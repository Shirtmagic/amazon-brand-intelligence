export type TrendDirection = 'up' | 'down' | 'flat';
export type Tone = 'positive' | 'warning' | 'critical' | 'neutral';

export type RenuvAsinKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: TrendDirection;
  note: string;
  sourceView: string;
};

export type RenuvAsinTableRow = {
  asin: string;
  title: string;
  category: string;
  orderedRevenue: string;
  units: string;
  conversionRate: string;
  adAttributedShare: string;
  revenueTrend: string;
  flags: string[];
  tone: Tone;
  sourceView: string;
};

export type RenuvAsinMover = {
  label: string;
  asin: string;
  detail: string;
  metric: string;
  change: string;
  trend: TrendDirection;
  tone: Tone;
  sourceView: string;
};

export type RenuvAsinConcentrationSignal = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

export type RenuvAsinConcentrationPanel = {
  headline: string;
  summary: string;
  metrics: RenuvAsinConcentrationSignal[];
  sourceView: string;
};

export type RenuvAsinFlag = {
  asin: string;
  title: string;
  issue: string;
  diagnosis: string;
  actionBias: string;
  tone: Tone;
  sourceView: string;
};

export type RenuvAsinPageSnapshot = {
  brand: string;
  periodLabel: string;
  environment: 'internal';
  kpis: RenuvAsinKpi[];
  topAsins: RenuvAsinTableRow[];
  movers: RenuvAsinMover[];
  concentration: RenuvAsinConcentrationPanel;
  flags: RenuvAsinFlag[];
};

export const renuvAsinContracts = {
  kpis:
    'reporting_amazon.asin_performance_daily | reporting_amazon.asin_performance_weekly | reporting_amazon.asin_performance_rollup',
  topAsins: 'reporting_amazon.asin_performance_daily',
  movers: 'reporting_amazon.asin_performance_daily',
  concentration: 'reporting_amazon.asin_performance_rollup',
  flags: 'reporting_amazon.asin_performance_daily'
} as const;

export const renuvAsinMock: RenuvAsinPageSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 14 days · internal preview',
  environment: 'internal',
  kpis: [
    {
      key: 'asin-revenue',
      label: 'ASIN revenue',
      value: '$182.7k',
      delta: '+9.4% vs prior period',
      trend: 'up',
      note: 'Rollup revenue across the current ranked ASIN set.',
      sourceView: 'reporting_amazon.asin_performance_rollup'
    },
    {
      key: 'asin-units',
      label: 'Units sold',
      value: '11,482',
      delta: '+7.1% vs prior period',
      trend: 'up',
      note: 'Unit movement remains healthy across the core recovery catalog.',
      sourceView: 'reporting_amazon.asin_performance_rollup'
    },
    {
      key: 'conversion-rate',
      label: 'Avg conversion rate',
      value: '17.8%',
      delta: '-0.6 pts vs prior period',
      trend: 'down',
      note: 'Slight softening is concentrated in a few traffic-heavy ASINs.',
      sourceView: 'reporting_amazon.asin_performance_rollup'
    },
    {
      key: 'ad-share',
      label: 'Ad-attributed share',
      value: '34.2%',
      delta: '+1.9 pts vs prior period',
      trend: 'up',
      note: 'Paid contribution rose as acquisition terms scaled.',
      sourceView: 'reporting_amazon.asin_performance_rollup'
    },
    {
      key: 'top-asin-share',
      label: 'Top ASIN share',
      value: '28.6%',
      delta: '+2.4 pts concentration shift',
      trend: 'down',
      note: 'Revenue concentration is still manageable, but dependency is rising.',
      sourceView: 'reporting_amazon.asin_performance_rollup'
    }
  ],
  topAsins: [
    {
      asin: 'B0CRV9RNV1',
      title: 'Advanced Silicone Scar Gel · 1.7 oz',
      category: 'Core recovery',
      orderedRevenue: '$52.3k',
      units: '2,914',
      conversionRate: '22.8%',
      adAttributedShare: '31%',
      revenueTrend: '+14.2%',
      flags: ['Leader', 'Stable CVR'],
      tone: 'positive',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV2',
      title: 'Advanced Silicone Scar Sheets · 8 ct',
      category: 'Scar sheets',
      orderedRevenue: '$34.7k',
      units: '1,986',
      conversionRate: '16.9%',
      adAttributedShare: '39%',
      revenueTrend: '+6.8%',
      flags: ['Paid heavy'],
      tone: 'warning',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV3',
      title: 'Post-Surgery Scar Care Bundle',
      category: 'Bundles',
      orderedRevenue: '$28.9k',
      units: '1,214',
      conversionRate: '19.6%',
      adAttributedShare: '27%',
      revenueTrend: '+11.1%',
      flags: ['Margin watch'],
      tone: 'neutral',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV4',
      title: 'Travel Scar Gel Twin Pack',
      category: 'Multipacks',
      orderedRevenue: '$24.1k',
      units: '1,742',
      conversionRate: '13.4%',
      adAttributedShare: '43%',
      revenueTrend: '-4.9%',
      flags: ['CVR weak', 'Traffic loss'],
      tone: 'critical',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV5',
      title: 'PM Recovery Scar Serum',
      category: 'Serums',
      orderedRevenue: '$17.8k',
      units: '1,105',
      conversionRate: '15.8%',
      adAttributedShare: '36%',
      revenueTrend: '+18.6%',
      flags: ['Fast mover'],
      tone: 'positive',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV6',
      title: 'Sensitive Skin Scar Gel',
      category: 'Variant',
      orderedRevenue: '$12.6k',
      units: '841',
      conversionRate: '12.7%',
      adAttributedShare: '41%',
      revenueTrend: '-8.2%',
      flags: ['Ad pressure'],
      tone: 'warning',
      sourceView: 'reporting_amazon.asin_performance_daily'
    }
  ],
  movers: [
    {
      label: 'Fastest winner',
      asin: 'B0CRV9RNV5',
      detail: 'PM Recovery Scar Serum is picking up volume without needing an outsized paid push.',
      metric: '$17.8k revenue',
      change: '+18.6% period growth',
      trend: 'up',
      tone: 'positive',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      label: 'Largest decliner',
      asin: 'B0CRV9RNV4',
      detail: 'Travel Scar Gel Twin Pack lost traffic and converted below catalog average.',
      metric: '13.4% CVR',
      change: '-4.9% revenue',
      trend: 'down',
      tone: 'critical',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      label: 'Paid dependency watch',
      asin: 'B0CRV9RNV2',
      detail: 'Scar Sheets remain productive, but sales are leaning harder on ad-attributed demand.',
      metric: '39% ad share',
      change: '+3.1 pts vs prior period',
      trend: 'down',
      tone: 'warning',
      sourceView: 'reporting_amazon.asin_performance_daily'
    }
  ],
  concentration: {
    headline: 'The catalog is still top-ASIN led, but concentration is not yet at a red-alert level.',
    summary:
      'One core hero SKU drives more than a quarter of ordered revenue, and the top three ASINs together carry most of the commercial load. That is workable for now, but it increases sensitivity to listing quality, inventory gaps, and pricing pressure on the lead products.',
    metrics: [
      {
        label: 'Top 1 ASIN share',
        value: '28.6%',
        detail: 'Higher than the prior period and worth watching as a dependency signal.',
        tone: 'warning'
      },
      {
        label: 'Top 3 ASIN share',
        value: '63.4%',
        detail: 'Core concentration remains high, though still consistent with a hero-SKU catalog shape.',
        tone: 'warning'
      },
      {
        label: 'ASINs in decline',
        value: '2 of top 6',
        detail: 'Weakness is concentrated rather than broad across the lineup.',
        tone: 'neutral'
      },
      {
        label: 'Diversification opportunity',
        value: 'Meaningful',
        detail: 'Bundles and secondary serums have room to absorb more share if conversion improves.',
        tone: 'positive'
      }
    ],
    sourceView: 'reporting_amazon.asin_performance_rollup'
  },
  flags: [
    {
      asin: 'B0CRV9RNV4',
      title: 'Travel Scar Gel Twin Pack',
      issue: 'Conversion weakness',
      diagnosis: 'Traffic is arriving, but retail conversion is materially below the catalog leader and revenue has turned negative period over period.',
      actionBias: 'Review pricing ladder, image clarity, and bundle framing against the main hero SKU.',
      tone: 'critical',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV6',
      title: 'Sensitive Skin Scar Gel',
      issue: 'Ad pressure',
      diagnosis: 'Ad-attributed share is high relative to its conversion efficiency, suggesting incremental paid support may be masking retail softness.',
      actionBias: 'Audit acquisition term mix and confirm the PDP promise is aligned with the traffic source.',
      tone: 'warning',
      sourceView: 'reporting_amazon.asin_performance_daily'
    },
    {
      asin: 'B0CRV9RNV2',
      title: 'Advanced Silicone Scar Sheets · 8 ct',
      issue: 'Dependency concentration',
      diagnosis: 'This SKU remains a top revenue driver, but its paid share has climbed faster than its conversion improvement.',
      actionBias: 'Watch organic rank support and avoid drifting into a media-only growth posture.',
      tone: 'warning',
      sourceView: 'reporting_amazon.asin_performance_daily'
    }
  ]
};
