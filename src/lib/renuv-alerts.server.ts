/**
 * Server-side Renuv alerts engine
 * Queries BigQuery and generates real-time alerts based on business rules
 */
import { queryBigQuery } from '@/lib/bigquery';
import {
  RenuvAlertSnapshot,
  RenuvAlert,
  RenuvAlertSummary,
} from '@/lib/renuv-alerts';
import { sanitizeDateParam } from '@/lib/date-utils';

type CampaignRow = {
  campaign_name: string;
  acos: number;
  spend: number;
  roas: number;
};

type FreshnessRow = {
  source_table: string;
  days_stale: number;
};

type SearchTermRow = {
  search_query: string;
  spend: number;
  attributed_orders: number;
};

/**
 * Main entry point: fetch live alerts snapshot
 */
export async function fetchAlertsSnapshot(startDate?: string, endDate?: string): Promise<RenuvAlertSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;
    const dateFrom = sd || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const dateTo = ed || new Date().toISOString().split('T')[0];

    const alerts: RenuvAlert[] = [];

    // Run all alert checks in parallel (no prior period comparisons)
    const [
      acosAlerts,
      freshnessAlerts,
      searchTermAlerts,
      roasAlerts
    ] = await Promise.all([
      checkAcosSpikeAlerts(dateFrom, dateTo),
      checkDataFreshnessAlerts(),
      checkSearchTermWasteAlerts(dateFrom, dateTo),
      checkHighPerformingAlerts(dateFrom, dateTo)
    ]);

    alerts.push(
      ...acosAlerts,
      ...freshnessAlerts,
      ...searchTermAlerts,
      ...roasAlerts
    );

    // Build summary
    const summary: RenuvAlertSummary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      totalActive: alerts.filter(a => a.status === 'active').length,
      lastEvaluationRun: new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      sourceView: 'reporting_amazon.alert_summary_daily'
    };

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · Live data` : 'Trailing 7 days · Live data',
      summary,
      alerts
    };

  } catch (error) {
    console.error('[Alerts Engine] Fatal error:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: {
        critical: 0,
        warning: 0,
        info: 0,
        totalActive: 0,
        lastEvaluationRun: new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }),
        sourceView: 'reporting_amazon.alert_summary_daily' as const
      },
      alerts: []
    };
  }
}

/**
 * Alert #1: ACoS Spike
 * Any campaign with ACoS > 60% in selected period AND spend > $500 → warning
 */
async function checkAcosSpikeAlerts(dateFrom: string, dateTo: string): Promise<RenuvAlert[]> {
  try {
    const sql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, campaign_name, cost as spend, sales14d as attributed_sales
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        UNION ALL
        SELECT DATE(date), campaign_name, cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), campaign_name, cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
      ),
      agg AS (
        SELECT
          campaign_name,
          SAFE_DIVIDE(SUM(spend), NULLIF(SUM(attributed_sales), 0)) * 100 as acos,
          SUM(spend) as spend,
          SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) as roas
        FROM all_campaigns
        GROUP BY campaign_name
      )
      SELECT * FROM agg WHERE acos > 60 AND spend > 500
    `;

    const rows = await queryBigQuery<CampaignRow>(sql);

    return rows.map((row, idx) => ({
      id: `acos-spike-${idx}`,
      trigger: 'spend_inefficiency',
      severity: 'warning' as const,
      status: 'active' as const,
      title: `High ACoS on ${row.campaign_name}`,
      summary: `ACoS at ${row.acos.toFixed(1)}% with $${Math.round(row.spend)} spend`,
      explanation: `Campaign "${row.campaign_name}" is running at ${row.acos.toFixed(1)}% ACoS with total spend of $${Math.round(row.spend)}. This exceeds the 60% efficiency threshold and warrants review.`,
      metric: 'ACoS',
      currentValue: `${row.acos.toFixed(1)}%`,
      priorValue: 'N/A',
      threshold: '60% (warning)',
      impact: `Inefficient spend: ~$${Math.round(row.spend * (row.acos / 100))} attributed revenue`,
      recommendations: [
        'Review search term report for wasteful broad match queries',
        'Consider bid reductions or budget caps',
        'Audit campaign targeting and match types',
        'Evaluate if campaign structure needs refinement'
      ],
      firstDetected: new Date().toISOString().split('T')[0],
      lastEvaluated: new Date().toISOString(),
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: row.campaign_name,
      relatedEntityType: 'campaign'
    }));
  } catch (error) {
    console.error('[ACoS Spike Check] Error:', error);
    return [];
  }
}

/**
 * Alert #2: Data Freshness
 * Any source with days_stale > 3 → warning
 */
async function checkDataFreshnessAlerts(): Promise<RenuvAlert[]> {
  try {
    const sql = `
      SELECT
        source_table,
        days_stale
      FROM \`renuv-amazon-data-warehouse.reporting_amazon.data_freshness_status\`
      WHERE brand_key = 'renuv'
        AND days_stale > 3
    `;

    const rows = await queryBigQuery<FreshnessRow>(sql);

    return rows.map((row, idx) => ({
      id: `freshness-stale-${idx}`,
      trigger: 'listing_issue',
      severity: 'warning' as const,
      status: 'active' as const,
      title: `Stale data in ${row.source_table}`,
      summary: `Data is ${row.days_stale} days old`,
      explanation: `The "${row.source_table}" data source has not refreshed in ${row.days_stale} days, exceeding the 3-day freshness threshold. Stale data may impact reporting accuracy and decision quality.`,
      metric: 'Data Freshness',
      currentValue: `${row.days_stale} days stale`,
      priorValue: 'Expected: ≤3 days',
      threshold: '3 days (warning)',
      impact: 'Reporting may not reflect recent performance changes',
      recommendations: [
        'Check data pipeline logs for errors or failures',
        'Verify API credentials and permissions are valid',
        'Review ETL job schedules and execution history',
        'Contact data engineering if issue persists'
      ],
      firstDetected: new Date().toISOString().split('T')[0],
      lastEvaluated: new Date().toISOString(),
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: row.source_table
    }));
  } catch (error) {
    console.error('[Data Freshness Check] Error:', error);
    return [];
  }
}

/**
 * Alert #3: Search Term Waste
 * Search terms with spend > $100 and zero attributed_orders → warning
 */
async function checkSearchTermWasteAlerts(dateFrom: string, dateTo: string): Promise<RenuvAlert[]> {
  try {
    const sql = `
      WITH agg AS (
        SELECT
          search_term as search_query,
          SUM(cost) as spend,
          SUM(purchases14d) as attributed_orders
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
        GROUP BY search_term
      )
      SELECT * FROM agg WHERE spend > 100 AND attributed_orders = 0
      ORDER BY spend DESC LIMIT 10
    `;

    const rows = await queryBigQuery<SearchTermRow>(sql);

    return rows.map((row, idx) => ({
      id: `search-waste-${idx}`,
      trigger: 'spend_inefficiency',
      severity: 'warning' as const,
      status: 'active' as const,
      title: `Wasteful search term: "${row.search_query}"`,
      summary: `$${Math.round(row.spend)} spend with zero orders`,
      explanation: `The search term "${row.search_query}" has driven $${Math.round(row.spend)} in spend with zero attributed orders. This represents pure waste and should be negated or excluded.`,
      metric: 'Search Term Spend',
      currentValue: `$${Math.round(row.spend)}`,
      priorValue: 'Orders: 0',
      threshold: '$100 spend + 0 orders (warning)',
      impact: `Wasted spend: $${Math.round(row.spend)}`,
      recommendations: [
        'Add as negative keyword immediately',
        'Review related broad match keywords for similar waste',
        'Audit search term report for other low-quality terms',
        'Consider tightening match types on parent campaigns'
      ],
      firstDetected: new Date().toISOString().split('T')[0],
      lastEvaluated: new Date().toISOString(),
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: row.search_query,
      relatedEntityType: 'query'
    }));
  } catch (error) {
    console.error('[Search Term Waste Check] Error:', error);
    return [];
  }
}

/**
 * Alert #4: High-Performing Opportunity
 * Campaigns with ROAS > 5x → positive info alert
 */
async function checkHighPerformingAlerts(dateFrom: string, dateTo: string): Promise<RenuvAlert[]> {
  try {
    const sql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, campaign_name, cost as spend, sales14d as attributed_sales
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        UNION ALL
        SELECT DATE(date), campaign_name, cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), campaign_name, cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
      ),
      agg AS (
        SELECT
          campaign_name,
          SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) as roas,
          SUM(spend) as spend
        FROM all_campaigns
        GROUP BY campaign_name
      )
      SELECT * FROM agg WHERE roas > 5 ORDER BY roas DESC LIMIT 5
    `;

    const rows = await queryBigQuery<CampaignRow>(sql);

    return rows.map((row, idx) => ({
      id: `high-roas-${idx}`,
      trigger: 'spend_inefficiency',
      severity: 'info' as const,
      status: 'active' as const,
      title: `Strong performance: ${row.campaign_name}`,
      summary: `ROAS at ${row.roas.toFixed(1)}x — scaling opportunity`,
      explanation: `Campaign "${row.campaign_name}" is achieving ${row.roas.toFixed(1)}x ROAS, well above the 5x high-performance threshold. This represents a strong scaling opportunity if budget allows.`,
      metric: 'ROAS',
      currentValue: `${row.roas.toFixed(1)}x`,
      priorValue: 'N/A',
      threshold: '5x (opportunity)',
      impact: `High-efficiency revenue generation: $${Math.round(row.spend * row.roas)} attributed revenue on $${Math.round(row.spend)} spend`,
      recommendations: [
        'Consider increasing budget to capture more volume',
        'Test bid increases to expand impression share',
        'Review if targeting can be expanded while maintaining efficiency',
        'Document winning tactics for replication in other campaigns'
      ],
      firstDetected: new Date().toISOString().split('T')[0],
      lastEvaluated: new Date().toISOString(),
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: row.campaign_name,
      relatedEntityType: 'campaign'
    }));
  } catch (error) {
    console.error('[High Performing Check] Error:', error);
    return [];
  }
}
