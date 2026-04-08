/**
 * Server-only fetch functions for overview data
 * This module should only be imported in server components
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  RenuvOverviewSnapshot,
  RenuvKpi,
  RenuvFreshnessItem,
  RenuvCampaignRow,
  RenuvBrandHealthPanel,
  RenuvSearchOpportunityRow,
  RenuvPaidSearchDiagnosticRow,
  RenuvFeeSummary,
  RenuvReconciliationSummary,
  RenuvDailyDataPoint,
  Tone,
} from './renuv-overview';
import { sanitizeDateParam, safeFixed } from './date-utils';

export async function fetchOverviewSnapshot(startDate?: string, endDate?: string): Promise<RenuvOverviewSnapshot> {
  try {
    // Resolve date boundaries
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;

    // Fetch KPIs from two separate sources: traffic + ads
    const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    const trafficStart = sd || defaultStart;
    const trafficEnd = ed || defaultEnd;

    const trafficSql = `
      SELECT
        date_day,
        SUM(ordered_revenue) AS ordered_revenue,
        SUM(orders) AS orders,
        SUM(sessions) AS sessions
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
        AND date_day >= '${trafficStart}' AND date_day <= '${trafficEnd}'
      GROUP BY date_day
      ORDER BY date_day DESC
    `;

    const adsSql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${trafficStart}' AND DATE(date) <= '${trafficEnd}'
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${trafficStart}' AND DATE(date) <= '${trafficEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${trafficStart}' AND DATE(date) <= '${trafficEnd}'
        ) WHERE rn = 1
      )
      SELECT date_day, SUM(spend) AS ad_spend, SUM(attributed_sales) AS ad_attributed_sales
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day
    `;

    const [trafficRows, adsRows] = await Promise.all([
      queryBigQuery<any>(trafficSql),
      queryBigQuery<any>(adsSql),
    ]);

    const currentPeriod = trafficRows;

    const currentRevenue = currentPeriod.reduce((sum, r) => sum + Number(r.ordered_revenue || 0), 0);
    const totalOrders = currentPeriod.reduce((sum, r) => sum + Number(r.orders || 0), 0);
    const totalSessions = currentPeriod.reduce((sum, r) => sum + Number(r.sessions || 0), 0);
    const currentSpend = adsRows.reduce((sum, r) => sum + Number(r.ad_spend || 0), 0);

    // Build daily data for chart
    const adsMap = new Map<string, { spend: number; sales: number }>();
    for (const r of adsRows) {
      const d = typeof r.date_day === 'object' ? r.date_day.value : String(r.date_day);
      adsMap.set(d, { spend: Number(r.ad_spend || 0), sales: Number(r.ad_attributed_sales || 0) });
    }
    const dailyData: RenuvDailyDataPoint[] = [...currentPeriod]
      .sort((a, b) => {
        const da = typeof a.date_day === 'object' ? a.date_day.value : String(a.date_day);
        const db = typeof b.date_day === 'object' ? b.date_day.value : String(b.date_day);
        return da.localeCompare(db);
      })
      .map(r => {
        const d = typeof r.date_day === 'object' ? r.date_day.value : String(r.date_day);
        const ads = adsMap.get(d) || { spend: 0, sales: 0 };
        return {
          date: d,
          revenue: Number(r.ordered_revenue || 0),
          adSpend: ads.spend,
          sessions: Number(r.sessions || 0),
          orders: Number(r.orders || 0),
        };
      });
    const currentTacos = currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : 0;
    const currentFees = 0;
    const currentCvr = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;

    const tacosNote = isFinite(currentTacos) && currentTacos > 100
      ? 'Ad spend exceeds ordered revenue. This is common during aggressive growth phases.'
      : 'Total advertising cost of sales for the selected period.';

    const kpis: RenuvKpi[] = [
      {
        key: 'ordered-revenue',
        label: 'Ordered revenue',
        value: formatCurrency(currentRevenue, true),
        delta: 'Total for selected period',
        trend: 'flat',
        sourceView: 'core_amazon.fact_sales_traffic_daily',
        note: 'Primary commercial top-line from traffic daily.'
      },
      {
        key: 'ad-spend',
        label: 'Ad spend',
        value: formatCurrency(currentSpend, true),
        delta: 'Total for selected period',
        trend: 'flat',
        sourceView: 'core_amazon.fact_sales_traffic_daily',
        note: 'Media investment for the selected period.'
      },
      {
        key: 'tacos',
        label: 'TACOS',
        value: isFinite(currentTacos) ? formatPercent(currentTacos) : '—',
        delta: 'Ad spend / ordered revenue',
        trend: 'flat',
        sourceView: 'core_amazon.fact_sales_traffic_daily',
        note: tacosNote
      },
      {
        key: 'total-fees',
        label: 'Total fees',
        value: formatCurrency(currentFees, true),
        delta: 'Total for selected period',
        trend: 'flat',
        sourceView: 'core_amazon.fact_sales_traffic_daily',
        note: 'Fee data not available from raw tables — placeholder zero.'
      },
      {
        key: 'conversion-rate',
        label: 'Conversion rate',
        value: isFinite(currentCvr) ? formatPercent(currentCvr) : '—',
        delta: 'Average for selected period',
        trend: 'flat',
        sourceView: 'core_amazon.fact_sales_traffic_daily',
        note: 'Average conversion rate across the selected period.'
      }
    ];

    // Fetch freshness data
    const freshnessSql = `
      SELECT
        source_table,
        last_seen_record_date,
        days_stale,
        freshness_status
      FROM \`renuv-amazon-data-warehouse.reporting_amazon.data_freshness_status\`
      ORDER BY source_table
    `;

    const freshnessRows = await queryBigQuery<any>(freshnessSql);
    const freshness: RenuvFreshnessItem[] = freshnessRows.map(r => ({
      source: r.source_table || 'Unknown',
      status: r.freshness_status === 'fresh' ? 'healthy' : Number(r.days_stale) > 2 ? 'stale' : 'watch',
      updatedAt: r.last_seen_record_date ? new Date(r.last_seen_record_date.value || r.last_seen_record_date).toLocaleDateString() : 'Unknown',
      lag: r.days_stale != null ? `${r.days_stale}d` : '0d',
      coverage: 'Current',
      sourceView: 'reporting_amazon.data_freshness_status'
    }));

    // Fetch top campaigns
    const campaignsSql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, campaign_name, 'SP' as ad_type, cost as spend, sales14d as attributed_sales, purchases14d as orders, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        UNION ALL
        SELECT DATE(date), campaign_name, 'SB', cost, sales, purchases, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), campaign_name, 'SD', cost, sales, purchases, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
      )
      SELECT
        campaign_name,
        ad_type,
        SUM(attributed_sales) AS revenue,
        SUM(spend) AS spend,
        SUM(attributed_sales) / NULLIF(SUM(spend), 0) AS roas,
        (SUM(spend) / NULLIF(${currentRevenue}, 0)) * 100 AS tacos_impact
      FROM all_campaigns
      GROUP BY campaign_name, ad_type
      ORDER BY revenue DESC
      LIMIT 4
    `;

    const campaignRows = await queryBigQuery<any>(campaignsSql);
    const campaigns: RenuvCampaignRow[] = campaignRows.map(r => ({
      campaign: r.campaign_name || 'Unknown',
      channel: r.ad_type || 'SP',
      revenue: formatCurrency(Number(r.revenue || 0), true),
      spend: formatCurrency(Number(r.spend || 0), true),
      roas: `${Number(r.roas || 0).toFixed(1)}x`,
      tacosImpact: `${Number(r.tacos_impact || 0).toFixed(1)} pts`,
      status: Number(r.roas || 0) > 5 ? 'positive' : Number(r.roas || 0) < 3 ? 'warning' : 'neutral',
      sourceView: 'ops_amazon.amzn_ads_sp_campaigns_v3_view'
    }));

    // Fetch Brand Health Signals (current period only, no WoW comparisons)
    let brandHealth: RenuvBrandHealthPanel;
    try {
      // Inventory risk — not available from raw tables, default to 0
      const inventoryRisk = 0;
      const inventoryTone: Tone = inventoryRisk === 0 ? 'positive' : inventoryRisk < 5 ? 'neutral' : 'warning';

      brandHealth = {
        headline: 'Brand health summary for the selected period.',
        summary: `Revenue: ${formatCurrency(currentRevenue, true)}, TACOS: ${isFinite(currentTacos) ? formatPercent(currentTacos) : '—'}, Conversion rate: ${isFinite(currentCvr) ? formatPercent(currentCvr) : '—'}.`,
        priorityActions: [
          'Monitor revenue trajectory across the period',
          isFinite(currentTacos) && currentTacos > 100 ? 'Review ad spend efficiency — TACOS exceeds 100%' : 'Maintain current efficiency levels',
          inventoryRisk > 0 ? `Address ${inventoryRisk} ASINs flagged for inventory risk` : 'Monitor inventory levels across portfolio'
        ],
        signals: [
          {
            label: 'Revenue',
            value: formatCurrency(currentRevenue, true),
            tone: 'neutral' as Tone,
            detail: `Total ordered revenue for the selected period`
          },
          {
            label: 'TACOS',
            value: isFinite(currentTacos) ? formatPercent(currentTacos) : '—',
            tone: (isFinite(currentTacos) && currentTacos < 30 ? 'positive' : currentTacos > 100 ? 'warning' : 'neutral') as Tone,
            detail: isFinite(currentTacos) && currentTacos > 100
              ? 'Ad spend exceeds ordered revenue. This is common during aggressive growth phases.'
              : `Ad spend is ${isFinite(currentTacos) ? formatPercent(currentTacos) : '—'} of ordered revenue`
          },
          {
            label: 'Conversion rate',
            value: isFinite(currentCvr) ? formatPercent(currentCvr) : '—',
            tone: (currentCvr > 25 ? 'positive' : currentCvr > 15 ? 'neutral' : 'warning') as Tone,
            detail: `Average conversion rate for the selected period`
          },
          {
            label: 'Inventory risk',
            value: inventoryRisk === 0 ? 'None' : `${inventoryRisk} ASINs`,
            tone: inventoryTone,
            detail: inventoryRisk === 0 ? 'No ASINs currently flagged for inventory issues' : `${inventoryRisk} ASINs require inventory attention`
          }
        ],
        sourceView: 'reporting_amazon.brand_health_overview'
      };
    } catch (error) {
      console.error('[fetchOverviewSnapshot] Brand health query failed:', error);
      brandHealth = {
        headline: 'Brand health data unavailable',
        summary: 'Unable to calculate brand health signals for this period.',
        priorityActions: [],
        signals: [],
        sourceView: 'reporting_amazon.brand_health_overview'
      };
    }

    // Fetch Search Opportunities
    let searchOpportunities: RenuvSearchOpportunityRow[];
    try {
      const searchSql = `
        WITH agg AS (SELECT
          search_term as search_query,
          SUM(cost) AS total_spend,
          SUM(clicks) AS total_clicks,
          SUM(impressions) AS total_impressions,
          SUM(purchases14d) AS total_orders,
          SUM(sales14d) AS total_sales,
          (SUM(cost) / NULLIF(SUM(sales14d), 0)) * 100 AS acos
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
          AND LOWER(search_term) NOT LIKE '%renuv%'
          AND LOWER(search_term) NOT LIKE '%renüv%'
        GROUP BY search_term
        ) SELECT * FROM agg WHERE total_spend > 0
        ORDER BY total_spend DESC
        LIMIT 10
      `;

      const searchRows = await queryBigQuery<any>(searchSql);
      searchOpportunities = searchRows.map(r => {
        const spend = Number(r.total_spend || 0);
        const sales = Number(r.total_sales || 0);
        const clicks = Number(r.total_clicks || 0);
        const orders = Number(r.total_orders || 0);
        const acos = Number(r.acos || 0);
        const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;

        return {
          query: r.search_query || 'Unknown',
          theme: spend > 1000 ? 'High investment' : spend > 500 ? 'Medium investment' : 'Low investment',
          searchVolume: clicks > 500 ? 'High' : clicks > 200 ? 'Medium' : 'Low',
          opportunity: acos > 30 ? 'Efficiency improvement needed' : sales > 2000 ? 'Scale opportunity' : 'Monitor',
          cvrGap: cvr < 10 ? `${(10 - cvr).toFixed(1)} pts below benchmark` : `${(cvr - 10).toFixed(1)} pts above benchmark`,
          actionBias: acos > 40 ? 'Review targeting and reduce waste' : cvr < 10 ? 'Improve conversion relevance' : 'Scale with current efficiency',
          sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view'
        };
      });
    } catch (error) {
      console.error('[fetchOverviewSnapshot] Search opportunities query failed:', error);
      searchOpportunities = [];
    }

    // Fetch Fee Summary
    // Fee summary — fees not available from raw tables
    const feeSummary: RenuvFeeSummary = {
      feeRate: 'N/A',
      estimatedFees: '$0',
      reimbursementWatch: 'None flagged',
      notes: [
        'Fee data is not available from raw source tables.',
        'This section will be populated once a fee-specific view is available.'
      ],
      sourceView: 'core_amazon.fact_sales_traffic_daily'
    };

    // Fetch Reconciliation
    let reconciliation: RenuvReconciliationSummary;
    try {
      const reconTrafficSql = `
        SELECT SUM(ordered_revenue) AS order_revenue
        FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
        WHERE brand_key = 'renuv' AND marketplace_key = 'US'
          AND date_day >= '${sd || defaultStart}' AND date_day <= '${ed || defaultEnd}'
      `;

      const reconAdsSql = `
        WITH all_campaigns AS (
          SELECT cost as spend, sales14d as attributed_sales
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
          UNION ALL
          SELECT cost, sales
          FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
            FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
            WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
          ) WHERE rn = 1
          UNION ALL
          SELECT cost, sales
          FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
            FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
            WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
          ) WHERE rn = 1
        )
        SELECT SUM(attributed_sales) AS ad_sales FROM all_campaigns
      `;

      const [reconTrafficRows, reconAdsRows] = await Promise.all([
        queryBigQuery<any>(reconTrafficSql),
        queryBigQuery<any>(reconAdsSql),
      ]);
      const orderRevenue = Number(reconTrafficRows[0]?.order_revenue || 0);
      const adSales = Number(reconAdsRows[0]?.ad_sales || 0);
      const adAttributionRatio = orderRevenue > 0 ? adSales / orderRevenue : 0;

      reconciliation = {
        revenueDelta: orderRevenue > 0 ? `${safeFixed(adAttributionRatio * 100)}%` : '—',
        orderRevenue: formatCurrency(orderRevenue, true),
        retailRevenue: formatCurrency(adSales, true),
        tolerance: 'Ad-attributed vs total ordered revenue',
        note: adAttributionRatio > 1
          ? `Ad-attributed revenue (${formatCurrency(adSales, true)}) exceeds ordered revenue (${formatCurrency(orderRevenue, true)}) — this reflects Amazon attribution overlap, not a data error.`
          : orderRevenue > 0
          ? `Ads drive ${safeFixed(adAttributionRatio * 100)}% of total ordered revenue.`
          : 'No revenue data available for reconciliation.',
        sourceView: 'reporting_amazon.reconciliation_snapshot'
      };
    } catch (error) {
      console.error('[fetchOverviewSnapshot] Reconciliation query failed:', error);
      reconciliation = {
        revenueDelta: '—',
        orderRevenue: '$0',
        retailRevenue: '$0',
        tolerance: '<3.0% watch band',
        note: 'Reconciliation data unavailable for this period.',
        sourceView: 'reporting_amazon.reconciliation_snapshot'
      };
    }

    // Build final snapshot
    const snapshot: RenuvOverviewSnapshot = {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · live data` : 'Trailing 7 days · live data',
      environment: 'internal',
      kpis,
      freshness,
      brandHealth,
      campaigns,
      searchOpportunities,
      paidSearchDiagnostics: [] as RenuvPaidSearchDiagnosticRow[],
      feeSummary,
      reconciliation,
      dailyData,
    };

    return snapshot;
  } catch (error) {
    console.error('[fetchOverviewSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      environment: 'internal' as const,
      kpis: [],
      freshness: [],
      brandHealth: {
        headline: 'Data unavailable',
        summary: 'Unable to load overview data.',
        priorityActions: [],
        signals: [],
        sourceView: 'reporting_amazon.brand_health_overview' as const
      },
      campaigns: [],
      searchOpportunities: [],
      paidSearchDiagnostics: [],
      feeSummary: {
        feeRate: 'No data available',
        estimatedFees: '$0',
        reimbursementWatch: 'None flagged',
        notes: [],
        sourceView: 'reporting_amazon.fee_summary_daily' as const
      },
      reconciliation: {
        revenueDelta: '—',
        orderRevenue: '$0',
        retailRevenue: '$0',
        tolerance: '<3.0% watch band',
        note: 'Data unavailable.',
        sourceView: 'reporting_amazon.reconciliation_snapshot' as const
      },
      dailyData: []
    };
  }
}
