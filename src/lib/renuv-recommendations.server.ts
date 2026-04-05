/**
 * Server-side recommendations engine
 * Queries live BigQuery data to generate data-driven recommendations
 */
import { queryBigQuery, formatCurrency } from '@/lib/bigquery';
import {
  RecommendationsSnapshot,
  Recommendation,
} from '@/lib/renuv-recommendations';
import { sanitizeDateParam } from '@/lib/date-utils';

type CampaignPerformance = {
  campaign_name: string;
  campaign_id: string;
  spend: number;
  revenue: number;
  orders: number;
  roas: number;
  acos: number;
  ctr: number;
  campaign_type: string;
};

type SearchTermPerformance = {
  search_query: string;
  spend: number;
  orders: number;
  revenue: number;
  impressions: number;
};

/**
 * Fetch recommendations snapshot from live BigQuery data
 */
export async function fetchRecommendationsSnapshot(startDate?: string, endDate?: string): Promise<RecommendationsSnapshot> {
  try {
    const sd = startDate ? sanitizeDateParam(startDate) : undefined;
    const ed = endDate ? sanitizeDateParam(endDate) : undefined;
    const dateFrom = sd || new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const dateTo = ed || new Date().toISOString().split('T')[0];

    const recommendations: Recommendation[] = [];

    // Rule 1: Budget Expansion (ROAS > 4x)
    const budgetExpansionRecs = await getBudgetExpansionRecommendations(dateFrom, dateTo);
    recommendations.push(...budgetExpansionRecs);

    // Rule 2: Negative Keywords (spend > $50, zero conversions)
    const negativeKeywordRecs = await getNegativeKeywordRecommendations(dateFrom, dateTo);
    recommendations.push(...negativeKeywordRecs);

    // Rule 3: Bid Optimization (ACoS > 45% or < 25%)
    const bidOptimizationRecs = await getBidOptimizationRecommendations(dateFrom, dateTo);
    recommendations.push(...bidOptimizationRecs);

    // Generate summary and commentary from the data
    const { summary, commentary } = generateSummaryAndCommentary(recommendations);

    return {
      brand: 'Renuv',
      periodLabel: sd && ed ? `${sd} – ${ed}` : 'Last 14 days',
      summary,
      recommendations,
      commentary,
    };
  } catch (error) {
    console.error('[fetchRecommendationsSnapshot] Error:', error);
    return {
      brand: 'Renuv',
      periodLabel: 'Data unavailable',
      summary: 'Unable to generate recommendations at this time.',
      recommendations: [],
      commentary: ''
    };
  }
}

/**
 * Rule 1: Budget Expansion - Campaigns with ROAS > 4x
 */
async function getBudgetExpansionRecommendations(dateFrom: string, dateTo: string): Promise<Recommendation[]> {
  const sql = `
    WITH all_campaigns AS (
      SELECT campaign_name, campaign_id, cost as spend, sales14d as attributed_sales, purchases14d as orders
      FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
      WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      UNION ALL
      SELECT campaign_name, campaign_id, cost, sales, purchases
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      UNION ALL
      SELECT campaign_name, campaign_id, cost, sales, purchases
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
    ),
    agg AS (
      SELECT
        campaign_name,
        campaign_id,
        SUM(spend) as spend,
        SUM(attributed_sales) as revenue,
        SUM(orders) as orders,
        SAFE_DIVIDE(SUM(attributed_sales), SUM(spend)) as roas,
        SAFE_DIVIDE(SUM(spend), SUM(attributed_sales)) * 100 as acos
      FROM all_campaigns
      GROUP BY campaign_name, campaign_id
    )
    SELECT * FROM agg WHERE roas > 4.0 AND spend > 100
    ORDER BY roas DESC LIMIT 3
  `;

  const campaigns = await queryBigQuery<CampaignPerformance>(sql);

  return campaigns.map((campaign, idx) => {
    const estimatedImpact = campaign.revenue * 0.5;

    return {
      id: `BE-${Date.now()}-${idx}`,
      title: `Scale budget on ${campaign.campaign_name}`,
      category: 'expansion' as const,
      priority: 'high' as const,
      impact: `${formatCurrency(estimatedImpact)} incremental revenue potential`,
      effort: 'low' as const,
      description: `Increase daily budget on this high-performing campaign. Current ROAS of ${campaign.roas.toFixed(2)}x indicates strong efficiency with room to scale.`,
      rationale: `Campaign achieved ${campaign.roas.toFixed(2)}x ROAS on ${formatCurrency(campaign.spend)} spend over the selected period, generating ${formatCurrency(campaign.revenue)} in revenue with ${campaign.orders} orders. Performance validates expansion opportunity.`,
      timeline: 'Implement within 1 week',
      expectedOutcome: `Incremental ${formatCurrency(estimatedImpact)} monthly revenue at similar or improved ROAS (${campaign.roas.toFixed(1)}x+).`,
      sourceView: 'reporting_amazon.recommendations',
    };
  });
}

/**
 * Rule 2: Negative Keywords - Search terms with spend > $50 and zero conversions
 */
async function getNegativeKeywordRecommendations(dateFrom: string, dateTo: string): Promise<Recommendation[]> {
  const sql = `
    WITH agg AS (
      SELECT
        search_term as search_query,
        SUM(cost) as spend,
        SUM(purchases14d) as orders,
        SUM(sales14d) as revenue,
        SUM(impressions) as impressions
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id, search_term ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_search_terms_v2_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      GROUP BY search_term
    )
    SELECT * FROM agg WHERE spend > 50 AND orders = 0
    ORDER BY spend DESC LIMIT 5
  `;

  const searchTerms = await queryBigQuery<SearchTermPerformance>(sql);

  if (searchTerms.length === 0) return [];

  const totalWaste = searchTerms.reduce((sum, term) => sum + term.spend, 0);

  return [{
    id: `NK-${Date.now()}`,
    title: 'Add negative keywords for non-converting search terms',
    category: 'optimization' as const,
    priority: 'medium' as const,
    impact: `${formatCurrency(totalWaste)} monthly waste reduction`,
    effort: 'low' as const,
    description: `Identified ${searchTerms.length} search terms that generated spend but zero conversions. Adding these as negative keywords will improve campaign efficiency.`,
    rationale: `Search terms including "${searchTerms[0].search_query}" (${formatCurrency(searchTerms[0].spend)} spend, 0 orders) and ${searchTerms.length - 1} others consumed ${formatCurrency(totalWaste)} with zero conversions. This spend can be reallocated to higher-performing terms.`,
    timeline: 'Implement within 3-5 days',
    expectedOutcome: `Prevent ${formatCurrency(totalWaste * 2)} monthly waste. Freed budget reallocated to converting terms, improving overall ACOS by 2-4 points.`,
    sourceView: 'reporting_amazon.recommendations',
  }];
}

/**
 * Rule 3: Bid Optimization - Campaigns with ACoS significantly above/below target
 */
async function getBidOptimizationRecommendations(dateFrom: string, dateTo: string): Promise<Recommendation[]> {
  const sql = `
    WITH all_campaigns AS (
      SELECT campaign_name, campaign_id, cost as spend, sales14d as attributed_sales, purchases14d as orders
      FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sp_campaigns_v3_view\`
      WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      UNION ALL
      SELECT campaign_name, campaign_id, cost, sales, purchases
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sb_campaigns_v1_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
      UNION ALL
      SELECT campaign_name, campaign_id, cost, sales, purchases
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY DATE(date), campaign_id ORDER BY ob_processed_at DESC) as rn
        FROM \`renuv-amazon-data-warehouse.ops_amazon.amzn_ads_sd_campaigns_v3_view\`
        WHERE DATE(date) >= '${dateFrom}' AND DATE(date) <= '${dateTo}'
      ) WHERE rn = 1
    ),
    agg AS (
      SELECT
        campaign_name,
        campaign_id,
        SUM(spend) as spend,
        SUM(attributed_sales) as revenue,
        SAFE_DIVIDE(SUM(spend), SUM(attributed_sales)) * 100 as acos,
        SUM(orders) as orders
      FROM all_campaigns
      GROUP BY campaign_name, campaign_id
    )
    SELECT * FROM agg
    WHERE (acos > 45 OR acos < 25) AND spend > 100
    ORDER BY CASE WHEN acos > 45 THEN acos ELSE -acos END DESC
    LIMIT 5
  `;

  const campaigns = await queryBigQuery<CampaignPerformance>(sql);

  return campaigns.map((campaign, idx) => {
    const isHighAcos = campaign.acos > 45;
    const action = isHighAcos ? 'Reduce bids' : 'Increase bids';
    const targetAcos = 35;
    const acosImprovement = Math.abs(campaign.acos - targetAcos);
    const impactDollars = campaign.spend * (acosImprovement / 100);

    return {
      id: `BO-${Date.now()}-${idx}`,
      title: `${action} on ${campaign.campaign_name}`,
      category: 'optimization' as const,
      priority: isHighAcos ? 'high' as const : 'medium' as const,
      impact: `${formatCurrency(impactDollars)} ${isHighAcos ? 'cost savings' : 'revenue opportunity'}`,
      effort: 'low' as const,
      description: `${action} to optimize towards target ACoS of ~35%. Current ACoS of ${campaign.acos.toFixed(1)}% is ${isHighAcos ? 'significantly above' : 'well below'} target, indicating ${isHighAcos ? 'inefficiency' : 'room to capture more volume'}.`,
      rationale: `Campaign running at ${campaign.acos.toFixed(1)}% ACoS on ${formatCurrency(campaign.spend)} spend. ${isHighAcos ? 'Reducing bids will improve efficiency and reduce wasted spend.' : 'Low ACoS indicates strong performance with headroom to increase bids and capture additional market share.'}`,
      timeline: 'Implement within 1 week',
      expectedOutcome: `${isHighAcos ? `ACoS improvement to ~35%, saving ${formatCurrency(impactDollars)} monthly.` : `Increased spend capturing ${formatCurrency(impactDollars)} additional monthly revenue while maintaining profitability.`}`,
      sourceView: 'reporting_amazon.recommendations',
    };
  });
}

/**
 * Generate summary and commentary from recommendations
 */
function generateSummaryAndCommentary(recommendations: Recommendation[]): {
  summary: string;
  commentary: string;
} {
  if (recommendations.length === 0) {
    return {
      summary: 'No high-priority recommendations at this time. Current campaigns are performing within expected parameters.',
      commentary: 'Continue monitoring performance metrics. Focus on maintaining current efficiency levels while watching for emerging opportunities or risks.',
    };
  }

  const highPriority = recommendations.filter(r => r.priority === 'high');
  const categories = [...new Set(recommendations.map(r => r.category))];

  // Build summary
  const summaryParts: string[] = [];
  if (highPriority.length > 0) {
    summaryParts.push(`${highPriority.length} high-priority ${highPriority.length === 1 ? 'action' : 'actions'} identified`);
  }
  if (categories.includes('expansion')) {
    summaryParts.push('expansion opportunities available');
  }
  if (categories.includes('optimization')) {
    summaryParts.push('efficiency optimizations recommended');
  }

  const summary = `Based on the selected period performance data: ${summaryParts.join(', ')}.`;

  // Build commentary
  const commentaryParts: string[] = [];

  if (highPriority.length > 0) {
    const topAction = highPriority[0];
    commentaryParts.push(`Primary focus should be on ${topAction.title.toLowerCase()}: ${topAction.rationale.split('.')[0]}.`);
  }

  if (categories.includes('expansion')) {
    const expansionRecs = recommendations.filter(r => r.category === 'expansion');
    commentaryParts.push(`${expansionRecs.length} expansion ${expansionRecs.length === 1 ? 'opportunity' : 'opportunities'} identified with validated performance metrics supporting scale.`);
  }

  if (categories.includes('optimization')) {
    const optimizationRecs = recommendations.filter(r => r.category === 'optimization');
    commentaryParts.push(`${optimizationRecs.length} optimization ${optimizationRecs.length === 1 ? 'action' : 'actions'} will improve efficiency and reduce wasted spend.`);
  }

  commentaryParts.push(`All recommendations are data-driven and based on observed performance patterns.`);

  const commentary = commentaryParts.join(' ');

  return { summary, commentary };
}
