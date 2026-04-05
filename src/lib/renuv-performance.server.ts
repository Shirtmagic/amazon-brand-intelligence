/**
 * Server-only fetch functions for performance data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  PerformanceSnapshot,
  PerformanceKpi,
  PerformanceChartDataPoint,
} from './renuv-performance';
import { sanitizeDateParam, extractDateValue } from './date-utils';

export async function fetchPerformanceSnapshot(startDate?: string, endDate?: string): Promise<PerformanceSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;

    const kpiSql = sd && ed
      ? `
      SELECT
        date_day,
        SUM(ordered_revenue) AS ordered_revenue,
        SUM(orders) AS orders,
        SUM(units_ordered) AS units_ordered,
        SUM(sessions) AS sessions,
        SAFE_DIVIDE(SUM(orders), NULLIF(SUM(sessions), 0)) AS conversion_rate
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
        SUM(sessions) AS sessions,
        SAFE_DIVIDE(SUM(orders), NULLIF(SUM(sessions), 0)) AS conversion_rate
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
      GROUP BY date_day
      ORDER BY date_day DESC
      LIMIT 60
    `;

    const kpiRows = await queryBigQuery<any>(kpiSql);

    if (kpiRows.length === 0) {
      console.log('[fetchPerformanceSnapshot] No data available');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        summary: 'No performance data available for the selected period.',
        kpis: [],
        chartData: [],
        commentary: '',
        implications: [],
        nextSteps: []
      };
    }

    const currentPeriod = sd
      ? kpiRows.filter(r => extractDateValue(r.date_day) >= sd)
      : kpiRows.slice(0, 30);

    // Calculate aggregated KPIs
    const currentRevenue = currentPeriod.reduce((sum, r) => sum + (r.ordered_revenue || 0), 0);
    const currentOrders = currentPeriod.reduce((sum, r) => sum + (r.orders || 0), 0);
    const currentUnits = currentPeriod.reduce((sum, r) => sum + (r.units_ordered || 0), 0);
    const currentSessions = currentPeriod.reduce((sum, r) => sum + (r.sessions || 0), 0);
    const currentCvr = currentSessions > 0 ? (currentOrders / currentSessions) * 100 : 0;
    const currentAov = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const kpis: PerformanceKpi[] = [
      {
        key: 'revenue',
        label: 'Total revenue',
        value: formatCurrency(currentRevenue),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total ordered revenue for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      },
      {
        key: 'orders',
        label: 'Total orders',
        value: currentOrders.toLocaleString(),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total orders for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      },
      {
        key: 'units',
        label: 'Units sold',
        value: currentUnits.toLocaleString(),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total units ordered for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      },
      {
        key: 'conversion',
        label: 'Conversion rate',
        value: formatPercent(currentCvr),
        delta: 'Orders / sessions',
        trend: 'flat',
        interpretation: 'Session-to-order conversion rate for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      },
      {
        key: 'aov',
        label: 'Average order value',
        value: formatCurrency(currentAov),
        delta: 'Revenue / orders',
        trend: 'flat',
        interpretation: 'Average order value for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      },
      {
        key: 'sessions',
        label: 'Sessions',
        value: currentSessions.toLocaleString(),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total sessions for the selected period',
        sourceView: 'reporting_amazon.performance_kpi'
      }
    ];

    // Chart data (reverse chronological to ascending)
    const chartData: PerformanceChartDataPoint[] = [...currentPeriod].reverse().map(r => ({
      date: typeof r.date_day === 'object' ? r.date_day.value : r.date_day,
      revenue: r.ordered_revenue || 0,
      orders: r.orders || 0,
      unitsSold: r.units_ordered || 0,
      sessions: r.sessions || 0,
      conversionRate: r.conversion_rate ? r.conversion_rate * 100 : 0
    }));

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · live` : 'Trailing 30 days · live',
      summary: `Performance summary: ${formatCurrency(currentRevenue)} revenue, ${currentOrders.toLocaleString()} orders, ${formatPercent(currentCvr)} conversion rate.`,
      kpis,
      chartData,
      commentary: `Performance for the selected period: ${formatCurrency(currentRevenue)} revenue, ${currentOrders.toLocaleString()} orders, ${currentUnits.toLocaleString()} units. Conversion rate at ${formatPercent(currentCvr)} with ${currentSessions.toLocaleString()} sessions. Average order value: ${formatCurrency(currentAov)}.`,
      implications: [
        `Conversion rate of ${formatPercent(currentCvr)} across ${currentSessions.toLocaleString()} sessions`,
        `Average order value of ${formatCurrency(currentAov)} across ${currentOrders.toLocaleString()} orders`,
      ],
      nextSteps: [
        'Monitor conversion rate stability as traffic scales',
        'Analyze bundle vs single-unit performance drivers',
        'Review performance trends across the selected period',
      ]
    };
  } catch (error) {
    console.error('[fetchPerformanceSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to load performance data.',
      kpis: [],
      chartData: [],
      commentary: '',
      implications: [],
      nextSteps: []
    };
  }
}
