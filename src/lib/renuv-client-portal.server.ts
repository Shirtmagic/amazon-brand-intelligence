/**
 * Server-only fetch functions for client portal overview data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  ClientPortalSnapshot,
  ClientKpi,
  TrendDataPoint,
} from './renuv-client-portal';
import { sanitizeDateParam, extractDateValue } from './date-utils';

export async function fetchClientPortalSnapshot(startDate?: string, endDate?: string): Promise<ClientPortalSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;

    // Query 1 - Traffic/sales data from fact_sales_traffic_daily
    const trafficSql = sd && ed
      ? `
      SELECT
        date_day,
        SUM(ordered_revenue) AS ordered_revenue,
        SUM(orders) AS orders,
        SUM(units_ordered) AS units_ordered,
        SUM(sessions) AS sessions
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
        AND date_day >= '${sd}' AND date_day <= '${ed}'
      GROUP BY date_day
      ORDER BY date_day DESC
    `
      : `
      SELECT
        date_day,
        SUM(ordered_revenue) AS ordered_revenue,
        SUM(orders) AS orders,
        SUM(units_ordered) AS units_ordered,
        SUM(sessions) AS sessions
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
        AND date_day >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
      GROUP BY date_day
      ORDER BY date_day DESC
    `;

    // Query 2 - Ad spend from raw campaign tables (UNION ALL)
    const adSpendSql = sd && ed
      ? `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_sales
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day
    `
      : `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_sales
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day
    `;

    const [trafficRows, adSpendRows] = await Promise.all([
      queryBigQuery<any>(trafficSql),
      queryBigQuery<any>(adSpendSql),
    ]);

    if (trafficRows.length === 0) {
      console.log('[fetchClientPortalSnapshot] No data available');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        executiveSummary: 'No data available for the selected period.',
        kpis: [],
        trendData: [],
        organicRevenue: 0,
        ppcRevenue: 0,
        growthDrivers: [],
        risks: [],
        nextSteps: [],
        marketContext: {
          categoryTrend: 'No data available',
          competitivePressure: 'No data available',
          seasonalNote: 'No data available',
          searchLandscape: 'No data available',
          sourceView: 'reporting_amazon.client_market_context'
        }
      };
    }

    // Calculate aggregated KPIs from traffic data
    const currentRevenue = trafficRows.reduce((sum, r) => sum + (r.ordered_revenue || 0), 0);
    const currentOrders = trafficRows.reduce((sum, r) => sum + (r.orders || 0), 0);
    const currentSessions = trafficRows.reduce((sum, r) => sum + (r.sessions || 0), 0);

    // Build daily ad spend lookup from the ads query
    const adByDay = new Map<string, { spend: number; sales: number }>();
    for (const r of adSpendRows) {
      const day = typeof r.date_day === 'object' ? r.date_day.value : String(r.date_day);
      adByDay.set(day, { spend: r.ad_spend || 0, sales: r.ad_sales || 0 });
    }

    // Ad spend totals
    const currentAdSpend = adSpendRows.reduce((sum, r) => sum + (r.ad_spend || 0), 0);
    const currentAdSales = adSpendRows.reduce((sum, r) => sum + (r.ad_sales || 0), 0);

    // TACOS = Total Ad Cost of Sales = ad_spend / revenue
    const currentTacos = currentRevenue > 0 ? (currentAdSpend / currentRevenue) * 100 : 0;

    // Conversion rate from orders/sessions
    const currentCvr = currentSessions > 0 ? (currentOrders / currentSessions) * 100 : 0;

    // AOV
    const currentAov = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const tacosInterpretation = currentTacos > 100
      ? 'Ad spend exceeds ordered revenue. This is common during aggressive growth phases.'
      : 'Advertising efficiency tracked against total revenue';

    const kpis: ClientKpi[] = [
      {
        key: 'revenue',
        label: 'Revenue',
        value: formatCurrency(currentRevenue, true),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total ordered revenue for the selected period',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'orders',
        label: 'Orders',
        value: currentOrders.toLocaleString(),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total orders for the selected period',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'ad-spend',
        label: 'Ad spend',
        value: formatCurrency(currentAdSpend, true),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total ad spend for the selected period',
        sourceView: 'ops_amazon.amzn_ads_sp/sb/sd_campaigns'
      },
      {
        key: 'tacos',
        label: 'TACOS',
        value: isFinite(currentTacos) ? formatPercent(currentTacos) : '—',
        delta: 'Ad spend / ordered revenue',
        trend: 'flat',
        interpretation: tacosInterpretation,
        sourceView: 'ops_amazon.amzn_ads + core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'conversion',
        label: 'Conversion rate',
        value: formatPercent(currentCvr),
        delta: 'Orders / sessions',
        trend: 'flat',
        interpretation: 'Session-to-order conversion rate for the selected period',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'aov',
        label: 'AOV',
        value: formatCurrency(currentAov),
        delta: 'Revenue / orders',
        trend: 'flat',
        interpretation: 'Average order value for the selected period',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      }
    ];

    // Trend data from traffic rows merged with daily ad data
    const trendData: TrendDataPoint[] = [...trafficRows].reverse().map(r => {
      const day = typeof r.date_day === 'object' ? r.date_day.value : String(r.date_day);
      const ad = adByDay.get(day) || { spend: 0, sales: 0 };
      return {
        date: day,
        revenue: r.ordered_revenue || 0,
        orders: r.orders || 0,
        adSpend: ad.spend,
        sessions: r.sessions || 0,
      };
    });

    const executiveSummary = `Renuv period summary: Revenue ${formatCurrency(currentRevenue, true)}, TACOS ${isFinite(currentTacos) ? formatPercent(currentTacos) : '—'}, conversion rate at ${formatPercent(currentCvr)}. ${currentTacos > 100 ? 'Note: Ad spend currently exceeds total revenue. This is common during aggressive growth phases.' : ''}`.trim();

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · live` : 'Trailing 60 days · live',
      executiveSummary,
      kpis,
      trendData,
      organicRevenue: Math.max(currentRevenue - currentAdSales, 0),
      ppcRevenue: currentAdSales,
      growthDrivers: [],
      risks: [],
      nextSteps: [],
      marketContext: {
        categoryTrend: 'Data driven from live metrics',
        competitivePressure: 'Monitor via advertising dashboard',
        seasonalNote: 'Review historical trends for seasonal patterns',
        searchLandscape: 'See search and advertising modules for detail',
        sourceView: 'reporting_amazon.client_market_context' as const
      }
    };
  } catch (error) {
    console.error('[fetchClientPortalSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      executiveSummary: 'Unable to load client portal data.',
      kpis: [],
      trendData: [],
      organicRevenue: 0,
      ppcRevenue: 0,
      growthDrivers: [],
      risks: [],
      nextSteps: [],
      marketContext: {
        categoryTrend: 'No data available',
        competitivePressure: 'No data available',
        seasonalNote: 'No data available',
        searchLandscape: 'No data available',
        sourceView: 'reporting_amazon.client_market_context' as const
      }
    };
  }
}
