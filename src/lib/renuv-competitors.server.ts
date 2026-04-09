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
} from './renuv-competitors';

const SELLER_ID = 'A2CWSK2O443P17';
const BA_TABLE = '`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view`';

/** Row shape from Query 1: per-keyword weekly share data */
type KeywordWeekRow = {
  search_query: string;
  end_date: { value: string } | string;
  search_query_volume: string | number;
  impression_share: string | number;
  click_share: string | number;
  purchase_share: string | number;
  impression_count: string | number;
  click_count: string | number;
  purchase_count: string | number;
};

/** Row shape from Query 2: competitor ASIN discovery */
type CompetitorAsinRow = {
  asin: string;
  search_query: string;
  click_share: string | number;
  purchase_share: string | number;
  clicks: string | number;
};

/** Row shape from Query 3: product name lookup */
type ProductNameRow = {
  asin: string;
  product_name: string;
};

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

export async function fetchCompetitorIntelligence(): Promise<CompetitorIntelligence> {
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

  try {
    // ---------------------------------------------------------------
    // Query 1: Per-keyword weekly share data (last 12 weeks)
    // ---------------------------------------------------------------
    const keywordWeeklyQuery = `
      WITH qualifying_keywords AS (
        SELECT DISTINCT LOWER(search_query_data_search_query) AS kw
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
          AND end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 84 DAY)
          AND (click_data_asin_click_count >= 5 OR purchase_data_asin_purchase_count >= 1)
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
    // Query 2: Competitor ASIN discovery
    // ---------------------------------------------------------------
    const competitorAsinQuery = `
      WITH our_keywords AS (
        SELECT DISTINCT LOWER(search_query_data_search_query) AS kw
        FROM ${BA_TABLE}
        WHERE ob_seller_id = '${SELLER_ID}'
          AND end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
          AND (click_data_asin_click_count >= 5 OR purchase_data_asin_purchase_count >= 1)
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

    // Run Query 1 and Query 2 in parallel
    const [keywordRows, competitorAsinRows] = await Promise.all([
      queryBigQuery<KeywordWeekRow>(keywordWeeklyQuery),
      queryBigQuery<CompetitorAsinRow>(competitorAsinQuery).catch((err) => {
        console.error('[Competitors] Competitor ASIN query failed:', err);
        return [] as CompetitorAsinRow[];
      }),
    ]);

    if (keywordRows.length === 0) {
      return emptyResult;
    }

    // ---------------------------------------------------------------
    // Query 3: Product names for competitor ASINs (if found)
    // ---------------------------------------------------------------
    let hasCompetitorAsinData = competitorAsinRows.length > 0;
    const competitorAsinSet = new Set(competitorAsinRows.map((r) => r.asin));
    let productNameMap = new Map<string, string>();

    if (hasCompetitorAsinData) {
      try {
        const asinList = Array.from(competitorAsinSet)
          .map((a) => `'${a}'`)
          .join(',');
        const productNameQuery = `
          SELECT DISTINCT
            asin,
            product_name
          FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
          WHERE asin IN (${asinList})
            AND item_name IS NOT NULL
          LIMIT 50
        `;
        const nameRows = await queryBigQuery<ProductNameRow>(productNameQuery);
        for (const row of nameRows) {
          if (row.asin && row.product_name) {
            productNameMap.set(row.asin, row.product_name);
          }
        }
      } catch (err) {
        console.error('[Competitors] Product name lookup failed:', err);
        // Non-fatal: we just won't have product names
      }
    }

    // ---------------------------------------------------------------
    // Process Query 1: Group by keyword, build CompetitiveKeyword[]
    // ---------------------------------------------------------------
    const keywordMap = new Map<string, KeywordWeekRow[]>();
    for (const row of keywordRows) {
      const kw = row.search_query;
      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw)!.push(row);
    }

    const allWeekDates = new Set<string>();
    const weekShareAccumulators = new Map<
      string,
      { impressionSum: number; clickSum: number; purchaseSum: number; count: number }
    >();

    const competitiveKeywords: CompetitiveKeyword[] = [];

    for (const [keyword, rows] of keywordMap) {
      // Sort rows by date ascending (should already be, but ensure)
      rows.sort((a, b) => toDateString(a.end_date).localeCompare(toDateString(b.end_date)));

      const weeklyHistory: KeywordMarketShare[] = rows.map((r) => {
        const impShare = toNumber(r.impression_share) / 100;
        const clkShare = toNumber(r.click_share) / 100;
        const purShare = toNumber(r.purchase_share) / 100;
        const weekDate = toDateString(r.end_date);

        allWeekDates.add(weekDate);

        // Accumulate for SOV trend
        if (!weekShareAccumulators.has(weekDate)) {
          weekShareAccumulators.set(weekDate, {
            impressionSum: 0,
            clickSum: 0,
            purchaseSum: 0,
            count: 0,
          });
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

      // Click share WoW change
      const clickShareChange = previousWeek
        ? latest.ourClickShare - previousWeek.ourClickShare
        : 0;
      const purchaseShareChange = previousWeek
        ? latest.ourPurchaseShare - previousWeek.ourPurchaseShare
        : 0;
      const impressionShareChange = previousWeek
        ? latest.ourImpressionShare - previousWeek.ourImpressionShare
        : 0;

      // Trend: compare last 3 weeks avg vs prior 3 weeks avg
      let trend: 'gaining' | 'losing' | 'stable' = 'stable';
      if (weeklyHistory.length >= 6) {
        const recent3 = weeklyHistory.slice(-3);
        const prior3 = weeklyHistory.slice(-6, -3);
        const recentAvg =
          recent3.reduce((s, w) => s + w.ourClickShare, 0) / recent3.length;
        const priorAvg =
          prior3.reduce((s, w) => s + w.ourClickShare, 0) / prior3.length;
        const delta = recentAvg - priorAvg;
        if (delta > 0.005) trend = 'gaining';
        else if (delta < -0.005) trend = 'losing';
      }

      // Opportunity score: high volume with low share = big opportunity
      const opportunityScore = latest.searchVolume * (1 - latest.ourClickShare);

      // Pressure level
      let pressureLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (clickShareChange < -0.03 && latest.searchVolume > 1000) {
        pressureLevel = 'critical';
      } else if (clickShareChange < -0.01 && latest.searchVolume > 1000) {
        pressureLevel = 'high';
      } else if (clickShareChange < -0.01) {
        pressureLevel = 'medium';
      } else if (clickShareChange < 0) {
        pressureLevel = 'medium';
      }

      // Conversion edge: >1 means we convert better than the field
      const conversionEdge = latest.ourClickShare > 0
        ? latest.ourPurchaseShare / latest.ourClickShare
        : 0;

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
      });
    }

    // ---------------------------------------------------------------
    // Build SOV trend: average shares across all keywords per week
    // ---------------------------------------------------------------
    const sortedWeeks = Array.from(allWeekDates).sort();
    const sovTrend: ShareOfVoice[] = sortedWeeks.map((weekEnding) => {
      const acc = weekShareAccumulators.get(weekEnding)!;
      return {
        weekEnding,
        avgImpressionShare: acc.count > 0 ? acc.impressionSum / acc.count : 0,
        avgClickShare: acc.count > 0 ? acc.clickSum / acc.count : 0,
        avgPurchaseShare: acc.count > 0 ? acc.purchaseSum / acc.count : 0,
        keywordCount: acc.count,
      };
    });

    // Current SOV = latest week
    const latestSOV = sovTrend.length > 0 ? sovTrend[sovTrend.length - 1] : null;
    const currentSOV = {
      impressionShare: latestSOV?.avgImpressionShare ?? 0,
      clickShare: latestSOV?.avgClickShare ?? 0,
      purchaseShare: latestSOV?.avgPurchaseShare ?? 0,
    };

    // ---------------------------------------------------------------
    // Counts and summaries
    // ---------------------------------------------------------------
    const gainingCount = competitiveKeywords.filter((k) => k.trend === 'gaining').length;
    const losingCount = competitiveKeywords.filter((k) => k.trend === 'losing').length;
    const stableCount = competitiveKeywords.filter((k) => k.trend === 'stable').length;
    const highPressureKeywords = competitiveKeywords
      .filter((k) => k.pressureLevel === 'critical' || k.pressureLevel === 'high')
      .map((k) => k.keyword);

    // Top opportunities: highest opportunityScore
    const topOpportunities = [...competitiveKeywords]
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10);

    // ---------------------------------------------------------------
    // Process competitor ASINs (Query 2 results)
    // ---------------------------------------------------------------
    const competitorAsins: CompetitorAsin[] = [];
    if (hasCompetitorAsinData) {
      // Group by ASIN
      const asinMap = new Map<
        string,
        { keywords: string[]; clickShareSum: number; purchaseShareSum: number; count: number }
      >();

      for (const row of competitorAsinRows) {
        const asin = row.asin;
        if (!asinMap.has(asin)) {
          asinMap.set(asin, { keywords: [], clickShareSum: 0, purchaseShareSum: 0, count: 0 });
        }
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
          trend: 'stable', // Would need historical data per competitor ASIN to compute
          topKeywords: data.keywords.slice(0, 5),
        });
      }

      // Sort by keyword overlap descending
      competitorAsins.sort((a, b) => b.keywordOverlap - a.keywordOverlap);
    }

    // ---------------------------------------------------------------
    // Build headline
    // ---------------------------------------------------------------
    const weekLabel = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1] : '';
    const clickSharePct = (currentSOV.clickShare * 100).toFixed(1);
    let headlineTrendNote = '';
    if (sovTrend.length >= 2) {
      const prevSOV = sovTrend[sovTrend.length - 2];
      const sovDelta = currentSOV.clickShare - prevSOV.avgClickShare;
      if (sovDelta > 0.005) {
        headlineTrendNote = `, up ${(sovDelta * 100).toFixed(1)}pts WoW`;
      } else if (sovDelta < -0.005) {
        headlineTrendNote = `, down ${(Math.abs(sovDelta) * 100).toFixed(1)}pts WoW`;
      } else {
        headlineTrendNote = ', stable WoW';
      }
    }
    const headline = `Average click share ${clickSharePct}% across ${competitiveKeywords.length} keywords${headlineTrendNote}`;

    return {
      headline,
      weekLabel,
      totalTrackedKeywords: competitiveKeywords.length,
      keywordsWithData: competitiveKeywords.filter((k) => k.weeklyHistory.length > 0).length,
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
