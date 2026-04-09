/**
 * Types for Competitor Intelligence module.
 * Tracks market share dynamics, competitive pressure, and opportunities
 * using Brand Analytics search query data.
 */

/** Weekly market share snapshot for a single keyword */
export type KeywordMarketShare = {
  keyword: string;
  weekEnding: string;
  searchVolume: number;
  ourImpressionShare: number; // 0-1 decimal
  ourClickShare: number;
  ourPurchaseShare: number;
  competitorImpressionShare: number; // 1 - ours
  competitorClickShare: number;
  competitorPurchaseShare: number;
  ourConversionEdge: number; // purchase_share / click_share ratio
  // Absolute counts (our ASINs only)
  ourClickCount: number;
  ourPurchaseCount: number;
  ourImpressionCount: number;
};

/** Aggregated competitive position for a keyword (latest + trend) */
export type CompetitiveKeyword = {
  keyword: string;
  searchVolume: number;
  // Latest week shares
  ourClickShare: number;
  ourPurchaseShare: number;
  ourImpressionShare: number;
  // Week-over-week change in share (positive = gaining)
  clickShareChange: number;
  purchaseShareChange: number;
  impressionShareChange: number;
  // Trend over 4+ weeks
  trend: 'gaining' | 'losing' | 'stable';
  // Conversion edge: >1 means we convert better than field
  conversionEdge: number;
  // Opportunity score: high volume * low share = big opportunity
  opportunityScore: number;
  // Competitive pressure: losing share on high-volume terms = high pressure
  pressureLevel: 'low' | 'medium' | 'high' | 'critical';
  // Weekly history for charts
  weeklyHistory: KeywordMarketShare[];
  // Is this a user-selected focus keyword?
  isFocusKeyword: boolean;
  // Top 3 clicked ASINs for this keyword (from BA, may be empty)
  topPositions: TopCompetitorPosition[];
  // Absolute volume estimates for the latest week
  ourClickCount: number;
  ourPurchaseCount: number;
  ourImpressionCount: number;
  // Estimated total market volume (derived: our_count / our_share)
  estimatedTotalClicks: number;
  estimatedTotalPurchases: number;
};

/** A competitor ASIN seen in Brand Analytics (if available) */
export type CompetitorAsin = {
  asin: string;
  productName: string;
  // How many of our keywords they appear on
  keywordOverlap: number;
  // Their average click share across overlapping keywords
  avgClickShare: number;
  avgPurchaseShare: number;
  // Trend
  trend: 'growing' | 'declining' | 'stable';
  // Keywords where they appear
  topKeywords: string[];
};

/** Top competitor position for a specific keyword (from BA top 3 clicked ASINs) */
export type TopCompetitorPosition = {
  rank: number;           // 1, 2, or 3
  asin: string;
  productName: string;
  clickShare: number;     // 0-1 decimal
  purchaseShare: number;  // 0-1 decimal
  isOurs: boolean;        // true if this ASIN belongs to us
};

/** Share of Voice aggregate across all tracked keywords */
export type ShareOfVoice = {
  weekEnding: string;
  avgImpressionShare: number;
  avgClickShare: number;
  avgPurchaseShare: number;
  keywordCount: number;
};

/** Full competitor intelligence container */
export type CompetitorIntelligence = {
  // Summary
  headline: string;
  weekLabel: string;
  totalTrackedKeywords: number;
  keywordsWithData: number;

  // Aggregate Share of Voice
  currentSOV: {
    impressionShare: number;
    clickShare: number;
    purchaseShare: number;
  };
  sovTrend: ShareOfVoice[]; // weekly SOV history

  // Per-keyword competitive breakdown
  keywords: CompetitiveKeyword[];

  // Competitive pressure summary
  gainingCount: number;
  losingCount: number;
  stableCount: number;
  highPressureKeywords: string[]; // keywords where we're losing fast

  // Opportunity matrix
  topOpportunities: CompetitiveKeyword[]; // high volume, low share

  // Competitor ASINs (empty if data not available)
  competitorAsins: CompetitorAsin[];
  hasCompetitorAsinData: boolean;

  sourceView: string;
};
