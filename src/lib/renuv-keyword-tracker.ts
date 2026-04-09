/**
 * Types for the Keyword Tracker feature.
 * Tracks specific keywords weekly with full funnel metrics from Brand Analytics.
 */

/** A single week's data for one keyword */
export type KeywordWeekData = {
  weekEnding: string;
  searchVolume: number;
  impressionTotal: number;
  impressionBrand: number;
  impressionBrandShare: number;
  clickTotal: number;
  clickBrand: number;
  clickBrandShare: number;
  ctrTotal: number;
  ctrBrand: number;
  cartAddTotal: number;
  cartAddBrand: number;
  cartAddBrandShare: number;
  purchaseTotal: number;
  purchaseBrand: number;
  purchaseBrandShare: number;
  conversionTotal: number;
  conversionBrand: number;
};

/** A tracked keyword with its weekly history */
export type TrackedKeyword = {
  keyword: string;
  /** Latest week metrics for summary cards */
  latestWeek: KeywordWeekData | null;
  /** Week-over-week change for key metrics */
  wow: {
    searchVolumeChange: number;
    impressionShareChange: number;
    clickShareChange: number;
    purchaseShareChange: number;
    conversionBrandChange: number;
  };
  /** Weekly history, oldest first */
  weeks: KeywordWeekData[];
  /** Trend direction based on recent brand click share */
  trend: 'gaining' | 'losing' | 'stable';
};

/** Full keyword tracker payload */
export type KeywordTrackerData = {
  keywords: TrackedKeyword[];
  trackedKeywordList: string[];
  weekCount: number;
  latestWeekEnding: string;
  sourceView: string;
};
