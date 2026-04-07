/**
 * Server-only fetch functions for search data
 */
import { queryBigQuery, formatCurrency } from './bigquery';
import { SearchSnapshot, Diagnostic, PositionTracking, CategoryRank } from './renuv-search';
import { sanitizeDateParam } from './date-utils';

/**
 * Fetch search diagnostics from BigQuery
 */
async function fetchSearchDiagnostics(sd?: string, ed?: string): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const dateFrom = sd || new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  const dateTo = ed || new Date().toISOString().split('T')[0];
  // Midpoint for splitting the range into two halves (rising terms comparison)
  const midMs = (new Date(dateFrom + 'T00:00:00').getTime() + new Date(dateTo + 'T00:00:00').getTime()) / 2;
  const midDate = new Date(midMs).toISOString().split('T')[0];

  try {
    // 1. High-waste terms: spend > $50 with zero attributed_orders
    const wasteTermsSql = `
      WITH recent_terms AS (
        SELECT
          search_term,
          SUM(cost) AS total_spend,
          SUM(purchases14d) AS total_orders
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
        GROUP BY search_term
      ),
      waste AS (
        SELECT * FROM recent_terms WHERE total_spend > 50 AND total_orders = 0
      )
      SELECT COUNT(*) AS waste_term_count, SUM(total_spend) AS waste_spend
      FROM waste
    `;
    const wasteRows = await queryBigQuery<any>(wasteTermsSql);
    if (wasteRows.length > 0 && wasteRows[0].waste_term_count > 0) {
      diagnostics.push({
        title: `${wasteRows[0].waste_term_count} high-waste search terms detected`,
        severity: 'warning',
        detail: `Found ${wasteRows[0].waste_term_count} search terms with spend >$50 and zero orders in the selected period, totaling ${formatCurrency(wasteRows[0].waste_spend || 0)} in wasted spend.`,
        actionBias: 'Review search term report and add negative keywords or reduce bids on non-converting high-spend terms.',
        sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view',
      });
    }

    // 2. Rising terms: compare second half of range vs first half
    const risingTermsSql = `
      WITH term_periods_raw AS (
        SELECT
          search_term,
          SUM(CASE WHEN DATE(date) >= '${midDate}' THEN impressions ELSE 0 END) AS recent_impressions,
          SUM(CASE WHEN DATE(date) < '${midDate}' THEN impressions ELSE 0 END) AS prior_impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
        ) WHERE rn = 1
        GROUP BY search_term
      ),
      term_periods AS (
        SELECT * FROM term_periods_raw WHERE prior_impressions > 0
      ),
      rising AS (
        SELECT
          search_term,
          recent_impressions,
          prior_impressions,
          SAFE_DIVIDE(recent_impressions, prior_impressions) AS growth_ratio
        FROM term_periods
        WHERE recent_impressions > prior_impressions * 1.5
      )
      SELECT COUNT(*) AS rising_count, STRING_AGG(search_term, ', ' LIMIT 5) AS sample_terms
      FROM rising
    `;
    const risingRows = await queryBigQuery<any>(risingTermsSql);
    if (risingRows.length > 0 && risingRows[0].rising_count > 0) {
      const risingDetailSql = `
        WITH term_periods AS (
          SELECT
            search_term,
            SUM(CASE WHEN DATE(date) >= DATE_SUB('${dateTo}', INTERVAL 6 DAY) THEN impressions ELSE 0 END) AS recent_impressions,
            SUM(CASE WHEN DATE(date) < DATE_SUB('${dateTo}', INTERVAL 6 DAY) THEN impressions ELSE 0 END) AS prior_impressions,
            SUM(clicks) AS clicks
          FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
            FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
            WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
          ) WHERE rn = 1
          GROUP BY search_term
        )
        SELECT
          search_term,
          recent_impressions,
          prior_impressions,
          clicks,
          SAFE_MULTIPLY(SAFE_DIVIDE(recent_impressions - prior_impressions, NULLIF(prior_impressions, 0)), 100) AS growth_pct
        FROM term_periods
        WHERE recent_impressions > prior_impressions * 1.5
        ORDER BY recent_impressions DESC
      `;
      const risingDetailRows = await queryBigQuery<any>(risingDetailSql);

      diagnostics.push({
        title: `${risingRows[0].rising_count} rising search terms showing strong momentum`,
        severity: 'positive',
        detail: `Identified ${risingRows[0].rising_count} terms with 50%+ impression growth in the recent half of the selected period.`,
        actionBias: 'Consider increasing bids or expanding match types on high-growth terms to capture additional volume.',
        sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view',
        items: risingDetailRows.map((row: any) => ({
          label: row.search_term,
          metric: `${Number(row.growth_pct || 0).toFixed(0)}% impression growth, ${Number(row.clicks || 0)} clicks`,
          recommendation: Number(row.clicks || 0) >= 15 ? 'Raise bid / expand match types' : 'Expand match types and monitor',
        })),
      });
    }

    // 3. Branded vs non-branded mix
    const brandMixSql = `
      SELECT
        (LOWER(search_term) LIKE '%renuv%' OR LOWER(search_term) LIKE '%renüv%') AS is_branded,
        SUM(cost) AS spend,
        SUM(sales14d) AS sales
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      GROUP BY is_branded
    `;
    const brandRows = await queryBigQuery<any>(brandMixSql);
    if (brandRows.length > 0) {
      const branded = brandRows.find((r: any) => r.is_branded) || { spend: 0, sales: 0 };
      const nonBranded = brandRows.find((r: any) => !r.is_branded) || { spend: 0, sales: 0 };
      const totalSpend = (branded.spend || 0) + (nonBranded.spend || 0);
      const brandedPct = totalSpend > 0 ? ((branded.spend / totalSpend) * 100) : 0;
      const nonBrandedPct = 100 - brandedPct;

      diagnostics.push({
        title: `Search spend mix: ${brandedPct.toFixed(0)}% branded, ${nonBrandedPct.toFixed(0)}% non-branded`,
        severity: brandedPct > 70 ? 'warning' : 'neutral',
        detail: `Branded terms account for ${formatCurrency(branded.spend || 0)} (${brandedPct.toFixed(1)}%) of total search spend, while non-branded terms account for ${formatCurrency(nonBranded.spend || 0)} (${nonBrandedPct.toFixed(1)}%).`,
        actionBias: brandedPct > 70 
          ? 'High branded spend may indicate defensive posture — consider expanding non-branded coverage for growth.'
          : 'Healthy balance between brand defense and category expansion.',
        sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view',
        items: [
          {
            label: 'Branded search terms',
            metric: `${brandedPct.toFixed(1)}% of spend | ${formatCurrency(branded.spend || 0)}`,
            recommendation: brandedPct > 70 ? 'Protect only the highest-value branded terms' : 'Maintain branded defense',
          },
          {
            label: 'Non-branded search terms',
            metric: `${nonBrandedPct.toFixed(1)}% of spend | ${formatCurrency(nonBranded.spend || 0)}`,
            recommendation: 'Expand the strongest category terms and cut waste',
          },
        ],
      });
    }

  } catch (error) {
    console.error('[fetchSearchDiagnostics] Error:', error);
    return [];
  }

  return diagnostics;
}

/**
 * Fetch Brand Analytics position tracking data
 * Uses sp_ba_search_query_by_week_v1_view for search query performance by ASIN
 */
async function fetchPositionTracking(): Promise<PositionTracking[]> {
  try {
    const positionSql = `
      WITH latest_week AS (
        SELECT MAX(end_date) AS max_week
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
        WHERE ob_seller_id = 'A2CWSK2O443P17'
      ),
      current_week AS (
        SELECT
          asin,
          search_query_data_search_query AS search_query,
          search_query_data_search_query_volume AS query_volume,
          impression_data_asin_impression_count AS impressions,
          impression_data_asin_impression_share AS impression_share,
          click_data_asin_click_count AS clicks,
          click_data_asin_click_share AS click_share,
          purchase_data_asin_purchase_count AS purchases,
          purchase_data_asin_purchase_share AS purchase_share,
          end_date
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
        CROSS JOIN latest_week
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND end_date = latest_week.max_week
      ),
      prior_week AS (
        SELECT
          asin,
          search_query_data_search_query AS search_query,
          impression_data_asin_impression_share AS prior_impression_share,
          click_data_asin_click_share AS prior_click_share,
          end_date
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_query_by_week_v1_view\`
        CROSS JOIN latest_week
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND end_date = DATE_SUB(latest_week.max_week, INTERVAL 7 DAY)
      ),
      top_queries_per_asin AS (
        SELECT
          c.asin,
          c.search_query,
          c.query_volume,
          c.impressions,
          c.impression_share,
          c.clicks,
          c.click_share,
          c.purchases,
          c.purchase_share,
          COALESCE(p.prior_impression_share, 0) AS prior_impression_share,
          COALESCE(p.prior_click_share, 0) AS prior_click_share,
          ROW_NUMBER() OVER (PARTITION BY c.asin ORDER BY c.impressions DESC) AS rn
        FROM current_week c
        LEFT JOIN prior_week p ON c.asin = p.asin AND c.search_query = p.search_query
      )
      SELECT
        asin,
        search_query,
        query_volume,
        impressions,
        impression_share,
        clicks,
        click_share,
        purchases,
        purchase_share,
        prior_impression_share,
        prior_click_share
      FROM top_queries_per_asin
      WHERE rn = 1
      ORDER BY impressions DESC
      LIMIT 10
    `;

    const rows = await queryBigQuery<any>(positionSql);
    if (rows.length === 0) {
      return [];
    }

    return rows.map((r: any) => {
      const impressionShareChange = (r.impression_share || 0) - (r.prior_impression_share || 0);
      const clickShareChange = (r.click_share || 0) - (r.prior_click_share || 0);
      const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
      
      let severity: 'positive' | 'neutral' | 'warning' | 'critical' = 'neutral';
      let diagnosis = 'Stable performance';
      
      if (impressionShareChange > 0.05) {
        severity = 'positive';
        diagnosis = 'Growing impression share — strong momentum';
      } else if (impressionShareChange < -0.05) {
        severity = 'warning';
        diagnosis = 'Declining impression share — monitor competitive pressure';
      } else if (ctr > 0.8) {
        severity = 'positive';
        diagnosis = 'High CTR indicates strong relevance';
      }

      return {
        asin: r.asin || '',
        title: r.asin || '',
        topQuery: r.search_query || '',
        queryVolume: `${Number(r.query_volume || 0).toLocaleString()} searches`,
        impressionShare: `${((r.impression_share || 0) * 100).toFixed(1)}%`,
        clickShare: `${((r.click_share || 0) * 100).toFixed(1)}%`,
        purchaseShare: `${((r.purchase_share || 0) * 100).toFixed(1)}%`,
        clickThroughRate: `${ctr.toFixed(2)}%`,
        diagnosis,
        severity,
      };
    });
  } catch (error) {
    console.error('[fetchPositionTracking] Error:', error);
    return [];
  }
}

/**
 * Fetch Brand Analytics category performance data
 * Uses sp_ba_search_catalog_by_week_v1_view for ASIN-level catalog metrics
 */
async function fetchCategoryPerformance(): Promise<CategoryRank[]> {
  try {
    const categorySql = `
      WITH latest_week AS (
        SELECT MAX(end_date) AS max_week
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_catalog_by_week_v1_view\`
        WHERE ob_seller_id = 'A2CWSK2O443P17'
      ),
      current_week AS (
        SELECT
          asin,
          impression_data_impression_count AS impressions,
          click_data_click_count AS clicks,
          click_data_click_rate AS click_rate,
          purchase_data_purchase_count AS purchases,
          purchase_data_conversion_rate AS conversion_rate,
          purchase_data_search_traffic_sales_amount AS sales,
          end_date
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_catalog_by_week_v1_view\`
        CROSS JOIN latest_week
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND end_date = latest_week.max_week
      ),
      prior_week AS (
        SELECT
          asin,
          impression_data_impression_count AS prior_impressions,
          purchase_data_conversion_rate AS prior_conversion_rate,
          end_date
        FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_ba_search_catalog_by_week_v1_view\`
        CROSS JOIN latest_week
        WHERE ob_seller_id = 'A2CWSK2O443P17'
          AND end_date = DATE_SUB(latest_week.max_week, INTERVAL 7 DAY)
      )
      SELECT
        c.asin,
        c.impressions,
        c.clicks,
        c.click_rate,
        c.purchases,
        c.conversion_rate,
        c.sales,
        COALESCE(p.prior_impressions, 0) AS prior_impressions,
        COALESCE(p.prior_conversion_rate, 0) AS prior_conversion_rate
      FROM current_week c
      LEFT JOIN prior_week p ON c.asin = p.asin
      ORDER BY c.sales DESC
      LIMIT 5
    `;

    const rows = await queryBigQuery<any>(categorySql);
    if (rows.length === 0) {
      return [];
    }

    return rows.map((r: any, idx: number) => {
      const impressionChange = r.prior_impressions > 0 
        ? ((r.impressions - r.prior_impressions) / r.prior_impressions) * 100
        : 0;
      const conversionChange = (r.conversion_rate || 0) - (r.prior_conversion_rate || 0);
      
      let tone: 'positive' | 'neutral' | 'warning' | 'critical' = 'neutral';
      if (impressionChange > 10 && conversionChange > 0) {
        tone = 'positive';
      } else if (impressionChange < -10 || conversionChange < -0.02) {
        tone = 'warning';
      }

      const trafficSharePct = idx === 0 ? 100 / rows.length : 100 / (rows.length * (idx + 1));

      return {
        category: r.asin || `Product ${idx + 1}`, // Using ASIN as category proxy
        currentRank: `#${idx + 1}`,
        rankChange: impressionChange > 0 ? `+${impressionChange.toFixed(0)}%` : `${impressionChange.toFixed(0)}%`,
        topCompetitors: 'Category benchmarks', // BA doesn't provide competitor names
        trafficShare: `${trafficSharePct.toFixed(1)}%`,
        tone,
      };
    });
  } catch (error) {
    console.error('[fetchCategoryPerformance] Error:', error);
    return [];
  }
}

export async function fetchSearchSnapshot(startDate?: string, endDate?: string): Promise<SearchSnapshot> {
  const sd = startDate ? sanitizeDateParam(startDate) : undefined;
  const ed = endDate ? sanitizeDateParam(endDate) : undefined;
  const dateFrom = sd || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const dateTo = ed || new Date().toISOString().split('T')[0];

  try {
    // Top paid search terms
    const termsSql = `
      SELECT
        search_term as search_query,
        (LOWER(search_term) LIKE '%renuv%' OR LOWER(search_term) LIKE '%renüv%') AS is_branded,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(purchases14d) AS orders,
        SUM(sales14d) AS sales,
        SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr,
        SAFE_DIVIDE(SUM(purchases14d), NULLIF(SUM(clicks), 0)) AS conversion_rate,
        SUM(cost) AS spend,
        SAFE_DIVIDE(SUM(cost), NULLIF(SUM(sales14d), 0)) AS acos
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      GROUP BY search_term, is_branded
      ORDER BY sales DESC
      LIMIT 10
    `;

    const termRows = await queryBigQuery<any>(termsSql);

    if (termRows.length === 0) {
      console.log('[fetchSearchSnapshot] No search term data available');
      return {
        brand: 'Renuv',
        periodLabel: 'No data available',
        summary: 'No search data available for the selected period.',
        kpis: [],
        topTerms: [],
        commentary: '',
        implications: [],
        nextSteps: [],
        topQueries: [],
        diagnostics: [],
        positionTracking: [],
        categoryRanks: [],
        freshness: []
      };
    }

    const topTerms = termRows.map((r: any) => ({
      term: r.search_query || '',
      impressions: r.impressions || 0,
      clicks: r.clicks || 0,
      orders: r.orders || 0,
      sales: r.sales || 0,
      ctr: (r.ctr || 0) * 100,
      conversionRate: (r.conversion_rate || 0) * 100,
      category: r.is_branded ? 'brand' as const : 'category' as const,
    }));

    // Aggregate KPIs: total paid search spend/sales/clicks split by branded/non-branded
    const kpiSql = `
      SELECT
        (LOWER(search_term) LIKE '%renuv%' OR LOWER(search_term) LIKE '%renüv%') AS is_branded,
        SUM(cost) AS spend,
        SUM(sales14d) AS sales,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        SUM(purchases14d) AS orders
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      GROUP BY is_branded
    `;
    const kpiRows = await queryBigQuery<any>(kpiSql);
    const branded = kpiRows.find((r: any) => r.is_branded) || {};
    const nonBranded = kpiRows.find((r: any) => !r.is_branded) || {};
    const totalSales = (branded.sales || 0) + (nonBranded.sales || 0);
    const totalClicks = (branded.clicks || 0) + (nonBranded.clicks || 0);
    const totalImpressions = (branded.impressions || 0) + (nonBranded.impressions || 0);
    const totalOrders = (branded.orders || 0) + (nonBranded.orders || 0);

    const kpis = [
      {
        key: 'non-brand-revenue',
        label: 'Non-brand search revenue',
        value: formatCurrency(nonBranded.sales || 0, true),
        delta: '-',
        trend: 'up' as const,
        interpretation: 'Non-brand search revenue from paid search terms.',
        sourceView: 'reporting_amazon.search_kpi' as const,
      },
      {
        key: 'brand-revenue',
        label: 'Brand search revenue',
        value: formatCurrency(branded.sales || 0, true),
        delta: '-',
        trend: 'up' as const,
        interpretation: 'Revenue from branded search queries.',
        sourceView: 'reporting_amazon.search_kpi' as const,
      },
      {
        key: 'search-conversion',
        label: 'Search conversion rate',
        value: `${totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : '0.0'}%`,
        delta: '-',
        trend: 'up' as const,
        interpretation: 'Overall search traffic conversion rate.',
        sourceView: 'reporting_amazon.search_kpi' as const,
      },
      {
        key: 'search-ctr',
        label: 'Search CTR',
        value: `${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'}%`,
        delta: '-',
        trend: 'up' as const,
        interpretation: 'Click-through rate across all paid search terms.',
        sourceView: 'reporting_amazon.search_kpi' as const,
      },
    ];

    // Top queries with aggregated volume data
    const topQueries = termRows.slice(0, 5).map((r: any) => ({
      query: r.search_query || '',
      queryVolume: String(r.impressions || 0),
      brandAppearance: r.is_branded ? '100%' : '-',
      shareOfVoice: totalImpressions > 0 ? `${((r.impressions / totalImpressions) * 100).toFixed(1)}%` : '-',
      impressions: String(r.impressions || 0),
      clicks: String(r.clicks || 0),
      clickShare: totalClicks > 0 ? `${((r.clicks / totalClicks) * 100).toFixed(1)}%` : '-',
      diagnosis: r.acos && r.acos < 0.35 ? 'Efficient — strong ROAS' :
                 r.acos && r.acos < 0.55 ? 'Moderate efficiency' :
                 'High ACoS — review targeting',
      severity: (r.acos || 1) < 0.35 ? 'positive' as const :
                (r.acos || 1) < 0.55 ? 'neutral' as const : 'warning' as const,
    }));

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed} · live` : 'All available data · live',
      summary: `Paid search analysis across ${termRows.length} top terms. Total search-attributed revenue: ${formatCurrency(totalSales, true)}.`,
      kpis,
      topTerms,
      commentary: `Search performance driven by ${topTerms[0]?.term || 'top terms'}. ${nonBranded.sales > branded.sales ? 'Non-brand revenue leads, indicating strong category capture.' : 'Brand terms dominate, indicating healthy brand equity.'}`,
      implications: [
        `Top search term "${topTerms[0]?.term || '-'}" drives ${topTerms[0] ? ((topTerms[0].sales / totalSales) * 100).toFixed(0) : 0}% of search revenue`,
        `${nonBranded.sales > branded.sales ? 'Non-brand discovery is strong' : 'Brand queries dominate — consider non-brand expansion'}`,
      ],
      nextSteps: [
        'Review high-ACoS terms for bid optimization opportunities',
        'Expand coverage on high-converting non-brand terms',
      ],
      topQueries,
      // Diagnostics from BigQuery
      diagnostics: await fetchSearchDiagnostics(sd, ed),
      // Brand Analytics data from BigQuery
      positionTracking: await fetchPositionTracking(),
      categoryRanks: await fetchCategoryPerformance(),
      freshness: [],
    };
  } catch (error) {
    console.error('[fetchSearchSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to load search data.',
      kpis: [],
      topTerms: [],
      commentary: '',
      implications: [],
      nextSteps: [],
      topQueries: [],
      diagnostics: [],
      positionTracking: [],
      categoryRanks: [],
      freshness: []
    };
  }
}
