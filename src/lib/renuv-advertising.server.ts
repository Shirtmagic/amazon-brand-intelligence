/**
 * Server-only fetch functions for advertising data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  AdvertisingSnapshot,
  AdvertisingKpi,
  CampaignPerformanceRow,
  AdvertisingChartDataPoint,
  KeywordWasteRow,
  KeywordPlacement,
  KeywordWasteSummary,
  SearchOpportunityRow,
  SearchOpportunityPlacement,
} from './renuv-advertising';
import { sanitizeDateParam, extractDateValue } from './date-utils';

export async function fetchAdvertisingSnapshot(startDate?: string, endDate?: string): Promise<AdvertisingSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;

    // Fetch current period from raw ads tables (UNION ALL of SP, SB, SD)
    const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];

    const kpiSql = sd && ed
      ? `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd}' AND DATE(date) <= '${ed}'
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_attributed_sales,
        SAFE_DIVIDE(SUM(spend), NULLIF(SUM(attributed_sales), 0)) * 100 AS acos,
        SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) AS roas
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day DESC
    `
      : `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${defaultStart}' AND DATE(date) <= '${defaultEnd}'
        ) WHERE rn = 1
      )
      SELECT
        date_day,
        SUM(spend) AS ad_spend,
        SUM(attributed_sales) AS ad_attributed_sales,
        SAFE_DIVIDE(SUM(spend), NULLIF(SUM(attributed_sales), 0)) * 100 AS acos,
        SAFE_DIVIDE(SUM(attributed_sales), NULLIF(SUM(spend), 0)) AS roas
      FROM all_campaigns
      GROUP BY date_day
      ORDER BY date_day DESC
      LIMIT 30
    `;

    const kpiRows = await queryBigQuery<any>(kpiSql);
    const currentPeriod = sd
      ? kpiRows.filter(r => extractDateValue(r.date_day) >= sd)
      : kpiRows.slice(0, 15);

    const currentSpend = currentPeriod.reduce((sum, r) => sum + Number(r.ad_spend || 0), 0);
    const currentSales = currentPeriod.reduce((sum, r) => sum + Number(r.ad_attributed_sales || 0), 0);
    const currentRoas = currentSpend > 0 ? currentSales / currentSpend : 0;
    const currentAcos = currentSales > 0 ? (currentSpend / currentSales) * 100 : 0;

    const kpis: AdvertisingKpi[] = [
      {
        key: 'spend',
        label: 'Ad spend',
        value: formatCurrency(currentSpend),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total media investment for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'sales',
        label: 'Ad-attributed sales',
        value: formatCurrency(currentSales),
        delta: 'Total for selected period',
        trend: 'flat',
        interpretation: 'Total ad-attributed revenue for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'roas',
        label: 'ROAS',
        value: currentRoas.toFixed(2),
        delta: 'Attributed sales / spend',
        trend: 'flat',
        interpretation: 'Return on ad spend for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      },
      {
        key: 'acos',
        label: 'ACOS',
        value: formatPercent(currentAcos),
        delta: 'Spend / attributed sales',
        trend: 'flat',
        interpretation: 'Advertising cost of sale for the selected period',
        sourceView: 'reporting_amazon.advertising_kpi'
      }
    ];

    const campaignSql = `
      WITH all_campaigns AS (
        SELECT DATE(date) as date_day, campaign_name, 'SP' as ad_type, cost as spend, sales14d as attributed_sales, clicks, impressions
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
        WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        UNION ALL
        SELECT DATE(date), campaign_name, 'SB', cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
        UNION ALL
        SELECT DATE(date), campaign_name, 'SD', cost, sales, clicks, impressions
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
          WHERE DATE(date) >= '${sd || defaultStart}' AND DATE(date) <= '${ed || defaultEnd}'
        ) WHERE rn = 1
      ),
      agg AS (
        SELECT
          campaign_name,
          ad_type,
          SUM(spend) AS spend,
          SUM(attributed_sales) AS sales,
          SUM(attributed_sales) / NULLIF(SUM(spend), 0) AS roas
        FROM all_campaigns
        GROUP BY campaign_name, ad_type
      )
      SELECT * FROM agg WHERE spend > 100 ORDER BY sales DESC LIMIT 10
    `;

    const campaignRows = await queryBigQuery<any>(campaignSql);
    const performance: CampaignPerformanceRow[] = campaignRows.map(r => ({
      campaign: r.campaign_name || 'Unknown',
      channel: r.ad_type || 'SP',
      objective: 'Acquisition',
      spend: formatCurrency(Number(r.spend || 0)),
      attributedSales: formatCurrency(Number(r.sales || 0)),
      roas: Number(r.roas || 0).toFixed(2),
      tacosImpact: currentSales > 0 ? formatPercent((Number(r.spend || 0) / currentSales) * 100) : '—',
      cvr: '—',
      status: Number(r.roas || 0) > 5 ? 'positive' : Number(r.roas || 0) < 3 ? 'warning' : 'neutral',
      sourceView: 'ops_amazon.amzn_ads_sp_campaigns_v3_view'
    }));

    const chartData: AdvertisingChartDataPoint[] = [...currentPeriod].reverse().map(r => ({
      date: typeof r.date_day === 'object' ? r.date_day.value : r.date_day,
      spend: Number(r.ad_spend || 0),
      sales: Number(r.ad_attributed_sales || 0),
      impressions: 0,
      clicks: 0,
      roas: Number(r.ad_attributed_sales || 0) / Number(r.ad_spend || 1)
    }));

    const spendMix = campaignRows.length > 0
      ? ['SP', 'SB', 'SD'].map((channel) => {
          const rows = campaignRows.filter(r => (r.ad_type || 'SP') === channel);
          const spend = rows.reduce((sum, r) => sum + (r.spend || 0), 0);
          const sales = rows.reduce((sum, r) => sum + (r.sales || 0), 0);
          return {
            channel,
            spendShare: currentSpend > 0 ? formatPercent((spend / currentSpend) * 100) : '0.0%',
            salesShare: currentSales > 0 ? formatPercent((sales / currentSales) * 100) : '0.0%',
            acos: sales > 0 ? formatPercent((spend / sales) * 100) : '—',
            role: channel === 'SP' ? 'Primary conversion engine' : channel === 'SB' ? 'Brand demand capture' : 'Retargeting / display support',
            sourceView: 'ops_amazon.raw_ads_union'
          };
        }).filter(r => r.spendShare !== '0.0%' || r.salesShare !== '0.0%')
      : [];

    const freshness = [
      {
        source: 'Sponsored Products / Brands / Display',
        updatedAt: `${sd || defaultStart} – ${ed || defaultEnd}`,
        lag: currentPeriod.length > 0 ? 'In range' : 'No rows',
        tone: currentPeriod.length > 0 ? 'healthy' as const : 'warning' as const,
        readiness: currentPeriod.length > 0 ? 'Advertising tables returned rows for the selected period.' : 'No campaign rows were returned for the selected period.',
        sourceView: 'ops_amazon.raw_ads_union'
      }
    ];

    const efficiencySignals = [
      {
        label: 'ROAS posture',
        value: currentRoas.toFixed(2) + 'x',
        tone: currentRoas >= 4 ? 'positive' as const : currentRoas >= 2.5 ? 'warning' as const : 'negative' as const,
        detail: currentRoas >= 4 ? 'Return on ad spend is strong enough to support selective scaling.' : currentRoas >= 2.5 ? 'Efficiency is workable but should be tightened before aggressive scaling.' : 'Efficiency is weak and needs tighter targeting or bidding.'
      },
      {
        label: 'ACOS posture',
        value: formatPercent(currentAcos),
        tone: currentAcos <= 25 ? 'positive' as const : currentAcos <= 40 ? 'warning' as const : 'negative' as const,
        detail: currentAcos <= 25 ? 'Cost of sale is in a healthy range for growth.' : currentAcos <= 40 ? 'Cost of sale is elevated enough to review waste and bidding pressure.' : 'Cost of sale is high enough that efficiency remediation should come before scale.'
      },
      {
        label: 'Top campaign concentration',
        value: performance[0]?.campaign ? performance[0].campaign.slice(0, 24) + (performance[0].campaign.length > 24 ? '…' : '') : '—',
        tone: 'info' as const,
        detail: performance[0]?.campaign ? 'The top campaign is driving the most attributed sales in the selected period.' : 'No top campaign could be identified for the selected period.'
      },
      {
        label: 'Budget pressure',
        value: currentSpend > 0 && currentSales === 0 ? 'High risk' : 'Review targeting',
        tone: currentSpend > 0 && currentSales === 0 ? 'critical' as const : 'warning' as const,
        detail: currentSpend > 0 && currentSales === 0 ? 'Spend without attributed sales indicates an urgent waste review.' : 'Use campaign and search-term detail to decide where to tighten bids or targeting.'
      }
    ];

    const diagnostics = [
      {
        title: 'Efficiency review',
        severity: currentRoas >= 4 ? 'positive' as const : currentRoas >= 2.5 ? 'warning' as const : 'negative' as const,
        detail: currentRoas >= 4 ? 'Overall advertising efficiency is healthy for the selected period.' : 'Efficiency is mixed and should be reviewed before scaling budget.',
        actionBias: currentRoas >= 4 ? 'Scale winners' : 'Reduce waste',
        sourceView: 'ops_amazon.raw_ads_union'
      },
      {
        title: 'Coverage and freshness',
        severity: currentPeriod.length > 0 ? 'healthy' as const : 'warning' as const,
        detail: currentPeriod.length > 0 ? 'Advertising data is present across the selected date range.' : 'Selected date range returned no advertising rows.',
        actionBias: currentPeriod.length > 0 ? 'Maintain monitoring cadence' : 'Check source coverage',
        sourceView: 'ops_amazon.raw_ads_union'
      }
    ];

    const searchTerms = performance.slice(0, 5).map((row) => ({
      query: row.campaign,
      campaignBias: row.channel,
      spend: row.spend,
      sales: row.attributedSales,
      acos: row.tacosImpact,
      qualityRead: row.status === 'positive' ? 'Scale' : row.status === 'warning' ? 'Tighten targeting' : 'Monitor',
      sourceView: row.sourceView,
    }));

    // Fetch keyword waste analysis
    let keywordWaste: KeywordWasteSummary | undefined;
    try {
      keywordWaste = await fetchKeywordWaste(sd || defaultStart, ed || defaultEnd);
    } catch (kwErr) {
      console.error('[fetchAdvertisingSnapshot] keyword waste fetch failed:', kwErr);
    }

    // Fetch search opportunities (moved from Overview)
    //
    // Logic:
    //   1. Source: ops_amazon.amzn_ads_sp_search_terms_v2_view (Sponsored Products search terms report)
    //   2. Filter: date range + exclude brand terms (renuv / renüv) + spend > 0
    //   3. Deduplicate on (date, campaign_id, search_term) via ROW_NUMBER to avoid inflated metrics
    //      when multiple rows exist for the same day/campaign/term.
    //   4. Aggregate by search_term → spend, clicks, impressions, orders (purchases14d), sales (sales14d)
    //   5. Sort by total_spend DESC, take top 10 (these are the highest-investment non-brand search terms
    //      where we most need to know whether to scale, cut, or optimize).
    //   6. For those top 10 terms, fetch a per-campaign/match-type breakdown so the UI can expand each row.
    //
    // Labels:
    //   - theme          = spend bucket (>$1000 = High investment, >$500 = Medium, else Low)
    //   - searchVolume   = click bucket (>500 = High, >200 = Medium, else Low)
    //   - opportunity    = ACOS > 30% → efficiency improvement; sales > $2000 → scale; else monitor
    //   - cvrGap         = CVR vs 10% benchmark (positive above, negative below)
    //   - actionBias     = ACOS > 40% → review & reduce; CVR < 10% → improve conversion; else scale
    let searchOpportunities: SearchOpportunityRow[] = [];
    try {
      const startBound = sd || defaultStart;
      const endBound = ed || defaultEnd;

      // Step 1: aggregate top 10 by spend
      const searchSql = `
        WITH dedup AS (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${startBound}' AND DATE(date) <= '${endBound}'
        )
        SELECT
          search_term AS search_query,
          SUM(CAST(cost AS FLOAT64)) AS total_spend,
          SUM(CAST(clicks AS INT64)) AS total_clicks,
          SUM(CAST(impressions AS INT64)) AS total_impressions,
          SUM(CAST(purchases14d AS INT64)) AS total_orders,
          SUM(CAST(sales14d AS FLOAT64)) AS total_sales
        FROM dedup
        WHERE rn = 1
          AND LOWER(search_term) NOT LIKE '%renuv%'
          AND LOWER(search_term) NOT LIKE '%renüv%'
        GROUP BY search_term
        HAVING SUM(CAST(cost AS FLOAT64)) > 0
        ORDER BY total_spend DESC
        LIMIT 10
      `;

      const searchRows = await queryBigQuery<any>(searchSql);
      const topTerms = searchRows.map(r => r.search_query).filter(Boolean) as string[];

      // Step 2: placements for those top 10 (per campaign + match type)
      let placementRows: any[] = [];
      if (topTerms.length > 0) {
        const termList = topTerms.map(t => `'${t.replace(/'/g, "''")}'`).join(',');
        const placementSql = `
          SELECT
            search_term,
            campaign_name,
            match_type,
            SUM(CAST(cost AS FLOAT64)) AS spend,
            SUM(CAST(sales14d AS FLOAT64)) AS sales,
            SUM(CAST(clicks AS INT64)) AS clicks,
            SUM(CAST(impressions AS INT64)) AS impressions,
            SUM(CAST(purchases14d AS INT64)) AS orders
          FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
          WHERE DATE(date) >= '${startBound}' AND DATE(date) <= '${endBound}'
            AND search_term IN (${termList})
          GROUP BY search_term, campaign_name, match_type
          ORDER BY spend DESC
        `;
        placementRows = await queryBigQuery<any>(placementSql);
      }

      const placementsByTerm = new Map<string, SearchOpportunityPlacement[]>();
      for (const p of placementRows) {
        const term = p.search_term;
        const spend = Number(p.spend || 0);
        const sales = Number(p.sales || 0);
        const clicks = Number(p.clicks || 0);
        const orders = Number(p.orders || 0);
        const acos = sales > 0 ? (spend / sales) * 100 : spend > 0 ? 999 : 0;
        const roas = spend > 0 ? sales / spend : 0;
        const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;

        // Per-campaign recommendation logic
        let recommendation: string;
        if (spend > 0 && sales === 0) {
          recommendation = `Pause or add as negative — ${clicks} clicks, $${spend.toFixed(0)} spent, 0 sales.`;
        } else if (acos > 60) {
          recommendation = `Cut bids aggressively — ACOS ${acos.toFixed(0)}% is well above target. Consider negative match.`;
        } else if (acos > 40) {
          recommendation = `Reduce bids and tighten match type — ACOS ${acos.toFixed(0)}% above target.`;
        } else if (cvr < 5 && clicks > 20) {
          recommendation = `Low CVR (${cvr.toFixed(1)}%) — review listing relevance or adjust targeting.`;
        } else if (roas >= 4 && orders >= 2) {
          recommendation = `Scale — ROAS ${roas.toFixed(1)}x is strong. Increase bids/budget on this placement.`;
        } else if (roas >= 2) {
          recommendation = `Hold and monitor — ROAS ${roas.toFixed(1)}x is acceptable.`;
        } else {
          recommendation = `Monitor — insufficient signal or borderline efficiency.`;
        }

        const placement: SearchOpportunityPlacement = {
          campaignName: p.campaign_name || 'Unknown',
          matchType: p.match_type || 'Unknown',
          spend,
          sales,
          clicks,
          impressions: Number(p.impressions || 0),
          orders,
          roas,
          acos,
          cvr,
          recommendation,
        };
        if (!placementsByTerm.has(term)) placementsByTerm.set(term, []);
        placementsByTerm.get(term)!.push(placement);
      }

      searchOpportunities = searchRows.map(r => {
        const spend = Number(r.total_spend || 0);
        const sales = Number(r.total_sales || 0);
        const clicks = Number(r.total_clicks || 0);
        const impressions = Number(r.total_impressions || 0);
        const orders = Number(r.total_orders || 0);
        const acos = sales > 0 ? (spend / sales) * 100 : 0;
        const roas = spend > 0 ? sales / spend : 0;
        const cvr = clicks > 0 ? (orders / clicks) * 100 : 0;

        return {
          query: r.search_query || 'Unknown',
          theme: spend > 1000 ? 'High investment' : spend > 500 ? 'Medium investment' : 'Low investment',
          searchVolume: clicks > 500 ? 'High' : clicks > 200 ? 'Medium' : 'Low',
          opportunity: acos > 30 ? 'Efficiency improvement needed' : sales > 2000 ? 'Scale opportunity' : 'Monitor',
          cvrGap: cvr < 10 ? `${(10 - cvr).toFixed(1)} pts below benchmark` : `${(cvr - 10).toFixed(1)} pts above benchmark`,
          actionBias: acos > 40 ? 'Review targeting and reduce waste' : cvr < 10 ? 'Improve conversion relevance' : 'Scale with current efficiency',
          sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view',
          totalSpend: spend,
          totalSales: sales,
          totalClicks: clicks,
          totalImpressions: impressions,
          totalOrders: orders,
          acos,
          roas,
          cvr,
          placements: placementsByTerm.get(r.search_query || '') || [],
        };
      });
    } catch (err) {
      console.error('[fetchAdvertisingSnapshot] search opportunities query failed:', err);
      searchOpportunities = [];
    }

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed}` : 'Trailing 30 days',
      summary: `Advertising summary: ${formatCurrency(currentSpend)} spend, ${formatCurrency(currentSales)} attributed sales, ${currentRoas.toFixed(2)}x ROAS.`,
      kpis: kpis.length > 0 ? kpis : [],
      chartData: chartData.length > 0 ? chartData : [],
      commentary: currentRoas >= 4 ? 'Advertising efficiency is healthy enough to support selective scaling.' : 'Advertising efficiency needs tighter control before broad budget expansion.',
      implications: [],
      nextSteps: [],
      performance: performance.length > 0 ? performance : [],
      efficiency: {
        headline: currentRoas >= 4 ? 'Efficiency is healthy for controlled scale' : 'Efficiency needs review before more spend',
        summary: currentRoas >= 4
          ? 'ROAS and ACOS indicate the account can support careful scaling into the strongest campaigns.'
          : 'Review weaker campaigns, tighten targeting, and cut low-efficiency spend before increasing budgets.',
        signals: efficiencySignals,
        sourceView: 'ops_amazon.raw_ads_union'
      },
      freshness,
      spendMix,
      searchTerms,
      diagnostics,
      keywordWaste,
      searchOpportunities,
    };
  } catch (error) {
    console.error('[fetchAdvertisingSnapshot] Failed:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to load advertising data.',
      kpis: [],
      chartData: [],
      commentary: '',
      implications: [],
      nextSteps: [],
      performance: [],
      efficiency: { headline: 'No data available', summary: '', signals: [], sourceView: 'reporting_amazon.advertising_efficiency' },
      freshness: [],
      spendMix: [],
      searchTerms: [],
      diagnostics: []
    };
  }
}

/**
 * Fetch keyword-level waste analysis.
 * Compares per-keyword ad spend against product price from inventory data
 * to identify "runaway" keywords where spend exceeds product cost without adequate sales.
 */
async function fetchKeywordWaste(startDate: string, endDate: string): Promise<KeywordWasteSummary> {
  // Step 1: Get aggregated keyword-level spend + sales
  const keywordSql = `
    SELECT
      search_term,
      SUM(CAST(cost AS FLOAT64)) AS total_spend,
      SUM(CAST(sales14d AS FLOAT64)) AS total_sales,
      SUM(CAST(purchases14d AS INT64)) AS total_orders,
      SUM(CAST(clicks AS INT64)) AS total_clicks,
      SUM(CAST(impressions AS INT64)) AS total_impressions
    FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
    WHERE DATE(date) >= '${startDate}' AND DATE(date) <= '${endDate}'
      AND CAST(cost AS FLOAT64) > 0
    GROUP BY search_term
    HAVING SUM(CAST(cost AS FLOAT64)) > 5
    ORDER BY total_spend DESC
    LIMIT 200
  `;

  // Step 2: Get per-keyword placement breakdown (campaign + match type)
  const placementSql = `
    SELECT
      search_term,
      campaign_name,
      match_type,
      SUM(CAST(cost AS FLOAT64)) AS spend,
      SUM(CAST(sales14d AS FLOAT64)) AS sales,
      SUM(CAST(clicks AS INT64)) AS clicks,
      SUM(CAST(impressions AS INT64)) AS impressions,
      SUM(CAST(purchases14d AS INT64)) AS orders
    FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
    WHERE DATE(date) >= '${startDate}' AND DATE(date) <= '${endDate}'
      AND CAST(cost AS FLOAT64) > 0
    GROUP BY search_term, campaign_name, match_type
    ORDER BY spend DESC
  `;

  // Step 3: Get average product price from inventory
  const priceSql = `
    SELECT AVG(featuredoffer_price) AS avg_price
    FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`
    WHERE ob_date = (SELECT MAX(ob_date) FROM \`renuv-amazon-data-warehouse.ops_amazon.sp_fba_manage_inventory_health_v24\`)
      AND featuredoffer_price > 0
  `;

  const [keywordRows, placementRows, priceRows] = await Promise.all([
    queryBigQuery<any>(keywordSql),
    queryBigQuery<any>(placementSql),
    queryBigQuery<any>(priceSql),
  ]);

  const avgPrice = priceRows.length > 0 ? Number(priceRows[0].avg_price || 0) : 30; // fallback

  // Build placement lookup: keyword → placements[]
  const placementMap = new Map<string, KeywordPlacement[]>();
  for (const p of placementRows) {
    const key = p.search_term;
    const spend = Number(p.spend || 0);
    const sales = Number(p.sales || 0);
    const placement: KeywordPlacement = {
      campaignName: p.campaign_name || 'Unknown',
      matchType: p.match_type || 'Unknown',
      spend,
      sales,
      clicks: Number(p.clicks || 0),
      impressions: Number(p.impressions || 0),
      orders: Number(p.orders || 0),
      roas: spend > 0 ? sales / spend : 0,
      acos: sales > 0 ? (spend / sales) * 100 : spend > 0 ? 999 : 0,
    };
    if (!placementMap.has(key)) placementMap.set(key, []);
    placementMap.get(key)!.push(placement);
  }

  // Evaluate each keyword for waste
  const flagged: KeywordWasteRow[] = [];
  for (const row of keywordRows) {
    const totalSpend = Number(row.total_spend || 0);
    const totalSales = Number(row.total_sales || 0);
    const totalOrders = Number(row.total_orders || 0);
    const totalClicks = Number(row.total_clicks || 0);

    // How many units should this spend have bought at avg product price?
    const expectedSales = avgPrice > 0 ? totalSpend / avgPrice : 0;
    const salesDeficit = expectedSales - totalOrders;
    const spendToProductRatio = avgPrice > 0 ? totalSpend / avgPrice : 0;

    // Flag if spend >= 1x product price AND orders are insufficient
    // Critical: spend >= 2x price with < 2 sales, or spend >= price with 0 sales
    // Warning: spend >= price with fewer sales than expected
    // Watch: spend >= 0.7x price with poor efficiency
    let severity: 'critical' | 'warning' | 'watch' | null = null;

    if (totalSpend >= avgPrice * 2 && totalOrders < 2) {
      severity = 'critical';
    } else if (totalSpend >= avgPrice && totalOrders === 0) {
      severity = 'critical';
    } else if (totalSpend >= avgPrice && totalOrders < expectedSales * 0.5) {
      severity = 'warning';
    } else if (totalSpend >= avgPrice * 0.7 && totalOrders < expectedSales * 0.5) {
      severity = 'watch';
    }

    if (severity) {
      flagged.push({
        keyword: row.search_term,
        totalSpend,
        totalSales,
        totalOrders,
        totalClicks,
        avgProductPrice: avgPrice,
        spendToProductRatio,
        expectedSalesAtPrice: expectedSales,
        salesDeficit,
        placements: placementMap.get(row.search_term) || [],
        severity,
      });
    }
  }

  // Sort: critical first, then warning, then watch; within severity by spend desc
  const severityOrder = { critical: 0, warning: 1, watch: 2 };
  flagged.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.totalSpend - a.totalSpend);

  const totalWasted = flagged.reduce((sum, kw) => sum + kw.totalSpend, 0);
  const criticalCount = flagged.filter(k => k.severity === 'critical').length;
  const warningCount = flagged.filter(k => k.severity === 'warning').length;

  const headline = criticalCount > 0
    ? `${criticalCount} critical runaway keyword${criticalCount > 1 ? 's' : ''} detected — ${formatCurrency(totalWasted)} total flagged spend`
    : warningCount > 0
      ? `${warningCount} keywords with spend-to-sales imbalance — review recommended`
      : flagged.length > 0
        ? `${flagged.length} keywords on watch for potential waste`
        : 'No runaway keywords detected — keyword efficiency looks healthy';

  return {
    headline,
    totalWastedSpend: totalWasted,
    flaggedKeywords: flagged.slice(0, 30), // cap at 30 for UI
    sourceView: 'ops_amazon.amzn_ads_sp_search_terms_v2_view + ops_amazon.sp_fba_manage_inventory_health_v24',
  };
}
