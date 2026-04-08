'use server';

import { queryBigQuery } from '@/lib/bigquery';
import {
  RetailHealthSnapshot,
  RetailHealthKpi,
  InventoryStatus,
  OperationalStatus,
  CatalogPanel,
  RiskRow,
  Alert,
  SourceStatus,
} from './renuv-retail-health';

interface InventoryHealthRow {
  asin: string;
  sku: string;
  product_name: string;
  available: number;
  days_of_supply: number;
  inbound_quantity: number;
  inbound_shipped: number;
  inbound_working: number;
  inbound_received: number;
  reserved_quantity: number;
  unfulfillable_quantity: number;
  sales_shipped_last_7_days: number;
  sales_shipped_last_30_days: number;
  sales_shipped_last_90_days: number;
  sell_through: number;
  weeks_of_cover: number;
  weeks_of_cover_t30: number;
  inv_age_0_to_90_days: number;
  inv_age_91_to_180_days: number;
  inv_age_181_to_270_days: number;
  inv_age_271_to_365_days: number;
  inv_age_365_plus_days: number;
  estimated_storage_cost_next_month: number;
  estimated_ltsf_next_charge: number;
  projected_ltsf_6_mo: number;
  recommended_action: string;
  recommended_order_quantity: number;
  recommended_removal_quantity: number;
  fba_inventory_level_health_status: string;
  alert: string;
  featuredoffer_price: number;
  sales_rank: number;
  inventory_supply_at_fba: number;
  snapshot_date: { value: string };
  ob_date: { value: string };
}

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function skuStatus(dos: number): 'healthy' | 'warning' | 'critical' {
  if (dos <= 7) return 'critical';
  if (dos <= 21) return 'warning';
  return 'healthy';
}

export async function fetchRetailHealthSnapshot(): Promise<RetailHealthSnapshot> {
  try {
    const inventoryRows = await queryBigQuery<InventoryHealthRow>(`
      SELECT
        asin, sku, product_name,
        CAST(available AS INT64) as available,
        CAST(days_of_supply AS INT64) as days_of_supply,
        inbound_quantity as inbound_quantity,
        inbound_shipped as inbound_shipped,
        inbound_working as inbound_working,
        inbound_received as inbound_received,
        reserved_quantity as reserved_quantity,
        unfulfillable_quantity as unfulfillable_quantity,
        sales_shipped_last_7_days as sales_shipped_last_7_days,
        sales_shipped_last_30_days as sales_shipped_last_30_days,
        sales_shipped_last_90_days as sales_shipped_last_90_days,
        sell_through as sell_through,
        weeks_of_cover as weeks_of_cover,
        weeks_of_cover_t30 as weeks_of_cover_t30,
        inv_age_0_to_90_days as inv_age_0_to_90_days,
        inv_age_91_to_180_days as inv_age_91_to_180_days,
        inv_age_181_to_270_days as inv_age_181_to_270_days,
        inv_age_271_to_365_days as inv_age_271_to_365_days,
        inv_age_365_plus_days as inv_age_365_plus_days,
        estimated_storage_cost_next_month as estimated_storage_cost_next_month,
        estimated_ltsf_next_charge as estimated_ltsf_next_charge,
        projected_ltsf_6_mo as projected_ltsf_6_mo,
        recommended_action,
        recommended_order_quantity as recommended_order_quantity,
        recommended_removal_quantity as recommended_removal_quantity,
        fba_inventory_level_health_status,
        alert,
        featuredoffer_price as featuredoffer_price,
        sales_rank as sales_rank,
        inventory_supply_at_fba as inventory_supply_at_fba,
        snapshot_date,
        ob_date
      FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
      WHERE ob_date = (SELECT MAX(ob_date) FROM \`renuv-amazon-data-warehouse\`.\`ops_amazon\`.\`sp_fba_manage_inventory_health_v24\`)
      ORDER BY sales_shipped_last_30_days DESC
    `);

    if (!inventoryRows.length) return {
      brand: 'Renuv',
      periodLabel: 'No inventory data available',
      summary: 'No FBA inventory data found.',
      kpis: [],
      inventoryStatus: [],
      commentary: 'No inventory data available.',
      implications: [],
      nextSteps: [],
      operationalStatuses: [],
      catalogPanel: { headline: 'No data', summary: '', signals: [], sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24' as const },
      risks: [],
      alerts: [],
      sourceStatuses: []
    };

    // Aggregate metrics
    const totalAvailable = inventoryRows.reduce((s, r) => s + Number(r.available), 0);
    const totalInbound = inventoryRows.reduce((s, r) => s + Number(r.inbound_quantity), 0);
    const totalReserved = inventoryRows.reduce((s, r) => s + Number(r.reserved_quantity), 0);
    const totalUnfulfillable = inventoryRows.reduce((s, r) => s + Number(r.unfulfillable_quantity), 0);
    const totalStorageCost = inventoryRows.reduce((s, r) => s + Number(r.estimated_storage_cost_next_month), 0);
    const totalLtsfExposure = inventoryRows.reduce((s, r) => s + Number(r.estimated_ltsf_next_charge), 0);
    const total30dSales = inventoryRows.reduce((s, r) => s + Number(r.sales_shipped_last_30_days), 0);
    const total7dSales = inventoryRows.reduce((s, r) => s + Number(r.sales_shipped_last_7_days), 0);
    const avgDaysOfSupply = inventoryRows.length > 0
      ? Math.round(inventoryRows.reduce((s, r) => s + Number(r.days_of_supply), 0) / inventoryRows.length)
      : 0;
    
    const criticalSkus = inventoryRows.filter(r => Number(r.days_of_supply) <= 7);
    const warningSkus = inventoryRows.filter(r => Number(r.days_of_supply) > 7 && Number(r.days_of_supply) <= 21);
    const healthySkus = inventoryRows.filter(r => Number(r.days_of_supply) > 21);
    const agingSkus = inventoryRows.filter(r => Number(r.inv_age_365_plus_days) > 0);
    const ltsfSkus = inventoryRows.filter(r => Number(r.estimated_ltsf_next_charge) > 0);

    // Inventory health score (0-100)
    const healthScore = Math.round(
      100 - (criticalSkus.length * 20) - (warningSkus.length * 8) - (agingSkus.length * 5) - (ltsfSkus.length * 3)
    );

    // KPIs
    const kpis: RetailHealthKpi[] = [
      {
        key: 'total-available',
        label: 'Total units available',
        value: totalAvailable.toLocaleString(),
        delta: `+${totalInbound.toLocaleString()} inbound`,
        trend: totalInbound > 0 ? 'up' : 'flat',
        interpretation: `${inventoryRows.length} active SKUs in FBA with ${totalReserved.toLocaleString()} reserved`,
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
      {
        key: 'inventory-health',
        label: 'Inventory health score',
        value: `${Math.max(0, healthScore)}/100`,
        delta: criticalSkus.length > 0 ? `${criticalSkus.length} critical` : 'No critical SKUs',
        trend: criticalSkus.length > 0 ? 'down' : warningSkus.length > 0 ? 'down' : 'up',
        interpretation: `${healthySkus.length} healthy, ${warningSkus.length} warning, ${criticalSkus.length} critical`,
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
      {
        key: 'avg-dos',
        label: 'Avg days of supply',
        value: `${avgDaysOfSupply} days`,
        delta: warningSkus.length > 0 ? `${warningSkus.length} SKUs below 21 days` : 'All above 21 days',
        trend: avgDaysOfSupply > 30 ? 'up' : avgDaysOfSupply > 14 ? 'flat' : 'down',
        interpretation: `Range: ${Math.min(...inventoryRows.map(r => Number(r.days_of_supply)))} to ${Math.max(...inventoryRows.map(r => Number(r.days_of_supply)))} days across all SKUs`,
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
      {
        key: 'velocity',
        label: 'Sales shipped (30d)',
        value: fmt(total30dSales),
        delta: `${fmt(total7dSales)} last 7d`,
        trend: total7dSales * 4.3 > total30dSales ? 'up' : 'flat',
        interpretation: `${fmt(total30dSales / 30)}/day avg, ${fmt(total7dSales / 7)}/day recent`,
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
      {
        key: 'storage-cost',
        label: 'Est. storage cost (next month)',
        value: fmt(totalStorageCost),
        delta: totalLtsfExposure > 0 ? `+${fmt(totalLtsfExposure)} LTSF` : 'No LTSF exposure',
        trend: totalLtsfExposure > 0 ? 'down' : 'flat',
        interpretation: totalLtsfExposure > 0
          ? `${ltsfSkus.length} SKU(s) facing long-term storage fees`
          : 'No long-term storage fee exposure',
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
      {
        key: 'sell-through',
        label: 'Avg sell-through rate',
        value: `${(inventoryRows.reduce((s, r) => s + Number(r.sell_through), 0) / inventoryRows.length).toFixed(1)}%`,
        delta: '',
        trend: 'flat',
        interpretation: 'Units sold and shipped over the past 90 days relative to avg inventory',
        sourceView: 'reporting_amazon.retail_health_kpi',
      },
    ];

    // Per-SKU inventory status
    const inventoryStatus: InventoryStatus[] = inventoryRows.map(r => ({
      sku: r.sku,
      name: r.product_name || r.asin,
      unitsAvailable: Number(r.available),
      daysOfSupply: Number(r.days_of_supply),
      status: skuStatus(Number(r.days_of_supply)),
      inboundQty: Number(r.inbound_quantity),
      inboundEta: null,
    }));

    // Operational statuses
    const operationalStatuses: OperationalStatus[] = [
      {
        label: 'Inventory position',
        tone: criticalSkus.length > 0 ? 'critical' : warningSkus.length > 0 ? 'warning' : 'positive',
        status: criticalSkus.length > 0 ? 'Critical' : warningSkus.length > 0 ? 'Watch' : 'Healthy',
        detail: criticalSkus.length > 0
          ? `${criticalSkus.length} SKU(s) critically low: ${criticalSkus.map(r => `${r.sku} (${r.days_of_supply}d)`).join(', ')}`
          : warningSkus.length > 0
          ? `${warningSkus.length} SKU(s) below 21-day threshold: ${warningSkus.map(r => `${r.sku} (${r.days_of_supply}d)`).join(', ')}`
          : `All ${healthySkus.length} SKUs above 21-day supply threshold`,
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      },
      {
        label: 'Inbound pipeline',
        tone: totalInbound > 0 ? 'positive' : 'warning',
        status: totalInbound > 0 ? 'Active' : 'Empty',
        detail: totalInbound > 0
          ? `${totalInbound.toLocaleString()} units inbound across active shipments`
          : 'No inbound shipments detected — review restock needs',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      },
      {
        label: 'Storage cost exposure',
        tone: totalLtsfExposure > 0 ? 'warning' : 'positive',
        status: totalLtsfExposure > 0 ? 'LTSF Risk' : 'Clean',
        detail: totalLtsfExposure > 0
          ? `${fmt(totalLtsfExposure)} in LTSF charges pending. ${ltsfSkus.length} SKU(s) with aging inventory.`
          : `No long-term storage fee exposure. Est. ${fmt(totalStorageCost)} monthly storage.`,
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      },
      {
        label: 'Unfulfillable inventory',
        tone: totalUnfulfillable > 0 ? 'warning' : 'positive',
        status: totalUnfulfillable > 0 ? `${totalUnfulfillable} units` : 'None',
        detail: totalUnfulfillable > 0
          ? `${totalUnfulfillable} units marked unfulfillable — review for removal or disposal`
          : 'No unfulfillable inventory detected',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      },
    ];

    // Catalog panel
    const catalogPanel: CatalogPanel = {
      headline: criticalSkus.length > 0
        ? `Inventory alert: ${criticalSkus.length} SKU(s) critically low`
        : warningSkus.length > 0
        ? `Inventory watch: ${warningSkus.length} SKU(s) approaching restock threshold`
        : 'Inventory health strong across all SKUs',
      summary: `${inventoryRows.length} active SKUs tracked. ${totalAvailable.toLocaleString()} units available, ${totalInbound.toLocaleString()} inbound. Avg ${avgDaysOfSupply} days of supply.`,
      signals: [
        {
          label: 'Available units',
          value: totalAvailable.toLocaleString(),
          tone: 'positive',
          detail: `Plus ${totalReserved.toLocaleString()} reserved for customer orders`,
        },
        {
          label: 'Days of supply',
          value: `${avgDaysOfSupply} avg`,
          tone: avgDaysOfSupply > 30 ? 'positive' : avgDaysOfSupply > 14 ? 'warning' : 'critical',
          detail: `Range: ${Math.min(...inventoryRows.map(r => Number(r.days_of_supply)))} to ${Math.max(...inventoryRows.map(r => Number(r.days_of_supply)))} days`,
        },
        {
          label: 'Aging inventory',
          value: agingSkus.length > 0 ? `${agingSkus.length} SKU(s)` : 'None',
          tone: agingSkus.length > 0 ? 'warning' : 'positive',
          detail: agingSkus.length > 0
            ? `${agingSkus.reduce((s, r) => s + Number(r.inv_age_365_plus_days), 0)} units over 365 days old`
            : 'No inventory over 365 days old',
        },
        {
          label: 'Sales shipped (30d)',
          value: fmt(total30dSales),
          tone: 'positive',
          detail: `${fmt(total30dSales / 30)}/day average`,
        },
      ],
      sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
    };

    // Risk rows
    const risks: RiskRow[] = inventoryRows.map(r => {
      const isLowStock = Number(r.days_of_supply) <= 14;
      const isAging = Number(r.inv_age_365_plus_days) > 0;
      const hasLtsf = Number(r.estimated_ltsf_next_charge) > 0;
      const needsRestock = Number(r.recommended_order_quantity) > 0;
      const needsRemoval = Number(r.recommended_removal_quantity) > 0;

      let risk = 'None';
      let severity: RiskRow['severity'] = 'positive';
      let actionBias = 'No action required';

      if (isLowStock) {
        risk = `Low stock — ${Number(r.days_of_supply)} days supply`;
        severity = Number(r.days_of_supply) <= 7 ? 'critical' : 'warning';
        actionBias = needsRestock
          ? `Restock ${Number(r.recommended_order_quantity)} units`
          : 'Expedite inbound shipment or reduce ad spend';
      } else if (isAging && hasLtsf) {
        risk = `Aging inventory + LTSF exposure (${fmt(Number(r.estimated_ltsf_next_charge))})`;
        severity = 'warning';
        actionBias = needsRemoval
          ? `Remove ${Number(r.recommended_removal_quantity)} units to avoid fees`
          : 'Consider promotion to accelerate sell-through';
      } else if (isAging) {
        risk = `${Number(r.inv_age_365_plus_days)} units over 365 days old`;
        severity = 'warning';
        actionBias = 'Monitor — approaching LTSF threshold';
      }

      const monthlyRev = Number(r.sales_shipped_last_30_days) * Number(r.featuredoffer_price || 0);

      return {
        asin: r.asin,
        title: r.product_name || r.asin,
        risk,
        severity,
        stockPosition: `${Number(r.days_of_supply)}d / ${Number(r.available)} units`,
        suppressionState: 'Active',
        pricingSignal: Number(r.featuredoffer_price) > 0 ? `$${Number(r.featuredoffer_price).toFixed(2)}` : 'N/A',
        buyBoxSignal: 'N/A',
        revenueAtRisk: isLowStock ? `${fmt(monthlyRev)}/mo` : '$0',
        actionBias,
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      };
    });

    // Alerts
    const alerts: Alert[] = [];
    for (const r of criticalSkus) {
      alerts.push({
        headline: `CRITICAL: ${r.sku} at ${Number(r.days_of_supply)} days of supply`,
        entity: `ASIN: ${r.asin}`,
        tone: 'critical',
        detail: `${r.product_name || r.asin} has only ${Number(r.available)} units available with ${fmt(Number(r.sales_shipped_last_7_days))} shipped last 7 days. ${Number(r.inbound_quantity) > 0 ? `${Number(r.inbound_quantity)} units inbound.` : 'No inbound shipment detected.'}`,
        actionBias: Number(r.recommended_order_quantity) > 0
          ? `Restock ${Number(r.recommended_order_quantity)} units immediately`
          : 'Reduce ad spend and expedite resupply',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      });
    }
    for (const r of warningSkus) {
      alerts.push({
        headline: `${r.sku} approaching restock threshold (${Number(r.days_of_supply)}d)`,
        entity: `ASIN: ${r.asin}`,
        tone: 'warning',
        detail: `${r.product_name || r.asin} has ${Number(r.available)} units with ${Number(r.days_of_supply)} days of supply. ${Number(r.inbound_quantity) > 0 ? `${Number(r.inbound_quantity)} units inbound.` : 'No inbound shipment.'}`,
        actionBias: 'Monitor daily and prepare restock if velocity increases',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      });
    }
    for (const r of ltsfSkus) {
      alerts.push({
        headline: `LTSF exposure on ${r.sku}: ${fmt(Number(r.estimated_ltsf_next_charge))}`,
        entity: `ASIN: ${r.asin}`,
        tone: 'warning',
        detail: `${Number(r.inv_age_365_plus_days)} units over 365 days old. Estimated charge: ${fmt(Number(r.estimated_ltsf_next_charge))}. 6-month projection: ${fmt(Number(r.projected_ltsf_6_mo))}.`,
        actionBias: Number(r.recommended_removal_quantity) > 0
          ? `Remove ${Number(r.recommended_removal_quantity)} units`
          : 'Run promotion to clear aging stock',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        headline: 'All SKUs in healthy inventory position',
        entity: 'Brand-wide',
        tone: 'positive',
        detail: `${healthySkus.length} SKUs above 21-day supply threshold. Total ${totalAvailable.toLocaleString()} units available.`,
        actionBias: 'Continue monitoring — no immediate action required',
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      });
    }

    // Source statuses
    const latestDate = inventoryRows[0]?.ob_date?.value || inventoryRows[0]?.snapshot_date?.value || 'Unknown';
    const sourceStatuses: SourceStatus[] = [
      {
        source: 'FBA Inventory Health',
        updatedAt: latestDate,
        lag: '< 24 hours',
        tone: 'positive',
        readiness: `${inventoryRows.length} SKUs tracked with full inventory health metrics`,
        sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24',
      },
    ];

    // Build summary
    const summaryParts: string[] = [];
    if (criticalSkus.length > 0) summaryParts.push(`${criticalSkus.length} SKU(s) critically low on stock`);
    if (warningSkus.length > 0) summaryParts.push(`${warningSkus.length} SKU(s) approaching restock threshold`);
    summaryParts.push(`${totalAvailable.toLocaleString()} total units available across ${inventoryRows.length} SKUs`);
    summaryParts.push(`Avg ${avgDaysOfSupply} days of supply`);
    if (totalLtsfExposure > 0) summaryParts.push(`${fmt(totalLtsfExposure)} LTSF exposure`);

    const commentary = `Inventory snapshot shows ${inventoryRows.length} active Renuv SKUs in FBA. ${healthySkus.length} SKUs are in healthy position (>21 days supply), ${warningSkus.length} need watching, and ${criticalSkus.length} are critical. Total available inventory is ${totalAvailable.toLocaleString()} units with ${totalInbound.toLocaleString()} inbound. Sales shipped: ${fmt(total30dSales)} (30-day) / ${fmt(total7dSales)} (7-day). Estimated monthly storage cost is ${fmt(totalStorageCost)}${totalLtsfExposure > 0 ? ` with ${fmt(totalLtsfExposure)} in long-term storage fee exposure` : ' with no LTSF exposure'}.`;

    const implications: string[] = [];
    if (criticalSkus.length > 0) implications.push(`Critical stock risk on ${criticalSkus.map(r => r.sku).join(', ')} — potential stockout will impact revenue and account health`);
    if (warningSkus.length > 0) implications.push(`${warningSkus.map(r => r.sku).join(', ')} need restock planning within 1-2 weeks`);
    if (totalLtsfExposure > 0) implications.push(`Long-term storage fees eroding margin — consider removal or promotion for aging SKUs`);
    if (total7dSales / 7 > total30dSales / 30 * 1.2) implications.push('Recent sales pace accelerating — monitor stock levels more frequently');
    implications.push(`Storage cost of ${fmt(totalStorageCost)}/month is ${totalStorageCost > 500 ? 'significant' : 'manageable'} — review aged inventory for optimization`);

    const nextSteps: string[] = [];
    for (const r of criticalSkus) nextSteps.push(`Restock ${r.sku} immediately — ${r.days_of_supply} days of supply remaining`);
    for (const r of warningSkus) nextSteps.push(`Plan restock for ${r.sku} — ${r.days_of_supply} days of supply`);
    if (ltsfSkus.length > 0) nextSteps.push(`Review removal/promotion options for ${ltsfSkus.length} SKU(s) with LTSF exposure`);
    if (totalUnfulfillable > 0) nextSteps.push(`Process ${totalUnfulfillable} unfulfillable units — remove or dispose`);
    nextSteps.push('Continue monitoring daily velocity for demand shifts');

    return {
      brand: 'Renuv',
      periodLabel: `Inventory snapshot — ${latestDate}`,
      summary: summaryParts.join('. ') + '.',
      kpis,
      inventoryStatus,
      commentary,
      implications,
      nextSteps,
      operationalStatuses,
      catalogPanel,
      risks,
      alerts,
      sourceStatuses,
    };
  } catch (err) {
    console.error('[Retail Health BigQuery Error]', err);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to load retail health data.',
      kpis: [],
      inventoryStatus: [],
      commentary: 'Retail health data unavailable.',
      implications: [],
      nextSteps: [],
      operationalStatuses: [],
      catalogPanel: { headline: 'Data unavailable', summary: '', signals: [], sourceView: 'ops_amazon.sp_fba_manage_inventory_health_v24' as const },
      risks: [],
      alerts: [],
      sourceStatuses: []
    };
  }
}
