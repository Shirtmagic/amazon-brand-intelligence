/**
 * Server-only fetch functions for traffic conversion data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  RenuvTrafficConversionPageSnapshot,
  RenuvTrafficConversionKpi,
  RenuvTrafficConversionReviewRow,
  RenuvTrafficFreshness,
  RenuvTrafficQualityPanel,
  RenuvTrafficDiagnostic,
  RenuvTrafficConversionRiskRow,
  DailyTrafficDataPoint,
} from './renuv-traffic-conversion';
import { sanitizeDateParam, extractDateValue } from './date-utils';

/**
 * Build traffic quality panel from metrics
 */
function buildTrafficQualityPanel(
  currentRPS: number,
  currentCVR: number,
  currentPVPS: number,
  avgBuyBox: number
): RenuvTrafficQualityPanel {
  return {
    headline: 'Traffic quality summary for the selected period',
    summary: `Revenue per session: ${formatCurrency(currentRPS)}. Page views per session: ${currentPVPS.toFixed(1)}. Average Buy Box: ${(avgBuyBox * 100).toFixed(1)}%.`,
    signals: [
      {
        label: 'Revenue per session',
        value: formatCurrency(currentRPS),
        tone: 'neutral',
        detail: 'Average revenue generated per session',
      },
      {
        label: 'Page views per session',
        value: currentPVPS.toFixed(2),
        tone: currentPVPS > 2.5 ? 'positive' : currentPVPS < 1.5 ? 'warning' : 'neutral',
        detail: 'Average engagement depth per session',
      },
      {
        label: 'Buy Box percentage',
        value: `${(avgBuyBox * 100).toFixed(1)}%`,
        tone: avgBuyBox > 0.9 ? 'positive' : avgBuyBox < 0.75 ? 'warning' : 'neutral',
        detail: 'Average Buy Box ownership across catalog',
      },
    ],
    sourceView: 'reporting_amazon.traffic_quality_daily',
  };
}

/**
 * Build traffic diagnostics from current period metrics
 */
function buildTrafficDiagnostics(
  currentSessions: number,
  currentOrders: number,
  currentCVR: number
): RenuvTrafficDiagnostic[] {
  const diagnostics: RenuvTrafficDiagnostic[] = [];

  if (currentCVR < 15) {
    diagnostics.push({
      title: 'Conversion rate below benchmark',
      severity: 'warning',
      detail: `Current conversion rate is ${currentCVR.toFixed(1)}%, below the 15% category benchmark.`,
      actionBias: 'Audit PDP content, pricing, and reviews. Check for Buy Box loss or competitive pressure.',
      sourceView: 'reporting_amazon.traffic_conversion_daily',
    });
  } else if (currentCVR > 25) {
    diagnostics.push({
      title: 'Strong conversion rate',
      severity: 'positive',
      detail: `Conversion rate at ${currentCVR.toFixed(1)}% is well above category benchmarks.`,
      actionBias: 'Maintain current strategy and consider scaling traffic acquisition.',
      sourceView: 'reporting_amazon.traffic_conversion_daily',
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      title: 'No significant diagnostic findings',
      severity: 'neutral',
      detail: 'Traffic and conversion metrics are within normal ranges.',
      actionBias: 'Continue monitoring for changes.',
      sourceView: 'reporting_amazon.traffic_conversion_daily',
    });
  }
  return diagnostics;
}

/**
 * Fetch ASIN-level risk table (current period only)
 */
async function fetchAsinRisks(dateFrom: string, dateTo: string): Promise<RenuvTrafficConversionRiskRow[]> {
  try {
    const sql = `
      WITH asin_metrics AS (
        SELECT
          asin,
          SUM(sessions) AS current_sessions,
          SUM(orders) AS current_orders,
          SUM(ordered_revenue) AS current_revenue,
          SAFE_DIVIDE(SUM(orders), NULLIF(SUM(sessions), 0)) * 100 AS cvr
        FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
        WHERE brand_key = 'renuv'
          AND marketplace_key = 'US'
          AND date_day >= '${dateFrom}' AND date_day <= '${dateTo}'
        GROUP BY asin
        HAVING SUM(sessions) > 100
      )
      SELECT
        asin,
        current_sessions,
        cvr,
        current_revenue
      FROM asin_metrics
      WHERE cvr < 15  -- Below benchmark conversion
      ORDER BY current_revenue DESC
      LIMIT 10
    `;

    const rows = await queryBigQuery<any>(sql);
    if (rows.length === 0) {
      return [];
    }

    // Get total sessions for traffic share calculation
    const totalSessionsSql = `
      SELECT SUM(sessions) AS total
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
        AND date_day >= '${dateFrom}' AND date_day <= '${dateTo}'
    `;
    const totalRows = await queryBigQuery<any>(totalSessionsSql);
    const totalSessions = Number(totalRows[0]?.total || 1);

    return rows.map((r: any) => {
      const trafficShare = (Number(r.current_sessions || 0) / totalSessions) * 100;

      return {
        asin: r.asin || 'Unknown',
        title: `ASIN ${r.asin}`,
        trafficShare: `${trafficShare.toFixed(1)}%`,
        sessionsChange: 'N/A',
        conversionRate: formatPercent(Number(r.cvr || 0)),
        conversionChange: 'N/A',
        demandQuality: Number(r.cvr || 0) < 10 ? 'Weak' : 'Below benchmark',
        diagnosis: `Conversion rate at ${Number(r.cvr || 0).toFixed(1)}% — below 15% benchmark`,
        severity: Number(r.cvr || 0) < 10 ? 'critical' as const : 'warning' as const,
        sourceView: 'reporting_amazon.asin_traffic_conversion_daily',
      };
    });
  } catch (error) {
    console.error('[fetchAsinRisks] Error:', error);
    return [];
  }
}

export async function fetchTrafficSnapshot(startDate?: string, endDate?: string): Promise<RenuvTrafficConversionPageSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;
    const dateFrom = sd || new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const dateTo = ed || new Date().toISOString().split('T')[0];

    // Fetch sales/traffic data for current period only
    const sql = `
      SELECT
        date_day,
        SUM(sessions) AS sessions,
        SUM(page_views) AS page_views,
        SUM(ordered_revenue) AS ordered_revenue,
        SUM(units_ordered) AS units_ordered,
        SUM(orders) AS orders,
        AVG(buy_box_percentage) AS avg_buy_box
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\`
      WHERE brand_key = 'renuv'
        AND marketplace_key = 'US'
        AND date_day >= '${dateFrom}' AND date_day <= '${dateTo}'
      GROUP BY date_day
      ORDER BY date_day DESC
    `;

    const rows = await queryBigQuery<any>(sql);

    if (rows.length === 0) {
      console.log('[fetchTrafficSnapshot] No traffic data available');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        environment: 'internal' as const,
        kpis: [],
        dailyData: [],
        review: [],
        trafficQuality: { headline: 'No data available', summary: '', signals: [], sourceView: 'reporting_amazon.traffic_quality_daily' as const },
        diagnostics: [],
        asinRisks: [],
        freshness: []
      };
    }

    const currentSessions = rows.reduce((s, r) => s + Number(r.sessions || 0), 0);
    const currentRevenue = rows.reduce((s, r) => s + Number(r.ordered_revenue || 0), 0);
    const currentUnits = rows.reduce((s, r) => s + Number(r.units_ordered || 0), 0);
    const currentOrders = rows.reduce((s, r) => s + Number(r.orders || 0), 0);
    const currentPageViews = rows.reduce((s, r) => s + Number(r.page_views || 0), 0);
    const avgBuyBox = rows.reduce((s, r) => s + Number(r.avg_buy_box || 0), 0) / rows.length;

    const currentCVR = currentSessions > 0 ? (currentOrders / currentSessions) * 100 : 0;
    const currentRPS = currentSessions > 0 ? currentRevenue / currentSessions : 0;
    const currentPVPS = currentSessions > 0 ? currentPageViews / currentSessions : 0;

    const kpis: RenuvTrafficConversionKpi[] = [
      {
        key: 'sessions',
        label: 'Sessions',
        value: currentSessions.toLocaleString(),
        delta: 'Total for selected period',
        trend: 'flat',
        note: 'Total sessions across all ASINs',
        sourceView: 'reporting_amazon.traffic_conversion_daily',
      },
      {
        key: 'conversion-rate',
        label: 'Conversion rate',
        value: formatPercent(currentCVR),
        delta: 'Orders / sessions',
        trend: 'flat',
        note: 'Session-to-order conversion rate',
        sourceView: 'reporting_amazon.traffic_conversion_daily',
      },
      {
        key: 'revenue-per-session',
        label: 'Revenue per session',
        value: formatCurrency(currentRPS),
        delta: 'Revenue / sessions',
        trend: 'flat',
        note: 'Average revenue generated per session',
        sourceView: 'reporting_amazon.traffic_conversion_rollup',
      },
      {
        key: 'units-per-order',
        label: 'Units per order',
        value: currentOrders > 0 ? (currentUnits / currentOrders).toFixed(1) : '—',
        delta: 'Units / orders',
        trend: 'flat',
        note: 'Average units ordered per conversion',
        sourceView: 'reporting_amazon.traffic_conversion_daily',
      },
    ];

    // Build daily chart data
    const dailyData: DailyTrafficDataPoint[] = rows
      .map((r: any) => {
        const dayDate = extractDateValue(r.date_day);
        const daySessions = Number(r.sessions || 0);
        const dayOrders = Number(r.orders || 0);
        const dayRevenue = Number(r.ordered_revenue || 0);
        return {
          date: dayDate,
          sessions: daySessions,
          orders: dayOrders,
          cvr: daySessions > 0 ? +((dayOrders / daySessions) * 100).toFixed(1) : 0,
          revenuePerSession: daySessions > 0 ? +(dayRevenue / daySessions).toFixed(2) : 0,
        };
      })
      .sort((a: DailyTrafficDataPoint, b: DailyTrafficDataPoint) => a.date.localeCompare(b.date));

    // Build review table (current period only)
    const review: RenuvTrafficConversionReviewRow[] = [
      {
        period: sd ? `${dateFrom} – ${dateTo}` : 'Selected period',
        sessions: currentSessions.toLocaleString(),
        orders: currentOrders.toLocaleString(),
        conversionRate: formatPercent(currentCVR),
        revenuePerSession: formatCurrency(currentRPS),
        read: 'Current period performance',
        sourceView: 'reporting_amazon.traffic_conversion_daily',
      },
    ];

    // Freshness
    const freshnessSql = `
      SELECT source_table, last_seen_record_date, days_stale
      FROM \`renuv-amazon-data-warehouse.reporting_amazon.data_freshness_status\`
      WHERE source_table LIKE '%retail%' OR source_table LIKE '%order%'
      LIMIT 3
    `;
    const freshnessRows = await queryBigQuery<any>(freshnessSql);
    const freshness: RenuvTrafficFreshness[] = freshnessRows.map((r: any) => ({
      source: r.source_table || 'Sales & Traffic',
      updatedAt: r.last_seen_record_date ? new Date(r.last_seen_record_date.value || r.last_seen_record_date).toLocaleDateString() : 'Unknown',
      lag: r.days_stale ? `${r.days_stale}d` : '0d',
      readiness: r.days_stale < 2 ? 'Current' : r.days_stale < 4 ? 'Acceptable' : 'Stale',
      tone: r.days_stale < 2 ? 'positive' : r.days_stale < 4 ? 'neutral' : 'warning',
      sourceView: 'reporting_amazon.data_freshness_status',
    }));

    // Build traffic quality panel
    const trafficQuality = buildTrafficQualityPanel(currentRPS, currentCVR, currentPVPS, avgBuyBox);

    // Build diagnostics
    const diagnostics = buildTrafficDiagnostics(currentSessions, currentOrders, currentCVR);

    // Build ASIN risk table
    const asinRisks = await fetchAsinRisks(dateFrom, dateTo);

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · live data` : 'Trailing 14 days · live data',
      environment: 'internal',
      kpis,
      dailyData,
      review,
      trafficQuality,
      diagnostics,
      asinRisks,
      freshness,
    };
  } catch (error) {
    console.error('[fetchTrafficSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      environment: 'internal' as const,
      kpis: [],
      dailyData: [],
      review: [],
      trafficQuality: { headline: 'Data unavailable', summary: '', signals: [], sourceView: 'reporting_amazon.traffic_quality_daily' as const },
      diagnostics: [],
      asinRisks: [],
      freshness: []
    };
  }
}
