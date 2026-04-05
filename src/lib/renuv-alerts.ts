export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'resolved' | 'acknowledged';

export type AlertTrigger =
  | 'sales_drop'
  | 'spend_inefficiency'
  | 'conversion_deterioration'
  | 'traffic_drop'
  | 'low_stock'
  | 'search_decline'
  | 'listing_issue';

export type RenuvAlert = {
  id: string;
  trigger: AlertTrigger;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  summary: string;
  explanation: string;
  metric: string;
  currentValue: string;
  priorValue: string;
  threshold: string;
  impact: string;
  recommendations: string[];
  firstDetected: string;
  lastEvaluated: string;
  sourceView: 'reporting_amazon.alert_evaluation_daily';
  relatedEntity?: string;
  relatedEntityType?: 'asin' | 'campaign' | 'query' | 'category';
};

export type RenuvAlertSummary = {
  critical: number;
  warning: number;
  info: number;
  totalActive: number;
  lastEvaluationRun: string;
  sourceView: 'reporting_amazon.alert_summary_daily';
};

export type RenuvAlertSnapshot = {
  brand: string;
  periodLabel: string;
  summary: RenuvAlertSummary;
  alerts: RenuvAlert[];
};

// Trigger definitions for evaluation engine
export type AlertTriggerDefinition = {
  trigger: AlertTrigger;
  name: string;
  description: string;
  category: 'performance' | 'efficiency' | 'operations' | 'search';
  metricSource: string;
  thresholds: {
    critical: number;
    warning: number;
  };
  evaluationLogic: string;
};

export const alertTriggerDefinitions: AlertTriggerDefinition[] = [
  {
    trigger: 'sales_drop',
    name: 'Sales drop versus prior period',
    description: 'Ordered revenue declined meaningfully compared to the prior period',
    category: 'performance',
    metricSource: 'reporting_amazon.executive_kpi_daily',
    thresholds: {
      critical: -15, // -15% or worse
      warning: -8    // -8% to -15%
    },
    evaluationLogic: 'Compare current period ordered revenue to prior period; trigger if decline exceeds threshold'
  },
  {
    trigger: 'spend_inefficiency',
    name: 'Spend inefficiency spike',
    description: 'TACOS or ACOS increased significantly, indicating reduced advertising efficiency',
    category: 'efficiency',
    metricSource: 'reporting_amazon.ads_campaign_summary_daily',
    thresholds: {
      critical: 25,  // +25% TACOS increase
      warning: 15    // +15% to +25% TACOS increase
    },
    evaluationLogic: 'Monitor TACOS trend; trigger if efficiency deteriorates beyond threshold'
  },
  {
    trigger: 'conversion_deterioration',
    name: 'Conversion deterioration on key ASINs',
    description: 'Conversion rate on top ASINs declined below acceptable range',
    category: 'performance',
    metricSource: 'reporting_amazon.asin_performance_daily',
    thresholds: {
      critical: -20, // -20% CVR drop
      warning: -12   // -12% to -20% CVR drop
    },
    evaluationLogic: 'Track CVR for ASINs contributing >10% of revenue; alert if drop exceeds threshold'
  },
  {
    trigger: 'traffic_drop',
    name: 'Meaningful traffic drop',
    description: 'Sessions or page views decreased significantly versus prior period',
    category: 'performance',
    metricSource: 'reporting_amazon.traffic_summary_daily',
    thresholds: {
      critical: -25, // -25% or worse
      warning: -15   // -15% to -25%
    },
    evaluationLogic: 'Compare current period sessions to prior period; trigger on significant decline'
  },
  {
    trigger: 'low_stock',
    name: 'Low stock / stockout risk',
    description: 'Inventory levels critically low or stockout imminent on key ASINs',
    category: 'operations',
    metricSource: 'reporting_amazon.inventory_health_daily',
    thresholds: {
      critical: 7,   // ≤7 days of stock
      warning: 14    // ≤14 days of stock
    },
    evaluationLogic: 'Monitor days of supply for top ASINs; alert when inventory falls below threshold'
  },
  {
    trigger: 'search_decline',
    name: 'Material search decline on important terms',
    description: 'Search volume or rank position deteriorated on high-value queries',
    category: 'search',
    metricSource: 'reporting_amazon.search_query_opportunities_daily',
    thresholds: {
      critical: -30, // -30% search volume or rank drop
      warning: -18   // -18% to -30% decline
    },
    evaluationLogic: 'Track high-intent query performance; trigger on volume or rank deterioration'
  },
  {
    trigger: 'listing_issue',
    name: 'Listing/retail issue if sourced reliably',
    description: 'Content quality score dropped, suppression detected, or buybox lost',
    category: 'operations',
    metricSource: 'reporting_amazon.retail_health_daily',
    thresholds: {
      critical: 1,   // Suppression or critical content issue
      warning: 1     // Quality score drop or buybox share <80%
    },
    evaluationLogic: 'Monitor listing health signals; trigger on suppression, content flags, or buybox loss'
  }
];

// Mock alert data
export const renuvAlertsMock: RenuvAlertSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 7 days · internal preview',
  summary: {
    critical: 1,
    warning: 3,
    info: 2,
    totalActive: 6,
    lastEvaluationRun: 'Today · 4:00 AM ET',
    sourceView: 'reporting_amazon.alert_summary_daily'
  },
  alerts: [
    {
      id: 'alert-001',
      trigger: 'conversion_deterioration',
      severity: 'critical',
      status: 'active',
      title: 'Conversion rate dropped significantly on Core Recovery Serum',
      summary: 'CVR declined 22.4% versus prior period',
      explanation: 'The primary SKU (B08XYZ1234) experienced a sharp conversion rate decline from 21.3% to 16.5% over the trailing 7 days. This represents a 22.4% decrease and exceeds the critical threshold of -20%. Traffic volume remained stable, suggesting the issue is downstream of the search/ad layer.',
      metric: 'Conversion rate',
      currentValue: '16.5%',
      priorValue: '21.3%',
      threshold: '-20% (critical)',
      impact: 'Estimated revenue loss: $8.2k over the period',
      recommendations: [
        'Review recent detail page changes (images, A+ content, bullet updates)',
        'Check for new negative reviews or rating deterioration',
        'Audit price competitiveness versus category benchmark',
        'Verify no inventory/fulfillment messaging changed'
      ],
      firstDetected: '2026-03-28',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'B08XYZ1234',
      relatedEntityType: 'asin'
    },
    {
      id: 'alert-002',
      trigger: 'spend_inefficiency',
      severity: 'warning',
      status: 'active',
      title: 'TACOS increased on non-brand acquisition campaign',
      summary: 'TACOS rose 18.6% versus prior period',
      explanation: 'The "SP · Non-brand acquisition" campaign saw TACOS rise from 3.9% to 4.6%, representing an 18.6% efficiency decline. ROAS dropped from 3.7x to 3.1x as spend increased faster than attributed revenue. This crosses the warning threshold but remains below critical.',
      metric: 'TACOS',
      currentValue: '4.6%',
      priorValue: '3.9%',
      threshold: '+15% (warning)',
      impact: 'Efficiency erosion reduced gross margin by ~$1.3k',
      recommendations: [
        'Audit search term report for new inefficient broad match spill',
        'Review bid strategy changes that may have increased CPCs',
        'Consider tightening match types or negative keyword expansion',
        'Evaluate if new competitive pressure is driving bid inflation'
      ],
      firstDetected: '2026-03-30',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'SP · Non-brand acquisition',
      relatedEntityType: 'campaign'
    },
    {
      id: 'alert-003',
      trigger: 'search_decline',
      severity: 'warning',
      status: 'active',
      title: 'Search volume dropped for "scar gel for surgery"',
      summary: 'Search volume declined 24.1% versus prior period',
      explanation: 'This high-intent query showed search volume decline from ~41k to ~31k searches over the trailing period. Organic rank also slipped from position 8 to position 12. While still a strong opportunity term, the combined volume + rank deterioration warrants review.',
      metric: 'Search volume + rank position',
      currentValue: '31k searches, rank #12',
      priorValue: '41k searches, rank #8',
      threshold: '-18% (warning)',
      impact: 'Estimated lost impression opportunity: ~18k impressions',
      recommendations: [
        'Check if seasonal trend or broader category shift',
        'Review organic rank factors (reviews, ratings, relevance)',
        'Increase sponsored coverage to compensate for organic slip',
        'Audit detail page content alignment with query intent'
      ],
      firstDetected: '2026-03-29',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'scar gel for surgery',
      relatedEntityType: 'query'
    },
    {
      id: 'alert-004',
      trigger: 'low_stock',
      severity: 'warning',
      status: 'active',
      title: 'Low inventory on secondary SKU',
      summary: '11 days of supply remaining',
      explanation: 'The secondary scar treatment SKU (B09ABC5678) has only 11 days of supply based on current sales velocity. This falls into the warning band (≤14 days). If velocity increases or replenishment is delayed, stockout risk becomes material within 2 weeks.',
      metric: 'Days of supply',
      currentValue: '11 days',
      priorValue: '19 days',
      threshold: '≤14 days (warning)',
      impact: 'Potential revenue loss if stockout: ~$4.2k/week',
      recommendations: [
        'Confirm inbound shipment ETA and quantity',
        'Consider temporary ad budget reduction to extend runway',
        'Flag for operations team inventory replenishment urgency',
        'Monitor velocity daily until stock normalized'
      ],
      firstDetected: '2026-03-31',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'B09ABC5678',
      relatedEntityType: 'asin'
    },
    {
      id: 'alert-005',
      trigger: 'traffic_drop',
      severity: 'info',
      status: 'active',
      title: 'Sessions declined moderately on brand defense campaign',
      summary: 'Sessions down 9.2% versus prior period',
      explanation: 'The "SB · Brand defense" campaign saw a 9.2% session decline. This is below warning threshold but notable given stable spend. Likely driven by lower impression share or CTR softness. Worth monitoring but not urgent.',
      metric: 'Sessions',
      currentValue: '8,420 sessions',
      priorValue: '9,270 sessions',
      threshold: '-15% (warning)',
      impact: 'Minor; conversion remained stable so revenue impact limited',
      recommendations: [
        'Check impression share trends',
        'Review creative refresh opportunity',
        'Monitor for continued decline'
      ],
      firstDetected: '2026-03-31',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'SB · Brand defense',
      relatedEntityType: 'campaign'
    },
    {
      id: 'alert-006',
      trigger: 'sales_drop',
      severity: 'info',
      status: 'acknowledged',
      title: 'Slight revenue softness on accessory SKU',
      summary: 'Revenue down 6.8% versus prior period',
      explanation: 'The accessory SKU (B07DEF9012) revenue dipped 6.8%, below warning threshold but flagged for continuity. Likely seasonal or promotional timing variance. Acknowledged and monitoring.',
      metric: 'Ordered revenue',
      currentValue: '$2.1k',
      priorValue: '$2.3k',
      threshold: '-8% (warning)',
      impact: 'Minimal; accessory is <2% of total revenue',
      recommendations: [
        'Continue monitoring',
        'Review if promotional calendar shifted'
      ],
      firstDetected: '2026-03-30',
      lastEvaluated: 'Today · 4:00 AM ET',
      sourceView: 'reporting_amazon.alert_evaluation_daily',
      relatedEntity: 'B07DEF9012',
      relatedEntityType: 'asin'
    }
  ]
};

export const renuvAlertsContracts = {
  summary: 'reporting_amazon.alert_summary_daily',
  alerts: 'reporting_amazon.alert_evaluation_daily',
  triggers: 'reporting_amazon.alert_trigger_definitions'
} as const;
