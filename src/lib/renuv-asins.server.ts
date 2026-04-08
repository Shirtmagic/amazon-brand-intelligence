/**
 * Server-only fetch functions for ASIN performance data
 * This module should only be imported in server components
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  RenuvAsinPageSnapshot,
  RenuvAsinKpi,
  RenuvAsinTableRow,
  RenuvAsinMover,
  RenuvAsinConcentrationPanel,
  RenuvAsinFlag,
  Tone,
} from './renuv-asins';
import { sanitizeDateParam, safeFixed } from './date-utils';

interface InventoryRow {
  asin: string;
  sku: string;
  product_name: string;
  available: number;
  days_of_supply: number;
  sales_shipped_last_7_days: number;
  sales_shipped_last_30_days: number;
  sales_shipped_last_90_days: number;
  sell_through: number;
  featuredoffer_price: number;
  sales_rank: number;
}

export async function fetchAsinPerformanceSnapshot(startDate?: string, endDate?: string): Promise<RenuvAsinPageSnapshot> {
  try {
    // Resolve date boundaries
    const sd = startDate ? sanitizeDateParam(startDate) : new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const ed = endDate ? sanitizeDateParam(endDate) : new Date().toISOString().split('T')[0];

    // Query sales traffic for ASIN performance
    const salesTrafficSql = `
      SELECT
        t.asin,
        i.product_name,
        SUM(t.ordered_revenue) as revenue,
        SUM(t.units_ordered) as units,
        SUM(t.sessions) as sessions,
        SUM(t.orders) as orders,
        SAFE_DIVIDE(SUM(t.orders), SUM(t.sessions)) * 100 as cvr,
        AVG(t.buy_box_percentage) as buy_box_pct
      FROM \`renuv-amazon-data-warehouse.core_amazon.fact_sales_traffic_daily\` t
      LEFT JOIN (
        SELECT DISTINCT asin, product_name
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
      ) i ON t.asin = i.asin
      WHERE t.brand_key = 'renuv'
        AND t.date_day >= '${sd}' AND t.date_day <= '${ed}'
      GROUP BY t.asin, i.product_name
      ORDER BY revenue DESC
      LIMIT 20
    `;

    const salesRows = await queryBigQuery<any>(salesTrafficSql);

    if (!salesRows.length) {
      console.warn('[fetchAsinPerformanceSnapshot] No data found');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        environment: 'internal' as const,
        kpis: [],
        topAsins: [],
        movers: [],
        concentration: {
          headline: 'No data available',
          summary: 'No ASIN data found for the selected period.',
          metrics: [],
          sourceView: 'reporting_amazon.asin_performance_rollup'
        },
        flags: []
      };
    }

    // Fetch inventory data for performance metrics
    const inventorySql = `
      SELECT
        asin,
        sku,
        product_name,
        available as available,
        days_of_supply as days_of_supply,
        sales_shipped_last_7_days as sales_shipped_last_7_days,
        sales_shipped_last_30_days as sales_shipped_last_30_days,
        sales_shipped_last_90_days as sales_shipped_last_90_days,
        sell_through as sell_through,
        featuredoffer_price as featuredoffer_price,
        sales_rank as sales_rank
      FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
      WHERE ob_date = (SELECT MAX(ob_date) FROM \`renuv-amazon-data-warehouse\`.\`ops_amazon\`.\`sp_fba_manage_inventory_health_v24\`)
      ORDER BY sales_shipped_last_30_days DESC
    `;

    const inventoryRows = await queryBigQuery<InventoryRow>(inventorySql);

    // Build inventory lookup
    const invMap = new Map<string, InventoryRow>();
    for (const inv of inventoryRows) {
      invMap.set(inv.asin, inv);
    }

    // Calculate aggregate metrics from sales traffic data
    const totalRevenue = salesRows.reduce((sum: number, r: any) => sum + Number(r.revenue || 0), 0);
    const totalUnits = salesRows.reduce((sum: number, r: any) => sum + Number(r.units || 0), 0);
    const totalSessions = salesRows.reduce((sum: number, r: any) => sum + Number(r.sessions || 0), 0);
    const totalOrders = salesRows.reduce((sum: number, r: any) => sum + Number(r.orders || 0), 0);
    const avgCvr = totalSessions > 0 ? (totalOrders / totalSessions) * 100 : 0;

    // KPIs
    const kpis: RenuvAsinKpi[] = [
      {
        key: 'asin-revenue',
        label: 'Revenue',
        value: formatCurrency(totalRevenue, true),
        delta: `${salesRows.length} ASINs tracked`,
        trend: 'flat',
        note: 'Total ordered revenue across all ASINs for selected period.',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'asin-units',
        label: 'Units sold',
        value: totalUnits.toLocaleString(),
        delta: `${totalOrders.toLocaleString()} orders`,
        trend: 'flat',
        note: 'Unit movement across all tracked ASINs.',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'conversion-rate',
        label: 'Avg conversion rate',
        value: formatPercent(avgCvr),
        delta: `${totalSessions.toLocaleString()} sessions`,
        trend: 'flat',
        note: 'Session-to-order conversion rate across all ASINs.',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      },
      {
        key: 'active-asins',
        label: 'Active ASINs',
        value: salesRows.length.toString(),
        delta: `${inventoryRows.length} with inventory data`,
        trend: 'flat',
        note: `${salesRows.length} ASINs with sales data, ${inventoryRows.length} tracked in FBA inventory.`,
        sourceView: 'reporting_amazon.asin_performance_rollup'
      },
      {
        key: 'top-asin-share',
        label: 'Top ASIN share',
        value: salesRows.length > 0 && totalRevenue > 0
          ? formatPercent((Number(salesRows[0].revenue || 0) / totalRevenue) * 100)
          : '0%',
        delta: 'Revenue concentration in #1 ASIN',
        trend: 'flat',
        note: 'Revenue share of top-performing ASIN.',
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      }
    ];

    // Top ASINs table (by revenue from sales traffic)
    const topAsins: RenuvAsinTableRow[] = salesRows.slice(0, 15).map((r: any) => {
      const inv = invMap.get(r.asin);
      const revenue = Number(r.revenue || 0);
      const revenueShare = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      const flags: string[] = [];
      let tone: Tone = 'neutral';

      if (revenueShare > 15) {
        flags.push('Leader');
        tone = 'positive';
      }
      if (inv && Number(inv.days_of_supply) <= 14) {
        flags.push('Low stock');
        tone = 'warning';
      }
      if (inv && Number(inv.days_of_supply) > 180) {
        flags.push('Overstocked');
      }
      if (Number(r.cvr || 0) > 30) {
        flags.push('High CVR');
        tone = 'positive';
      }

      return {
        asin: r.asin,
        title: r.product_name || inv?.product_name || r.asin,
        category: inv?.product_name ? 'Cleaning' : 'Unknown',
        orderedRevenue: formatCurrency(revenue, true),
        units: Number(r.units || 0).toLocaleString(),
        conversionRate: formatPercent(Number(r.cvr || 0)),
        adAttributedShare: inv ? `${inv.days_of_supply}d supply` : '—',
        revenueTrend: `${revenueShare.toFixed(1)}% share`,
        flags: flags.length > 0 ? flags : ['Active'],
        tone,
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      };
    });

    // Movers — top 5 ASINs by revenue share
    const movers: RenuvAsinMover[] = salesRows.slice(0, 5).map((r: any) => {
      const inv = invMap.get(r.asin);
      const revenue = Number(r.revenue || 0);
      const share = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      return {
        label: share > 15 ? 'Leader' : 'Core',
        asin: r.asin,
        detail: r.product_name || inv?.product_name || r.asin,
        metric: formatCurrency(revenue, true),
        change: `${share.toFixed(1)}% of total revenue`,
        trend: 'flat' as const,
        tone: (share > 20 ? 'positive' : 'neutral') as Tone,
        sourceView: 'core_amazon.fact_sales_traffic_daily'
      };
    });

    // Concentration panel
    const top3Revenue = salesRows.slice(0, 3).reduce((sum: number, r: any) => sum + Number(r.revenue || 0), 0);
    const top3Share = totalRevenue > 0 ? (top3Revenue / totalRevenue) * 100 : 0;
    const top1Share = salesRows.length > 0 && totalRevenue > 0
      ? (Number(salesRows[0].revenue || 0) / totalRevenue) * 100 : 0;

    const concentration: RenuvAsinConcentrationPanel = {
      headline: top1Share > 30
        ? 'High concentration: Top ASIN represents significant share'
        : 'Portfolio concentration is manageable',
      summary: `Top 3 ASINs represent ${top3Share.toFixed(1)}% of revenue. Top ASIN contributes ${top1Share.toFixed(1)}%.`,
      metrics: [
        {
          label: 'Top ASIN share',
          value: formatPercent(top1Share),
          detail: salesRows.length > 0
            ? `${salesRows[0].asin} — ${salesRows[0].product_name || invMap.get(salesRows[0].asin)?.product_name || 'Unknown'}`
            : 'N/A',
          tone: top1Share > 30 ? 'warning' : 'positive'
        },
        {
          label: 'Top 3 ASINs share',
          value: formatPercent(top3Share),
          detail: `Combined revenue: ${formatCurrency(top3Revenue, true)}`,
          tone: top3Share > 60 ? 'warning' : 'positive'
        },
        {
          label: 'Portfolio breadth',
          value: `${salesRows.length} ASINs with sales`,
          detail: `${inventoryRows.length} tracked in FBA inventory`,
          tone: salesRows.length > 10 ? 'positive' : 'neutral'
        }
      ],
      sourceView: 'core_amazon.fact_sales_traffic_daily'
    };

    // Flags (ASINs needing attention)
    const flags: RenuvAsinFlag[] = [];
    for (const inv of inventoryRows) {
      if (Number(inv.days_of_supply) <= 14 && Number(inv.days_of_supply) > 0) {
        flags.push({
          asin: inv.asin,
          title: inv.product_name || inv.asin,
          issue: 'Low stock',
          diagnosis: `Only ${Number(inv.days_of_supply)} days of supply remaining`,
          actionBias: `Expedite restock — ${Number(inv.available)} units available`,
          tone: Number(inv.days_of_supply) <= 7 ? 'critical' : 'warning',
          sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24'
        });
      }
    }
    
    // Add placeholder flags if none found
    if (flags.length === 0) {
      flags.push({
        asin: salesRows[0]?.asin || 'N/A',
        title: 'All ASINs healthy',
        issue: 'No critical issues',
        diagnosis: 'All monitored ASINs are in healthy operational status',
        actionBias: 'Continue monitoring inventory and performance trends',
        tone: 'positive',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24'
      });
    }

    return {
      brand: 'Renuv',
      periodLabel: `${sd} to ${ed}`,
      environment: 'internal',
      kpis,
      topAsins,
      movers,
      concentration,
      flags
    };
  } catch (err) {
    console.error('[fetchAsinPerformanceSnapshot] BigQuery error:', err);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      environment: 'internal' as const,
      kpis: [],
      topAsins: [],
      movers: [],
      concentration: {
        headline: 'Data unavailable',
        summary: 'Unable to load ASIN performance data.',
        metrics: [],
        sourceView: 'reporting_amazon.asin_performance_rollup'
      },
      flags: []
    };
  }
}
