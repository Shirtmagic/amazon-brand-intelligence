export type SearchKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  note?: string;
  sourceView: 'reporting_amazon.search_kpi';
};

export type SearchTermPerformance = {
  term: string;
  impressions: number;
  clicks: number;
  orders: number;
  sales: number;
  ctr: number;
  conversionRate: number;
  category: 'brand' | 'category' | 'competitor' | 'recovery' | 'post-surgery';
};

export type TopQuery = {
  query: string;
  queryVolume: string;
  brandAppearance: string;
  shareOfVoice: string;
  impressions: string;
  clicks: string;
  clickShare: string;
  diagnosis: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type DiagnosticItem = {
  label: string;
  metric?: string;
  recommendation?: string;
};

export type Diagnostic = {
  title: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  detail: string;
  actionBias: string;
  sourceView: string;
  items?: DiagnosticItem[];
};

export type PositionTracking = {
  asin: string;
  title: string;
  topQuery: string;
  queryVolume: string;
  impressionShare: string;
  clickShare: string;
  purchaseShare: string;
  clickThroughRate: string;
  diagnosis: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type CategoryRank = {
  category: string;
  currentRank: string;
  rankChange: string;
  topCompetitors: string;
  trafficShare: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

/** Per-query competitive share from Brand Analytics */
export type CategoryShareQuery = {
  searchQuery: string;
  queryVolume: number;
  ourImpressionShare: number;
  ourClickShare: number;
  ourPurchaseShare: number;
  competitorImpressionShare: number;
  competitorClickShare: number;
  competitorPurchaseShare: number;
  weekOverWeekImpressionChange: number;
  weekOverWeekClickChange: number;
  weekOverWeekPurchaseChange: number;
  /** >1 means we convert better than the field; <1 means competitors convert better */
  conversionEdge: number;
  ourImpressions: number;
  ourClicks: number;
  ourPurchases: number;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

/** BSR tracking entry per ASIN with historical trend */
export type BSREntry = {
  asin: string;
  productName: string;
  salesRank: number;
  trend: BSRTrendPoint[];
};

/** Single data point in BSR history */
export type BSRTrendPoint = {
  date: string;
  rank: number;
};

/** Weekly aggregate share trend point */
export type CategoryShareTrend = {
  weekEnding: string;
  avgImpressionShare: number;
  avgClickShare: number;
  avgPurchaseShare: number;
  totalImpressions: number;
  totalClicks: number;
  totalPurchases: number;
};

/** Full category intelligence container */
export type CategoryIntelligence = {
  headline: string;
  avgImpressionShare: number;
  avgClickShare: number;
  avgPurchaseShare: number;
  overallConversionEdge: number;
  queryShares: CategoryShareQuery[];
  bsrTracking: BSREntry[];
  shareTrends: CategoryShareTrend[];
  weekLabel: string;
  sourceView: string;
};

export type Freshness = {
  source: string;
  updatedAt: string;
  lag: string;
  readiness: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
  interpretation: string;
};

export type SearchFreshnessSummary = {
  headline: string;
  decisionReadiness: 'Ready for optimization' | 'Use with caution' | 'Delay major decisions';
  overallTone: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type SearchSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: SearchKpi[];
  topTerms: SearchTermPerformance[];
  commentary: string;
  implications: string[];
  nextSteps: string[];
  topQueries: TopQuery[];
  diagnostics: Diagnostic[];
  positionTracking: PositionTracking[];
  categoryRanks: CategoryRank[];
  freshness: Freshness[];
  freshnessSummary?: SearchFreshnessSummary;
  categoryIntelligence?: CategoryIntelligence;
};

export const renuvSearchMock: SearchSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Search performance showed strong momentum with non-brand search revenue up 28% and improved share-of-voice on high-intent recovery and post-surgery terms. Organic rank gains complemented paid search expansion.',
  kpis: [
    {
      key: 'non-brand-revenue',
      label: 'Non-brand search revenue',
      value: '$187,400',
      delta: '+28.3%',
      trend: 'up',
      interpretation: 'Non-brand search revenue accelerated driven by expanded coverage on recovery and post-surgery queries',
      sourceView: 'reporting_amazon.search_kpi'
    },
    {
      key: 'brand-revenue',
      label: 'Brand search revenue',
      value: '$224,900',
      delta: '+6.2%',
      trend: 'up',
      interpretation: 'Brand search remained strong with healthy growth and high conversion efficiency',
      sourceView: 'reporting_amazon.search_kpi'
    },
    {
      key: 'sov',
      label: 'Share of voice (non-brand)',
      value: '18.4%',
      delta: '+2.3 pts',
      trend: 'up',
      interpretation: 'Increased presence on high-intent category terms driven by bid optimization and creative improvements',
      sourceView: 'reporting_amazon.search_kpi'
    },
    {
      key: 'organic-rank',
      label: 'Avg. organic rank (top 20 terms)',
      value: '8.2',
      delta: '-1.8',
      trend: 'up',
      interpretation: 'Organic ranking improved on key terms (lower rank number is better), supporting reduced paid reliance',
      sourceView: 'reporting_amazon.search_kpi'
    },
    {
      key: 'search-conversion',
      label: 'Search conversion rate',
      value: '21.3%',
      delta: '+1.6 pts',
      trend: 'up',
      interpretation: 'Search traffic converting at premium rate indicating strong query-to-product match',
      sourceView: 'reporting_amazon.search_kpi'
    },
    {
      key: 'search-ctr',
      label: 'Search CTR',
      value: '0.52%',
      delta: '+0.06 pts',
      trend: 'up',
      interpretation: 'Click-through rate improvement reflects better ad relevance and creative performance',
      sourceView: 'reporting_amazon.search_kpi'
    }
  ],
  topTerms: [
    { term: 'scar gel for surgery', impressions: 124500, clicks: 685, orders: 152, sales: 25800, ctr: 0.55, conversionRate: 22.2, category: 'post-surgery' },
    { term: 'silicone scar treatment', impressions: 108200, clicks: 592, orders: 131, sales: 21900, ctr: 0.55, conversionRate: 22.1, category: 'category' },
    { term: 'renuv scar gel', impressions: 96300, clicks: 874, orders: 198, sales: 33100, ctr: 0.91, conversionRate: 22.7, category: 'brand' },
    { term: 'scar removal cream', impressions: 89400, clicks: 447, orders: 91, sales: 15200, ctr: 0.50, conversionRate: 20.4, category: 'category' },
    { term: 'post surgery scar treatment', impressions: 76200, clicks: 419, orders: 96, sales: 16100, ctr: 0.55, conversionRate: 22.9, category: 'post-surgery' },
    { term: 'silicone gel for scars', impressions: 71800, clicks: 394, orders: 87, sales: 14600, ctr: 0.55, conversionRate: 22.1, category: 'category' },
    { term: 'c section scar treatment', impressions: 68500, clicks: 377, orders: 89, sales: 14900, ctr: 0.55, conversionRate: 23.6, category: 'post-surgery' },
    { term: 'renuv', impressions: 62100, clicks: 558, orders: 127, sales: 21200, ctr: 0.90, conversionRate: 22.8, category: 'brand' },
    { term: 'surgical scar gel', impressions: 59300, clicks: 326, orders: 74, sales: 12400, ctr: 0.55, conversionRate: 22.7, category: 'post-surgery' },
    { term: 'best scar cream after surgery', impressions: 54700, clicks: 301, orders: 71, sales: 11900, ctr: 0.55, conversionRate: 23.6, category: 'post-surgery' }
  ],
  commentary: 'Search intelligence this period revealed strong momentum on non-brand queries with revenue up 28.3% driven by expanded coverage on recovery and post-surgery terms. Share-of-voice increased 2.3 points on non-brand searches to 18.4%, reflecting improved ad position and creative performance. Organic rank gains (average rank improved from 10.0 to 8.2 on top 20 terms) provide a tailwind by reducing paid reliance on some high-volume queries. Search conversion rate at 21.3% significantly exceeds the category benchmark of ~16%, validating strong query-to-product match. Top-performing terms cluster around post-surgery recovery use cases ("scar gel for surgery", "c section scar treatment", "post surgery scar treatment"), suggesting this is the highest-intent audience segment. Brand search remained healthy with 6.2% growth and premium conversion rates above 22%. CTR improvement of 0.06 points indicates creative and targeting relevance is strong. The final week showed accelerating non-brand momentum, validating expansion opportunity.',
  implications: [
    'Post-surgery and recovery queries are the highest-converting segment — should be priority for budget allocation and creative optimization',
    'Organic rank gains create opportunity to reduce paid spend on select terms while maintaining visibility — strategic reallocation possible',
    'Search conversion rate at 21.3% significantly exceeds category average — indicates strong product-market fit on search traffic',
    'Share-of-voice gains demonstrate competitive positioning is improving — continued investment can capture additional market share',
    'Brand search health remains strong — no defensive pressure, can focus investment on non-brand expansion'
  ],
  nextSteps: [
    'Expand exact and phrase match coverage on validated post-surgery terms — current performance justifies significant budget increase',
    'Test selective bid reduction on terms with strong organic rank (top 5) — pilot reducing paid spend while monitoring total visibility',
    'Develop creative variants specifically for post-surgery audience — test messaging emphasizing surgical recovery, healing timeline, and clinical validation',
    'Audit broad match search term reports for new post-surgery query variations — identify expansion opportunities in related surgical procedures',
    'Monitor share-of-voice trends weekly — track competitive dynamics and adjust bids to maintain or grow presence on strategic terms'
  ],
  topQueries: [
    { query: 'scar gel for surgery', queryVolume: '124,500', brandAppearance: '78%', shareOfVoice: '24%', impressions: '124,500', clicks: '685', clickShare: '31%', diagnosis: 'Strong position with room to grow', severity: 'positive' as const },
    { query: 'silicone scar treatment', queryVolume: '108,200', brandAppearance: '65%', shareOfVoice: '19%', impressions: '108,200', clicks: '592', clickShare: '26%', diagnosis: 'Competitive — monitor bid pressure', severity: 'neutral' as const },
    { query: 'post surgery scar treatment', queryVolume: '76,200', brandAppearance: '72%', shareOfVoice: '14%', impressions: '76,200', clicks: '419', clickShare: '18%', diagnosis: 'Growing segment — increase coverage', severity: 'positive' as const },
    { query: 'scar removal cream', queryVolume: '89,400', brandAppearance: '48%', shareOfVoice: '11%', impressions: '89,400', clicks: '447', clickShare: '14%', diagnosis: 'Underweight — expand match types', severity: 'warning' as const },
    { query: 'c section scar treatment', queryVolume: '68,500', brandAppearance: '70%', shareOfVoice: '9%', impressions: '68,500', clicks: '377', clickShare: '12%', diagnosis: 'High-intent niche — strong conversion', severity: 'positive' as const }
  ],
  diagnostics: [
    { title: 'Non-brand revenue acceleration', severity: 'positive' as const, detail: 'Non-brand search revenue grew 28.3% period-over-period with improving share-of-voice across high-intent recovery terms.', actionBias: 'Increase budget allocation to top-performing non-brand campaigns to capture additional share.', sourceView: 'reporting_amazon.search_diagnostic' },
    { title: 'Organic rank improvement reducing paid dependency', severity: 'positive' as const, detail: 'Average organic rank on top 20 terms improved from 10.0 to 8.2, creating opportunity to optimize paid spend.', actionBias: 'Test selective bid reductions on terms with strong organic rank to optimize total cost of visibility.', sourceView: 'reporting_amazon.search_diagnostic' },
    { title: 'Broad match query leakage', severity: 'warning' as const, detail: 'Broad match campaigns showing 12% of spend on low-relevance queries outside core scar treatment category.', actionBias: 'Review search term report and add negative keywords for irrelevant query clusters.', sourceView: 'reporting_amazon.search_diagnostic' }
  ],
  positionTracking: [
    { asin: 'B0EXAMPLE1', title: 'Renuv Advanced Scar Gel', topQuery: 'scar gel for surgery', queryVolume: '142,000 searches', impressionShare: '18%', clickShare: '31%', purchaseShare: '12%', clickThroughRate: '0.55%', diagnosis: 'Dominant visibility on primary term', severity: 'positive' as const },
    { asin: 'B0EXAMPLE2', title: 'Renuv Silicone Scar Sheets', topQuery: 'silicone scar treatment', queryVolume: '98,500 searches', impressionShare: '12%', clickShare: '22%', purchaseShare: '8%', clickThroughRate: '0.48%', diagnosis: 'Stable mid-tier visibility', severity: 'neutral' as const },
    { asin: 'B0EXAMPLE3', title: 'Renuv Post-Surgery Recovery Kit', topQuery: 'post surgery scar treatment', queryVolume: '76,200 searches', impressionShare: '8%', clickShare: '15%', purchaseShare: '6%', clickThroughRate: '0.41%', diagnosis: 'Improving search visibility', severity: 'positive' as const }
  ],
  categoryRanks: [
    { category: 'Scar Treatments', currentRank: '#3', rankChange: '+1', topCompetitors: 'Mederma, ScarAway, Bio-Oil', trafficShare: '14.2%', tone: 'positive' as const },
    { category: 'Post-Surgery Recovery', currentRank: '#2', rankChange: '—', topCompetitors: 'Mederma, NewGel+', trafficShare: '18.7%', tone: 'positive' as const },
    { category: 'Silicone Scar Gel', currentRank: '#1', rankChange: '+2', topCompetitors: 'ScarAway, Dermatix', trafficShare: '22.1%', tone: 'positive' as const }
  ],
  freshness: [
    { source: 'Search Query Performance', updatedAt: '2026-03-31 23:45 UTC', lag: 'Current through Mar 31', readiness: 'Healthy', tone: 'positive' as const, interpretation: 'Use this source to judge query demand, click share, and search mix. Fresh enough for decision-making today.' },
    { source: 'Brand Analytics / ASIN visibility', updatedAt: '2026-03-31 12:00 UTC', lag: 'Weekly, current through Mar 30', readiness: 'Healthy', tone: 'positive' as const, interpretation: 'Use this source to judge ASIN-level search visibility and relative share.' }
  ],
  freshnessSummary: {
    headline: 'Search data is current enough to support query and visibility decisions today.',
    decisionReadiness: 'Ready for optimization',
    overallTone: 'positive' as const,
  }
};

export const renuvSearchContracts = {
  kpi: 'reporting_amazon.search_kpi',
  kpis: 'reporting_amazon.search_kpi',
  topTerms: 'reporting_amazon.search_term_performance',
  snapshot: 'reporting_amazon.search_snapshot',
  queryPerformance: 'reporting_amazon.search_query_performance_daily',
  asinPosition: 'reporting_amazon.search_asin_position_daily',
  categoryRank: 'reporting_amazon.category_rank_daily',
  freshness: 'reporting_amazon.source_freshness'
} as const;

/**
 * Fetch search snapshot from BigQuery
 */

