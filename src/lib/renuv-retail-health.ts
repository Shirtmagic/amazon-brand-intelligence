export type RetailHealthKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  note?: string;
  sourceView: 'reporting_amazon.retail_health_kpi';
};

export type InventoryStatus = {
  sku: string;
  name: string;
  unitsAvailable: number;
  daysOfSupply: number;
  status: 'healthy' | 'warning' | 'critical';
  inboundQty: number;
  inboundEta: string | null;
};

export type OperationalStatus = {
  label: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  status: string;
  detail: string;
  sourceView: string;
};

export type CatalogSignal = {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  detail: string;
};

export type CatalogPanel = {
  headline: string;
  summary: string;
  signals: CatalogSignal[];
  sourceView: string;
};

export type RiskRow = {
  asin: string;
  title: string;
  risk: string;
  severity: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  stockPosition: string;
  suppressionState: string;
  pricingSignal: string;
  buyBoxSignal: string;
  revenueAtRisk: string;
  actionBias: string;
  sourceView: string;
};

export type Alert = {
  headline: string;
  entity: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  detail: string;
  actionBias: string;
  sourceView: string;
};

export type SourceStatus = {
  source: string;
  updatedAt: string;
  lag: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  readiness: string;
  sourceView: string;
};

export type RetailHealthSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: RetailHealthKpi[];
  inventoryStatus: InventoryStatus[];
  commentary: string;
  implications: string[];
  nextSteps: string[];
  operationalStatuses: OperationalStatus[];
  catalogPanel: CatalogPanel;
  risks: RiskRow[];
  alerts: Alert[];
  sourceStatuses: SourceStatus[];
};

export const renuvRetailHealthMock: RetailHealthSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Current status',
  summary: 'Retail health remains strong with primary SKUs well-stocked and Buy Box ownership at 98.7%. One secondary SKU showing inventory pressure with 12 days of supply. Content health and review velocity are positive indicators.',
  kpis: [
    {
      key: 'buybox',
      label: 'Buy Box ownership',
      value: '98.7%',
      delta: '+0.3 pts',
      trend: 'up',
      interpretation: 'Excellent Buy Box control with minimal competitive pressure on flagship SKUs',
      sourceView: 'reporting_amazon.retail_health_kpi'
    },
    {
      key: 'inventory-health',
      label: 'Inventory health score',
      value: '87/100',
      delta: '-5 pts',
      trend: 'down',
      interpretation: 'Overall inventory health good but one SKU approaching restock threshold',
      sourceView: 'reporting_amazon.retail_health_kpi'
    },
    {
      key: 'review-rating',
      label: 'Average review rating',
      value: '4.6 stars',
      delta: '+0.1',
      trend: 'up',
      interpretation: 'Review rating improved slightly with positive review velocity outpacing negative',
      sourceView: 'reporting_amazon.retail_health_kpi'
    },
    {
      key: 'review-count',
      label: 'Total reviews',
      value: '3,842',
      delta: '+127',
      trend: 'up',
      interpretation: 'Strong review acquisition pace supporting social proof and conversion',
      sourceView: 'reporting_amazon.retail_health_kpi'
    },
    {
      key: 'content-score',
      label: 'Content quality score',
      value: '94/100',
      delta: '0',
      trend: 'flat',
      interpretation: 'Content remains optimized across images, A+ content, and product descriptions',
      sourceView: 'reporting_amazon.retail_health_kpi'
    },
    {
      key: 'suppress-rate',
      label: 'Suppression rate',
      value: '0.2%',
      delta: '0',
      trend: 'flat',
      interpretation: 'Minimal listing suppression indicating excellent compliance and content quality',
      sourceView: 'reporting_amazon.retail_health_kpi'
    }
  ],
  inventoryStatus: [
    {
      sku: 'RENUV-001',
      name: 'Renuv Advanced Scar Gel - 30ml',
      unitsAvailable: 2847,
      daysOfSupply: 48,
      status: 'healthy',
      inboundQty: 1500,
      inboundEta: '2026-04-15'
    },
    {
      sku: 'RENUV-002',
      name: 'Renuv Scar Treatment - 50ml Bundle',
      unitsAvailable: 1924,
      daysOfSupply: 52,
      status: 'healthy',
      inboundQty: 1000,
      inboundEta: '2026-04-15'
    },
    {
      sku: 'RENUV-003',
      name: 'Renuv Post-Surgery Kit',
      unitsAvailable: 218,
      daysOfSupply: 12,
      status: 'warning',
      inboundQty: 500,
      inboundEta: '2026-04-08'
    },
    {
      sku: 'RENUV-004',
      name: 'Renuv 3-Pack Value Set',
      unitsAvailable: 892,
      daysOfSupply: 38,
      status: 'healthy',
      inboundQty: 600,
      inboundEta: '2026-04-15'
    }
  ],
  commentary: 'Retail health metrics remain strong overall with Buy Box ownership at 98.7% and minimal competitive pressure on core SKUs. Inventory health declined slightly from last period (87/100 vs 92/100) due to one secondary SKU (RENUV-003 Post-Surgery Kit) showing elevated velocity relative to stock levels. This SKU has approximately 12 days of supply at current run rate with inbound shipment confirmed for April 8. All other SKUs maintain healthy 38-52 day supply buffers. Review performance continues to strengthen with average rating improving to 4.6 stars and positive review acquisition pace (+127 reviews this period). Content quality score remains excellent at 94/100 with optimized A+ content, image galleries, and product descriptions. Suppression rate at 0.2% indicates strong compliance and listing health. The one area requiring attention is RENUV-003 inventory runway — if inbound shipment delays or demand accelerates, stockout risk becomes material within two weeks. All other indicators suggest strong retail fundamentals supporting continued growth.',
  implications: [
    'Buy Box ownership at 98.7% provides strong foundation for advertising efficiency — minimal waste from competitor traffic capture',
    'RENUV-003 inventory pressure requires near-term attention — stockout would disrupt bundle strategy and potentially harm account health',
    'Review velocity and rating improvement are positive conversion tailwinds — supporting organic rank gains and reduced paid reliance',
    'Content optimization at 94/100 indicates limited opportunity for additional lift from listing changes — focus should remain on external traffic and advertising'
  ],
  nextSteps: [
    'Monitor RENUV-003 inventory daily and prepare contingency plan if velocity increases or inbound shipment delays',
    'Consider temporarily reducing ad spend on RENUV-003 if stockout risk increases to extend runway until resupply',
    'Review inbound shipment tracking for April 8 delivery and coordinate with operations on expedited processing if possible',
    'Continue review acquisition efforts to maintain positive velocity and rating trajectory',
    'Audit Buy Box share on competitor ASINs to identify defensive or offensive expansion opportunities'
  ],
  operationalStatuses: [
    {
      label: 'Buy Box control',
      tone: 'positive',
      status: 'Excellent',
      detail: 'Maintaining 98.7% Buy Box ownership across flagship SKUs with minimal competitive pressure.',
      sourceView: 'reporting_amazon.buybox_health'
    },
    {
      label: 'Inventory position',
      tone: 'warning',
      status: 'Watch',
      detail: 'One SKU (RENUV-003) showing inventory pressure at 12 days of supply. Resupply inbound but requires monitoring.',
      sourceView: 'reporting_amazon.inventory_status'
    },
    {
      label: 'Content health',
      tone: 'positive',
      status: 'Optimized',
      detail: 'Content quality score at 94/100 with strong image, A+ content, and product description coverage.',
      sourceView: 'reporting_amazon.content_quality'
    },
    {
      label: 'Review velocity',
      tone: 'positive',
      status: 'Strong',
      detail: 'Adding 127 reviews this period with 4.6 star average. Positive review velocity supporting conversion.',
      sourceView: 'reporting_amazon.review_metrics'
    }
  ],
  catalogPanel: {
    headline: 'Retail health stable with one inventory watch',
    summary: 'Overall retail posture is strong with excellent Buy Box control, optimized content, and positive review momentum. Primary risk is RENUV-003 inventory pressure requiring near-term attention.',
    signals: [
      {
        label: 'Buy Box ownership',
        value: '98.7%',
        tone: 'positive',
        detail: 'Excellent control across flagship SKUs with minimal competitor interference.'
      },
      {
        label: 'Inventory risk',
        value: '1 SKU',
        tone: 'warning',
        detail: 'RENUV-003 at 12 days of supply requires monitoring until resupply arrives.'
      },
      {
        label: 'Content quality',
        value: '94/100',
        tone: 'positive',
        detail: 'Content optimization strong with limited opportunity for additional lift.'
      },
      {
        label: 'Review rating',
        value: '4.6 stars',
        tone: 'positive',
        detail: 'Review rating improving with positive acquisition velocity outpacing negative.'
      }
    ],
    sourceView: 'reporting_amazon.retail_health_rollup'
  },
  risks: [
    {
      asin: 'B08X123456',
      title: 'Renuv Advanced Scar Gel - 30ml',
      risk: 'Inventory pressure',
      severity: 'warning',
      stockPosition: '12 days',
      suppressionState: 'Active',
      pricingSignal: 'Stable',
      buyBoxSignal: '100%',
      revenueAtRisk: '$8,400/mo',
      actionBias: 'Monitor daily, consider reducing ad spend if velocity increases',
      sourceView: 'reporting_amazon.asin_retail_risk'
    },
    {
      asin: 'B08X234567',
      title: 'Renuv Keloid Treatment Kit',
      risk: 'Buy Box loss',
      severity: 'warning',
      stockPosition: '42 days',
      suppressionState: 'Active',
      pricingSignal: 'Below market',
      buyBoxSignal: '94%',
      revenueAtRisk: '$2,100/mo',
      actionBias: 'Review pricing strategy to improve Buy Box share',
      sourceView: 'reporting_amazon.asin_retail_risk'
    },
    {
      asin: 'B08X345678',
      title: 'Renuv Post-Surgical Recovery Pack',
      risk: 'None',
      severity: 'positive',
      stockPosition: '68 days',
      suppressionState: 'Active',
      pricingSignal: 'Optimal',
      buyBoxSignal: '100%',
      revenueAtRisk: '$0',
      actionBias: 'No action required',
      sourceView: 'reporting_amazon.asin_retail_risk'
    }
  ],
  alerts: [
    {
      headline: 'RENUV-003 approaching restock threshold',
      entity: 'ASIN: B08X123456',
      tone: 'warning',
      detail: 'Current inventory at 12 days of supply. Inbound shipment scheduled for April 8. Monitor velocity daily to avoid stockout.',
      actionBias: 'Prepare contingency plan for ad spend reduction if velocity increases or inbound delays',
      sourceView: 'reporting_amazon.inventory_alerts'
    },
    {
      headline: 'Buy Box share drop on RENUV-002',
      entity: 'ASIN: B08X234567',
      tone: 'warning',
      detail: 'Buy Box ownership decreased to 94% from 98% due to competitor pricing below our floor. Revenue impact ~$2.1K/month.',
      actionBias: 'Review pricing strategy and competitor monitoring to recover Buy Box share',
      sourceView: 'reporting_amazon.buybox_alerts'
    },
    {
      headline: 'Review velocity strong across flagship SKUs',
      entity: 'Brand-wide',
      tone: 'positive',
      detail: 'Added 127 reviews this period with 4.6 star average. Positive review acquisition pace supporting conversion and organic rank.',
      actionBias: 'Continue review acquisition efforts to maintain momentum',
      sourceView: 'reporting_amazon.review_alerts'
    }
  ],
  sourceStatuses: [
    {
      source: 'Inventory position data',
      updatedAt: '2026-04-01 09:15 UTC',
      lag: '< 8 hours',
      tone: 'positive',
      readiness: 'Inventory levels and days-of-supply calculations are current and ready for operational decisions.',
      sourceView: 'reporting_amazon.inventory_status'
    },
    {
      source: 'Buy Box health data',
      updatedAt: '2026-04-01 08:30 UTC',
      lag: '< 10 hours',
      tone: 'positive',
      readiness: 'Buy Box ownership and competitive pricing data is fresh enough for defensive strategy adjustments.',
      sourceView: 'reporting_amazon.buybox_health'
    },
    {
      source: 'Review and rating data',
      updatedAt: '2026-03-31 23:45 UTC',
      lag: '~18 hours',
      tone: 'warning',
      readiness: 'Review metrics have typical lag; most recent reviews may not be reflected in current averages.',
      sourceView: 'reporting_amazon.review_metrics'
    }
  ]
};

export const renuvRetailHealthContracts = {
  kpis: 'reporting_amazon.retail_health_kpi',
  inventoryStatus: 'reporting_amazon.inventory_status',
  snapshot: 'reporting_amazon.retail_health_snapshot'
} as const;
