import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  AgentRegistryItem,
  ApprovalItem,
  ApprovalStatus,
  AuditLogSource,
  CommentGuidanceSource,
  RuntimeSource
} from '@/lib/mission-control-store';
import { readFacebookApprovalsCached } from '@/lib/mission-control-store';
import { getCachedSnapshot, setCachedSnapshot } from '@/lib/dashboard-cache';
import { ensureMetaSyncWorker, waitForFirstSync } from '@/lib/meta-sync-worker';

const mission = 'Our mission is to help brands achieve 10X growth through sharper strategy, stronger execution, and AI-powered leverage.';

const command = {
  ceo: { name: 'Todd', title: 'CEO', note: 'Sets business direction, final approvals, and priorities.' },
  coo: { name: 'Gus', title: 'COO / Agent Operator', note: 'Runs the agent org, assigns work, resolves blockers, and escalates when needed.' }
} as const;

const laneMeta = {
  command: { id: 'command', name: 'Command', accent: '#16324a', summary: 'Top-level operating direction, approvals, and orchestration.' },
  creative: { id: 'creative', name: 'Creative & Content', accent: '#5ea8ff', summary: 'Hooks, concepts, copy, content, and creative packaging.' },
  storefront: { id: 'storefront', name: 'Storefront & Organic', accent: '#8eb8ff', summary: 'SEO, product pages, offers, bundles, and conversion lift.' }
} as const;

type Priority = 'low' | 'medium' | 'high';
type WorkflowStatus = 'on-track' | 'review' | 'blocked' | 'paused';
type Severity = 'critical' | 'high' | 'medium';

type TaskItem = {
  id: string;
  title: string;
  assignee: string;
  lane: string;
  priority: Priority;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
};

type ActivityItem = {
  id: string;
  time: string;
  actor: string;
  summary: string;
  object: string;
};

type WorkflowItem = {
  id: string;
  name: string;
  owner: string;
  cadence: string;
  nextRun: string;
  lastCompleted: string;
  status: WorkflowStatus;
  approval: string;
  output: string;
};

type UsageItem = {
  provider: string;
  spend: number;
  tokens: string;
  requests: number;
  trend: number[];
};

type UsageHistoryProvider = {
  provider: string;
  spend: number;
  tokens: number;
  requests: number;
};

type UsageHistoryDay = {
  date: string;
  providers: UsageHistoryProvider[];
};

type UsageSource = {
  providers: UsageItem[];
  expensiveRuns: Array<{ agent: string; run: string; cost: string; note: string }>;
  history?: UsageHistoryDay[];
  coverageNote?: string;
};

export type { ApprovalItem, ApprovalStatus };
export type DashboardSnapshot = Awaited<ReturnType<typeof buildDashboardSnapshot>>;

async function readDataFile<T>(fileName: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'src/data', fileName);
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function readAuditLog() {
  try {
    return await readDataFile<AuditLogSource>('mission-control-audit-log.json');
  } catch {
    return {
      source: 'mission-control/audit-log.json',
      lastUpdatedAt: new Date().toISOString(),
      events: []
    } satisfies AuditLogSource;
  }
}

async function readCommentGuidance() {
  try {
    return await readDataFile<CommentGuidanceSource>('mission-control-comment-guidance.json');
  } catch {
    return {
      source: 'mission-control/comment-guidance.json',
      lastUpdatedAt: new Date().toISOString(),
      items: [],
      history: []
    } satisfies CommentGuidanceSource;
  }
}

function formatTimestampLabel(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatRelativeFromNow(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function isPendingApproval(status: ApprovalStatus) {
  return status === 'needs-review' || status === 'draft-ready' || status === 'revision-requested';
}

function isFacebookCommentItem(item: { workflowKind?: ApprovalItem['workflowKind']; channel?: ApprovalItem['channel'] }) {
  return item.workflowKind === 'facebook-comment' || item.channel === 'Facebook';
}

function getReplyReadyToPost(item: ApprovalItem) {
  return item.replyReadyToPost ?? item.revisedResponse ?? item.suggestedResponse ?? null;
}

function withStableUniqueIds<T extends { id: string }>(items: T[]) {
  const seen = new Map<string, number>();

  return items.map((item) => {
    const count = (seen.get(item.id) ?? 0) + 1;
    seen.set(item.id, count);
    return count === 1 ? item : { ...item, id: `${item.id}__${count}` };
  });
}

const SKILLS_DIR = path.resolve(process.cwd(), '../../skills');

async function readInstalledSkills(): Promise<Array<{ name: string; description: string; directory: string }>> {
  try {
    const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
    const skills: Array<{ name: string; description: string; directory: string }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
        const raw = await readFile(skillPath, 'utf8');
        const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) continue;
        const frontmatter = frontmatterMatch[1];
        const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);

        // Handle both single-line and multi-line (YAML | block) descriptions
        let description = 'No description available.';
        const descBlockMatch = frontmatter.match(/^description:\s*\|\s*\n([\s\S]*?)(?=\n\S|\n*$)/m);
        if (descBlockMatch) {
          description = descBlockMatch[1].replace(/^\s{2}/gm, '').trim().split('\n').join(' ');
        } else {
          const descLineMatch = frontmatter.match(/^description:\s*(.+)$/m);
          if (descLineMatch) description = descLineMatch[1].trim().replace(/^["']|["']$/g, '');
        }

        skills.push({
          name: nameMatch ? nameMatch[1].trim().replace(/^["']|["']$/g, '') : entry.name,
          description,
          directory: entry.name
        });
      } catch {
        // Skip directories without a valid SKILL.md
      }
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const cached = getCachedSnapshot() as DashboardSnapshot | null;
  if (cached) return cached;
  const data = await buildDashboardSnapshot();
  setCachedSnapshot(data);
  return data;
}

async function buildDashboardSnapshot() {
  // Start the background Meta sync worker (idempotent — only starts once)
  // and wait for the first sync to land so the dashboard doesn't show
  // "Background sync has not completed yet" on every cold start.
  ensureMetaSyncWorker();
  await waitForFirstSync();

  const [registry, runtime, approvalsSync, tasks, activity, workflows, usage, auditLog, commentGuidance] = await Promise.all([
    readDataFile<AgentRegistryItem[]>('mission-control-agent-registry.json'),
    readDataFile<RuntimeSource>('mission-control-runtime.json'),
    readFacebookApprovalsCached(),
    readDataFile<TaskItem[]>('mission-control-tasks.json'),
    readDataFile<ActivityItem[]>('mission-control-activity.json'),
    readDataFile<WorkflowItem[]>('mission-control-workflows.json'),
    readDataFile<UsageSource>('mission-control-usage.json'),
    readAuditLog(),
    readCommentGuidance()
  ]);
  const approvals = approvalsSync.approvals;

  const runtimeById = new Map(runtime.agents.map((agent) => [agent.id, agent]));
  const auditEventsByTarget = new Map<string, AuditLogSource['events']>();

  for (const event of auditLog.events) {
    const key = `${event.targetType}:${event.targetId}`;
    const existing = auditEventsByTarget.get(key) ?? [];
    existing.push(event);
    auditEventsByTarget.set(key, existing);
  }

  const activeAgents = registry
    .map((agent) => {
      const state = runtimeById.get(agent.id);
      if (!state) return null;

      const auditHistory = auditEventsByTarget.get(`agent:${agent.id}`) ?? [];
      const latestAudit = auditHistory[0];

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        lane: agent.lane,
        provider: agent.provider,
        model: agent.model,
        reportsTo: agent.reportsTo,
        responsibilities: agent.responsibilities,
        status: state.status,
        currentTask: state.currentTask,
        focus: state.focus,
        lastHeartbeat: state.lastHeartbeat,
        pendingTasks: state.pendingTasks,
        pendingApprovals: state.pendingApprovals,
        blocker: state.blocker,
        audit: {
          count: auditHistory.length,
          lastAction: latestAudit?.summary ?? null,
          lastActionAt: latestAudit?.timestamp ? formatRelativeFromNow(latestAudit.timestamp) : null,
          lastActionDetail: latestAudit?.detail ?? null
        }
      };
    })
    .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));

  const statusCounts = activeAgents.reduce(
    (acc, agent) => {
      acc[agent.status] += 1;
      return acc;
    },
    { online: 0, busy: 0, idle: 0, blocked: 0, future: 0 }
  );

  const approvalQueue = approvals.items.map((item) => {
    const auditHistory = auditEventsByTarget.get(`approval:${item.id}`) ?? [];
    const latestAudit = auditHistory[0];
    const learningNotes = withStableUniqueIds(
      (item.learningNoteIds ?? [])
        .map((id) => commentGuidance.items.find((note) => note.id === id))
        .filter((note): note is NonNullable<typeof note> => Boolean(note))
    );
    const replyReadyToPost = getReplyReadyToPost(item);

    return {
      ...item,
      replyReadyToPost,
      audit: {
        count: auditHistory.length,
        lastAction: latestAudit?.summary ?? null,
        lastActionAt: latestAudit?.timestamp ? formatRelativeFromNow(latestAudit.timestamp) : null,
        lastActionDetail: latestAudit?.detail ?? null
      },
      learningNotes: learningNotes.map((note) => ({
        id: note.id,
        rule: note.rule,
        timesApplied: note.timesApplied,
        lastAppliedAt: formatRelativeFromNow(note.lastAppliedAt)
      }))
    };
  });

  const facebookApprovalQueue = approvalQueue.filter(isFacebookCommentItem);
  const genericApprovalQueue = approvalQueue.filter((item) => !isFacebookCommentItem(item));
  const usageHistory = usage.history ?? [];
  const todayUsage = usageHistory.at(-1);
  const todaySpend = todayUsage
    ? todayUsage.providers.reduce((sum, provider) => sum + provider.spend, 0)
    : usage.providers.reduce((sum, provider) => sum + provider.spend, 0);

  const summaryStats = [
    {
      label: 'Cost view',
      value: `$${todaySpend.toFixed(2)}`,
      detail: 'Today · switch to yesterday, last 7 days, this month, or a custom range below',
      href: '#usage'
    },
    {
      label: 'Agent roster',
      value: String(activeAgents.length),
      detail: `${statusCounts.online + statusCounts.busy} live · ${statusCounts.blocked} blocked · ${statusCounts.idle} not active · ${statusCounts.future} future`,
      href: '#active-agents'
    },
    {
      label: 'Pending approvals',
      value: String(approvalQueue.filter((item) => isPendingApproval(item.status)).length),
      detail: `${approvalQueue.filter((item) => isPendingApproval(item.status) && item.sla.toLowerCase().includes('overdue')).length} overdue · ${approvalQueue.filter((item) => isPendingApproval(item.status) && item.risk === 'high').length} high risk`,
      href: '#facebook-commenter'
    },
    {
      label: 'In progress',
      value: String(tasks.filter((task) => task.status === 'in-progress').length),
      detail: `${tasks.length} tracked tasks across the operating board`,
      href: '#task-board'
    }
  ];

  const lanes = Object.values(laneMeta)
    .map((lane) => ({
      ...lane,
      agents: activeAgents
        .filter((agent) => registry.find((item) => item.id === agent.id)?.laneId === lane.id)
    }))
    .filter((lane) => lane.agents.length > 0);

  const taskColumns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Awaiting Review' },
    { id: 'done', title: 'Done' }
  ].map((column) => ({
    ...column,
    cards: tasks.filter((task) => task.status === column.id)
  }));

  const alerts = [
    ...activeAgents
      .filter((agent) => agent.status === 'blocked')
      .map((agent) => ({
        severity: 'high' as Severity,
        title: `Unblock ${agent.name}`,
        owner: agent.name,
        openedAt: agent.lastHeartbeat,
        reason: agent.blocker ?? agent.currentTask,
        recommendedAction: `Review ${agent.name}'s blocker and decide whether to unblock, reassign, or stop the task.`,
        nextStep: `${agent.name} can resume execution once Mission Control clears the blocker or changes direction.`,
        ctaLabel: 'Open agent controls',
        href: '#active-agents'
      })),
    ...approvalQueue
      .filter((item) => isPendingApproval(item.status) && item.sla.toLowerCase().includes('overdue'))
      .map((item) => ({
        severity: 'critical' as Severity,
        title: `Make a decision on ${item.title}`,
        owner: item.decisionOwner,
        openedAt: item.requestedAt,
        reason: `This ${item.type.toLowerCase()} is overdue and cannot move forward until ${item.decisionOwner} decides what to do.`,
        recommendedAction: isFacebookCommentItem(item)
          ? 'Open the Meta comment workflow lane, review the original public comment plus the exact reply that will post, then approve it or steer one more revision.'
          : 'Open the approval queue and either approve it, send it back with revisions, or reject it for now.',
        nextStep: isFacebookCommentItem(item)
          ? 'Sammy will keep the postable reply local and visible until you approve it.'
          : 'Once decided, the assigned agent will either execute, revise, or drop the work and the audit trail will update automatically.',
        ctaLabel: isFacebookCommentItem(item) ? 'Open Meta comment workflow' : 'Open approval queue',
        href: isFacebookCommentItem(item) ? '#facebook-commenter' : '#approval-queue'
      })),
    ...workflows
      .filter((workflow) => workflow.status === 'blocked' || workflow.status === 'review')
      .slice(0, 2)
      .map((workflow) => ({
        severity: workflow.status === 'blocked' ? ('high' as Severity) : ('medium' as Severity),
        title: workflow.status === 'blocked' ? `Resolve ${workflow.name}` : `Review ${workflow.name}`,
        owner: workflow.owner,
        openedAt: workflow.lastCompleted,
        reason: `${workflow.output} is not moving cleanly through the current workflow state.`,
        recommendedAction: workflow.status === 'blocked'
          ? 'Check the workflow blocker and choose the next operating move before more work stacks up behind it.'
          : 'Review the current output and confirm whether it should proceed, change, or pause.',
        nextStep: `After your decision, ${workflow.owner} can keep the workflow on schedule or update the cadence accordingly.`,
        ctaLabel: 'Review workflow context',
        href: '#task-board'
      }))
  ].slice(0, 4);

  const commentAgent = activeAgents.find((agent) => agent.id === 'comment-agent') ?? null;
  const commentAgentGuidance = withStableUniqueIds(commentGuidance.items.filter((item) => item.agentId === 'comment-agent'));
  const latestFeedbackEvent = commentGuidance.history[0];

  const skillsRegistry = await readInstalledSkills();

  const recentAudit = auditLog.events.slice(0, 15).map((event) => ({
    ...event,
    timeLabel: formatTimestampLabel(event.timestamp),
    relativeTime: formatRelativeFromNow(event.timestamp)
  }));

  return {
    mission,
    command,
    summaryStats,
    runtimeMeta: {
      source: runtime.source,
      lastSynced: formatTimestampLabel(runtime.lastSyncedAt),
      lastSyncedAt: runtime.lastSyncedAt
    },
    approvalMeta: {
      source: approvals.source,
      lastUpdated: formatTimestampLabel(approvals.lastUpdatedAt),
      lastUpdatedAt: approvals.lastUpdatedAt
    },
    auditMeta: {
      source: auditLog.source,
      lastUpdated: formatTimestampLabel(auditLog.lastUpdatedAt),
      lastUpdatedAt: auditLog.lastUpdatedAt,
      totalEvents: auditLog.events.length
    },
    activeAgents,
    approvalQueue: genericApprovalQueue,
    facebookCommenter: {
      agent: commentAgent,
      items: facebookApprovalQueue,
      integration: {
        source: approvalsSync.connection.source,
        checkedAt: approvalsSync.connection.checkedAt,
        data: approvalsSync.connection.data,
        posting: approvalsSync.connection.posting,
        tokenPath: approvalsSync.connection.tokenPath,
        pageId: approvalsSync.connection.pageId,
        knownCommentCount: approvalsSync.connection.knownCommentCount,
        knownStoryCount: approvalsSync.connection.knownStoryCount,
        newestKnownCommentAt: approvalsSync.connection.newestKnownCommentAt,
        snapshotFetchedAt: approvalsSync.connection.snapshotFetchedAt
      },
      guidance: {
        source: commentGuidance.source,
        totalRules: commentAgentGuidance.length,
        historyCount: commentGuidance.history.length,
        lastUpdatedAt: commentGuidance.lastUpdatedAt,
        lastUpdated: formatTimestampLabel(commentGuidance.lastUpdatedAt),
        recentRules: commentAgentGuidance.slice(0, 4).map((item) => ({
          id: item.id,
          rule: item.rule,
          timesApplied: item.timesApplied,
          lastAppliedAt: formatRelativeFromNow(item.lastAppliedAt)
        })),
        latestFeedbackEvent: latestFeedbackEvent
          ? {
              createdAt: formatRelativeFromNow(latestFeedbackEvent.createdAt),
              feedback: latestFeedbackEvent.feedback,
              operatorDraft: latestFeedbackEvent.operatorDraft,
              revisedResponse: latestFeedbackEvent.revisedResponse
            }
          : null
      }
    },
    lanes,
    taskColumns,
    usage: usage.providers,
    usageHistory,
    usageCoverageNote: usage.coverageNote ?? 'Usage ranges are currently derived from local snapshot data, not a fully live historical feed.',
    expensiveRuns: usage.expensiveRuns,
    alerts,
    activity,
    recentAudit,
    skillsRegistry,
    recurringWorkflows: workflows,
    agentRegistry: registry.map(a => ({ id: a.id, name: a.name, role: a.role, laneId: a.laneId, lane: a.lane })),
    implementationPlan: [
      {
        day: 'Shipped',
        tasks: ['Dedicated Meta comment workflow lane', 'Fast local revise loop with file writes', 'Reusable feedback guidance captured locally', 'Audit trail for approvals + revisions']
      },
      {
        day: 'Planned — next',
        tasks: ['Replace JSON runtime source with orchestration feed', 'Stream event writes into the audit log', 'Normalize usage events into per-run records']
      },
      {
        day: 'Planned — later',
        tasks: ['Real backend subscriptions', 'Historical run timeline', 'Per-agent drill-down pages']
      }
    ]
  };
}

export async function getRuntimeSnapshot() {
  const snapshot = await getDashboardSnapshot();
  return {
    meta: snapshot.runtimeMeta,
    agents: snapshot.activeAgents,
    alerts: snapshot.alerts
  };
}

export async function getApprovalQueueSnapshot() {
  const snapshot = await getDashboardSnapshot();
  return {
    meta: snapshot.approvalMeta,
    items: snapshot.approvalQueue,
    totals: {
      pending: snapshot.approvalQueue.filter((item) => item.status === 'needs-review').length,
      draftReady: snapshot.approvalQueue.filter((item) => item.status === 'draft-ready').length,
      overdue: snapshot.approvalQueue.filter((item) => isPendingApproval(item.status) && item.sla.toLowerCase().includes('overdue')).length
    }
  };
}
