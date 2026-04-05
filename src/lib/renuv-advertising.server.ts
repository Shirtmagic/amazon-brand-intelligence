/**
 * Server-only fetch functions for advertising data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  AdvertisingSnapshot,
  AdvertisingKpi,
  CampaignPerformanceRow,
  AdvertisingChartDataPoint,
} from './renuv-advertising';
import { sanitizeDateParam, extractDateValue } from './date-utils';

export async function fetchAdvertisingSnapshot(startDate?: string, endDate?: string): Promise<AdvertisingSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;

    // Fetch current period from raw ads tables (UNION ALL of SP, SB, SD)
    const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];

    const kpiSql = sd && ed
      ? `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_attributed_sales,
        SAFE_DIVIDE(SUM(spend), NULLIF(SUM(attributed_sales), 0)) * 100 AS acos,
        SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) AS roas
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day DESC
    `
      : `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_attributed_sales,
        SAFE_DIVIDE(SUM(spend), NULLIF(SUM(attributed_sales), 0)) * 100 AS acos,
        SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) AS roas
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day DESC
      LIMIT 30
    `;

    const kpiRows = await queryBigQuery<any>(kpiSql);
    const currentPeriod = sd
      ? kpiRows.filter(r => extractDateValue(r.date_day) >= sd)
      : kpiRows.slice(0, 15);

    const currentSpend = currentPeriod.reduce((sum, r) => sum + (r.ad_spend || 0), 0);
    const currentSales = currentPeriod.reduce((sum, r) => sum + (r.ad_attributed_sales || 0), 0);
    const currentRoas = currentSpend > 0 ? currentSales / currentSpend : 0;
    const currentAcos = currentSales > 0 ? (currentSpend / currentSales) * 100 : 0;

    const kpis: AdvertisingKpi[] = [
      {
        key: 'spend',
        label: 'Ad spend',
        value: formatCurrency(currentSpend),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total media investment for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'sales',
        label: 'Ad-attributed sales',
        value: formatCurrency(currentSales),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total ad-attributed revenue for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'roas',
        label: 'ROAS',
        value: currentRoas.toFixed(2),
        delta: 'Attributed sales / spend',
        trend: 'flat',
        interpretation: 'Return on ad spend for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'acos',
        label: 'ACOS',
        value: formatPercent(currentAcos),
        delta: 'Spend / attributed sales',
        trend: 'flat',
        interpretation: 'Advertising cost of sale for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      }
    ];

    const campaignSql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, campaign_name, 'SP' as ad_type, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        UNION ALL
        SELECT DATE(date), campaign_name, 'SB', cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), campaign_name, 'SD', cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
      ),
      agg AS (
        SELECT
          campaign_name,
          ad_type,
          SUM(spend) AS spend,
          SUM(attributed_sales) AS sales,
          SUM(attributed_sales) / NULLIF(SUM(spend), 0) AS roas
        FROM all_campaigns
        GROUP BY campaign_name, ad_type
      )
      SELECT * FROM agg WHERE spend > 100 ORDER BY sales DESC LIMIT 10
    `;

    const campaignRows = await queryBigQuery<any>(campaignSql);
    const performance: CampaignPerformanceRow[] = campaignRows.map(r => ({
      campaign: r.campaign_name || 'Unknown',
      channel: r.ad_type || 'SP',
      objective: 'Acquisition',
      spend: formatCurrency(r.spend || 0),
      attributedSales: formatCurrency(r.sales || 0),
      roas: (r.roas || 0).toFixed(2),
      tacosImpact: currentSales > 0 ? formatPercent((r.spend / currentSales) * 100) : '—',
      cvr: '—',
      status: (r.roas || 0) > 5 ? 'positive' : (r.roas || 0) < 3 ? 'warning' : 'neutral',
      sourceView: 'ops_amazon.amzn_ads_sp_campaigns_v3_view'
    }));

    const chartData: AdvertisingChartDataPoint[] = [...currentPeriod].reverse().map(r => ({
      date: typeof r.date_day === 'object' ? r.date_day.value : r.date_day,
      spend: r.ad_spend || 0,
      sales: r.ad_attributed_sales || 0,
      impressions: 0,
      clicks: 0,
      roas: (r.ad_attributed_sales || 0) / (r.ad_spend || 1)
    }));

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed}` : 'Trailing 30 days',
      summary: `Advertising summary: ${formatCurrency(currentSpend)} spend, ${formatCurrency(currentSales)} attributed sales, ${currentRoas.toFixed(2)}x ROAS.`,
      kpis: kpis.length > 0 ? kpis : [],
      chartData: chartData.length > 0 ? chartData : [],
      commentary: '',
      implications: [],
      nextSteps: [],
      performance: performance.length > 0 ? performance : [],
      efficiency: { headline: 'No data available', summary: '', signals: [], sourceView: 'reporting_amazon.advertising_efficiency' },
      freshness: [],
      spendMix: [],
      searchTerms: [],
      diagnostics: []
    };
  } catch (error) {
    console.error('[fetchAdvertisingSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to load advertising data.',
      kpis: [],
      chartData: [],
      commentary: '',
      implications: [],
      nextSteps: [],
      performance: [],
      efficiency: { headline: 'No data available', summary: '', signals: [], sourceView: 'reporting_amazon.advertising_efficiency' },
      freshness: [],
      spendMix: [],
      searchTerms: [],
      diagnostics: []
    };
  }
}
