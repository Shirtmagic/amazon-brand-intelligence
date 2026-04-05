export type PerformanceKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: 'reporting_amazon.client_performance_kpis';
};

export type PerformanceTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
  sessions: number;
  cvr: number;
};

export type TopAsin = {
  asin: string;
  title: string;
  revenue: string;
  revenueShare: string;
  orders: number;
  cvr: string;
  trend: 'up' | 'down' | 'flat';
  sourceView: 'reporting_amazon.client_asin_performance';
};

export type PerformanceInsight = {
  title: string;
  summary: string;
  metric: string;
  impact: string;
  sourceView: 'reporting_amazon.client_performance_insights';
};

export type ClientPerformanceSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: PerformanceKpi[];
  trendData: PerformanceTrendPoint[];
  topAsins: TopAsin[];
  insights: PerformanceInsight[];
  implications: string;
  nextSteps: string[];
};

export const renuvClientPerformanceMock: ClientPerformanceSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Revenue reached $542.8k with strong 12.4% growth driven by conversion rate improvements and expanded search coverage. All core metrics showed positive momentum with particularly strong performance on flagship SKUs.',
  kpis: [
    {
      key: 'revenue',
      label: 'Total revenue',
      value: '$542.8k',
      delta: '+12.4%',
      trend: 'up',
      interpretation: 'Strong top-line growth accelerated throughout the period',
      sourceView: 'reporting_amazon.client_performance_kpis'
    },
    {
      key: 'orders',
      label: 'Total orders',
      value: '3,248',
      delta: '+9.8%',
      trend: 'up',
      interpretation: 'Order volume growth reflects healthy demand expansion',
      sourceView: 'reporting_amazon.client_performance_kpis'
    },
    {
      key: 'units',
      label: 'Units sold',
      value: '4,127',
      delta: '+11.2%',
      trend: 'up',
      interpretation: 'Unit growth outpaced order growth due to bundle adoption',
      sourceView: 'reporting_amazon.client_performance_kpis'
    },
    {
      key: 'sessions',
      label: 'Sessions',
      value: '16,927',
      delta: '+8.1%',
      trend: 'up',
      interpretation: 'Traffic growth remained healthy across organic and paid channels',
      sourceView: 'reporting_amazon.client_performance_kpis'
    },
    {
      key: 'cvr',
      label: 'Conversion rate',
      value: '19.2%',
      delta: '+1.4 pts',
      trend: 'up',
      interpretation: 'Significant CVR improvement driven by listing quality upgrades',
      sourceView: 'reporting_amazon.client_performance_kpis'
    },
    {
      key: 'aov',
      label: 'Average order value',
      value: '$167.10',
      delta: '+2.3%',
      trend: 'up',
      interpretation: 'AOV increased as customers shifted to higher-value configurations',
      sourceView: 'reporting_amazon.client_performance_kpis'
    }
  ],
  trendData: [
    { date: '2026-03-02', revenue: 16200, orders: 98, sessions: 540, cvr: 18.1 },
    { date: '2026-03-03', revenue: 17500, orders: 104, sessions: 560, cvr: 18.6 },
    { date: '2026-03-04', revenue: 18100, orders: 109, sessions: 580, cvr: 18.8 },
    { date: '2026-03-05', revenue: 19200, orders: 115, sessions: 610, cvr: 18.9 },
    { date: '2026-03-06', revenue: 18800, orders: 112, sessions: 595, cvr: 18.8 },
    { date: '2026-03-07', revenue: 17300, orders: 103, sessions: 570, cvr: 18.1 },
    { date: '2026-03-08', revenue: 16900, orders: 101, sessions: 555, cvr: 18.2 },
    { date: '2026-03-09', revenue: 19500, orders: 117, sessions: 625, cvr: 18.7 },
    { date: '2026-03-10', revenue: 20100, orders: 121, sessions: 640, cvr: 18.9 },
    { date: '2026-03-11', revenue: 19800, orders: 119, sessions: 630, cvr: 18.9 },
    { date: '2026-03-12', revenue: 21000, orders: 126, sessions: 660, cvr: 19.1 },
    { date: '2026-03-13', revenue: 20500, orders: 123, sessions: 650, cvr: 18.9 },
    { date: '2026-03-14', revenue: 18700, orders: 112, sessions: 590, cvr: 19.0 },
    { date: '2026-03-15', revenue: 17900, orders: 107, sessions: 570, cvr: 18.8 },
    { date: '2026-03-16', revenue: 20800, orders: 125, sessions: 655, cvr: 19.1 },
    { date: '2026-03-17', revenue: 21500, orders: 129, sessions: 670, cvr: 19.3 },
    { date: '2026-03-18', revenue: 22100, orders: 133, sessions: 685, cvr: 19.4 },
    { date: '2026-03-19', revenue: 21800, orders: 131, sessions: 675, cvr: 19.4 },
    { date: '2026-03-20', revenue: 20200, orders: 121, sessions: 635, cvr: 19.1 },
    { date: '2026-03-21', revenue: 19100, orders: 114, sessions: 605, cvr: 18.8 },
    { date: '2026-03-22', revenue: 18500, orders: 111, sessions: 585, cvr: 19.0 },
    { date: '2026-03-23', revenue: 21200, orders: 127, sessions: 660, cvr: 19.2 },
    { date: '2026-03-24', revenue: 22400, orders: 135, sessions: 695, cvr: 19.4 },
    { date: '2026-03-25', revenue: 23100, orders: 139, sessions: 715, cvr: 19.4 },
    { date: '2026-03-26', revenue: 22600, orders: 136, sessions: 700, cvr: 19.4 },
    { date: '2026-03-27', revenue: 21900, orders: 132, sessions: 680, cvr: 19.4 },
    { date: '2026-03-28', revenue: 20400, orders: 122, sessions: 640, cvr: 19.1 },
    { date: '2026-03-29', revenue: 19800, orders: 119, sessions: 620, cvr: 19.2 },
    { date: '2026-03-30', revenue: 22800, orders: 137, sessions: 710, cvr: 19.3 },
    { date: '2026-03-31', revenue: 23500, orders: 141, sessions: 730, cvr: 19.3 }
  ],
  topAsins: [
    {
      asin: 'B08XYZ1234',
      title: 'Renuv Silicone Scar Gel - Medical Grade (50g)',
      revenue: '$312.4k',
      revenueShare: '57.5%',
      orders: 1868,
      cvr: '21.4%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_asin_performance'
    },
    {
      asin: 'B08ABC5678',
      title: 'Renuv Advanced Scar Treatment - 3-Pack Bundle',
      revenue: '$124.7k',
      revenueShare: '23.0%',
      orders: 398,
      cvr: '18.2%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_asin_performance'
    },
    {
      asin: 'B08DEF9012',
      title: 'Renuv Post-Surgery Recovery Gel (30g)',
      revenue: '$68.5k',
      revenueShare: '12.6%',
      orders: 612,
      cvr: '17.8%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_asin_performance'
    },
    {
      asin: 'B08GHI3456',
      title: 'Renuv Scar Sheets + Gel Combo',
      revenue: '$37.2k',
      revenueShare: '6.9%',
      orders: 370,
      cvr: '16.5%',
      trend: 'flat',
      sourceView: 'reporting_amazon.client_asin_performance'
    }
  ],
  insights: [
    {
      title: 'Flagship SKU momentum accelerating',
      summary: 'The core 50g silicone gel SKU drove 57.5% of revenue and showed the strongest growth trajectory. Conversion rate on this ASIN improved 1.8 percentage points, reflecting successful A+ content refresh and enhanced review profile.',
      metric: '21.4% CVR on flagship SKU',
      impact: '+$42.1k incremental revenue',
      sourceView: 'reporting_amazon.client_performance_insights'
    },
    {
      title: 'Bundle adoption expanding',
      summary: 'The 3-pack bundle configuration saw 28% order growth as customers increasingly chose higher-value multi-pack options. This drove AOV expansion and improved unit economics.',
      metric: '23% revenue share from bundles',
      impact: '+$28.3k from bundle shift',
      sourceView: 'reporting_amazon.client_performance_insights'
    },
    {
      title: 'Weekend performance strengthening',
      summary: 'Weekend days (Saturday/Sunday) showed 14% higher CVR compared to weekdays, suggesting stronger purchase intent during research-heavy browsing periods. This pattern presents optimization opportunities.',
      metric: '20.8% avg weekend CVR',
      impact: 'Opportunity to adjust bid schedules',
      sourceView: 'reporting_amazon.client_performance_insights'
    }
  ],
  implications: 'Strong performance across all key metrics indicates healthy business momentum. The combination of conversion rate improvement, traffic growth, and AOV expansion created compounding revenue gains. Flagship SKU strength provides a solid foundation for scaling investment.',
  nextSteps: [
    'Continue A+ content optimization on secondary SKUs to capture CVR gains similar to flagship',
    'Expand bundle SKU visibility through enhanced creative and targeted campaigns',
    'Test dayparting strategies to capitalize on stronger weekend conversion patterns',
    'Monitor top ASIN inventory levels closely given accelerating velocity'
  ]
};

export const renuvClientPerformanceContracts = {
  kpis: 'reporting_amazon.client_performance_kpis',
  trendData: 'reporting_amazon.client_performance_trend_daily',
  topAsins: 'reporting_amazon.client_asin_performance',
  insights: 'reporting_amazon.client_performance_insights'
} as const;
