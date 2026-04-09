/**
 * Server-only fetch functions for Keyword Tracker.
 *
 * Pulls per-keyword weekly metrics from Brand Analytics
 * (sp_ba_search_query_by_week_v1_view) and search catalog
 * (sp_ba_search_catalog_by_week_v1_view).
 *
 * The BA search_query table has per-ASIN rows for each (keyword, week).
 * We aggregate across all our ASINs to get brand-level share per keyword.
 *
 * Brand Analytics stores share values as percentages (20.94 = 20.94%),
 * so we divide by 100 to get decimals.
 */
import { queryBigQuery } from './bigquery';
import type { KeywordTrackerData, TrackedKeyword, KeywordWeekData } from './renuv-keyword-tracker';

const SELLER_ID = 'A2CWSK2O443P17';

/**
 * Default tracked keywords for Renuv.
 * This is the seed list — the UI lets the user add/remove keywords
 * which are persisted in localStorage on the client.
 */
export const DEFAULT_TRACKED_KEYWORDS: string[] = [
  'nasal irrigation',
  'nasal rinse',
  'neti pot',
  'sinus rinse',
  'nasal wash',
  'renuv',
  'sinus irrigation',
  'saline nasal rinse',
  'neti pot salt',
  'nose rinse',
];

/**
 * Fetch keyword tracker data for a list of keywords.
 * Returns weekly breakdown of search volume, impressions, clicks,
 * cart adds, purchases — total + brand + brand share.
 */
export async function fetchKeywordTrackerData(
  keywords: string[]
): Promise<KeywordTrackerData> {
  if (keywords.length === 0) {
    return {
      keywords: [],
      trackedKeywordList: [],
      weekCount: 0,
      latestWeekEnding: '',
      sourceView: 'ops_amazon.sp_ba_search_query_by_week_v1_view',
    };
  }

  // Escape keywords for SQL
  const keywordList = keywords.map(k => `'${k.replace(/'/g, "\\'").toLowerCase()}'`).join(',');

  // Query 1: Our brand's per-keyword weekly data from BA search query view.
  // This gives us brand-level counts and shares per keyword per week.
  // We aggregate across all our ASINs for the brand-level numbers.
  const brandDataSql = `
    WITH recent_weeks AS (
      SELECT DISTINCT end_date
      FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
      WHERE ob_seller_id = '${SELLER_ID}'
      ORDER BY end_date DESC
      LIMIT 20
    )
    SELECT
      LOWER(search_query_data_search_query) AS search_query,
      CAST(end_date AS STRING) AS week_ending,
      MAX(search_query_data_search_query_volume) AS search_volume,
      -- Brand totals (sum across our ASINs)
      SUM(impression_data_asin_impression_count) AS impression_brand,
      SUM(click_data_asin_click_count) AS click_brand,
      SUM(purchase_data_asin_purchase_count) AS purchase_brand,
      SUM(cart_add_to_cart_data_asin_add_to_cart_count) AS cart_add_brand,
      -- Brand shares (sum across our ASINs — BA gives per-ASIN share)
      SUM(impression_data_asin_impression_share) AS impression_brand_share,
      SUM(click_data_asin_click_share) AS click_brand_share,
      SUM(purchase_data_asin_purchase_share) AS purchase_brand_share,
      SUM(cart_add_to_cart_data_asin_add_to_cart_share) AS cart_add_brand_share
    FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
    WHERE ob_seller_id = '${SELLER_ID}'
      AND end_date IN (SELECT end_date FROM recent_weeks)
      AND LOWER(search_query_data_search_query) IN (${keywordList})
    GROUP BY search_query, end_date
    ORDER BY search_query, end_date ASC
  `;

  // Query 2: Total market counts per keyword per week.
  // We need total impressions/clicks/purchases/cart-adds for the entire market (all sellers)
  // to compute total counts. BA only gives us our own counts + shares.
  // Total = our_count / (our_share / 100) when share > 0, otherwise we estimate from search volume.
  // This is handled in processing below.

  try {
    const rows = await queryBigQuery<any>(brandDataSql);

    // Group by keyword
    const keywordMap = new Map<string, KeywordWeekData[]>();

    for (const r of rows) {
      const kw = (r.search_query || '').toLowerCase();
      const weekEnding = r.week_ending?.value || r.week_ending || '';
      const searchVolume = Number(r.search_volume || 0);

      // Brand counts
      const impressionBrand = Number(r.impression_brand || 0);
      const clickBrand = Number(r.click_brand || 0);
      const purchaseBrand = Number(r.purchase_brand || 0);
      const cartAddBrand = Number(r.cart_add_brand || 0);

      // Brand shares (divide by 100 — BA stores as percentages)
      const impressionBrandShare = Number(r.impression_brand_share || 0) / 100;
      const clickBrandShare = Number(r.click_brand_share || 0) / 100;
      const purchaseBrandShare = Number(r.purchase_brand_share || 0) / 100;
      const cartAddBrandShare = Number(r.cart_add_brand_share || 0) / 100;

      // Estimate total market counts from our counts + shares
      // Total = brand_count / brand_share (when share > 0)
      const impressionTotal = impressionBrandShare > 0
        ? Math.round(impressionBrand / impressionBrandShare) : 0;
      const clickTotal = clickBrandShare > 0
        ? Math.round(clickBrand / clickBrandShare) : 0;
      const purchaseTotal = purchaseBrandShare > 0
        ? Math.round(purchaseBrand / purchaseBrandShare) : 0;
      const cartAddTotal = cartAddBrandShare > 0
        ? Math.round(cartAddBrand / cartAddBrandShare) : 0;

      // CTR = clicks / impressions
      const ctrTotal = impressionTotal > 0 ? clickTotal / impressionTotal : 0;
      const ctrBrand = impressionBrand > 0 ? clickBrand / impressionBrand : 0;

      // Conversion = purchases / clicks
      const conversionTotal = clickTotal > 0 ? purchaseTotal / clickTotal : 0;
      const conversionBrand = clickBrand > 0 ? purchaseBrand / clickBrand : 0;

      const weekData: KeywordWeekData = {
        weekEnding,
        searchVolume,
        impressionTotal,
        impressionBrand,
        impressionBrandShare,
        clickTotal,
        clickBrand,
        clickBrandShare,
        ctrTotal,
        ctrBrand,
        cartAddTotal,
        cartAddBrand,
        cartAddBrandShare,
        purchaseTotal,
        purchaseBrand,
        purchaseBrandShare,
        conversionTotal,
        conversionBrand,
      };

      if (!keywordMap.has(kw)) keywordMap.set(kw, []);
      keywordMap.get(kw)!.push(weekData);
    }

    // Build TrackedKeyword objects
    const trackedKeywords: TrackedKeyword[] = keywords.map(kw => {
      const weeks = keywordMap.get(kw.toLowerCase()) || [];
      // Sort oldest first
      weeks.sort((a, b) => a.weekEnding.localeCompare(b.weekEnding));

      const latestWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;
      const priorWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;

      // Week-over-week changes
      const wow = {
        searchVolumeChange: latestWeek && priorWeek && priorWeek.searchVolume > 0
          ? (latestWeek.searchVolume - priorWeek.searchVolume) / priorWeek.searchVolume : 0,
        impressionShareChange: latestWeek && priorWeek
          ? latestWeek.impressionBrandShare - priorWeek.impressionBrandShare : 0,
        clickShareChange: latestWeek && priorWeek
          ? latestWeek.clickBrandShare - priorWeek.clickBrandShare : 0,
        purchaseShareChange: latestWeek && priorWeek
          ? latestWeek.purchaseBrandShare - priorWeek.purchaseBrandShare : 0,
        conversionBrandChange: latestWeek && priorWeek
          ? latestWeek.conversionBrand - priorWeek.conversionBrand : 0,
      };

      // Trend: compare last 3 weeks average brand click share to prior 3
      let trend: 'gaining' | 'losing' | 'stable' = 'stable';
      if (weeks.length >= 4) {
        const recent3 = weeks.slice(-3);
        const prior3 = weeks.slice(-6, -3);
        if (prior3.length > 0) {
          const recentAvg = recent3.reduce((s, w) => s + w.clickBrandShare, 0) / recent3.length;
          const priorAvg = prior3.reduce((s, w) => s + w.clickBrandShare, 0) / prior3.length;
          const diff = recentAvg - priorAvg;
          if (diff > 0.005) trend = 'gaining';
          else if (diff < -0.005) trend = 'losing';
        }
      }

      return { keyword: kw, latestWeek, wow, weeks, trend };
    });

    // Sort: keywords with data first, then by total purchases desc
    trackedKeywords.sort((a, b) => {
      if (!a.latestWeek && b.latestWeek) return 1;
      if (a.latestWeek && !b.latestWeek) return -1;
      const aPurch = a.latestWeek?.purchaseBrand || 0;
      const bPurch = b.latestWeek?.purchaseBrand || 0;
      return bPurch - aPurch;
    });

    const latestWeekEnding = trackedKeywords
      .filter(k => k.latestWeek)
      .map(k => k.latestWeek!.weekEnding)
      .sort()
      .pop() || '';

    return {
      keywords: trackedKeywords,
      trackedKeywordList: keywords,
      weekCount: Math.max(...trackedKeywords.map(k => k.weeks.length), 0),
      latestWeekEnding,
      sourceView: 'ops_amazon.sp_ba_search_query_by_week_v1_view',
    };
  } catch (error) {
    console.error('[fetchKeywordTrackerData] Error:', error);
    return {
      keywords: [],
      trackedKeywordList: keywords,
      weekCount: 0,
      latestWeekEnding: '',
      sourceView: 'ops_amazon.sp_ba_search_query_by_week_v1_view',
    };
  }
}
