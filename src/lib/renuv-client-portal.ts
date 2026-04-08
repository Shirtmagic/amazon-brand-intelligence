export type ClientKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: string;
};

export type TrendDataPoint = {
  date: string;
  revenue: number;
  orders: number;
  adSpend: number;
  sessions: number;
};

export type GrowthDriver = {
  title: string;
  impact: string;
  summary: string;
  metric: string;
  sourceView: 'reporting_amazon.client_growth_drivers';
};

export type ClientRisk = {
  title: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  mitigation: string;
  sourceView: 'reporting_amazon.client_risk_summary';
};

export type NextStep = {
  title: string;
  category: 'optimization' | 'expansion' | 'protection' | 'analysis';
  description: string;
  timeline: string;
  sourceView: 'reporting_amazon.client_next_steps';
};

export type MarketContext = {
  categoryTrend: string;
  competitivePressure: string;
  seasonalNote: string;
  searchLandscape: string;
  sourceView: 'reporting_amazon.client_market_context';
};

export type ClientPortalSnapshot = {
  brand: string;
  periodLabel: string;
  executiveSummary: string;
  kpis: ClientKpi[];
  trendData: TrendDataPoint[];
  organicRevenue: number;
  ppcRevenue: number;
  growthDrivers: GrowthDriver[];
  risks: ClientRisk[];
  nextSteps: NextStep[];
  marketContext: MarketContext;
};

// Mock client portal data
export const renuvClientPortalMock: ClientPortalSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  executiveSummary: 'Renuv delivered strong performance this period with revenue up 12.4% and improved advertising efficiency. Conversion rate gains and strategic campaign optimizations drove results. Key focus areas include maintaining momentum on high-intent search terms and managing inventory ahead of seasonal demand.',
  kpis: [
    {
      key: 'revenue',
      label: 'Revenue',
      value: '$542.8k',
      delta: '+12.4%',
      trend: 'up',
      interpretation: 'Strong growth driven by conversion improvement and expanded search coverage',
      sourceView: 'reporting_amazon.client_kpi_summary'
    },
    {
      key: 'orders',
      label: 'Orders',
      value: '3,248',
      delta: '+9.8%',
      trend: 'up',
      interpretation: 'Order volume increased at a healthy pace, slightly outpacing unit growth',
      sourceView: 'reporting_amazon.client_kpi_summary'
    },
    {
      key: 'ad-spend',
      label: 'Ad spend',
      value: '$89.2k',
      delta: '+6.1%',
      trend: 'up',
      interpretation: 'Spend increased modestly while revenue growth accelerated, improving efficiency',
      sourceView: 'reporting_amazon.client_kpi_summary'
    },
    {
      key: 'tacos',
      label: 'TACOS',
      value: '16.4%',
      delta: '-1.1 pts',
      trend: 'up',
      interpretation: 'Advertising efficiency improved as revenue outpaced spend growth',
      sourceView: 'reporting_amazon.client_kpi_summary'
    },
    {
      key: 'conversion',
      label: 'Conversion rate',
      value: '19.2%',
      delta: '+1.4 pts',
      trend: 'up',
      interpretation: 'Meaningful CVR gain reflects stronger product-market fit and listing quality',
      sourceView: 'reporting_amazon.client_kpi_summary'
    },
    {
      key: 'aov',
      label: 'AOV',
      value: '$167.10',
      delta: '+2.3%',
      trend: 'up',
      interpretation: 'Average order value increased driven by bundle adoption and upsell success',
      sourceView: 'reporting_amazon.client_kpi_summary'
    }
  ],
  trendData: [
    { date: '2026-03-02', revenue: 16200, orders: 98, adSpend: 2800, sessions: 540 },
    { date: '2026-03-03', revenue: 17500, orders: 104, adSpend: 2900, sessions: 560 },
    { date: '2026-03-04', revenue: 18100, orders: 109, adSpend: 2950, sessions: 580 },
    { date: '2026-03-05', revenue: 19200, orders: 115, adSpend: 3100, sessions: 610 },
    { date: '2026-03-06', revenue: 18800, orders: 112, adSpend: 3000, sessions: 595 },
    { date: '2026-03-07', revenue: 17300, orders: 103, adSpend: 2850, sessions: 570 },
    { date: '2026-03-08', revenue: 16900, orders: 101, adSpend: 2800, sessions: 555 },
    { date: '2026-03-09', revenue: 19500, orders: 117, adSpend: 3150, sessions: 625 },
    { date: '2026-03-10', revenue: 20100, orders: 121, adSpend: 3200, sessions: 640 },
    { date: '2026-03-11', revenue: 19800, orders: 119, adSpend: 3100, sessions: 630 },
    { date: '2026-03-12', revenue: 21000, orders: 126, adSpend: 3300, sessions: 660 },
    { date: '2026-03-13', revenue: 20500, orders: 123, adSpend: 3250, sessions: 650 },
    { date: '2026-03-14', revenue: 18700, orders: 112, adSpend: 2950, sessions: 590 },
    { date: '2026-03-15', revenue: 17900, orders: 107, adSpend: 2850, sessions: 570 },
    { date: '2026-03-16', revenue: 20800, orders: 125, adSpend: 3250, sessions: 655 },
    { date: '2026-03-17', revenue: 21500, orders: 129, adSpend: 3350, sessions: 670 },
    { date: '2026-03-18', revenue: 22100, orders: 133, adSpend: 3400, sessions: 685 },
    { date: '2026-03-19', revenue: 21800, orders: 131, adSpend: 3350, sessions: 675 },
    { date: '2026-03-20', revenue: 20200, orders: 121, adSpend: 3150, sessions: 635 },
    { date: '2026-03-21', revenue: 19100, orders: 114, adSpend: 3000, sessions: 605 },
    { date: '2026-03-22', revenue: 18500, orders: 111, adSpend: 2900, sessions: 585 },
    { date: '2026-03-23', revenue: 21200, orders: 127, adSpend: 3300, sessions: 660 },
    { date: '2026-03-24', revenue: 22400, orders: 135, adSpend: 3450, sessions: 695 },
    { date: '2026-03-25', revenue: 23100, orders: 139, adSpend: 3550, sessions: 715 },
    { date: '2026-03-26', revenue: 22600, orders: 136, adSpend: 3450, sessions: 700 },
    { date: '2026-03-27', revenue: 21900, orders: 132, adSpend: 3350, sessions: 680 },
    { date: '2026-03-28', revenue: 20400, orders: 122, adSpend: 3150, sessions: 640 },
    { date: '2026-03-29', revenue: 19800, orders: 119, adSpend: 3050, sessions: 620 },
    { date: '2026-03-30', revenue: 22800, orders: 137, adSpend: 3500, sessions: 710 },
    { date: '2026-03-31', revenue: 23500, orders: 141, adSpend: 3600, sessions: 730 }
  ],
  organicRevenue: 336500,
  ppcRevenue: 206300,
  growthDrivers: [
    {
      title: 'Conversion rate improvement',
      impact: '+$48.2k incremental revenue',
      summary: 'CVR increased 1.4 percentage points driven by enhanced product detail pages, improved review profile, and A+ content optimization. This was the largest single contributor to revenue growth this period.',
      metric: '19.2% CVR (up from 17.8%)',
      sourceView: 'reporting_amazon.client_growth_drivers'
    },
    {
      title: 'Non-brand search expansion',
      impact: '+$32.1k incremental revenue',
      summary: 'Expanded coverage on high-intent cleaning and appliance maintenance terms. Phrase match campaigns on "dishwasher cleaner" and related queries delivered strong ROAS while building market share.',
      metric: '+28% non-brand search revenue',
      sourceView: 'reporting_amazon.client_growth_drivers'
    },
    {
      title: 'Bundle & upsell adoption',
      impact: '+$18.7k incremental revenue',
      summary: 'Multi-pack and bundle SKUs saw accelerated adoption. Average order value increased as customers shifted toward higher-value configurations and complementary product pairings.',
      metric: 'AOV up 2.3% to $167.10',
      sourceView: 'reporting_amazon.client_growth_drivers'
    },
    {
      title: 'Sponsored Display retargeting',
      impact: '+$12.4k incremental revenue',
      summary: 'Retargeting campaigns maintained strong efficiency while capturing high-intent shoppers who previously viewed but did not convert. ROAS on retargeting exceeded 7x.',
      metric: '7.2x ROAS on SD retargeting',
      sourceView: 'reporting_amazon.client_growth_drivers'
    }
  ],
  risks: [
    {
      title: 'Inventory runway on secondary SKU',
      severity: 'medium',
      summary: 'The secondary washing machine cleaner SKU has approximately 12 days of supply at current velocity. If replenishment is delayed or demand increases, stockout risk becomes material within 2 weeks.',
      mitigation: 'Inbound shipment confirmed for April 8. Monitoring velocity daily and prepared to throttle ad spend if needed to extend runway.',
      sourceView: 'reporting_amazon.client_risk_summary'
    },
    {
      title: 'Competitive pressure on core category terms',
      severity: 'medium',
      summary: 'CPCs increased 8-12% on core "dishwasher cleaner" and "appliance cleaner" queries as new competitors entered the auction. This is compressing margins on some high-volume terms.',
      mitigation: 'Refining bid strategies to focus on higher-converting variations and long-tail opportunities. Also testing creative refresh to improve CTR and Quality Score.',
      sourceView: 'reporting_amazon.client_risk_summary'
    },
    {
      title: 'Seasonal demand uncertainty',
      severity: 'low',
      summary: 'Historical patterns suggest potential demand variability in late Q2. Current inventory planning assumes steady growth, but variance risk exists if seasonal patterns shift.',
      mitigation: 'Prepared to adjust ad budgets and promotional calendar based on early April signal. Inventory positioned conservatively to avoid excess if softness materializes.',
      sourceView: 'reporting_amazon.client_risk_summary'
    }
  ],
  nextSteps: [
    {
      title: 'Scale non-brand search coverage',
      category: 'expansion',
      description: 'Expand exact and phrase match coverage on validated high-intent queries. Current performance on appliance cleaning and maintenance terms justifies increased investment.',
      timeline: 'Next 2 weeks',
      sourceView: 'reporting_amazon.client_next_steps'
    },
    {
      title: 'Optimize broad match efficiency',
      category: 'optimization',
      description: 'Audit search term report for broad match spill and add negative keywords. Opportunity to improve ACOS 3-5 points on non-brand acquisition campaigns.',
      timeline: 'Next week',
      sourceView: 'reporting_amazon.client_next_steps'
    },
    {
      title: 'Refresh Sponsored Brand creative',
      category: 'optimization',
      description: 'Test new creative variants for SB campaigns to improve CTR and combat rising CPCs. Focus on benefit-driven messaging and seasonal relevance.',
      timeline: 'Next 3 weeks',
      sourceView: 'reporting_amazon.client_next_steps'
    },
    {
      title: 'Monitor inventory health',
      category: 'protection',
      description: 'Continue daily monitoring of secondary SKU inventory levels. Coordinate with operations on inbound shipment tracking and velocity alerts.',
      timeline: 'Ongoing',
      sourceView: 'reporting_amazon.client_next_steps'
    },
    {
      title: 'Competitive landscape analysis',
      category: 'analysis',
      description: 'Conduct deeper analysis of new competitor entry patterns, pricing strategies, and share-of-voice trends to inform defensive and offensive tactics.',
      timeline: 'Next 4 weeks',
      sourceView: 'reporting_amazon.client_next_steps'
    },
    {
      title: 'A+ content iteration',
      category: 'optimization',
      description: 'Test updated A+ content modules emphasizing clinical results and customer testimonials. Current version is performing well but opportunity for incremental CVR lift.',
      timeline: 'Next 3 weeks',
      sourceView: 'reporting_amazon.client_next_steps'
    }
  ],
  marketContext: {
    categoryTrend: 'The home appliance cleaning category is experiencing steady growth with increasing consumer awareness of maintenance products. New entrants are expanding the market but also intensifying competition.',
    competitivePressure: 'Competitive pressure increased this period with 3-4 new brands launching in the category. CPCs rose on core terms, but Renuv maintains strong share on high-intent queries due to review strength and listing quality.',
    seasonalNote: 'Heading into spring cleaning season with historically strong demand through Q2. Current inventory planning assumes continued growth, with variance risk if demand exceeds projections.',
    searchLandscape: 'Non-brand search volume remained healthy on appliance cleaning and maintenance terms. "Dishwasher cleaner" and related queries continue to show strong intent and conversion potential. Some volatility on broader category terms as competitive dynamics shift.',
    sourceView: 'reporting_amazon.client_market_context'
  }
};

export const renuvClientPortalContracts = {
  kpis: 'reporting_amazon.client_kpi_summary',
  trendData: 'reporting_amazon.client_trend_daily',
  growthDrivers: 'reporting_amazon.client_growth_drivers',
  risks: 'reporting_amazon.client_risk_summary',
  nextSteps: 'reporting_amazon.client_next_steps',
  marketContext: 'reporting_amazon.client_market_context'
} as const;
