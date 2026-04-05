export type AdvertisingKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  interpretation: string;
  sourceView: 'reporting_amazon.client_advertising_kpis';
};

export type CampaignPerformance = {
  campaign: string;
  type: string;
  spend: string;
  sales: string;
  roas: string;
  acos: string;
  trend: 'up' | 'down' | 'flat';
  sourceView: 'reporting_amazon.client_campaign_performance';
};

export type EfficiencyMetric = {
  label: string;
  value: string;
  interpretation: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type ClientAdvertisingSnapshot = {
  brand: string;
  periodLabel: string;
  summary: string;
  kpis: AdvertisingKpi[];
  campaigns: CampaignPerformance[];
  efficiency: {
    headline: string;
    summary: string;
    metrics: EfficiencyMetric[];
    sourceView: 'reporting_amazon.client_advertising_efficiency';
  };
  implications: string;
  nextSteps: string[];
};

export const renuvClientAdvertisingMock: ClientAdvertisingSnapshot = {
  brand: 'Renuv',
  periodLabel: 'Trailing 30 days',
  summary: 'Advertising performance strengthened with $89.2k in spend driving $544.2k in attributed sales. TACOS improved to 16.4% as revenue growth outpaced spend increases. Non-brand search campaigns delivered particularly strong efficiency gains.',
  kpis: [
    {
      key: 'ad-spend',
      label: 'Total ad spend',
      value: '$89.2k',
      delta: '+6.1%',
      trend: 'up',
      interpretation: 'Spend increased modestly while maintaining healthy efficiency',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    },
    {
      key: 'ad-sales',
      label: 'Attributed sales',
      value: '$544.2k',
      delta: '+13.2%',
      trend: 'up',
      interpretation: 'Attributed sales growth significantly outpaced spend growth',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    },
    {
      key: 'tacos',
      label: 'TACOS',
      value: '16.4%',
      delta: '-1.1 pts',
      trend: 'up',
      interpretation: 'Total advertising cost of sales improved meaningfully',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    },
    {
      key: 'roas',
      label: 'Blended ROAS',
      value: '6.10x',
      delta: '+0.41x',
      trend: 'up',
      interpretation: 'Return on ad spend reached strong efficiency levels',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    },
    {
      key: 'clicks',
      label: 'Ad clicks',
      value: '28,427',
      delta: '+8.4%',
      trend: 'up',
      interpretation: 'Click volume grew healthily across paid channels',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    },
    {
      key: 'cpc',
      label: 'Average CPC',
      value: '$3.14',
      delta: '-2.1%',
      trend: 'up',
      interpretation: 'Cost per click declined despite competitive pressure',
      sourceView: 'reporting_amazon.client_advertising_kpis'
    }
  ],
  campaigns: [
    {
      campaign: 'Non-brand search | Exact match',
      type: 'Sponsored Products',
      spend: '$24.8k',
      sales: '$178.4k',
      roas: '7.19x',
      acos: '13.9%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_campaign_performance'
    },
    {
      campaign: 'Brand defense | Exact',
      type: 'Sponsored Products',
      spend: '$18.2k',
      sales: '$142.7k',
      roas: '7.84x',
      acos: '12.8%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_campaign_performance'
    },
    {
      campaign: 'Non-brand | Phrase match',
      type: 'Sponsored Products',
      spend: '$16.4k',
      sales: '$92.1k',
      roas: '5.62x',
      acos: '17.8%',
      trend: 'flat',
      sourceView: 'reporting_amazon.client_campaign_performance'
    },
    {
      campaign: 'Sponsored Brand | Recovery terms',
      type: 'Sponsored Brands',
      spend: '$12.6k',
      sales: '$54.3k',
      roas: '4.31x',
      acos: '23.2%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_campaign_performance'
    },
    {
      campaign: 'Display retargeting | Views',
      type: 'Sponsored Display',
      spend: '$8.9k',
      sales: '$64.2k',
      roas: '7.21x',
      acos: '13.9%',
      trend: 'up',
      sourceView: 'reporting_amazon.client_campaign_performance'
    },
    {
      campaign: 'Product targeting | Competitors',
      type: 'Sponsored Products',
      spend: '$8.3k',
      sales: '$12.5k',
      roas: '1.51x',
      acos: '66.4%',
      trend: 'down',
      sourceView: 'reporting_amazon.client_campaign_performance'
    }
  ],
  efficiency: {
    headline: 'Advertising efficiency improved across most channels',
    summary: 'TACOS improved 1.1 percentage points to 16.4% as attributed sales growth outpaced spend increases. Non-brand search campaigns delivered the strongest efficiency gains with ROAS exceeding 7x. Competitive product targeting underperformed and requires optimization or budget reallocation.',
    metrics: [
      {
        label: 'Non-brand search efficiency',
        value: 'ROAS 7.19x, ACOS 13.9%',
        interpretation: 'Excellent efficiency on acquisition-focused search terms',
        tone: 'positive'
      },
      {
        label: 'Brand defense strength',
        value: 'ROAS 7.84x, protecting share',
        interpretation: 'Strong defense position with healthy efficiency',
        tone: 'positive'
      },
      {
        label: 'Display retargeting',
        value: 'ROAS 7.21x on high-intent shoppers',
        interpretation: 'Retargeting delivering strong incremental sales',
        tone: 'positive'
      },
      {
        label: 'Competitive targeting',
        value: 'ROAS 1.51x, underperforming',
        interpretation: 'Competitor product targeting needs review and optimization',
        tone: 'warning'
      }
    ],
    sourceView: 'reporting_amazon.client_advertising_efficiency'
  },
  implications: 'Advertising performance is strong overall with improving efficiency across core channels. The combination of non-brand search expansion and retargeting success drove incremental growth. Competitive targeting campaigns require optimization or budget reallocation to improve portfolio-level efficiency.',
  nextSteps: [
    'Scale non-brand exact match campaigns given strong 7.19x ROAS performance',
    'Optimize or pause underperforming competitive product targeting campaigns',
    'Expand Sponsored Display retargeting coverage to capture more high-intent shoppers',
    'Test new creative variants for Sponsored Brand campaigns to improve CTR and reduce CPC',
    'Review search term reports for negative keyword opportunities to tighten efficiency'
  ]
};

export const renuvClientAdvertisingContracts = {
  kpis: 'reporting_amazon.client_advertising_kpis',
  campaigns: 'reporting_amazon.client_campaign_performance',
  efficiency: 'reporting_amazon.client_advertising_efficiency'
} as const;
