export type SearchKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: 'reporting_amazon.client_search_kpis';
};

export type TopSearchTerm = {
  term: string;
  category: 'Brand' | 'Non-brand' | 'Competitor';
  clicks: number;
  cvr: string;
  rank: string;
  trend: 'up' | 'down' | 'flat';
  sourceView: 'reporting_amazon.client_search_terms';
};

export type SearchOpportunity = {
  title: string;
  query: string;
  volume: string;
  currentRank: string;
  targetRank: string;
  impact: string;
  sourceView: 'reporting_amazon.client_search_opportunities';
};

export type ClientSearchSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: SearchKpi[];
  topTerms: TopSearchTerm[];
  opportunities: SearchOpportunity[];
  searchLandscape: {
    headline: string;
    categoryTrend: string;
    competitivePressure: string;
    shareOfVoice: string;
    sourceView: 'reporting_amazon.client_search_landscape';
  };
  implications: string;
  nextSteps: string[];
};

export const renuvClientSearchMock: ClientSearchSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Search performance remained strong with healthy share on core brand and category terms. Non-brand recovery and post-surgery queries drove incremental growth. Organic rankings improved on several high-intent terms, reducing reliance on paid traffic.',
  kpis: [
    {
      key: 'organic-share',
      label: 'Organic search share',
      value: '42.3%',
      delta: '+3.2 pts',
      trend: 'up',
      interpretation: 'Organic share of total search traffic increased meaningfully',
      sourceView: 'reporting_amazon.client_search_kpis'
    },
    {
      key: 'brand-share',
      label: 'Brand search share',
      value: '87.4%',
      delta: '+1.8 pts',
      trend: 'up',
      interpretation: 'Strong defense position on branded search queries',
      sourceView: 'reporting_amazon.client_search_kpis'
    },
    {
      key: 'avg-rank',
      label: 'Avg organic rank (top 10 terms)',
      value: '#4.2',
      delta: 'Improved +1.3 positions',
      trend: 'up',
      interpretation: 'Average ranking improved on priority search terms',
      sourceView: 'reporting_amazon.client_search_kpis'
    },
    {
      key: 'search-cvr',
      label: 'Search CVR',
      value: '20.1%',
      delta: '+1.6 pts',
      trend: 'up',
      interpretation: 'Conversion from search traffic strengthened',
      sourceView: 'reporting_amazon.client_search_kpis'
    },
    {
      key: 'non-brand-growth',
      label: 'Non-brand search clicks',
      value: '+18.4%',
      delta: 'vs prior period',
      trend: 'up',
      interpretation: 'Non-brand search coverage expanded significantly',
      sourceView: 'reporting_amazon.client_search_kpis'
    }
  ],
  topTerms: [
    {
      term: 'renuv scar gel',
      category: 'Brand',
      clicks: 4827,
      cvr: '24.3%',
      rank: '#1',
      trend: 'up',
      sourceView: 'reporting_amazon.client_search_terms'
    },
    {
      term: 'silicone scar gel',
      category: 'Non-brand',
      clicks: 3214,
      cvr: '18.9%',
      rank: '#3',
      trend: 'up',
      sourceView: 'reporting_amazon.client_search_terms'
    },
    {
      term: 'scar gel for surgery',
      category: 'Non-brand',
      clicks: 2891,
      cvr: '21.2%',
      rank: '#4',
      trend: 'up',
      sourceView: 'reporting_amazon.client_search_terms'
    },
    {
      term: 'post surgery scar treatment',
      category: 'Non-brand',
      clicks: 2147,
      cvr: '19.7%',
      rank: '#5',
      trend: 'up',
      sourceView: 'reporting_amazon.client_search_terms'
    },
    {
      term: 'medical grade scar gel',
      category: 'Non-brand',
      clicks: 1823,
      cvr: '20.4%',
      rank: '#6',
      trend: 'flat',
      sourceView: 'reporting_amazon.client_search_terms'
    },
    {
      term: 'scar removal gel',
      category: 'Non-brand',
      clicks: 1654,
      cvr: '17.8%',
      rank: '#8',
      trend: 'down',
      sourceView: 'reporting_amazon.client_search_terms'
    }
  ],
  opportunities: [
    {
      title: 'C-section scar treatment',
      query: 'c section scar gel',
      volume: 'High (est. 12k monthly searches)',
      currentRank: '#11',
      targetRank: '#4-6',
      impact: 'Est. +$18k monthly revenue at target rank',
      sourceView: 'reporting_amazon.client_search_opportunities'
    },
    {
      title: 'Keloid treatment expansion',
      query: 'keloid scar treatment',
      volume: 'Medium (est. 7k monthly searches)',
      currentRank: '#14',
      targetRank: '#6-8',
      impact: 'Est. +$9k monthly revenue at target rank',
      sourceView: 'reporting_amazon.client_search_opportunities'
    },
    {
      title: 'Acne scar gel crossover',
      query: 'silicone gel for acne scars',
      volume: 'Medium (est. 6k monthly searches)',
      currentRank: 'Not ranked',
      targetRank: '#8-12',
      impact: 'Est. +$6k monthly revenue with entry',
      sourceView: 'reporting_amazon.client_search_opportunities'
    }
  ],
  searchLandscape: {
    headline: 'Healthy search position with expansion opportunities',
    categoryTrend: 'Scar treatment category search volume remained stable with moderate growth on recovery-focused terms. Consumer interest in medical-grade solutions continues to increase.',
    competitivePressure: 'Competitive density increased on core "scar gel" queries as new brands entered. However, Renuv maintains strong positions on high-intent recovery and post-surgery terms where review strength provides a competitive moat.',
    shareOfVoice: 'Renuv holds approximately 18% share of voice across priority search terms (combination of organic + paid visibility). This represents a 2.4 percentage point gain versus the prior period, driven by improved organic rankings.',
    sourceView: 'reporting_amazon.client_search_landscape'
  },
  implications: 'Search performance is strong with improving organic rankings reducing cost-per-acquisition. The combination of brand strength and expanding non-brand coverage provides a healthy foundation. Opportunity exists to further scale non-brand terms and capture adjacent categories like c-section and keloid treatment.',
  nextSteps: [
    'Target top 5 ranking on "c section scar gel" through content optimization and strategic ad investment',
    'Expand content targeting acne scar crossover opportunity to capture new customer segment',
    'Continue building review velocity on flagship SKU to defend organic rankings against competitive pressure',
    'Test new search term variations around "recovery gel" and "healing gel" to identify additional expansion vectors',
    'Monitor competitor ranking changes weekly to identify defensive opportunities on core terms'
  ]
};

export const renuvClientSearchContracts = {
  kpis: 'reporting_amazon.client_search_kpis',
  topTerms: 'reporting_amazon.client_search_terms',
  opportunities: 'reporting_amazon.client_search_opportunities',
  searchLandscape: 'reporting_amazon.client_search_landscape'
} as const;
