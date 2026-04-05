export type Recommendation = {
  id: string;
  title: string;
  category: 'optimization' | 'expansion' | 'protection' | 'analysis';
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  description: string;
  rationale: string;
  timeline: string;
  expectedOutcome: string;
  sourceView: 'reporting_amazon.recommendations';
};

export type RecommendationsSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  recommendations: Recommendation[];
  commentary: string;
};

export const renuvRecommendationsMock: RecommendationsSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Current recommendations',
  summary: 'Based on recent performance trends and market dynamics, we recommend focusing on non-brand search expansion, creative refresh to combat rising CPCs, and proactive inventory management on the Post-Surgery Kit SKU.',
  recommendations: [
    {
      id: 'REC-001',
      title: 'Scale non-brand search investment',
      category: 'expansion',
      priority: 'high',
      impact: '+$28-42k incremental monthly revenue',
      effort: 'low',
      description: 'Increase budgets on high-performing phrase and exact match campaigns targeting validated recovery and post-surgery terms. Current efficiency levels (ROAS 4.6+, CVR 21.3%) support significant expansion.',
      rationale: 'Non-brand search revenue grew 28.3% this period with improving efficiency. Share-of-voice gains (+2.3 pts to 18.4%) and strong conversion rates on post-surgery queries validate expansion opportunity. Current spend constraint is primary growth limiter.',
      timeline: 'Implement within 2 weeks',
      expectedOutcome: 'Incremental $28-42k monthly revenue at similar or improved ROAS. Share-of-voice increase to 22-24% on strategic terms.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-002',
      title: 'Refresh Sponsored Brand creative',
      category: 'optimization',
      priority: 'high',
      impact: '3-5 point ACOS improvement',
      effort: 'medium',
      description: 'Test new headline and image combinations for Sponsored Brand campaigns to improve CTR and combat rising CPCs in competitive auctions. Focus on benefit-driven messaging and seasonal relevance.',
      rationale: 'CPCs increased 8-12% on core category terms as competitive pressure intensified. Current CTR at 0.48% has improved but remains below potential. Creative refresh is most direct path to efficiency gains without reducing spend.',
      timeline: 'Develop and test within 3 weeks',
      expectedOutcome: 'CTR improvement to 0.55-0.60%, offsetting CPC increases and improving ACOS by 3-5 points on SB campaigns.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-003',
      title: 'Implement inventory safeguards for RENUV-003',
      category: 'protection',
      priority: 'high',
      impact: 'Prevent stockout and account health impact',
      effort: 'low',
      description: 'Establish daily monitoring and automated alerts for Post-Surgery Kit inventory. Prepare to throttle ad spend if velocity increases or inbound shipment delays.',
      rationale: 'RENUV-003 has 12 days of supply at current velocity. Stockout would disrupt bundle strategy, harm conversion rate on related SKUs, and potentially trigger account health issues. Inbound shipment confirmed for April 8 but buffer is minimal.',
      timeline: 'Implement immediately',
      expectedOutcome: 'Extended runway to 18-20 days if throttling needed. Zero stockout risk and maintained account health.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-004',
      title: 'Optimize broad match negative keyword coverage',
      category: 'optimization',
      priority: 'medium',
      impact: '3-5 point ACOS improvement',
      effort: 'low',
      description: 'Audit search term reports for broad match campaigns to identify and exclude low-quality traffic. Target 3-5 point ACOS improvement on non-brand acquisition campaigns.',
      rationale: 'Broad match campaigns currently contribute ~35% of non-brand spend but show efficiency gap vs exact/phrase. Search term report analysis indicates opportunity to exclude 8-12% of current impressions with minimal revenue impact.',
      timeline: 'Complete within 1 week',
      expectedOutcome: 'ACOS improvement of 3-5 points on broad campaigns. Freed budget reallocated to high-performing exact/phrase terms.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-005',
      title: 'Test selective bid reduction on strong organic rank terms',
      category: 'optimization',
      priority: 'medium',
      impact: '$4-8k monthly spend reduction with maintained visibility',
      effort: 'medium',
      description: 'Pilot strategic bid reduction on 5-8 terms where organic rank is top 5 and paid contribution is <30% of total orders. Monitor total visibility and conversion impact.',
      rationale: 'Organic rank improved from 10.0 to 8.2 on top 20 terms. On select high-volume queries with strong organic position, paid spend may be partially redundant. Controlled test can validate reallocation opportunity.',
      timeline: 'Test over 2-3 weeks',
      expectedOutcome: 'Reduced paid spend of $4-8k monthly on validated terms with minimal total visibility impact. Budget redeployed to expansion opportunities.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-006',
      title: 'Develop post-surgery specific creative variants',
      category: 'expansion',
      priority: 'medium',
      impact: '+15-25% CTR on post-surgery campaigns',
      effort: 'high',
      description: 'Create audience-specific creative emphasizing surgical recovery, healing timelines, and clinical validation. Deploy to post-surgery search campaigns and retargeting.',
      rationale: 'Post-surgery queries ("scar gel for surgery", "c section scar treatment", etc.) convert at 23.6% vs 21.3% overall. This segment shows highest intent but uses generic creative not optimized for surgical recovery context.',
      timeline: '4-6 weeks',
      expectedOutcome: 'CTR improvement of 15-25% on post-surgery campaigns. Incremental $12-18k monthly revenue from improved engagement.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-007',
      title: 'Competitive landscape deep dive',
      category: 'analysis',
      priority: 'low',
      impact: 'Strategic insight for Q2 planning',
      effort: 'medium',
      description: 'Conduct comprehensive analysis of new competitor entry patterns, pricing strategies, share-of-voice trends, and review velocity to inform defensive and offensive tactics.',
      rationale: '3-4 new brands launched in category this period with material impact on CPCs and competitive dynamics. Deeper understanding of competitor positioning, weaknesses, and growth trajectories will inform strategic planning.',
      timeline: '4 weeks',
      expectedOutcome: 'Strategic framework for competitive response. Identification of 2-3 offensive opportunities and defensive priorities for Q2.',
      sourceView: 'reporting_amazon.recommendations'
    },
    {
      id: 'REC-008',
      title: 'A+ content iteration testing',
      category: 'optimization',
      priority: 'low',
      impact: '+0.3-0.6 pts CVR lift',
      effort: 'medium',
      description: 'Test updated A+ content modules emphasizing clinical results and customer testimonials. Current version performs well but opportunity for incremental CVR lift.',
      rationale: 'Conversion rate at 19.2% is strong but A+ content has not been refreshed in 4+ months. Category best-practices are evolving toward stronger clinical validation and before/after storytelling.',
      timeline: '3-4 weeks',
      expectedOutcome: 'Conversion rate improvement of 0.3-0.6 points. Incremental $8-15k monthly revenue from improved listing conversion.',
      sourceView: 'reporting_amazon.recommendations'
    }
  ],
  commentary: 'Current recommendations prioritize three high-impact areas: (1) non-brand search expansion to capitalize on strong efficiency and validated high-intent queries, (2) creative optimization to combat rising competitive pressure and CPC inflation, and (3) inventory safeguards to prevent disruption on the Post-Surgery Kit SKU. The expansion opportunity is particularly compelling — non-brand search performance this period (28.3% revenue growth, 21.3% CVR, 4.6+ ROAS) validates significant room to scale investment while maintaining or improving efficiency. Creative refresh is the most direct path to offsetting CPC increases without reducing spend or market share. Inventory management on RENUV-003 is defensive but critical — 12 days of supply creates meaningful stockout risk if velocity increases or inbound shipment delays. Medium-priority recommendations focus on efficiency optimization (negative keywords, organic rank leverage) and audience-specific creative development. Lower-priority items support strategic planning and incremental conversion gains but are not time-sensitive.'
};

export const renuvRecommendationsContracts = {
  recommendations: 'reporting_amazon.recommendations',
  snapshot: 'reporting_amazon.recommendations_snapshot'
} as const;
