/**
 * Types for the unified Competitive Tracker page.
 *
 * The Competitive Tracker merges what used to be two separate tabs
 * ("Keyword Tracker" and "Competitor Intelligence") into a single
 * cleaner view. The underlying data is a superset of both feeds —
 * every field the old pages displayed is still available here.
 *
 * Most of the heavy lifting happens in renuv-competitors.server.ts
 * via fetchCompetitorIntelligence. This file's server wrapper
 * (renuv-competitive-tracker.server.ts) just layers on page-specific
 * post-processing (WoW deltas on the SOV aggregate, "biggest risks"
 * ranking, etc).
 */
import type {
  CompetitiveKeyword,
  CompetitorAsin,
  ShareOfVoice,
} from './renuv-competitors';

// Re-export the building-block types so UI files only need to import
// from this single module.
export type {
  CompetitiveKeyword,
  CompetitorAsin,
  ShareOfVoice,
  KeywordMarketShare,
  TopCompetitorPosition,
} from './renuv-competitors';

/** The full payload for the Competitive Tracker page. */
export type CompetitiveTrackerData = {
  /** The week this snapshot represents (latest week of BA data). */
  weekLabel: string;
  /** BigQuery view used as the primary source. */
  sourceView: string;

  /** Every tracked keyword, with full weekly history and competitive pressure. */
  keywords: CompetitiveKeyword[];

  /** List of keywords currently being tracked (what the user has configured). */
  trackedKeywordList: string[];

  /**
   * Aggregate share-of-voice across all tracked keywords (latest week).
   * Simple average, not volume-weighted — matches the old Competitor
   * Intelligence SOV calc so the two tabs would show the same number.
   */
  currentSOV: {
    impressionShare: number;
    clickShare: number;
    purchaseShare: number;
  };

  /** Week-over-week delta on the SOV aggregate (points, not percentage). */
  sovWowDelta: {
    impressionShare: number;
    clickShare: number;
    purchaseShare: number;
  };

  /** Weekly SOV history for the trend chart. Oldest first. */
  sovTrend: ShareOfVoice[];

  // ----- Summary counts -------------------------------------------------
  totalTrackedKeywords: number;
  keywordsWithData: number;
  gainingCount: number;
  losingCount: number;
  stableCount: number;

  /** Top 5 opportunities (high search volume × low click share). */
  topOpportunities: CompetitiveKeyword[];

  /** Top 5 biggest risks (highest WoW share loss on meaningful volume). */
  biggestRisks: CompetitiveKeyword[];

  /** Competitor ASINs that appear most often across our tracked keywords. */
  competitorAsins: CompetitorAsin[];
  hasCompetitorAsinData: boolean;
};
