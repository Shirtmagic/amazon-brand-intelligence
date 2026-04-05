export type Tone = 'positive' | 'warning' | 'critical' | 'neutral';
export type Priority = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in-progress' | 'blocked' | 'complete';

export type RenuvNote = {
  id: string;
  timestamp: string;
  author: string;
  category: 'observation' | 'decision' | 'question' | 'action-item';
  title: string;
  detail: string;
  tags: string[];
  relatedModule?: 'advertising' | 'asins' | 'retail-health' | 'traffic-conversion' | 'search';
  sourceView: 'reporting_amazon.team_notes';
};

export type RenuvAction = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: ActionStatus;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  relatedModule?: 'advertising' | 'asins' | 'retail-health' | 'traffic-conversion' | 'search';
  blockerDetail?: string;
  sourceView: 'reporting_amazon.next_actions';
};

export type RenuvDecisionLog = {
  id: string;
  date: string;
  decision: string;
  context: string;
  outcome: string;
  participants: string[];
  sourceView: 'reporting_amazon.decision_log';
};

export type RenuvNotesPageSnapshot = {
  brand: string;
  periodLabel: string;
  environment: 'internal';
  recentNotes: RenuvNote[];
  nextActions: RenuvAction[];
  recentDecisions: RenuvDecisionLog[];
};

export const renuvNotesContracts = {
  notes: `CREATE VIEW reporting_amazon.team_notes AS
SELECT
  note_id,
  created_at,
  author_name,
  note_category,
  note_title,
  note_detail,
  tags,
  related_module
FROM team_collaboration.notes
WHERE brand_id = ?
  AND created_at >= ?
ORDER BY created_at DESC;`,

  actions: `CREATE VIEW reporting_amazon.next_actions AS
SELECT
  action_id,
  action_title,
  action_description,
  priority,
  status,
  assigned_to,
  due_date,
  created_at,
  related_module,
  blocker_detail
FROM team_collaboration.action_items
WHERE brand_id = ?
  AND status IN ('pending', 'in-progress', 'blocked')
ORDER BY
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  due_date ASC;`,

  decisions: `CREATE VIEW reporting_amazon.decision_log AS
SELECT
  decision_id,
  decision_date,
  decision_summary,
  context,
  expected_outcome,
  participants
FROM team_collaboration.decision_log
WHERE brand_id = ?
  AND decision_date >= ?
ORDER BY decision_date DESC;`
};

export const renuvNotesMock: RenuvNotesPageSnapshot = {
  brand: 'Renuv',
  periodLabel: 'L30D',
  environment: 'internal',
  recentNotes: [
    {
      id: 'note-001',
      timestamp: '2026-04-01 14:23 EDT',
      author: 'Sarah Chen',
      category: 'observation',
      title: 'Organic rank slide on high-volume queries',
      detail: 'Three primary ASINs (B0D9MN5RTW, B0D7KJ3PLQ, B0D4GH8WXM) have dropped 2-4 positions on category queries over the past two weeks. Conversion rates remain stable, suggesting this is competitive/algorithmic pressure rather than product quality degradation.',
      tags: ['search', 'organic-rank', 'competitive'],
      relatedModule: 'search',
      sourceView: 'reporting_amazon.team_notes'
    },
    {
      id: 'note-002',
      timestamp: '2026-03-31 11:45 EDT',
      author: 'Marcus Williams',
      category: 'action-item',
      title: 'Review sponsored placement costs for eroding queries',
      detail: 'Since organic positions are declining on key queries like "wrinkle reducer serum" and "anti aging face cream", we should evaluate increasing sponsored coverage temporarily while we address the organic signals. Need ROI analysis before committing budget.',
      tags: ['advertising', 'sponsored', 'budget'],
      relatedModule: 'advertising',
      sourceView: 'reporting_amazon.team_notes'
    },
    {
      id: 'note-003',
      timestamp: '2026-03-30 16:08 EDT',
      author: 'Elena Rodriguez',
      category: 'decision',
      title: 'Approved: Increase daily ad budget by 15% for Q2',
      detail: 'Decision made to raise daily advertising budget from $2,340 to $2,690 for April-June period based on strong ROAS performance in March and anticipated seasonal demand increase.',
      tags: ['advertising', 'budget', 'approved'],
      relatedModule: 'advertising',
      sourceView: 'reporting_amazon.team_notes'
    },
    {
      id: 'note-004',
      timestamp: '2026-03-29 09:34 EDT',
      author: 'Sarah Chen',
      category: 'question',
      title: 'Why is traffic quality declining despite stable conversion?',
      detail: 'Sessions are down but conversion rate is holding. This suggests we\'re getting fewer visitors but they\'re higher quality. Is this a win (more efficient traffic) or a concern (shrinking reach)? Need to cross-check with competitor activity and category trends.',
      tags: ['traffic', 'conversion', 'analysis'],
      relatedModule: 'traffic-conversion',
      sourceView: 'reporting_amazon.team_notes'
    },
    {
      id: 'note-005',
      timestamp: '2026-03-28 13:52 EDT',
      author: 'Marcus Williams',
      category: 'observation',
      title: 'Buybox win rate improving on B0D4GH8WXM',
      detail: 'Primary ASIN buybox ownership increased from 87% to 94% over the past week. Pricing strategy adjustment from 3/24 appears to be working without significantly impacting margin.',
      tags: ['retail-health', 'buybox', 'pricing'],
      relatedModule: 'retail-health',
      sourceView: 'reporting_amazon.team_notes'
    },
    {
      id: 'note-006',
      timestamp: '2026-03-27 10:19 EDT',
      author: 'Elena Rodriguez',
      category: 'action-item',
      title: 'Investigate fee reconciliation discrepancy',
      detail: 'March settlement shows $1,840 variance between expected and actual referral fees. Appears to be related to promotional fee credits not flowing through correctly. Finance team needs to file case with Seller Central.',
      tags: ['retail-health', 'fees', 'reconciliation'],
      relatedModule: 'retail-health',
      sourceView: 'reporting_amazon.team_notes'
    }
  ],
  nextActions: [
    {
      id: 'action-001',
      title: 'Audit and optimize product listings for eroding queries',
      description: 'Review title, bullets, and backend keywords for ASINs B0D9MN5RTW and B0D7KJ3PLQ to improve organic ranking on "wrinkle reducer serum" and "anti aging face cream". Consider A+ content refresh.',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Sarah Chen',
      dueDate: '2026-04-05',
      createdAt: '2026-04-01',
      relatedModule: 'search',
      sourceView: 'reporting_amazon.next_actions'
    },
    {
      id: 'action-002',
      title: 'Calculate ROI for increased sponsored coverage on declining queries',
      description: 'Build cost model for temporarily boosting sponsored placements on queries where organic rank is sliding. Determine budget impact and compare against projected revenue recovery.',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'Marcus Williams',
      dueDate: '2026-04-03',
      createdAt: '2026-03-31',
      relatedModule: 'advertising',
      sourceView: 'reporting_amazon.next_actions'
    },
    {
      id: 'action-003',
      title: 'File Seller Central case for March fee variance',
      description: 'Submit support case documenting the $1,840 referral fee discrepancy and request reconciliation. Include transaction IDs and promotional credit evidence.',
      priority: 'medium',
      status: 'blocked',
      assignedTo: 'Elena Rodriguez',
      dueDate: '2026-04-02',
      createdAt: '2026-03-27',
      relatedModule: 'retail-health',
      blockerDetail: 'Waiting for finance team to provide detailed transaction breakdown.',
      sourceView: 'reporting_amazon.next_actions'
    },
    {
      id: 'action-004',
      title: 'Analyze competitor pricing trends in Face Serums category',
      description: 'Rank dropped from #17 to #22 in Face Serums category. Research top 10 competitors to identify pricing, promotion, or review velocity patterns that might explain the shift.',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Sarah Chen',
      dueDate: '2026-04-08',
      createdAt: '2026-04-01',
      relatedModule: 'search',
      sourceView: 'reporting_amazon.next_actions'
    },
    {
      id: 'action-005',
      title: 'Test messaging variations for underperforming ad groups',
      description: 'Three ad groups have CTR below 0.8%. Create 2-3 new headline/creative variants and run A/B test for one week to identify lift opportunities.',
      priority: 'low',
      status: 'pending',
      assignedTo: 'Marcus Williams',
      dueDate: '2026-04-12',
      createdAt: '2026-03-29',
      relatedModule: 'advertising',
      sourceView: 'reporting_amazon.next_actions'
    }
  ],
  recentDecisions: [
    {
      id: 'decision-001',
      date: '2026-03-30',
      decision: 'Increase Q2 daily ad budget by 15% ($2,340 → $2,690)',
      context: 'Strong March ROAS (4.2x) and anticipated seasonal demand increase for spring skincare routines.',
      outcome: 'Expected 12-18% revenue lift in April-June vs Q1 baseline with maintained or improved efficiency.',
      participants: ['Elena Rodriguez', 'Marcus Williams', 'Finance team'],
      sourceView: 'reporting_amazon.decision_log'
    },
    {
      id: 'decision-002',
      date: '2026-03-24',
      decision: 'Adjust pricing on B0D4GH8WXM to improve buybox win rate',
      context: 'Buybox ownership dropped to 87% due to new competitor undercutting by $1.20. Margin analysis showed room for strategic price adjustment.',
      outcome: 'Buybox win rate recovered to 94% by 3/28 with minimal margin impact (0.4% reduction).',
      participants: ['Sarah Chen', 'Pricing team'],
      sourceView: 'reporting_amazon.decision_log'
    },
    {
      id: 'decision-003',
      date: '2026-03-18',
      decision: 'Pause Sponsored Display campaigns on low-performing ASINs',
      context: 'Three ASINs showing ROAS below 1.8x on Display after 60-day test. Budget reallocation could improve overall efficiency.',
      outcome: 'Freed up $380/day budget for reallocation to high-performing Sponsored Products campaigns.',
      participants: ['Marcus Williams', 'Elena Rodriguez'],
      sourceView: 'reporting_amazon.decision_log'
    }
  ]
};
