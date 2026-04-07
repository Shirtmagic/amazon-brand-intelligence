/**
 * Server-only fetch functions for advertising data
 */
import { queryBigQuery, formatCurrency, formatPercent } from './bigquery';
import {
  AdvertisingSnapshot,
  AdvertisingKpi,
  CampaignPerformanceRow,
  AdvertisingChartDataPoint,
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

    const currentSpend = currentPeriod.reduce((sum, r) => sum + (r.ad_spend || 0), 0);
    const currentSales = currentPeriod.reduce((sum, r) => sum + (r.ad_attributed_sales || 0), 0);
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
      spend: formatCurrency(r.spend || 0),
      attributedSales: formatCurrency(r.sales || 0),
      roas: (r.roas || 0).toFixed(2),
      tacosImpact: currentSales > 0 ? formatPercent((r.spend / currentSales) * 100) : '—',
      cvr: '—',
      status: (r.roas || 0) > 5 ? 'positive' : (r.roas || 0) < 3 ? 'warning' : 'neutral',
      sourceView: 'ops_amazon.amzn_ads_sp_campaigns_v3_view'
    }));

    const chartData: AdvertisingChartDataPoint[] = [...currentPeriod].reverse().map(r => ({
      date: typeof r.date_day === 'object' ? r.date_day.value : r.date_day,
      spend: r.ad_spend || 0,
      sales: r.ad_attributed_sales || 0,
      impressions: 0,
      clicks: 0,
      roas: (r.ad_attributed_sales || 0) / (r.ad_spend || 1)
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
      diagnostics
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
