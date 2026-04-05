export type PerformanceKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: 'reporting_amazon.performance_kpi';
};

export type PerformanceChartDataPoint = {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  sessions: number;
  conversionRate: number;
};

export type PerformanceSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: PerformanceKpi[];
  chartData: PerformanceChartDataPoint[];
  commentary: string;
  implications: string[];
  nextSteps: string[];
};

export const renuvPerformanceMock: PerformanceSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Strong revenue momentum with healthy conversion rate gains and improved order efficiency. Traffic quality remains high with session-to-order conversion exceeding category benchmarks.',
  kpis: [
    {
      key: 'revenue',
      label: 'Total revenue',
      value: '$542,800',
      delta: '+12.4%',
      trend: 'up',
      interpretation: 'Revenue growth accelerated driven by conversion improvements and stable traffic quality',
      sourceView: 'reporting_amazon.performance_kpi'
    },
    {
      key: 'orders',
      label: 'Total orders',
      value: '3,248',
      delta: '+9.8%',
      trend: 'up',
      interpretation: 'Order volume increased at healthy pace, slightly outpacing unit growth',
      sourceView: 'reporting_amazon.performance_kpi'
    },
    {
      key: 'units',
      label: 'Units sold',
      value: '4,104',
      delta: '+8.2%',
      trend: 'up',
      interpretation: 'Unit growth steady with multi-pack adoption driving units-per-order improvement',
      sourceView: 'reporting_amazon.performance_kpi'
    },
    {
      key: 'conversion',
      label: 'Conversion rate',
      value: '19.2%',
      delta: '+1.4 pts',
      trend: 'up',
      interpretation: 'Meaningful CVR lift reflects enhanced listing quality and stronger product-market fit',
      sourceView: 'reporting_amazon.performance_kpi'
    },
    {
      key: 'aov',
      label: 'Average order value',
      value: '$167.10',
      delta: '+2.3%',
      trend: 'up',
      interpretation: 'AOV increased driven by bundle adoption and upsell success',
      sourceView: 'reporting_amazon.performance_kpi'
    },
    {
      key: 'sessions',
      label: 'Sessions',
      value: '16,917',
      delta: '+5.1%',
      trend: 'up',
      interpretation: 'Traffic growth remained positive with advertising and organic both contributing',
      sourceView: 'reporting_amazon.performance_kpi'
    }
  ],
  chartData: [
    { date: '2026-03-02', revenue: 16200, orders: 98, unitsSold: 124, sessions: 540, conversionRate: 18.1 },
    { date: '2026-03-03', revenue: 17500, orders: 104, unitsSold: 132, sessions: 560, conversionRate: 18.6 },
    { date: '2026-03-04', revenue: 18100, orders: 109, unitsSold: 138, sessions: 580, conversionRate: 18.8 },
    { date: '2026-03-05', revenue: 19200, orders: 115, unitsSold: 145, sessions: 610, conversionRate: 18.9 },
    { date: '2026-03-06', revenue: 18800, orders: 112, unitsSold: 142, sessions: 595, conversionRate: 18.8 },
    { date: '2026-03-07', revenue: 17300, orders: 103, unitsSold: 130, sessions: 570, conversionRate: 18.1 },
    { date: '2026-03-08', revenue: 16900, orders: 101, unitsSold: 128, sessions: 555, conversionRate: 18.2 },
    { date: '2026-03-09', revenue: 19500, orders: 117, unitsSold: 148, sessions: 625, conversionRate: 18.7 },
    { date: '2026-03-10', revenue: 20100, orders: 121, unitsSold: 153, sessions: 640, conversionRate: 18.9 },
    { date: '2026-03-11', revenue: 19800, orders: 119, unitsSold: 151, sessions: 630, conversionRate: 18.9 },
    { date: '2026-03-12', revenue: 21000, orders: 126, unitsSold: 159, sessions: 660, conversionRate: 19.1 },
    { date: '2026-03-13', revenue: 20500, orders: 123, unitsSold: 156, sessions: 650, conversionRate: 18.9 },
    { date: '2026-03-14', revenue: 18700, orders: 112, unitsSold: 142, sessions: 590, conversionRate: 19.0 },
    { date: '2026-03-15', revenue: 17900, orders: 107, unitsSold: 136, sessions: 570, conversionRate: 18.8 },
    { date: '2026-03-16', revenue: 20800, orders: 125, unitsSold: 158, sessions: 655, conversionRate: 19.1 },
    { date: '2026-03-17', revenue: 21500, orders: 129, unitsSold: 163, sessions: 670, conversionRate: 19.3 },
    { date: '2026-03-18', revenue: 22100, orders: 133, unitsSold: 168, sessions: 685, conversionRate: 19.4 },
    { date: '2026-03-19', revenue: 21800, orders: 131, unitsSold: 166, sessions: 675, conversionRate: 19.4 },
    { date: '2026-03-20', revenue: 20200, orders: 121, unitsSold: 153, sessions: 635, conversionRate: 19.1 },
    { date: '2026-03-21', revenue: 19100, orders: 114, unitsSold: 145, sessions: 605, conversionRate: 18.8 },
    { date: '2026-03-22', revenue: 18500, orders: 111, unitsSold: 141, sessions: 585, conversionRate: 19.0 },
    { date: '2026-03-23', revenue: 21200, orders: 127, unitsSold: 161, sessions: 660, conversionRate: 19.2 },
    { date: '2026-03-24', revenue: 22400, orders: 135, unitsSold: 171, sessions: 695, conversionRate: 19.4 },
    { date: '2026-03-25', revenue: 23100, orders: 139, unitsSold: 176, sessions: 715, conversionRate: 19.4 },
    { date: '2026-03-26', revenue: 22600, orders: 136, unitsSold: 172, sessions: 700, conversionRate: 19.4 },
    { date: '2026-03-27', revenue: 21900, orders: 132, unitsSold: 167, sessions: 680, conversionRate: 19.4 },
    { date: '2026-03-28', revenue: 20400, orders: 122, unitsSold: 155, sessions: 640, conversionRate: 19.1 },
    { date: '2026-03-29', revenue: 19800, orders: 119, unitsSold: 151, sessions: 620, conversionRate: 19.2 },
    { date: '2026-03-30', revenue: 22800, orders: 137, unitsSold: 174, sessions: 710, conversionRate: 19.3 },
    { date: '2026-03-31', revenue: 23500, orders: 141, unitsSold: 179, sessions: 730, conversionRate: 19.3 }
  ],
  commentary: 'Performance this period exceeded expectations across all core metrics. The 12.4% revenue increase was driven primarily by conversion rate improvement (+1.4 percentage points) and healthy traffic growth (+5.1%). Order volume increased 9.8%, slightly outpacing unit growth (8.2%), indicating favorable mix shift toward higher-value SKUs and bundles. Average order value improved 2.3% to $167.10, reflecting successful bundle promotion and upsell execution. Conversion rate gains are particularly meaningful — moving from 17.8% to 19.2% represents strong product-market fit and effective listing optimization. The final week of the period showed the strongest performance, suggesting positive momentum heading into April.',
  implications: [
    'Conversion rate improvement is durable — sustained gains over multiple weeks indicate structural improvements rather than temporary fluctuation',
    'Traffic quality remains high — session growth at 5.1% with CVR gains demonstrates effective targeting and audience relevance',
    'Bundle and multi-pack adoption is driving favorable economics — AOV lift without CVR degradation is ideal outcome',
    'Performance trajectory supports planned advertising expansion — current efficiency levels justify increased investment in validated channels'
  ],
  nextSteps: [
    'Monitor conversion rate stability — ensure recent gains hold as traffic scales',
    'Analyze bundle vs single-unit performance — understand drivers of AOV lift to inform merchandising strategy',
    'Review week-over-week momentum — investigate late-period acceleration to identify replicable tactics',
    'Prepare for seasonal transition — model expected April performance based on historical patterns and current trajectory'
  ]
};

export const renuvPerformanceContracts = {
  kpis: 'reporting_amazon.performance_kpi',
  chartData: 'reporting_amazon.performance_daily',
  snapshot: 'reporting_amazon.performance_snapshot'
} as const;
