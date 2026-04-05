export type TrendDirection = 'up' | 'down' | 'flat';
export type Tone = 'positive' | 'warning' | 'critical' | 'neutral';

export type RenuvKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: TrendDirection;
  sourceView: 'core_amazon.fact_sales_traffic_daily' | 'reporting_amazon.executive_kpi_daily' | 'reporting_amazon.executive_kpi_weekly';
  note: string;
};

export type RenuvFreshnessItem = {
  source: string;
  status: 'healthy' | 'watch' | 'stale';
  updatedAt: string;
  lag: string;
  coverage: string;
  sourceView: 'reporting_amazon.data_freshness_status';
};

export type RenuvBrandHealthSignal = {
  label: string;
  value: string;
  tone: Tone;
  detail: string;
};

export type RenuvBrandHealthPanel = {
  headline: string;
  summary: string;
  priorityActions: string[];
  signals: RenuvBrandHealthSignal[];
  sourceView: 'reporting_amazon.brand_health_overview';
};

export type RenuvCampaignRow = {
  campaign: string;
  channel: string;
  revenue: string;
  spend: string;
  roas: string;
  tacosImpact: string;
  status: Tone;
  sourceView: 'reporting_amazon.ads_campaign_summary_daily' | 'ops_amazon.amzn_ads_sp_campaigns_v3_view';
};

export type RenuvSearchOpportunityRow = {
  query: string;
  theme: string;
  searchVolume: string;
  opportunity: string;
  cvrGap: string;
  actionBias: string;
  sourceView: 'reporting_amazon.search_query_opportunities_daily' | 'ops_amazon.amzn_ads_sp_search_terms_v2_view';
};

export type RenuvPaidSearchDiagnosticRow = {
  query: string;
  matchType: string;
  spend: string;
  sales: string;
  acos: string;
  clicks: string;
  diagnosis: string;
  sourceView: 'reporting_amazon.ads_search_term_summary_daily';
};

export type RenuvFeeSummary = {
  feeRate: string;
  estimatedFees: string;
  reimbursementWatch: string;
  notes: string[];
  sourceView: 'reporting_amazon.fee_summary_daily' | 'core_amazon.fact_sales_traffic_daily';
};

export type RenuvReconciliationSummary = {
  revenueDelta: string;
  orderRevenue: string;
  retailRevenue: string;
  tolerance: string;
  note: string;
  sourceView: 'reporting_amazon.reconciliation_snapshot';
};

export type RenuvDailyDataPoint = {
  date: string;
  revenue: number;
  adSpend: number;
  sessions: number;
  orders: number;
};

export type RenuvOverviewSnapshot = {
  brand: string;
  periodLabel: string;
  environment: 'internal';
  kpis: RenuvKpi[];
  freshness: RenuvFreshnessItem[];
  brandHealth: RenuvBrandHealthPanel;
  campaigns: RenuvCampaignRow[];
  searchOpportunities: RenuvSearchOpportunityRow[];
  paidSearchDiagnostics: RenuvPaidSearchDiagnosticRow[];
  feeSummary: RenuvFeeSummary;
  reconciliation: RenuvReconciliationSummary;
  dailyData: RenuvDailyDataPoint[];
};

export const renuvOverviewMock: RenuvOverviewSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 7 days',
  environment: 'internal',
  kpis: [
    {
      key: 'ordered-revenue',
      label: 'Ordered revenue',
      value: '$128.4k',
      delta: '+8.7% vs prior period',
      trend: 'up',
      sourceView: 'reporting_amazon.executive_kpi_daily',
      note: 'Primary commercial top-line from executive KPI daily.'
    },
    {
      key: 'ad-spend',
      label: 'Ad spend',
      value: '$21.9k',
      delta: '+4.1% vs prior period',
      trend: 'up',
      sourceView: 'reporting_amazon.executive_kpi_daily',
      note: 'Media investment pacing remains controlled.'
    },
    {
      key: 'tacos',
      label: 'TACOS',
      value: '17.1%',
      delta: '-1.4 pts vs prior period',
      trend: 'up',
      sourceView: 'reporting_amazon.executive_kpi_daily',
      note: 'Efficiency improved as revenue outpaced spend.'
    },
    {
      key: 'total-fees',
      label: 'Total fees',
      value: '$24.8k',
      delta: '+0.6% vs prior period',
      trend: 'flat',
      sourceView: 'reporting_amazon.executive_kpi_daily',
      note: 'Fee layer is a summary preview, not a finalized ledger.'
    },
    {
      key: 'conversion-rate',
      label: 'Conversion rate',
      value: '18.6%',
      delta: '+0.9 pts vs prior period',
      trend: 'up',
      sourceView: 'reporting_amazon.executive_kpi_daily',
      note: 'Traffic quality improved against a steadier session base.'
    }
  ],
  freshness: [
    {
      source: 'Executive KPI daily',
      status: 'healthy',
      updatedAt: 'Today · 3:18 AM ET',
      lag: '42m lag',
      coverage: 'Daily reporting current through yesterday close',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'Campaign summary',
      status: 'healthy',
      updatedAt: 'Today · 3:26 AM ET',
      lag: '34m lag',
      coverage: 'Sponsored Products + Sponsored Brands loaded',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'Search opportunities',
      status: 'watch',
      updatedAt: 'Today · 2:41 AM ET',
      lag: '1h 19m lag',
      coverage: 'Brand Analytics slice trailing by one load window',
      sourceView: 'reporting_amazon.data_freshness_status'
    },
    {
      source: 'Fees + reconciliation',
      status: 'watch',
      updatedAt: 'Today · 1:58 AM ET',
      lag: '2h 02m lag',
      coverage: 'Preview snapshot is current enough for review, not ledger finality',
      sourceView: 'reporting_amazon.data_freshness_status'
    }
  ],
  brandHealth: {
    headline: 'Brand health is mostly stable, with search coverage and fee treatment worth closer review.',
    summary: 'Commercial performance is trending up, paid search efficiency improved, and no broad feed failure is visible. The main attention pockets are opportunity capture on high-intent queries and reconciling fee/revenue perspectives before client-safe narration.',
    priorityActions: [
      'Review non-branded query coverage for recovery terms with strong volume but below-target conversion.',
      'Trim waste inside broad match terms where ACOS remains above target despite adequate click depth.',
      'Sanity-check fee + reconciliation panels before using them as the basis for external narrative.'
    ],
    signals: [
      {
        label: 'Commercial momentum',
        value: 'Healthy',
        tone: 'positive',
        detail: 'Revenue growth outpaced spend and conversion improved.'
      },
      {
        label: 'Search capture',
        value: 'Needs review',
        tone: 'warning',
        detail: 'Several high-volume queries show clear room to improve paid + retail capture.'
      },
      {
        label: 'Data trust posture',
        value: 'Watch',
        tone: 'warning',
        detail: 'Freshness is good overall; fee/reconciliation data is summary-level.'
      },
      {
        label: 'Immediate risk',
        value: 'Contained',
        tone: 'neutral',
        detail: 'No stale-source failures or major campaign issues detected.'
      }
    ],
    sourceView: 'reporting_amazon.brand_health_overview'
  },
  campaigns: [
    {
      campaign: 'SP · Core appliance cleaners',
      channel: 'Sponsored Products',
      revenue: '$34.6k',
      spend: '$5.2k',
      roas: '6.7x',
      tacosImpact: '4.1 pts',
      status: 'positive',
      sourceView: 'reporting_amazon.ads_campaign_summary_daily'
    },
    {
      campaign: 'SB · Brand defense',
      channel: 'Sponsored Brands',
      revenue: '$22.1k',
      spend: '$4.4k',
      roas: '5.0x',
      tacosImpact: '3.4 pts',
      status: 'neutral',
      sourceView: 'reporting_amazon.ads_campaign_summary_daily'
    },
    {
      campaign: 'SP · Non-brand acquisition',
      channel: 'Sponsored Products',
      revenue: '$18.3k',
      spend: '$5.9k',
      roas: '3.1x',
      tacosImpact: '4.6 pts',
      status: 'warning',
      sourceView: 'reporting_amazon.ads_campaign_summary_daily'
    },
    {
      campaign: 'SD · Retargeting',
      channel: 'Sponsored Display',
      revenue: '$9.5k',
      spend: '$1.4k',
      roas: '6.8x',
      tacosImpact: '1.1 pts',
      status: 'positive',
      sourceView: 'reporting_amazon.ads_campaign_summary_daily'
    }
  ],
  searchOpportunities: [
    {
      query: 'dishwasher cleaner',
      theme: 'Core appliance',
      searchVolume: 'High',
      opportunity: 'High revenue upside',
      cvrGap: '-2.1 pts vs benchmark',
      actionBias: 'Strengthen rank + ad coverage',
      sourceView: 'reporting_amazon.search_query_opportunities_daily'
    },
    {
      query: 'washing machine cleaner',
      theme: 'Core appliance',
      searchVolume: 'High',
      opportunity: 'Share capture available',
      cvrGap: '-1.3 pts vs benchmark',
      actionBias: 'Improve detail page alignment',
      sourceView: 'reporting_amazon.search_query_opportunities_daily'
    },
    {
      query: 'citric acid cleaner',
      theme: 'Multi-use',
      searchVolume: 'Medium',
      opportunity: 'Strong intent / moderate competition',
      cvrGap: '-0.8 pts vs benchmark',
      actionBias: 'Expand exact match coverage',
      sourceView: 'reporting_amazon.search_query_opportunities_daily'
    },
    {
      query: 'garbage disposal cleaner',
      theme: 'Kitchen maintenance',
      searchVolume: 'Medium',
      opportunity: 'High intent use-case wedge',
      cvrGap: '-1.7 pts vs benchmark',
      actionBias: 'Audit creative + landing relevance',
      sourceView: 'reporting_amazon.search_query_opportunities_daily'
    }
  ],
  paidSearchDiagnostics: [
    {
      query: 'dishwasher cleaner',
      matchType: 'Broad',
      spend: '$1.9k',
      sales: '$4.8k',
      acos: '39.6%',
      clicks: '1,284',
      diagnosis: 'Volume is healthy but efficiency remains above goal. Candidate for tighter segmentation.',
      sourceView: 'reporting_amazon.ads_search_term_summary_daily'
    },
    {
      query: 'renuv dishwasher cleaner',
      matchType: 'Exact',
      spend: '$620',
      sales: '$5.9k',
      acos: '10.5%',
      clicks: '344',
      diagnosis: 'Brand defense remains efficient and should stay protected.',
      sourceView: 'reporting_amazon.ads_search_term_summary_daily'
    },
    {
      query: 'washing machine cleaner tablets',
      matchType: 'Phrase',
      spend: '$840',
      sales: '$2.1k',
      acos: '40.0%',
      clicks: '466',
      diagnosis: 'Traffic arrives, but downstream conversion is weaker than expected. Review product/query fit.',
      sourceView: 'reporting_amazon.ads_search_term_summary_daily'
    },
    {
      query: 'coffee maker cleaner descaler',
      matchType: 'Exact',
      spend: '$710',
      sales: '$3.4k',
      acos: '20.9%',
      clicks: '301',
      diagnosis: 'Good structure for scaling if conversion stays stable.',
      sourceView: 'reporting_amazon.ads_search_term_summary_daily'
    }
  ],
  feeSummary: {
    feeRate: '19.3% of ordered revenue',
    estimatedFees: '$24.8k',
    reimbursementWatch: '$1.2k flagged',
    notes: [
      'Fee layer is intentionally presented as a summary preview, not a finalized ledger.',
      'Useful for internal monitoring and operational review.',
      'Flagged reimbursement watchlist should be reviewed before externalizing any profitability narrative.'
    ],
    sourceView: 'reporting_amazon.fee_summary_daily'
  },
  reconciliation: {
    revenueDelta: '2.6%',
    orderRevenue: '$128.4k',
    retailRevenue: '$125.1k',
    tolerance: '<3.0% watch band',
    note: 'Current gap is inside the working watch band, but still deserves explicit acknowledgment when moving from internal operations to client-safe reporting.',
    sourceView: 'reporting_amazon.reconciliation_snapshot'
  },
  dailyData: []
};

export const renuvOverviewContracts = {
  kpis: 'reporting_amazon.executive_kpi_daily | reporting_amazon.executive_kpi_weekly',
  freshness: 'reporting_amazon.data_freshness_status',
  brandHealth: 'reporting_amazon.brand_health_overview',
  campaigns: 'reporting_amazon.ads_campaign_summary_daily',
  searchOpportunities: 'reporting_amazon.search_query_opportunities_daily',
  paidSearchDiagnostics: 'reporting_amazon.ads_search_term_summary_daily',
  feeSummary: 'reporting_amazon.fee_summary_daily',
  reconciliation: 'reporting_amazon.reconciliation_snapshot'
} as const;

