export type AdvertisingKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  note?: string;
  sourceView: 'reporting_amazon.advertising_kpi';
};

export type AdvertisingChartDataPoint = {
  date: string;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  roas: number;
};

export type CampaignPerformanceRow = {
  campaign: string;
  channel: string;
  objective: string;
  spend: string;
  attributedSales: string;
  roas: string;
  tacosImpact: string;
  cvr: string;
  status: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  sourceView: string;
};

export type EfficiencySignal = {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  detail: string;
};

export type EfficiencyBlock = {
  headline: string;
  summary: string;
  signals: EfficiencySignal[];
  sourceView: string;
};

export type FreshnessItem = {
  source: string;
  updatedAt: string;
  lag: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  readiness: string;
  sourceView: string;
};

export type SpendMixRow = {
  channel: string;
  spendShare: string;
  salesShare: string;
  acos: string;
  role: string;
  sourceView: string;
};

export type SearchTermRow = {
  query: string;
  campaignBias: string;
  spend: string;
  sales: string;
  acos: string;
  qualityRead: string;
  sourceView: string;
};

export type DiagnosticItem = {
  title: string;
  severity: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
  detail: string;
  actionBias: string;
  sourceView: string;
};

/** A single keyword placement: one campaign + match type combo for a keyword */
export type KeywordPlacement = {
  campaignName: string;
  matchType: string;
  spend: number;
  sales: number;
  clicks: number;
  impressions: number;
  orders: number;
  roas: number;
  acos: number;
};

/** A keyword flagged for waste — spend vs product price analysis */
export type KeywordWasteRow = {
  keyword: string;
  totalSpend: number;
  totalSales: number;
  totalOrders: number;
  totalClicks: number;
  avgProductPrice: number;
  spendToProductRatio: number;
  expectedSalesAtPrice: number;
  salesDeficit: number;
  placements: KeywordPlacement[];
  severity: 'critical' | 'warning' | 'watch';
};

/** Summary container for keyword waste analysis */
export type KeywordWasteSummary = {
  headline: string;
  totalWastedSpend: number;
  flaggedKeywords: KeywordWasteRow[];
  sourceView: string;
};

export type AdvertisingSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: AdvertisingKpi[];
  chartData: AdvertisingChartDataPoint[];
  commentary: string;
  implications: string[];
  nextSteps: string[];
  performance: CampaignPerformanceRow[];
  efficiency: EfficiencyBlock;
  freshness: FreshnessItem[];
  spendMix: SpendMixRow[];
  searchTerms: SearchTermRow[];
  diagnostics: DiagnosticItem[];
  keywordWaste?: KeywordWasteSummary;
};

export const renuvAdvertisingMock: AdvertisingSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Advertising efficiency improved significantly this period with ROAS up 8.2% and TACOS down 1.1 percentage points. Strategic campaign optimizations and improved creative performance drove results while spend increased modestly.',
  kpis: [
    {
      key: 'spend',
      label: 'Ad spend',
      value: '$89,200',
      delta: '+6.1%',
      trend: 'up',
      interpretation: 'Spend growth remained controlled while revenue accelerated, driving efficiency gains',
      sourceView: 'reporting_amazon.advertising_kpi'
    },
    {
      key: 'sales',
      label: 'Ad-attributed sales',
      value: '$412,300',
      delta: '+14.8%',
      trend: 'up',
      interpretation: 'Ad sales increased faster than spend, indicating strong campaign performance',
      sourceView: 'reporting_amazon.advertising_kpi'
    },
    {
      key: 'roas',
      label: 'ROAS',
      value: '4.62',
      delta: '+8.2%',
      trend: 'up',
      interpretation: 'Return on ad spend improved meaningfully driven by conversion gains and bid optimization',
      sourceView: 'reporting_amazon.advertising_kpi'
    },
    {
      key: 'tacos',
      label: 'TACOS',
      value: '16.4%',
      delta: '-1.1 pts',
      trend: 'up',
      interpretation: 'Total advertising cost of sale improved as revenue outpaced spend growth',
      sourceView: 'reporting_amazon.advertising_kpi'
    },
    {
      key: 'acos',
      label: 'ACOS',
      value: '21.6%',
      delta: '-1.8 pts',
      trend: 'up',
      interpretation: 'Advertising cost of sale decreased reflecting better campaign efficiency',
      sourceView: 'reporting_amazon.advertising_kpi'
    },
    {
      key: 'ctr',
      label: 'Click-through rate',
      value: '0.48%',
      delta: '+0.04 pts',
      trend: 'up',
      interpretation: 'CTR improvement suggests stronger creative relevance and targeting accuracy',
      sourceView: 'reporting_amazon.advertising_kpi'
    }
  ],
  chartData: [
    { date: '2026-03-02', spend: 2800, sales: 12400, impressions: 582000, clicks: 2790, roas: 4.43 },
    { date: '2026-03-03', spend: 2900, sales: 13200, impressions: 605000, clicks: 2900, roas: 4.55 },
    { date: '2026-03-04', spend: 2950, sales: 13600, impressions: 615000, clicks: 2950, roas: 4.61 },
    { date: '2026-03-05', spend: 3100, sales: 14400, impressions: 645000, clicks: 3100, roas: 4.65 },
    { date: '2026-03-06', spend: 3000, sales: 14000, impressions: 625000, clicks: 3020, roas: 4.67 },
    { date: '2026-03-07', spend: 2850, sales: 13100, impressions: 595000, clicks: 2860, roas: 4.60 },
    { date: '2026-03-08', spend: 2800, sales: 12800, impressions: 585000, clicks: 2810, roas: 4.57 },
    { date: '2026-03-09', spend: 3150, sales: 14600, impressions: 655000, clicks: 3160, roas: 4.63 },
    { date: '2026-03-10', spend: 3200, sales: 15000, impressions: 665000, clicks: 3210, roas: 4.69 },
    { date: '2026-03-11', spend: 3100, sales: 14700, impressions: 645000, clicks: 3110, roas: 4.74 },
    { date: '2026-03-12', spend: 3300, sales: 15600, impressions: 685000, clicks: 3310, roas: 4.73 },
    { date: '2026-03-13', spend: 3250, sales: 15300, impressions: 675000, clicks: 3260, roas: 4.71 },
    { date: '2026-03-14', spend: 2950, sales: 13900, impressions: 615000, clicks: 2960, roas: 4.71 },
    { date: '2026-03-15', spend: 2850, sales: 13300, impressions: 595000, clicks: 2860, roas: 4.67 },
    { date: '2026-03-16', spend: 3250, sales: 15400, impressions: 675000, clicks: 3260, roas: 4.74 },
    { date: '2026-03-17', spend: 3350, sales: 15900, impressions: 695000, clicks: 3360, roas: 4.75 },
    { date: '2026-03-18', spend: 3400, sales: 16400, impressions: 705000, clicks: 3410, roas: 4.82 },
    { date: '2026-03-19', spend: 3350, sales: 16100, impressions: 695000, clicks: 3360, roas: 4.81 },
    { date: '2026-03-20', spend: 3150, sales: 14900, impressions: 655000, clicks: 3160, roas: 4.73 },
    { date: '2026-03-21', spend: 3000, sales: 14100, impressions: 625000, clicks: 3010, roas: 4.70 },
    { date: '2026-03-22', spend: 2900, sales: 13700, impressions: 605000, clicks: 2910, roas: 4.72 },
    { date: '2026-03-23', spend: 3300, sales: 15700, impressions: 685000, clicks: 3310, roas: 4.76 },
    { date: '2026-03-24', spend: 3450, sales: 16600, impressions: 715000, clicks: 3460, roas: 4.81 },
    { date: '2026-03-25', spend: 3550, sales: 17100, impressions: 735000, clicks: 3560, roas: 4.82 },
    { date: '2026-03-26', spend: 3450, sales: 16700, impressions: 715000, clicks: 3460, roas: 4.84 },
    { date: '2026-03-27', spend: 3350, sales: 16200, impressions: 695000, clicks: 3360, roas: 4.84 },
    { date: '2026-03-28', spend: 3150, sales: 15100, impressions: 655000, clicks: 3160, roas: 4.79 },
    { date: '2026-03-29', spend: 3050, sales: 14600, impressions: 635000, clicks: 3060, roas: 4.79 },
    { date: '2026-03-30', spend: 3500, sales: 16900, impressions: 725000, clicks: 3510, roas: 4.83 },
    { date: '2026-03-31', spend: 3600, sales: 17400, impressions: 745000, clicks: 3610, roas: 4.83 }
  ],
  commentary: 'Advertising performance this period significantly exceeded expectations with efficiency gains across the board. ROAS improved 8.2% to 4.62 while TACOS decreased 1.1 percentage points to 16.4%. This represents the ideal scenario — ad sales growth (14.8%) substantially outpacing spend growth (6.1%). The efficiency improvements were driven by three key factors: conversion rate gains on the listings themselves (+1.4 pts), strategic bid optimization on high-performing campaigns, and improved creative performance (CTR up 0.04 pts). Sponsored Product campaigns led the way with ROAS exceeding 5.0x, while Sponsored Brand and Sponsored Display both delivered solid contributions. Non-brand search campaigns showed particularly strong performance with ACOS improving 2.3 points while maintaining growth. The final week of the period demonstrated sustained efficiency at higher spend levels, validating the opportunity to scale investment.',
  implications: [
    'Current efficiency levels support significant expansion opportunity — ROAS at 4.62 and TACOS at 16.4% indicate room to increase spend while maintaining profitability',
    'Non-brand search campaigns are ready to scale — efficiency improvements combined with strong volume justify increased investment in validated high-intent queries',
    'Creative performance is contributing to efficiency gains — CTR improvements suggest ad relevance is strong and may support further testing',
    'Sponsored Product efficiency validates product-market fit — strong ROAS on SP campaigns indicates listings are converting well once traffic arrives'
  ],
  nextSteps: [
    'Scale non-brand search investment — increase budgets on high-performing phrase and exact match campaigns targeting validated recovery and post-surgery terms',
    'Test broader match expansion on proven terms — selectively expand to modified broad on top-performing keywords with strong search term report validation',
    'Refresh Sponsored Brand creative — test new headline and image combinations to further improve CTR and combat rising CPCs in competitive auctions',
    'Audit negative keyword coverage — review search term reports to identify and exclude low-quality traffic, targeting 3-5 point ACOS improvement on broad campaigns',
    'Implement bid dayparting strategy — analyze performance by hour-of-day to identify opportunities for strategic bid adjustments during peak conversion windows'
  ],
  performance: [
    {
      campaign: 'SP | Recovery essentials | Exact',
      channel: 'Sponsored Products',
      objective: 'Non-brand acquisition',
      spend: '$18,400',
      attributedSales: '$96,200',
      roas: '5.23',
      tacosImpact: '3.8%',
      cvr: '14.2%',
      status: 'positive',
      sourceView: 'reporting_amazon.campaign_performance'
    },
    {
      campaign: 'SP | Post-surgery care | Phrase',
      channel: 'Sponsored Products',
      objective: 'Non-brand acquisition',
      spend: '$14,200',
      attributedSales: '$71,800',
      roas: '5.06',
      tacosImpact: '2.9%',
      cvr: '13.8%',
      status: 'positive',
      sourceView: 'reporting_amazon.campaign_performance'
    },
    {
      campaign: 'SB | Brand defense',
      channel: 'Sponsored Brands',
      objective: 'Brand protection',
      spend: '$12,600',
      attributedSales: '$58,300',
      roas: '4.63',
      tacosImpact: '2.6%',
      cvr: '11.9%',
      status: 'positive',
      sourceView: 'reporting_amazon.campaign_performance'
    },
    {
      campaign: 'SD | Product targeting | Auto',
      channel: 'Sponsored Display',
      objective: 'Retargeting',
      spend: '$8,900',
      attributedSales: '$38,700',
      roas: '4.35',
      tacosImpact: '1.8%',
      cvr: '9.2%',
      status: 'neutral',
      sourceView: 'reporting_amazon.campaign_performance'
    },
    {
      campaign: 'SP | Competitor ASIN targeting',
      channel: 'Sponsored Products',
      objective: 'Conquest',
      spend: '$11,300',
      attributedSales: '$42,100',
      roas: '3.73',
      tacosImpact: '2.3%',
      cvr: '8.6%',
      status: 'warning',
      sourceView: 'reporting_amazon.campaign_performance'
    }
  ],
  efficiency: {
    headline: 'Efficiency strong with scaling opportunity',
    summary: 'Current ROAS of 4.62 and TACOS of 16.4% indicate healthy profitability with room to increase spend. Non-brand campaigns are performing particularly well, validating expansion into validated high-intent search terms.',
    signals: [
      {
        label: 'ROAS trend',
        value: '+8.2%',
        tone: 'positive',
        detail: 'Return on ad spend improved meaningfully over trailing 30 days, driven by conversion gains and bid optimization.'
      },
      {
        label: 'TACOS trend',
        value: '-1.1 pts',
        tone: 'positive',
        detail: 'Total advertising cost of sale decreased as revenue growth outpaced spend growth.'
      },
      {
        label: 'Non-brand efficiency',
        value: 'Strong',
        tone: 'positive',
        detail: 'Non-brand search campaigns delivering ROAS above 5.0x with room to scale investment.'
      },
      {
        label: 'Spend velocity',
        value: '+6.1%',
        tone: 'neutral',
        detail: 'Spend growth remained controlled while sales accelerated, creating efficiency gains.'
      }
    ],
    sourceView: 'reporting_amazon.efficiency_rollup'
  },
  freshness: [
    {
      source: 'Campaign performance data',
      updatedAt: '2026-04-01 08:42 UTC',
      lag: '< 12 hours',
      tone: 'positive',
      readiness: 'Campaign-level spend, sales, and efficiency metrics are current and ready for decision-making.',
      sourceView: 'reporting_amazon.campaign_performance'
    },
    {
      source: 'Search term report',
      updatedAt: '2026-04-01 07:15 UTC',
      lag: '< 18 hours',
      tone: 'positive',
      readiness: 'Search term data is fresh enough for keyword optimization and negative keyword management.',
      sourceView: 'reporting_amazon.search_term_report'
    },
    {
      source: 'Ad-attributed conversion data',
      updatedAt: '2026-03-31 22:00 UTC',
      lag: '~26 hours',
      tone: 'warning',
      readiness: 'Conversion data has typical lag; ROAS metrics may shift slightly as attribution window closes.',
      sourceView: 'reporting_amazon.attributed_conversion'
    }
  ],
  spendMix: [
    {
      channel: 'Sponsored Products',
      spendShare: '62.4%',
      salesShare: '68.2%',
      acos: '19.8%',
      role: 'Primary acquisition engine',
      sourceView: 'reporting_amazon.channel_mix'
    },
    {
      channel: 'Sponsored Brands',
      spendShare: '24.1%',
      salesShare: '21.3%',
      acos: '24.5%',
      role: 'Brand visibility + defense',
      sourceView: 'reporting_amazon.channel_mix'
    },
    {
      channel: 'Sponsored Display',
      spendShare: '13.5%',
      salesShare: '10.5%',
      acos: '27.8%',
      role: 'Retargeting + awareness',
      sourceView: 'reporting_amazon.channel_mix'
    }
  ],
  searchTerms: [
    {
      query: 'recovery essentials after surgery',
      campaignBias: 'SP | Recovery essentials | Exact',
      spend: '$2,840',
      sales: '$15,600',
      acos: '18.2%',
      qualityRead: 'High-intent, strong conversion',
      sourceView: 'reporting_amazon.search_term_report'
    },
    {
      query: 'post surgical care products',
      campaignBias: 'SP | Post-surgery care | Phrase',
      spend: '$2,120',
      sales: '$11,300',
      acos: '18.8%',
      qualityRead: 'High-intent, validated term',
      sourceView: 'reporting_amazon.search_term_report'
    },
    {
      query: 'renuv brand',
      campaignBias: 'SB | Brand defense',
      spend: '$1,890',
      sales: '$9,200',
      acos: '20.5%',
      qualityRead: 'Brand term, strong loyalty',
      sourceView: 'reporting_amazon.search_term_report'
    },
    {
      query: 'surgical recovery kit',
      campaignBias: 'SP | Recovery essentials | Phrase',
      spend: '$1,640',
      sales: '$8,100',
      acos: '20.2%',
      qualityRead: 'High-intent, scale opportunity',
      sourceView: 'reporting_amazon.search_term_report'
    },
    {
      query: 'wound care essentials',
      campaignBias: 'SP | Competitor ASIN targeting',
      spend: '$1,320',
      sales: '$4,800',
      acos: '27.5%',
      qualityRead: 'Moderate quality, review for negative',
      sourceView: 'reporting_amazon.search_term_report'
    }
  ],
  diagnostics: [
    {
      title: 'High-performing campaigns ready to scale',
      severity: 'positive',
      detail: 'Top non-brand search campaigns are delivering ROAS above 5.0x with strong conversion rates. Current budget caps are limiting impression share on validated high-intent queries.',
      actionBias: 'Increase daily budgets on "SP | Recovery essentials | Exact" and "SP | Post-surgery care | Phrase" by 30-40% to capture additional volume at current efficiency levels.',
      sourceView: 'reporting_amazon.campaign_diagnostics'
    },
    {
      title: 'Competitor targeting efficiency below threshold',
      severity: 'warning',
      detail: 'ASIN-targeted conquest campaigns are delivering ROAS of 3.73, below the 4.0x efficiency floor. Search term report shows quality issues with broad match traffic.',
      actionBias: 'Review search term report for "SP | Competitor ASIN targeting" and add negative keywords for low-quality traffic. Consider reducing bids by 15-20% to improve efficiency.',
      sourceView: 'reporting_amazon.campaign_diagnostics'
    },
    {
      title: 'Sponsored Display attribution lag',
      severity: 'neutral',
      detail: 'SD campaigns show typical 24-48 hour attribution delay. Current ROAS of 4.35 may improve as view-through conversions are fully attributed.',
      actionBias: 'Monitor SD performance over 7-day window before making bid adjustments. Current performance is within expected range for retargeting campaigns.',
      sourceView: 'reporting_amazon.campaign_diagnostics'
    }
  ]
};

export const renuvAdvertisingContracts = {
  kpis: 'reporting_amazon.advertising_kpi',
  chartData: 'reporting_amazon.advertising_daily',
  snapshot: 'reporting_amazon.advertising_snapshot'
} as const;

/**
 * Fetch advertising snapshot from BigQuery
 */

