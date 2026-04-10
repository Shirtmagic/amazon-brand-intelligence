/**
 * Server-only fetch for the unified Competitive Tracker page.
 *
 * Delegates the heavy BigQuery work to fetchCompetitorIntelligence
 * (which already builds a superset of what both the old "Keyword
 * Tracker" and "Competitor Intelligence" pages needed) and then
 * layers on a few page-specific computations:
 *
 *   1. Week-over-week delta on the aggregate share-of-voice numbers
 *      so the hero KPI cards can show "+2.1pts" style chips.
 *   2. "Biggest risks" — keywords losing click share fastest on
 *      meaningful search volume (the best single signal of a
 *      keyword that's currently bleeding out).
 *   3. A tracked-only view of the keywords array. Competitor
 *      Intelligence also returns discovered-but-unqualified keywords;
 *      the tracker deliberately shows only what the user asked for
 *      so the table stays tight.
 */
import {
  fetchCompetitorIntelligence,
  DEFAULT_FOCUS_KEYWORDS,
} from './renuv-competitors.server';
import type { CompetitiveTrackerData } from './renuv-competitive-tracker';

/** Seed list of tracked keywords (same as the old Competitor Intelligence defaults). */
export const DEFAULT_TRACKED_KEYWORDS = DEFAULT_FOCUS_KEYWORDS;

export async function fetchCompetitiveTrackerData(
  trackedKeywords: string[] = DEFAULT_TRACKED_KEYWORDS,
): Promise<CompetitiveTrackerData> {
  const raw = await fetchCompetitorIntelligence(trackedKeywords);
  const trackedSet = new Set(trackedKeywords.map((k) => k.toLowerCase()));

  // Restrict the main keywords list to only tracked keywords,
  // so the user sees a clean 1-row-per-tracked-keyword table.
  const trackedOnly = raw.keywords.filter((k) => trackedSet.has(k.keyword));

  // SOV WoW delta — diff the last two weeks of the SOV trend.
  // When we only have one week of data this stays at zero.
  const sovWowDelta = {
    impressionShare: 0,
    clickShare: 0,
    purchaseShare: 0,
  };
  if (raw.sovTrend.length >= 2) {
    const last = raw.sovTrend[raw.sovTrend.length - 1];
    const prev = raw.sovTrend[raw.sovTrend.length - 2];
    sovWowDelta.impressionShare = last.avgImpressionShare - prev.avgImpressionShare;
    sovWowDelta.clickShare = last.avgClickShare - prev.avgClickShare;
    sovWowDelta.purchaseShare = last.avgPurchaseShare - prev.avgPurchaseShare;
  }

  // Biggest risks — keywords where click share is dropping fastest
  // on meaningful volume. Weight = delta × volume so we surface the
  // biggest dollar-value bleeds first.
  const biggestRisks = [...trackedOnly]
    .filter((k) => k.clickShareChange < -0.005 && k.searchVolume > 100)
    .sort(
      (a, b) => a.clickShareChange * a.searchVolume - b.clickShareChange * b.searchVolume,
    )
    .slice(0, 5);

  // Opportunities — highest opportunity score among tracked keywords.
  // Opportunity score is computed in renuv-competitors.server.ts as:
  //   search_volume × (1 - our_click_share)
  const topOpportunities = [...trackedOnly]
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 5);

  // Summary counts restricted to tracked keywords.
  const gainingCount = trackedOnly.filter((k) => k.trend === 'gaining').length;
  const losingCount = trackedOnly.filter((k) => k.trend === 'losing').length;
  const stableCount = trackedOnly.filter((k) => k.trend === 'stable').length;

  return {
    weekLabel: raw.weekLabel,
    sourceView: raw.sourceView,
    keywords: trackedOnly,
    trackedKeywordList: trackedKeywords,
    currentSOV: raw.currentSOV,
    sovWowDelta,
    sovTrend: raw.sovTrend,
    totalTrackedKeywords: trackedOnly.length,
    keywordsWithData: trackedOnly.filter((k) => k.weeklyHistory.length > 0).length,
    gainingCount,
    losingCount,
    stableCount,
    topOpportunities,
    biggestRisks,
    competitorAsins: raw.competitorAsins,
    hasCompetitorAsinData: raw.hasCompetitorAsinData,
  };
}
