/**
 * Server-only fetch functions for Competitor Intelligence.
 *
 * Queries Brand Analytics search query data to build a competitive
 * landscape view: share-of-voice trends, per-keyword competitive
 * position, opportunity scoring, and competitor ASIN discovery.
 *
 * Brand Analytics stores share values as percentages (20.94 = 20.94%),
 * so we divide by 100 to get decimals.
 *
 * BigQuery returns INT64/NUMERIC as strings — always use Number() coercion.
 */
import { queryBigQuery } from './bigquery';
import type {
  CompetitorIntelligence,
  CompetitiveKeyword,
  KeywordMarketShare,
  CompetitorAsin,
  ShareOfVoice,
  TopCompetitorPosition,
} from './renuv-competitors';

const SELLER_ID = 'A2CWSK2O443P17';
const BA_TABLE = '`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view`';
const INV_TABLE = '`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24`';
const TOP_SEARCH_TABLE = '`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_terms_by_week_v2_view`';

/** Default focus keywords for Renuv — defines what the brand actually sells */
export const DEFAULT_FOCUS_KEYWORDS: string[] = [
  'washing machine cleaner',
  'dishwasher cleaner',
  'coffee maker cleaner',
  'garbage disposal cleaner',
  'citric acid powder',
  'washing machine cleaner tablets',
  'renuv',
  'renuv washing machine cleaner',
  'renuv coffee maker cleaner',
  'washing machine cleaner powder',
];

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function toDateString(val: { value: string } | string | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'object' && 'value' in val) return val.value;
  return String(val);
}

/**
 * Fetch competitor intelligence.
 * @param focusKeywords - User-selected keywords that matter most. These get priority.
 */
export async function fetchCompetitorIntelligence(
  focusKeywords: string[] = DEFAULT_FOCUS_KEYWORDS
): Promise<CompetitorIntelligence> {
  const emptyResult: CompetitorIntelligence = {
    headline: 'No competitor data available',
    weekLabel: '',
    totalTrackedKeywords: 0,
    keywordsWithData: 0,
    currentSOV: { impressionShare: 0, clickShare: 0, purchaseShare: 0 },
    sovTrend: [],
    keywords: [],
    gainingCount: 0,
    losingCount: 0,
    stableCount: 0,
    highPressureKeywords: [],
    topOpportunities: [],
    competitorAsins: [],
    hasCompetitorAsinData: false,
    sourceView: 'ops_amazon.sp_ba_search_query_by_week_v1_view',
  };

  const focusSet = new Set(focusKeywords.map(k => k.toLowerCase()));

  try {
    // ---------------------------------------------------------------
    // Query 1: Per-keyword weekly share data (last 12 weeks)
    // Focus keywords always included; also include other high-activity keywords
    // ---------------------------------------------------------------
    const focusList = focusKeywords.map(k => `'${k.replace(/'/g, "''").toLowerCase()}'`).join(',');

    const keywordWeeklyQuery = `
      WITH qualifying_keywords AS (
        -- Always include user's focus keywords
        SELECT DISTINCT LOWER(search_query_data_search_query) AS kw
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
          AND end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 84 DAY)
          AND LOWER(search_query_data_search_query) IN (${focusList})
        UNION DISTINCT
        -- Also include other keywords where we have meaningful activity
        SELECT DISTINCT LOWER(search_query_data_search_query) AS kw
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
          AND end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 84 DAY)
          AND (click_data_asin_click_count >= 10 OR purchase_data_asin_purchase_count >= 3)
      )
      SELECT
        LOWER(ba.search_query_data_search_query) AS search_query,
        ba.end_date,
        MAX(ba.search_query_data_search_query_volume) AS search_query_volume,
        SUM(ba.impression_data_asin_impression_share) AS impression_share,
        SUM(ba.click_data_asin_click_share) AS click_share,
        SUM(ba.purchase_data_asin_purchase_share) AS purchase_share,
        SUM(ba.impression_data_asin_impression_count) AS impression_count,
        SUM(ba.click_data_asin_click_count) AS click_count,
        SUM(ba.purchase_data_asin_purchase_count) AS purchase_count
      FROM ${BA_TABLE} ba
      INNER JOIN qualifying_keywords qk
        ON LOWER(ba.search_query_data_search_query) = qk.kw
      WHERE ba.ob_seller_id = '${SELLER_ID}'
        AND ba.end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 84 DAY)
      GROUP BY LOWER(ba.search_query_data_search_query), ba.end_date
      ORDER BY search_query ASC, end_date ASC
      LIMIT 2000
    `;

    // ---------------------------------------------------------------
    // Query 2: Top 3 clicked ASINs per focus keyword (latest week)
    // Uses the Brand Analytics "Top Search Terms" report which has
    // the top 3 clicked ASINs for EVERY search term — including competitors.
    // Table: sp_ba_search_terms_by_week_v2_view
    // Columns: search_term, clicked_asin, clicked_item_name,
    //          click_share_rank, click_share, conversion_share
    // ---------------------------------------------------------------
    const topPositionsQuery = `
      WITH latest_week AS (
        SELECT MAX(ob_date) AS max_date
        FROM ${TOP_SEARCH_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
      ),
      our_asins AS (
        SELECT DISTINCT asin
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
      )
      SELECT
        LOWER(st.search_term) AS search_query,
        st.clicked_asin AS asin,
        st.clicked_item_name AS product_name,
        st.click_share_rank AS position_rank,
        st.click_share,
        st.conversion_share,
        CASE WHEN oa.asin IS NOT NULL THEN TRUE ELSE FALSE END AS is_ours
      FROM ${TOP_SEARCH_TABLE} st
      CROSS JOIN latest_week lw
      LEFT JOIN our_asins oa ON st.clicked_asin = oa.asin
      WHERE st.ob_seller_id = '${SELLER_ID}'
        AND st.ob_date = lw.max_date
        AND LOWER(st.search_term) IN (${focusList})
      ORDER BY LOWER(st.search_term), st.click_share_rank ASC
    `;

    // ---------------------------------------------------------------
    // Query 3: Competitor ASIN discovery (broader — across all keywords)
    // ---------------------------------------------------------------
    const competitorAsinQuery = `
      WITH our_keywords AS (
        SELECT DISTINCT LOWER(search_query_data_search_query) AS kw
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
          AND end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
          AND (click_data_asin_click_count >= 10 OR purchase_data_asin_purchase_count >= 3)
      ),
      our_asins AS (
        SELECT DISTINCT asin
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
      )
      SELECT
        ba.asin,
        LOWER(ba.search_query_data_search_query) AS search_query,
        SUM(ba.click_data_asin_click_share) AS click_share,
        SUM(ba.purchase_data_asin_purchase_share) AS purchase_share,
        SUM(ba.click_data_asin_click_count) AS clicks
      FROM ${BA_TABLE} ba
      INNER JOIN our_keywords ok ON LOWER(ba.search_query_data_search_query) = ok.kw
      WHERE ba.asin NOT IN (SELECT asin FROM our_asins)
        AND ba.end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      GROUP BY ba.asin, LOWER(ba.search_query_data_search_query)
      HAVING SUM(ba.click_data_asin_click_count) >= 3
      ORDER BY clicks DESC
      LIMIT 50
    `;

    // Run all queries in parallel
    const [keywordRows, topPosRows, competitorAsinRows] = await Promise.all([
      queryBigQuery<any>(keywordWeeklyQuery),
      queryBigQuery<any>(topPositionsQuery).catch((err) => {
        console.error('[Competitors] Top positions query failed:', err);
        return [] as any[];
      }),
      queryBigQuery<any>(competitorAsinQuery).catch((err) => {
        console.error('[Competitors] Competitor ASIN query failed:', err);
        return [] as any[];
      }),
    ]);

    console.log(`[Competitors] Query 1: ${keywordRows.length} rows, Query 2: ${topPosRows.length} rows, Query 3: ${competitorAsinRows.length} rows`);

    if (keywordRows.length === 0) {
      return emptyResult;
    }

    // ---------------------------------------------------------------
    // Query 4: Product names for all ASINs in top positions + competitors
    // ---------------------------------------------------------------
    const allAsins = new Set<string>();
    for (const r of topPosRows) { if (r.asin) allAsins.add(r.asin); }
    for (const r of competitorAsinRows) { if (r.asin) allAsins.add(r.asin); }

    let productNameMap = new Map<string, string>();
    if (allAsins.size > 0) {
      try {
        const asinList = Array.from(allAsins).map(a => `'${a}'`).join(',');
        const nameQuery = `
          SELECT DISTINCT asin, product_name
          FROM ${INV_TABLE}
          WHERE asin IN (${asinList}) AND product_name IS NOT NULL
          LIMIT 100
        `;
        const nameRows = await queryBigQuery<any>(nameQuery);
        for (const row of nameRows) {
          if (row.asin && row.product_name) {
            productNameMap.set(row.asin, row.product_name);
          }
        }
      } catch (err) {
        console.error('[Competitors] Product name lookup failed:', err);
      }
    }

    // ---------------------------------------------------------------
    // Process top positions per keyword
    // ---------------------------------------------------------------
    const topPositionsMap = new Map<string, TopCompetitorPosition[]>();
    for (const r of topPosRows) {
      const kw = (r.search_query || '').toLowerCase();
      if (!topPositionsMap.has(kw)) topPositionsMap.set(kw, []);
      topPositionsMap.get(kw)!.push({
        rank: toNumber(r.position_rank),
        asin: r.asin || '',
        productName: r.product_name || productNameMap.get(r.asin) || r.asin || '',
        clickShare: toNumber(r.click_share) / 100,
        purchaseShare: toNumber(r.conversion_share) / 100,
        isOurs: r.is_ours === true || r.is_ours === 'true',
      });
    }

    // ---------------------------------------------------------------
    // Process Query 1: Group by keyword, build CompetitiveKeyword[]
    // ---------------------------------------------------------------
    const keywordMap = new Map<string, any[]>();
    for (const row of keywordRows) {
      const kw = (row.search_query || '').toLowerCase();
      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw)!.push(row);
    }

    const allWeekDates = new Set<string>();
    const weekShareAccumulators = new Map<string, { impressionSum: number; clickSum: number; purchaseSum: number; count: number }>();
    const competitiveKeywords: CompetitiveKeyword[] = [];

    for (const [keyword, rows] of keywordMap) {
      rows.sort((a: any, b: any) => toDateString(a.end_date).localeCompare(toDateString(b.end_date)));

      const weeklyHistory: KeywordMarketShare[] = rows.map((r: any) => {
        const impShare = toNumber(r.impression_share) / 100;
        const clkShare = toNumber(r.click_share) / 100;
        const purShare = toNumber(r.purchase_share) / 100;
        const weekDate = toDateString(r.end_date);

        allWeekDates.add(weekDate);

        if (!weekShareAccumulators.has(weekDate)) {
          weekShareAccumulators.set(weekDate, { impressionSum: 0, clickSum: 0, purchaseSum: 0, count: 0 });
        }
        const acc = weekShareAccumulators.get(weekDate)!;
        acc.impressionSum += impShare;
        acc.clickSum += clkShare;
        acc.purchaseSum += purShare;
        acc.count += 1;

        return {
          keyword,
          weekEnding: weekDate,
          searchVolume: toNumber(r.search_query_volume),
          ourImpressionShare: impShare,
          ourClickShare: clkShare,
          ourPurchaseShare: purShare,
          competitorImpressionShare: Math.max(0, 1 - impShare),
          competitorClickShare: Math.max(0, 1 - clkShare),
          competitorPurchaseShare: Math.max(0, 1 - purShare),
          ourConversionEdge: clkShare > 0 ? purShare / clkShare : 0,
        };
      });

      const latest = weeklyHistory[weeklyHistory.length - 1];
      const previousWeek = weeklyHistory.length >= 2 ? weeklyHistory[weeklyHistory.length - 2] : null;

      const clickShareChange = previousWeek ? latest.ourClickShare - previousWeek.ourClickShare : 0;
      const purchaseShareChange = previousWeek ? latest.ourPurchaseShare - previousWeek.ourPurchaseShare : 0;
      const impressionShareChange = previousWeek ? latest.ourImpressionShare - previousWeek.ourImpressionShare : 0;

      let trend: 'gaining' | 'losing' | 'stable' = 'stable';
      if (weeklyHistory.length >= 6) {
        const recent3 = weeklyHistory.slice(-3);
        const prior3 = weeklyHistory.slice(-6, -3);
        const recentAvg = recent3.reduce((s, w) => s + w.ourClickShare, 0) / recent3.length;
        const priorAvg = prior3.reduce((s, w) => s + w.ourClickShare, 0) / prior3.length;
        const delta = recentAvg - priorAvg;
        if (delta > 0.005) trend = 'gaining';
        else if (delta < -0.005) trend = 'losing';
      }

      const opportunityScore = latest.searchVolume * (1 - latest.ourClickShare);

      let pressureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (clickShareChange < -0.03 && latest.searchVolume > 1000) pressureLevel = 'critical';
      else if (clickShareChange < -0.01 && latest.searchVolume > 1000) pressureLevel = 'high';
      else if (clickShareChange < -0.005) pressureLevel = 'medium';

      const conversionEdge = latest.ourClickShare > 0 ? latest.ourPurchaseShare / latest.ourClickShare : 0;

      competitiveKeywords.push({
        keyword,
        searchVolume: latest.searchVolume,
        ourClickShare: latest.ourClickShare,
        ourPurchaseShare: latest.ourPurchaseShare,
        ourImpressionShare: latest.ourImpressionShare,
        clickShareChange,
        purchaseShareChange,
        impressionShareChange,
        trend,
        conversionEdge,
        opportunityScore,
        pressureLevel,
        weeklyHistory,
        isFocusKeyword: focusSet.has(keyword),
        topPositions: topPositionsMap.get(keyword) || [],
      });
    }

    // Sort: focus keywords first (sorted by purchases desc), then others by purchases desc
    competitiveKeywords.sort((a, b) => {
      if (a.isFocusKeyword && !b.isFocusKeyword) return -1;
      if (!a.isFocusKeyword && b.isFocusKeyword) return 1;
      return b.ourPurchaseShare - a.ourPurchaseShare || b.searchVolume - a.searchVolume;
    });

    // ---------------------------------------------------------------
    // Build SOV trend (focus keywords only for cleaner signal)
    // ---------------------------------------------------------------
    const focusKeywordSet = new Set(competitiveKeywords.filter(k => k.isFocusKeyword).map(k => k.keyword));
    const focusWeekAccumulators = new Map<string, { impressionSum: number; clickSum: number; purchaseSum: number; count: number }>();

    for (const kw of competitiveKeywords) {
      if (!kw.isFocusKeyword) continue;
      for (const w of kw.weeklyHistory) {
        if (!focusWeekAccumulators.has(w.weekEnding)) {
          focusWeekAccumulators.set(w.weekEnding, { impressionSum: 0, clickSum: 0, purchaseSum: 0, count: 0 });
        }
        const acc = focusWeekAccumulators.get(w.weekEnding)!;
        acc.impressionSum += w.ourImpressionShare;
        acc.clickSum += w.ourClickShare;
        acc.purchaseSum += w.ourPurchaseShare;
        acc.count += 1;
      }
    }

    const sortedWeeks = Array.from(allWeekDates).sort();
    const sovTrend: ShareOfVoice[] = sortedWeeks
      .filter(w => focusWeekAccumulators.has(w))
      .map(weekEnding => {
        const acc = focusWeekAccumulators.get(weekEnding)!;
        return {
          weekEnding,
          avgImpressionShare: acc.count > 0 ? acc.impressionSum / acc.count : 0,
          avgClickShare: acc.count > 0 ? acc.clickSum / acc.count : 0,
          avgPurchaseShare: acc.count > 0 ? acc.purchaseSum / acc.count : 0,
          keywordCount: acc.count,
        };
      });

    const latestSOV = sovTrend.length > 0 ? sovTrend[sovTrend.length - 1] : null;
    const currentSOV = {
      impressionShare: latestSOV?.avgImpressionShare ?? 0,
      clickShare: latestSOV?.avgClickShare ?? 0,
      purchaseShare: latestSOV?.avgPurchaseShare ?? 0,
    };

    // ---------------------------------------------------------------
    // Counts
    // ---------------------------------------------------------------
    const focusKeywords_ = competitiveKeywords.filter(k => k.isFocusKeyword);
    const gainingCount = focusKeywords_.filter(k => k.trend === 'gaining').length;
    const losingCount = focusKeywords_.filter(k => k.trend === 'losing').length;
    const stableCount = focusKeywords_.filter(k => k.trend === 'stable').length;
    const highPressureKeywords = competitiveKeywords
      .filter(k => k.pressureLevel === 'critical' || k.pressureLevel === 'high')
      .map(k => k.keyword);

    // Top opportunities: focus keywords with highest opportunity score
    const topOpportunities = [...focusKeywords_]
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);

    // ---------------------------------------------------------------
    // Process competitor ASINs
    // ---------------------------------------------------------------
    const competitorAsins: CompetitorAsin[] = [];
    const hasCompetitorAsinData = competitorAsinRows.length > 0;

    if (hasCompetitorAsinData) {
      const asinMap = new Map<string, { keywords: string[]; clickShareSum: number; purchaseShareSum: number; count: number }>();
      for (const row of competitorAsinRows) {
        const asin = row.asin;
        if (!asinMap.has(asin)) asinMap.set(asin, { keywords: [], clickShareSum: 0, purchaseShareSum: 0, count: 0 });
        const entry = asinMap.get(asin)!;
        entry.keywords.push(row.search_query);
        entry.clickShareSum += toNumber(row.click_share) / 100;
        entry.purchaseShareSum += toNumber(row.purchase_share) / 100;
        entry.count += 1;
      }

      for (const [asin, data] of asinMap) {
        competitorAsins.push({
          asin,
          productName: productNameMap.get(asin) || asin,
          keywordOverlap: data.keywords.length,
          avgClickShare: data.count > 0 ? data.clickShareSum / data.count : 0,
          avgPurchaseShare: data.count > 0 ? data.purchaseShareSum / data.count : 0,
          trend: 'stable',
          topKeywords: data.keywords.slice(0, 5),
        });
      }
      competitorAsins.sort((a, b) => b.keywordOverlap - a.keywordOverlap);
    }

    // ---------------------------------------------------------------
    // Headline
    // ---------------------------------------------------------------
    const weekLabel = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : '';
    const focusCount = focusKeywords_.length;
    const clickSharePct = (currentSOV.clickShare * 100).toFixed(1);
    let headlineTrendNote = '';
    if (sovTrend.length >= 2) {
      const prevSOV = sovTrend[sovTrend.length - 2];
      const sovDelta = currentSOV.clickShare - prevSOV.avgClickShare;
      if (sovDelta > 0.005) headlineTrendNote = `, up ${(sovDelta * 100).toFixed(1)}pts WoW`;
      else if (sovDelta < -0.005) headlineTrendNote = `, down ${(Math.abs(sovDelta) * 100).toFixed(1)}pts WoW`;
      else headlineTrendNote = ', stable WoW';
    }
    const headline = `Average click share ${clickSharePct}% across ${focusCount} focus keywords${headlineTrendNote}`;

    return {
      headline,
      weekLabel,
      totalTrackedKeywords: competitiveKeywords.length,
      keywordsWithData: competitiveKeywords.filter(k => k.weeklyHistory.length > 0).length,
      currentSOV,
      sovTrend,
      keywords: competitiveKeywords,
      gainingCount,
      losingCount,
      stableCount,
      highPressureKeywords,
      topOpportunities,
      competitorAsins,
      hasCompetitorAsinData,
      sourceView: 'ops_amazon.sp_ba_search_query_by_week_v1_view',
    };
  } catch (error) {
    console.error('[Competitors] fetchCompetitorIntelligence failed:', error);
    return emptyResult;
  }
}
