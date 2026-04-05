export type RetailHealthKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: 'reporting_amazon.client_retail_health_kpis';
};

export type InventoryStatus = {
  asin: string;
  title: string;
  stock: string;
  daysRemaining: number;
  velocity: string;
  status: 'healthy' | 'watch' | 'critical';
  sourceView: 'reporting_amazon.client_inventory_status';
};

export type BuyBoxMetric = {
  label: string;
  value: string;
  interpretation: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type HealthAlert = {
  title: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  action: string;
  sourceView: 'reporting_amazon.client_health_alerts';
};

export type ClientRetailHealthSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: RetailHealthKpi[];
  inventory: InventoryStatus[];
  buyBox: {
    headline: string;
    summary: string;
    metrics: BuyBoxMetric[];
    sourceView: 'reporting_amazon.client_buybox_health';
  };
  alerts: HealthAlert[];
  implications: string;
  nextSteps: string[];
};

export const renuvClientRetailHealthMock: ClientRetailHealthSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Retail health remains strong with 97.8% Buy Box ownership and healthy review momentum. Inventory levels are adequate across most SKUs, with one watch item requiring monitoring. Content quality and listing compliance continue to meet Amazon standards.',
  kpis: [
    {
      key: 'buybox',
      label: 'Buy Box %',
      value: '97.8%',
      delta: '+0.4 pts',
      trend: 'up',
      interpretation: 'Excellent Buy Box ownership maintained throughout period',
      sourceView: 'reporting_amazon.client_retail_health_kpis'
    },
    {
      key: 'review-rating',
      label: 'Average review rating',
      value: '4.6',
      delta: '+0.1',
      trend: 'up',
      interpretation: 'Review profile strengthened with positive momentum',
      sourceView: 'reporting_amazon.client_retail_health_kpis'
    },
    {
      key: 'review-count',
      label: 'Total reviews',
      value: '2,847',
      delta: '+142',
      trend: 'up',
      interpretation: 'Strong review velocity continues to build social proof',
      sourceView: 'reporting_amazon.client_retail_health_kpis'
    },
    {
      key: 'in-stock',
      label: 'In-stock rate',
      value: '98.2%',
      delta: '-1.8 pts',
      trend: 'down',
      interpretation: 'One SKU had brief out-of-stock period, now resolved',
      sourceView: 'reporting_amazon.client_retail_health_kpis'
    },
    {
      key: 'suppressions',
      label: 'Content suppressions',
      value: '0',
      delta: 'No change',
      trend: 'flat',
      interpretation: 'All listings remain compliant with Amazon policies',
      sourceView: 'reporting_amazon.client_retail_health_kpis'
    }
  ],
  inventory: [
    {
      asin: 'B08XYZ1234',
      title: 'Renuv Silicone Scar Gel - Medical Grade (50g)',
      stock: '847 units',
      daysRemaining: 42,
      velocity: '~20 units/day',
      status: 'healthy',
      sourceView: 'reporting_amazon.client_inventory_status'
    },
    {
      asin: 'B08ABC5678',
      title: 'Renuv Advanced Scar Treatment - 3-Pack Bundle',
      stock: '312 units',
      daysRemaining: 38,
      velocity: '~8 units/day',
      status: 'healthy',
      sourceView: 'reporting_amazon.client_inventory_status'
    },
    {
      asin: 'B08DEF9012',
      title: 'Renuv Post-Surgery Recovery Gel (30g)',
      stock: '148 units',
      daysRemaining: 12,
      velocity: '~12 units/day',
      status: 'watch',
      sourceView: 'reporting_amazon.client_inventory_status'
    },
    {
      asin: 'B08GHI3456',
      title: 'Renuv Scar Sheets + Gel Combo',
      stock: '421 units',
      daysRemaining: 54,
      velocity: '~8 units/day',
      status: 'healthy',
      sourceView: 'reporting_amazon.client_inventory_status'
    }
  ],
  buyBox: {
    headline: 'Strong Buy Box position with excellent ownership',
    summary: 'Renuv maintained 97.8% Buy Box ownership across all SKUs throughout the period. Pricing remained competitive while preserving healthy margins. No significant competitive suppression events occurred.',
    metrics: [
      {
        label: 'Buy Box ownership',
        value: '97.8% (up from 97.4%)',
        interpretation: 'Excellent control with marginal improvement',
        tone: 'positive'
      },
      {
        label: 'Competitive pricing position',
        value: 'Within 3% of lowest FBA offer',
        interpretation: 'Competitive without margin erosion',
        tone: 'positive'
      },
      {
        label: 'FBA eligibility',
        value: '100% of SKUs FBA-eligible',
        interpretation: 'All products maintain Prime eligibility',
        tone: 'positive'
      },
      {
        label: 'Pricing volatility',
        value: 'Stable (±1.2% range)',
        interpretation: 'Minimal price fluctuation supports consistent margins',
        tone: 'positive'
      }
    ],
    sourceView: 'reporting_amazon.client_buybox_health'
  },
  alerts: [
    {
      title: 'Secondary SKU inventory watch',
      severity: 'medium',
      summary: 'The Post-Surgery Recovery Gel (30g) has approximately 12 days of inventory remaining at current velocity. Replenishment is inbound but tight timing creates stockout risk if velocity accelerates.',
      action: 'Monitor daily. Inbound shipment confirmed for April 8. Prepared to throttle ad spend if needed to extend runway.',
      sourceView: 'reporting_amazon.client_health_alerts'
    },
    {
      title: 'Review velocity opportunity',
      severity: 'low',
      summary: 'Review velocity on the 3-pack bundle SKU (8 reviews last 30 days) is below optimal levels for continued organic ranking growth. More customer feedback would strengthen competitive position.',
      action: 'Consider targeted post-purchase email sequence to encourage reviews on bundle SKU. Monitor review rate weekly.',
      sourceView: 'reporting_amazon.client_health_alerts'
    }
  ],
  implications: 'Retail health fundamentals are strong with excellent Buy Box control and improving review profile. The secondary SKU inventory watch item requires monitoring but is not an immediate crisis given confirmed replenishment timing. Overall, the account is well-positioned from a retail health perspective.',
  nextSteps: [
    'Monitor Post-Surgery Recovery Gel inventory daily and adjust ad spend if velocity spikes',
    'Confirm April 8 inbound shipment arrival and update inventory forecasts',
    'Implement review generation strategy for 3-pack bundle SKU to accelerate feedback velocity',
    'Continue monitoring competitor pricing movements to defend Buy Box position',
    'Review A+ content performance on secondary SKUs for optimization opportunities'
  ]
};

export const renuvClientRetailHealthContracts = {
  kpis: 'reporting_amazon.client_retail_health_kpis',
  inventory: 'reporting_amazon.client_inventory_status',
  buyBox: 'reporting_amazon.client_buybox_health',
  alerts: 'reporting_amazon.client_health_alerts'
} as const;
