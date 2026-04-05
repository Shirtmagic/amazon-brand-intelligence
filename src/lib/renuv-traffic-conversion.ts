export type TrendDirection = 'up' | 'down' | 'flat';
export type Tone = 'positive' | 'warning' | 'critical' | 'neutral';

export type RenuvTrafficConversionKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: TrendDirection;
  note: string;
  sourceView:
    | 'reporting_amazon.traffic_conversion_daily'
    | 'reporting_amazon.traffic_conversion_weekly'
    | 'reporting_amazon.traffic_conversion_rollup'
    | 'reporting_amazon.asin_traffic_conversion_daily';
};

export type RenuvTrafficConversionReviewRow = {
  period: string;
  sessions: string;
  orders: string;
  conversionRate: string;
  revenuePerSession: string;
  read: string;
  sourceView: 'reporting_amazon.traffic_conversion_daily';
};

export type RenuvTrafficQualitySignal = {
  label: string;
  value: string;
  tone: Tone;
  detail: string;
};

export type RenuvTrafficQualityPanel = {
  headline: string;
  summary: string;
  signals: RenuvTrafficQualitySignal[];
  sourceView: 'reporting_amazon.traffic_quality_daily';
};

export type RenuvTrafficDiagnostic = {
  title: string;
  severity: Tone;
  detail: string;
  actionBias: string;
  sourceView:
    | 'reporting_amazon.traffic_conversion_daily'
    | 'reporting_amazon.traffic_quality_daily'
    | 'reporting_amazon.asin_traffic_conversion_daily'
    | 'reporting_amazon.data_freshness_status';
};

export type RenuvTrafficConversionRiskRow = {
  asin: string;
  title: string;
  trafficShare: string;
  sessionsChange: string;
  conversionRate: string;
  conversionChange: string;
  demandQuality: string;
  diagnosis: string;
  severity: Tone;
  sourceView: 'reporting_amazon.asin_traffic_conversion_daily';
};

export type RenuvTrafficFreshness = {
  source: string;
  updatedAt: string;
  lag: string;
  readiness: string;
  tone: Tone;
  sourceView: 'reporting_amazon.data_freshness_status';
};

export type RenuvTrafficConversionPageSnapshot = {
  brand: string;
  periodLabel: string;
  environment: 'internal';
  kpis: RenuvTrafficConversionKpi[];
  review: RenuvTrafficConversionReviewRow[];
  trafficQuality: RenuvTrafficQualityPanel;
  diagnostics: RenuvTrafficDiagnostic[];
  asinRisks: RenuvTrafficConversionRiskRow[];
  freshness: RenuvTrafficFreshness[];
};

export const renuvTrafficConversionContracts = {
  kpis:
    'reporting_amazon.traffic_conversion_daily | reporting_amazon.traffic_conversion_weekly | reporting_amazon.traffic_conversion_rollup',
  review: 'reporting_amazon.traffic_conversion_daily',
  trafficQuality: 'reporting_amazon.traffic_quality_daily',
  diagnostics:
    'reporting_amazon.traffic_conversion_daily | reporting_amazon.traffic_quality_daily | reporting_amazon.data_freshness_status',
  asinRisks: 'reporting_amazon.asin_traffic_conversion_daily',
  freshness: 'reporting_amazon.data_freshness_status'
} as const;

export const renuvTrafficConversionMock: RenuvTrafficConversionPageSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 14 days · internal preview',
  environment: 'internal',
  kpis: [
    {
      key: 'sessions',
      label: 'Sessions',
      value: '142.8k',
      delta: '+6.9% vs prior period',
      trend: 'up',
      note: 'Traffic is growing without looking inflated by a one-day anomaly.',
      sourceView: 'reporting_amazon.traffic_conversion_rollup'
    },
    {
      key: 'orders',
      label: 'Orders',
      value: '25.8k',
      delta: '+4.1% vs prior period',
      trend: 'up',
      note: 'Order growth is positive, but slower than the traffic lift.',
      sourceView: 'reporting_amazon.traffic_conversion_rollup'
    },
    {
      key: 'conversion-rate',
      label: 'Conversion rate',
      value: '18.1%',
      delta: '-0.5 pts vs prior period',
      trend: 'down',
      note: 'The account is bringing in more traffic, but quality and PDP efficiency are slightly softer.',
      sourceView: 'reporting_amazon.traffic_conversion_rollup'
    },
    {
      key: 'revenue-per-session',
      label: 'Revenue / session',
      value: '$1.28',
      delta: '-1.9% vs prior period',
      trend: 'down',
      note: 'Demand is still healthy, though each marginal session is monetizing a little less efficiently.',
      sourceView: 'reporting_amazon.traffic_conversion_rollup'
    },
    {
      key: 'high-risk-asins',
      label: 'High-risk ASINs',
      value: '3',
      delta: '+1 vs prior period',
      trend: 'down',
      note: 'The main watch items are concentrated, not broad-based across the catalog.',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    }
  ],
  review: [
    {
      period: 'Current 14 days',
      sessions: '142.8k',
      orders: '25.8k',
      conversionRate: '18.1%',
      revenuePerSession: '$1.28',
      read: 'Traffic expanded faster than orders, so conversion is the more important explanation layer this period.',
      sourceView: 'reporting_amazon.traffic_conversion_daily'
    },
    {
      period: 'Prior 14 days',
      sessions: '133.6k',
      orders: '24.8k',
      conversionRate: '18.6%',
      revenuePerSession: '$1.30',
      read: 'The prior period monetized a touch better, especially on hero ASIN sessions.',
      sourceView: 'reporting_amazon.traffic_conversion_daily'
    },
    {
      period: 'Change',
      sessions: '+6.9%',
      orders: '+4.1%',
      conversionRate: '-0.5 pts',
      revenuePerSession: '-1.9%',
      read: 'This is a demand-quality / PDP-efficiency story, not a top-of-funnel collapse.',
      sourceView: 'reporting_amazon.traffic_conversion_daily'
    }
  ],
  trafficQuality: {
    headline: 'Traffic is healthy enough in volume, but the incremental session mix looks slightly less efficient than the prior window.',
    summary:
      'The right internal read is not that demand is weak. Demand is arriving. The sharper question is whether newer traffic pockets are as qualified as the core traffic base and whether certain PDPs are converting that extra demand as well as they should.',
    signals: [
      {
        label: 'Demand posture',
        value: 'Healthy volume',
        tone: 'positive',
        detail: 'Traffic is still expanding across the monitored window, with no evidence of a major awareness drop.'
      },
      {
        label: 'Conversion posture',
        value: 'Softening',
        tone: 'warning',
        detail: 'Account-level conversion slipped modestly, enough to matter in performance interpretation.'
      },
      {
        label: 'Quality read',
        value: 'Mixed session quality',
        tone: 'warning',
        detail: 'Newer acquisition traffic appears slightly less qualified than the core returning / branded mix.'
      },
      {
        label: 'Operating risk',
        value: 'Contained',
        tone: 'neutral',
        detail: 'The weakness is concentrated in a few ASINs and session cohorts rather than the whole catalog.'
      }
    ],
    sourceView: 'reporting_amazon.traffic_quality_daily'
  },
  diagnostics: [
    {
      title: 'Traffic growth is real, but it is not converting proportionally into orders.',
      severity: 'warning',
      detail: 'The account added meaningful session volume, yet order growth lagged enough that conversion became the more important explanation layer for the period.',
      actionBias: 'Review demand quality and PDP friction together; do not treat this as a pure media-volume win.',
      sourceView: 'reporting_amazon.traffic_conversion_daily'
    },
    {
      title: 'The softening looks concentrated in traffic-heavy ASINs, not broad catalog weakness.',
      severity: 'neutral',
      detail: 'A few high-traffic products are doing most of the damage to overall conversion efficiency, which keeps the issue actionable instead of structural.',
      actionBias: 'Use the ASIN risk table to isolate which PDPs or use cases deserve the next diagnostic pass.',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    },
    {
      title: 'Freshness is good enough for internal review; keep trust framing visible until live binding is complete.',
      severity: 'positive',
      detail: 'Traffic and session data are current enough to support a real internal readout, but the module still benefits from explicit source/view labeling.',
      actionBias: 'Preserve freshness and source labels on every block when the BigQuery wiring replaces the stub snapshot.',
      sourceView: 'reporting_amazon.data_freshness_status'
    }
  ],
  asinRisks: [
    {
      asin: 'B0CRV9RNV4',
      title: 'Travel Scar Gel Twin Pack',
      trafficShare: '11%',
      sessionsChange: '-3.8%',
      conversionRate: '13.4%',
      conversionChange: '-1.7 pts',
      demandQuality: 'Weakening',
      diagnosis: 'Both traffic and conversion softened, making this the clearest true traffic-and-conversion risk in the current set.',
      severity: 'critical',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    },
    {
      asin: 'B0CRV9RNV2',
      title: 'Advanced Silicone Scar Sheets · 8 ct',
      trafficShare: '17%',
      sessionsChange: '+8.6%',
      conversionRate: '16.9%',
      conversionChange: '-0.9 pts',
      demandQuality: 'Mixed',
      diagnosis: 'Traffic is arriving, but the incremental volume is monetizing less efficiently than the prior period.',
      severity: 'warning',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    },
    {
      asin: 'B0CRV9RNV6',
      title: 'Sensitive Skin Scar Gel',
      trafficShare: '8%',
      sessionsChange: '+5.1%',
      conversionRate: '12.7%',
      conversionChange: '-1.1 pts',
      demandQuality: 'Questionable',
      diagnosis: 'Traffic rose modestly, but lower-intent session mix and weaker PDP efficiency are combining into a real conversion drag.',
      severity: 'warning',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    },
    {
      asin: 'B0CRV9RNV1',
      title: 'Advanced Silicone Scar Gel · 1.7 oz',
      trafficShare: '26%',
      sessionsChange: '+9.4%',
      conversionRate: '22.8%',
      conversionChange: '+0.4 pts',
      demandQuality: 'Strong',
      diagnosis: 'The hero SKU is handling additional traffic well and is not the source of the portfolio softness.',
      severity: 'positive',
      sourceView: 'reporting_amazon.asin_traffic_conversion_daily'
    }
  ],
  freshness: [
    {
      source: 'Traffic conversion daily',
      updatedAt: 'Today · 3:14 AM ET',
      lag: '46m lag',
      readiness: 'Primary session and conversion layer is current through yesterday close.',
      tone: 'positive',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'ASIN traffic conversion daily',
      updatedAt: 'Today · 3:09 AM ET',
      lag: '51m lag',
      readiness: 'Safe for ASIN-level diagnostics and internal comparison work.',
      tone: 'neutral',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'Traffic quality rollup',
      updatedAt: 'Today · 2:58 AM ET',
      lag: '1h 02m lag',
      readiness: 'Ready for internal readouts; keep explicit trust framing because quality classification remains a modeled layer.',
      tone: 'warning',
      sourceView: 'reporting_amazon.data_freshness_status'
    }
  ]
};

/**
 * Fetch traffic conversion snapshot from BigQuery
 */

