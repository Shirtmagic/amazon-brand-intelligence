'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { ApprovalActionCard } from '@/components/mission-control/approval-action-card';
import { FacebookCommenterLane } from '@/components/mission-control/facebook-commenter-lane';
import { WorkflowCalendar } from '@/components/mission-control/workflow-calendar';
import type { DashboardSnapshot } from '@/lib/mission-control';
import { cn } from '@/lib/utils';

type Agent = DashboardSnapshot['activeAgents'][number];

type DashboardShellProps = {
  initialSnapshot: DashboardSnapshot;
  availableModels: string[];
};

type RefreshReason = 'poll' | 'manual' | 'action' | 'focus';

const POLL_INTERVAL_MS = 45_000;
const STALE_WARNING_MS = 120_000;
const STALE_CRITICAL_MS = 5 * 60_000;


type CostRangeKey = 'today' | 'yesterday' | 'last7' | 'month' | 'custom';

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

const COST_RANGE_OPTIONS: Array<{ key: CostRangeKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' }
];


export function DashboardShell({ initialSnapshot, availableModels }: DashboardShellProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefreshReason, setLastRefreshReason] = useState<RefreshReason>('manual');
  const [selectedCostRange, setSelectedCostRange] = useState<CostRangeKey>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const requestRef = useRef(0);

  const refreshSnapshot = useCallback(async (reason: RefreshReason = 'poll') => {
    const requestId = ++requestRef.current;
    if (reason !== 'poll') {
      setIsRefreshing(true);
    }
    setRefreshError(null);

    try {
      const response = await fetch('/api/dashboard', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh dashboard snapshot.');
      }

      const payload = (await response.json()) as DashboardSnapshot;
      if (requestId !== requestRef.current) {
        return;
      }

      setSnapshot(payload);
      setLastRefreshedAt(Date.now());
      setLastRefreshReason(reason);
    } catch (error) {
      if (requestId !== requestRef.current) {
        return;
      }
      setRefreshError(error instanceof Error ? error.message : 'Refresh failed.');
    } finally {
      if (requestId === requestRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshSnapshot('poll');
      }
    }, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshSnapshot('focus');
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshSnapshot]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshTick((tick) => tick + 1);
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const now = Date.now() + refreshTick * 0;
  const diffMs = now - lastRefreshedAt;
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  const refreshStatus = (() => {
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    return `${days}d ago`;
  })();

  const staleState = (() => {
    if (diffMs >= STALE_CRITICAL_MS) return 'critical' as const;
    if (diffMs >= STALE_WARNING_MS) return 'warning' as const;
    return 'healthy' as const;
  })();

  const pendingApprovals = snapshot.approvalQueue.filter(
    (item) => item.status === 'needs-review' || item.status === 'draft-ready' || item.status === 'revision-requested'
  );
  const overdueApprovals = pendingApprovals.filter((item) => item.sla.toLowerCase().includes('overdue'));
  const blockedAgents = snapshot.activeAgents.filter((agent) => agent.status === 'blocked');
  const usageHistory = useMemo(() => (snapshot.usageHistory ?? []) as UsageHistoryDay[], [snapshot.usageHistory]);

  useEffect(() => {
    if (!usageHistory.length) return;
    const firstDate = usageHistory[0]?.date ?? '';
    const lastDate = usageHistory.at(-1)?.date ?? '';
    setCustomStartDate((current) => current || firstDate);
    setCustomEndDate((current) => current || lastDate);
  }, [usageHistory]);

  const costView = useMemo(() => buildCostView({
    usageHistory,
    selectedRange: selectedCostRange,
    customStartDate,
    customEndDate
  }), [usageHistory, selectedCostRange, customStartDate, customEndDate]);

  const totalSpend = costView.totalSpend.toFixed(2);
  const latestAudit = snapshot.recentAudit[0];
  const pendingFacebookItems = snapshot.facebookCommenter.items.filter(
    (item) => item.status === 'needs-review' || item.status === 'draft-ready' || item.status === 'revision-requested'
  );
  const actionableApprovals = pendingApprovals.length + pendingFacebookItems.length;
  const auditSummary = [
    { label: 'Queued approvals', value: String(actionableApprovals), tone: 'navy' as const },
    { label: 'Blocked agents', value: String(blockedAgents.length), tone: 'blue' as const },
    { label: 'Latest control event', value: latestAudit ? latestAudit.relativeTime : 'None yet', tone: 'soft' as const }
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1720px] px-6 py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-6 py-6 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.95fr)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-[var(--navy-900)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white">
                  Mission Control
                </span>
                <LiveBadge isRefreshing={isRefreshing} refreshStatus={refreshStatus} staleState={staleState} />
                <button
                  type="button"
                  onClick={() => void refreshSnapshot('manual')}
                  className="mc-btn mc-btn-ghost"
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh now'}
                </button>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-5xl text-4xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-6xl">
                  Todd’s Agent Operating Dashboard
                </h1>
                <p className="max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  {snapshot.mission}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                  <Tag>Control actions write locally and persist</Tag>
                  <Tag>Refreshes on poll, focus, and control actions</Tag>
                  <Tag>High-risk outward work stays approval-gated</Tag>
                </div>
              </div>

              <StatusBanner staleState={staleState} refreshStatus={refreshStatus} refreshError={refreshError} />

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Last refresh {refreshStatus}</Tag>
                <Tag>Reason {formatRefreshReason(lastRefreshReason)}</Tag>
                <Tag>Runtime {formatAbsolute(snapshot.runtimeMeta.lastSyncedAt)}</Tag>
                <Tag>Approvals {formatAbsolute(snapshot.approvalMeta.lastUpdatedAt)}</Tag>
                <Tag>Audit {formatAbsolute(snapshot.auditMeta.lastUpdatedAt)}</Tag>
              </div>
              {refreshError ? <p className="text-xs text-[#b15d27]">{refreshError}</p> : null}
            </div>

            <div className="space-y-4 xl:pt-2">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {snapshot.summaryStats.map((stat) => (
                  stat.href === '#usage' ? (
                    <CostSummaryCard
                      key={stat.label}
                      rangeLabel={costView.rangeLabel}
                      value={`$${totalSpend}`}
                      detail={costView.summaryDetail}
                      href={stat.href}
                    />
                  ) : (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} href={stat.href} />
                  )
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {auditSummary.map((item) => (
                  <MiniBanner key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Brand workspace" title="Internal product surfaces" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                  The Renuv internal brand workspace is live with full reporting views across performance, advertising, search, retail health, and operational modules.
                </p>
              </div>
              <a href="/renuv/internal" className="mc-btn mc-btn-primary">
                Open Renuv internal overview
              </a>
            </div>
            <div className="mt-5 rounded-[24px] border border-[rgba(94,168,255,0.16)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.94))] p-5 shadow-[0_16px_36px_rgba(19,44,74,0.06)]">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Renuv Amazon Intelligence</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">Internal Renuv surfaces are shipping</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">
                    Includes the internal overview, ASIN performance, and retail-health workspace covering KPIs, catalog risk, listing health, and operational review.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniBanner label="Route" value="/internal/renuv" tone="navy" />
                  <MiniBanner label="Status" value="Internal preview" tone="blue" />
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Command view" title="Operating hierarchy" />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                  <Tag>Role clarity across the full org</Tag>
                  <Tag>Expand each agent for runtime controls, model changes, and live detail</Tag>
                  <Tag>View full history opens the deep task and audit panel</Tag>
                </div>
              </div>
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                Full-width org structure
              </span>
            </div>
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <LeaderCard name={snapshot.command.ceo.name} title={snapshot.command.ceo.title} note={snapshot.command.ceo.note} tone="dark" />
              {(() => {
                const gusAgent = snapshot.activeAgents.find((a) => a.name === 'Gus');
                return gusAgent ? (
                  <div className="rounded-[26px] bg-[linear-gradient(180deg,#3a8df2_0%,#2d74d7_100%)] p-5 shadow-[0_24px_50px_rgba(19,44,74,0.16)] text-white">
                    <HierarchyAgentCard
                      agent={gusAgent}
                      laneId="command"
                      availableModels={availableModels}
                      onDataChanged={() => void refreshSnapshot('action')}
                      onViewHistory={() => setDetailAgent(gusAgent)}
                      leaderVariant
                    />
                  </div>
                ) : (
                  <LeaderCard name={snapshot.command.coo.name} title={snapshot.command.coo.title} note={snapshot.command.coo.note} tone="blue" />
                );
              })()}
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" id="active-agents">
              {snapshot.lanes.length ? snapshot.lanes.map((lane) => (
                <div key={`${lane.id}-full`} className="rounded-[28px] border border-[var(--line-soft)] bg-white/92 p-6 shadow-[0_20px_48px_rgba(19,44,74,0.08)]">
                  <div className="mb-3 inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: lane.accent }}>
                    {lane.name}
                  </div>
                  <p className="mb-5 text-sm leading-6 text-[var(--ink-700)]">{lane.summary}</p>
                  <div className="space-y-3">
                    {lane.agents.map((agent) => (
                      <HierarchyAgentCard
                        key={`${lane.id}-${agent.name}-full`}
                        agent={agent}
                        laneId={lane.id}
                        availableModels={availableModels}
                        onDataChanged={() => void refreshSnapshot('action')}
                        onViewHistory={() => setDetailAgent(agent)}
                      />
                    ))}
                  </div>
                </div>
              )) : <EmptyState title="No hierarchy loaded" detail="Lane cards will render here once agent-to-lane mappings are available." className="md:col-span-2 xl:col-span-3 2xl:col-span-5" />}
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Decision workspace" title="Needs your decision" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                  Start here when something needs operator judgment: each card tells you why it surfaced, the next move to make, and what will happen after you decide.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                  <Tag>{snapshot.alerts.length} live decisions</Tag>
                  <Tag>Recommended next step on every card</Tag>
                  <Tag>Approval-gated work stays protected</Tag>
                </div>
              </div>
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                Operator decision lane
              </span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
              {snapshot.alerts.length ? snapshot.alerts.map((alert) => (
                <div key={`${alert.title}-attention`} className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityPill severity={alert.severity} />
                      <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-700)]">
                        Owner {alert.owner}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--ink-600)]">{alert.openedAt}</span>
                  </div>
                  <h3 className="text-lg font-semibold leading-7 text-[var(--ink-950)]">{alert.title}</h3>

                  <div className="mt-4 space-y-3">
                    <DecisionDetail label="Why this is here" value={alert.reason} />
                    <DecisionDetail label="Recommended next step" value={alert.recommendedAction} emphasize />
                    <DecisionDetail label="What happens next" value={alert.nextStep} />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-4">
                    <p className="text-xs leading-5 text-[var(--ink-600)]">Use this lane to decide, then move into the linked workspace.</p>
                    <a
                      href={alert.href}
                      className="mc-btn mc-btn-primary"
                    >
                      {alert.ctaLabel}
                    </a>
                  </div>
                </div>
              )) : <EmptyState title="No decisions waiting" detail="Everything in the current snapshot is either moving cleanly or already sitting inside the formal approval lane." className="xl:col-span-2 2xl:col-span-4" />}
            </div>
            <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-600)]">Operating rule</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                This lane is for operator judgment, not passive monitoring. High-risk outward work should surface here clearly, then move forward only after an explicit decision.
              </p>
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Dedicated workflow" title="Meta comment workflow / comment response" />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                  <Tag>{snapshot.facebookCommenter.items.length} Meta items</Tag>
                  <Tag>{snapshot.facebookCommenter.guidance.totalRules} stored guidance rules</Tag>
                  <Tag>Original public comment → operator steer → reply that will post if approved</Tag>
                  <Tag>Fast local revision loop</Tag>
                </div>
              </div>
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                {snapshot.facebookCommenter.guidance.source} · updated {snapshot.facebookCommenter.guidance.lastUpdated}
              </span>
            </div>
            <div className="mt-5">
              <FacebookCommenterLane commenter={snapshot.facebookCommenter} onDataChanged={() => void refreshSnapshot('action')} />
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Approval gate" title="General approval queue" />
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                  <Tag>{pendingApprovals.length} actionable</Tag>
                  <Tag>{overdueApprovals.length} overdue</Tag>
                  <Tag>Facebook comments now live in their own dedicated lane</Tag>
                  <Tag>Notes write into the audit trail</Tag>
                </div>
              </div>
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                {snapshot.approvalMeta.source} · updated {snapshot.approvalMeta.lastUpdated}
              </span>
            </div>
            <div className="mt-5 grid gap-3" id="approval-queue">
              {snapshot.approvalQueue.length ? snapshot.approvalQueue.map((item) => (
                <ApprovalActionCard key={item.id} item={item} onDataChanged={() => void refreshSnapshot('action')} />
              )) : <EmptyState title="General approval queue is clear" detail="Facebook comment-response items now surface in their own dedicated section above. Other high-risk approvals will appear here automatically." />}
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-4">
              <SectionHeading eyebrow="Operating cadence" title="Recurring workflows" />
            </div>
            {snapshot.recurringWorkflows.length ? (
              <WorkflowCalendar
                workflows={snapshot.recurringWorkflows}
                agents={snapshot.agentRegistry}
              />
            ) : (
              <EmptyState title="No recurring workflows configured" detail="Recurring operating cadence will show here once workflow definitions exist." />
            )}
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Execution" title="Task board" />
            {snapshot.taskColumns.some((col) => col.cards.length > 0) ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" id="task-board">
                {snapshot.taskColumns.map((column) => (
                  <div key={column.id} className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)]">{column.title}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-[var(--ink-700)]">{column.cards.length}</span>
                    </div>
                    <div className="space-y-3">
                      {column.cards.length ? column.cards.map((card) => (
                        <div key={card.id} className="rounded-[18px] border border-[var(--line-soft)] bg-white p-3 shadow-[0_10px_24px_rgba(19,44,74,0.05)]">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-6 text-[var(--ink-900)]">{card.title}</p>
                            <PriorityPill priority={card.priority} />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                            <Tag>{card.assignee}</Tag>
                            <Tag>{card.lane}</Tag>
                          </div>
                        </div>
                      )) : <EmptyColumnState title={`No items in ${column.title.toLowerCase()}`} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No live tasks connected" detail="Task tracking will appear here once a live task source is wired." className="mt-5" />
            )}
          </Panel>
        </section>

        <OperationsLog activity={snapshot.activity} />

        <section className="mb-6 grid gap-6 xl:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between gap-4">
              <SectionHeading eyebrow="Audit trail" title="Recent control events" />
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                {snapshot.auditMeta.source} · {snapshot.auditMeta.totalEvents} stored
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MiniBanner label="Events stored" value={String(snapshot.auditMeta.totalEvents)} tone="navy" />
              <MiniBanner label="Approval decisions" value={String(snapshot.recentAudit.filter((event) => event.actionKind === 'approval-decision').length)} tone="blue" />
              <MiniBanner label="Training milestones" value={String(snapshot.recentAudit.filter((event) => event.actionKind === 'training-milestone').length)} tone="soft" />
              <MiniBanner label="Agent controls" value={String(snapshot.recentAudit.filter((event) => event.actionKind !== 'approval-decision' && event.actionKind !== 'training-milestone').length)} tone="soft" />
            </div>
            <div className="mt-5 space-y-3" id="audit-trail">
              {snapshot.recentAudit.length ? snapshot.recentAudit.map((event) => (
                <div key={event.id} className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_14px_34px_rgba(19,44,74,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${event.actionKind === 'training-milestone' ? 'text-[#2d8a56]' : 'text-[var(--blue-700)]'}`}>{event.actionKind.replaceAll('-', ' ')}</p>
                      <h3 className="mt-1 text-base font-semibold text-[var(--ink-950)]">{event.summary}</h3>
                    </div>
                    <div className="text-right text-xs text-[var(--ink-600)]">
                      <p>{event.relativeTime}</p>
                      <p>{event.timeLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{event.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                    <Tag>{event.actor}</Tag>
                    <Tag>{event.targetType} · {event.targetLabel}</Tag>
                  </div>
                </div>
              )) : <EmptyState title="No control events recorded" detail="The audit trail is ready; it will fill as approvals and agent controls are used." />}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-4">
              <SectionHeading eyebrow="Delivery path" title="Implementation direction" />
              <span className="rounded-full border border-[var(--line-soft)] bg-[#fff8e8] px-4 py-2 text-xs font-semibold text-[#876a18] shadow-sm">
                Planned · not connected to live data
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {snapshot.implementationPlan.map((phase) => {
                const isShipped = phase.day === 'Shipped';
                return (
                  <div key={phase.day} className={cn('rounded-[20px] border p-4', isShipped ? 'border-[var(--line-soft)] bg-white' : 'border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)]')}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', isShipped ? 'bg-[#e7f2ee] text-[#2d8a56]' : 'bg-[#fff8e8] text-[#876a18]')}>
                        {phase.day}
                      </span>
                      {!isShipped && <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#876a18]">Planned · not connected to live data</span>}
                    </div>
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task} className="flex gap-2 text-sm leading-6 text-[var(--ink-700)]">
                          <span className={cn('mt-2 h-1.5 w-1.5 rounded-full', isShipped ? 'bg-[#2d8a56]' : 'bg-[var(--ink-400)]')} />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
                <h3 className="text-base font-semibold text-[var(--ink-950)]">Most expensive recent runs</h3>
                <div className="mt-4 space-y-3">
                  {snapshot.expensiveRuns.length ? snapshot.expensiveRuns.map((run) => (
                    <div key={run.run} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--panel-muted)] p-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink-950)]">{run.run}</p>
                        <p className="text-sm text-[var(--ink-700)]">{run.agent} · {run.note}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--navy-900)]">{run.cost}</span>
                    </div>
                  )) : <EmptyColumnState title="No expensive runs captured yet" />}
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <SectionHeading eyebrow="Usage" title="Model + provider usage" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                  Switch the spend view by time range. The selector works now, but the underlying history is still sourced from local snapshot data rather than a fully live per-run backend feed.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 lg:items-end">
                <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-800)]" id="usage">
                  {costView.rangeLabel} · ${totalSpend}
                </span>
                <div className="flex flex-wrap gap-2">
                  {COST_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedCostRange(option.key)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${selectedCostRange === option.key ? 'bg-[var(--navy-900)] text-white shadow-[0_12px_24px_rgba(19,44,74,0.16)]' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:border-[rgba(45,116,215,0.22)] hover:text-[var(--blue-700)]'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {selectedCostRange === 'custom' ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--line-soft)] bg-white p-3 shadow-sm">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">
                      From
                      <input type="date" value={customStartDate} max={customEndDate || undefined} onChange={(event) => setCustomStartDate(event.target.value)} className="mt-2 block rounded-full border border-[var(--line-soft)] px-3 py-2 text-sm font-medium text-[var(--ink-800)] outline-none focus:border-[var(--blue-500)]" />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">
                      To
                      <input type="date" value={customEndDate} min={customStartDate || undefined} onChange={(event) => setCustomEndDate(event.target.value)} className="mt-2 block rounded-full border border-[var(--line-soft)] px-3 py-2 text-sm font-medium text-[var(--ink-800)] outline-none focus:border-[var(--blue-500)]" />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-5 rounded-[24px] border border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(94,168,255,0.10),rgba(255,255,255,0.92))] p-4 shadow-[0_16px_36px_rgba(19,44,74,0.06)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Selected spend window</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-950)]">${totalSpend}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{costView.summaryDetail}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Days included" value={String(costView.daysIncluded)} />
                  <MiniStat label="Requests" value={costView.totalRequests.toLocaleString('en-US')} />
                  <MiniStat label="Tokens" value={formatCompactNumber(costView.totalTokens)} />
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--ink-600)]">{snapshot.usageCoverageNote}</p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {costView.providers.length ? costView.providers.map((item) => (
                <div key={item.provider} className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_14px_34px_rgba(19,44,74,0.06)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-[var(--ink-950)]">{item.provider}</h3>
                    <span className="text-sm font-semibold text-[var(--blue-700)]">${item.spend.toFixed(2)}</span>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <MiniStat label="Tokens" value={item.tokens} />
                    <MiniStat label="Requests" value={String(item.requests)} />
                  </div>
                  <div className="flex h-14 items-end gap-1.5">
                    {item.trend.map((value, index) => (
                      <div
                        key={`${item.provider}-${index}`}
                        className="flex-1 rounded-t-full bg-[linear-gradient(180deg,#5ea8ff_0%,#2d74d7_100%)] opacity-90"
                        style={{ height: `${Math.max(18, value)}%` }}
                      />
                    ))}
                  </div>
                </div>
              )) : <EmptyState title="No usage data yet" detail="Provider usage cards will appear once usage snapshots are available." className="md:col-span-3" />}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-4">
              <SectionHeading eyebrow="Skills" title="Skill registry" />
              <span className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-xs font-medium text-[var(--ink-700)] shadow-sm">
                What runs where
              </span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-1 2xl:grid-cols-2">
              {snapshot.skillsRegistry.length ? snapshot.skillsRegistry.map((skill) => (
                <div key={skill.name} className="rounded-[22px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[var(--ink-950)]">{skill.name}</h3>
                    <Tag>{skill.directory}</Tag>
                  </div>
                  <p className="text-sm leading-6 text-[var(--ink-700)]">{skill.description}</p>
                </div>
              )) : <EmptyState title="No skills registered yet" detail="Install skills into the skills/ directory with a SKILL.md to see them here." className="xl:col-span-1 2xl:col-span-2" />}
            </div>
          </Panel>
        </section>
      </div>
      {detailAgent ? (
        <AgentDetailPanel
          agent={detailAgent}
          tasks={snapshot.taskColumns.flatMap((col) => col.cards)}
          auditEvents={snapshot.recentAudit}
          onClose={() => setDetailAgent(null)}
        />
      ) : null}
    </main>
  );
}

function HierarchyAgentCard({
  agent,
  laneId,
  availableModels,
  onDataChanged,
  onViewHistory,
  leaderVariant = false
}: {
  agent: Agent;
  laneId: string;
  availableModels: string[];
  onDataChanged?: () => void;
  onViewHistory: () => void;
  leaderVariant?: boolean;
}) {
  const [selectedModel, setSelectedModel] = useState(agent.model);
  const [currentModel, setCurrentModel] = useState(agent.model);
  const [isPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setSelectedModel(agent.model);
    setCurrentModel(agent.model);
  }, [agent.model]);

  const canStopTask = agent.status === 'online' || agent.status === 'busy' || agent.status === 'blocked';

  const handleModelChange = () => {
    setActionMsg(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/model`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel })
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Failed to change model.');
        setCurrentModel(selectedModel);
        setActionMsg({ type: 'ok', text: `Model updated to ${selectedModel}.` });
        onDataChanged?.();
      } catch (e) {
        setActionMsg({ type: 'err', text: e instanceof Error ? e.message : 'Something went wrong.' });
      }
    });
  };

  const handleStopTask = () => {
    if (!canStopTask) return;
    setActionMsg(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/stop`, { method: 'POST' });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Failed to stop task.');
        setActionMsg({ type: 'ok', text: 'Task stopped. Agent parked for reassignment.' });
        onDataChanged?.();
      } catch (e) {
        setActionMsg({ type: 'err', text: e instanceof Error ? e.message : 'Something went wrong.' });
      }
    });
  };

  return (
    <details key={`${laneId}-${agent.name}-full`} className={cn('group rounded-[20px] p-4', leaderVariant ? 'bg-transparent' : 'border border-[var(--line-soft)] bg-[var(--panel-muted)] open:bg-white')}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn('font-semibold', leaderVariant ? 'text-white text-xl' : 'text-[var(--ink-950)]')}>{agent.name}</p>
            <p className={cn('text-xs font-semibold uppercase tracking-[0.24em] mt-0.5', leaderVariant ? 'text-white/75' : 'hidden')}>{leaderVariant ? 'COO / Agent Operator' : ''}</p>
            <div className="mt-1"><StatusPill status={agent.status} /></div>
            <p className={cn('mt-2 text-xs leading-5', leaderVariant ? 'text-white/82' : 'text-[var(--ink-700)]')}>{agent.role}</p>
          </div>
          <span className={cn('mt-1 text-xs font-semibold uppercase tracking-[0.16em] transition-transform group-open:rotate-180', leaderVariant ? 'text-white/75' : 'text-[var(--blue-700)]')}>Expand</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 border-t border-[var(--line-soft)] pt-3">
        <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
          <Tag>{agent.provider}</Tag>
          <Tag>{currentModel}</Tag>
          <Tag>Reports to {agent.reportsTo}</Tag>
        </div>

        <div className="rounded-[14px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Current task</p>
            {agent.blocker ? <span className="rounded-full bg-[#fff4ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b15d27]">Blocked</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-900)]">{agent.currentTask}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">Focus · {agent.focus}</p>
        </div>

        <div className="grid gap-2 text-xs text-[var(--ink-600)] sm:grid-cols-2">
          <span>Heartbeat · {agent.lastHeartbeat}</span>
          <span>Tracked tasks · {agent.pendingTasks}</span>
          <span>Approvals waiting · {agent.pendingApprovals}</span>
          <span>Control events · {agent.audit.count}</span>
        </div>

        {agent.blocker ? (
          <p className="text-xs text-[var(--ink-600)]">Blocker · {agent.blocker}</p>
        ) : (
          <p className="text-xs text-[var(--ink-600)]">Responsibilities · {agent.responsibilities.join(' · ')}</p>
        )}

        {agent.audit.lastAction ? (
          <div className="rounded-[14px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-2 text-xs text-[var(--ink-700)]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Recent event</span>
              <span>{agent.audit.lastActionAt}</span>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-[var(--ink-900)]">{agent.audit.lastAction}</p>
          </div>
        ) : null}

        <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Runtime model</p>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="mt-1 w-full rounded-[12px] border border-[var(--line-soft)] bg-white px-3 py-2 text-xs text-[var(--ink-900)] shadow-sm"
            >
              {availableModels.map((model) => (
                <option key={`${agent.name}-${model}`} value={model}>{model}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={isPending || selectedModel === currentModel}
            onClick={handleModelChange}
            className="mc-btn mc-btn-ghost text-xs"
          >
            {isPending ? 'Saving…' : 'Apply model'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onViewHistory}
            className="mc-btn mc-btn-ghost text-xs"
          >
            View full history
          </button>
          <button
            type="button"
            disabled={isPending || !canStopTask}
            onClick={handleStopTask}
            className="mc-btn mc-btn-danger text-xs"
          >
            {canStopTask ? 'Stop task' : agent.status === 'future' ? 'Not live yet' : 'Not active'}
          </button>
        </div>

        {actionMsg ? (
          <div className={cn(
            'rounded-[12px] border px-3 py-2 text-xs',
            actionMsg.type === 'err'
              ? 'border-[#ffd6c7] bg-[#fff4ef] text-[#b15d27]'
              : 'border-[#d8e8ff] bg-[#eef6ff] text-[#215ea9]'
          )}>
            {actionMsg.text}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function AgentDetailPanel({
  agent,
  tasks,
  auditEvents,
  onClose
}: {
  agent: Agent;
  tasks: Array<{ id: string; title: string; assignee: string; lane: string; priority: string; status: string }>;
  auditEvents: Array<{ id: string; summary: string; detail: string; relativeTime: string; timeLabel: string; actionKind: string; targetType: string; targetLabel: string; actor: string; targetId: string; timestamp: string; metadata?: Record<string, unknown> }>;
  onClose: () => void;
}) {
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [referenceNow] = useState(() => Date.now());

  const agentTasks = tasks.filter((t) => t.assignee === agent.name);
  const agentAudit = auditEvents.filter(
    (e) => (e.targetType === 'agent' && e.targetId === agent.id) ||
           (e.targetType === 'agent' && e.targetLabel?.includes(agent.name)) ||
           (e.metadata?.agentId === agent.id) ||
           e.actor?.includes(agent.name)
  );

  const filteredAudit = agentAudit.filter((e) => {
    if (timeRange === 'all') return true;
    const ts = new Date(e.timestamp).getTime();
    if (timeRange === '24h') return referenceNow - ts < 86400000;
    if (timeRange === '7d') return referenceNow - ts < 604800000;
    return referenceNow - ts < 2592000000;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative m-4 flex h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-white shadow-[0_32px_80px_rgba(19,44,74,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{agent.lane}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{agent.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-700)]">{agent.role}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill status={agent.status} />
              <Tag>{agent.provider}</Tag>
              <Tag>{agent.model}</Tag>
              <Tag>Reports to {agent.reportsTo}</Tag>
            </div>
          </div>
          <button type="button" onClick={onClose} className="mc-btn mc-btn-ghost text-xs">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)]">Assigned tasks</h3>
            <div className="mt-3 space-y-2">
              {agentTasks.length ? agentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{task.title}</p>
                    <p className="mt-1 text-xs text-[var(--ink-600)]">{task.lane} · {task.status}</p>
                  </div>
                  <PriorityPill priority={task.priority} />
                </div>
              )) : (
                <p className="text-sm text-[var(--ink-600)]">No tracked tasks assigned to {agent.name}.</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)]">Activity history</h3>
              <div className="flex gap-1">
                {(['all', '24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${timeRange === range ? 'bg-[var(--navy-900)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:text-[var(--blue-700)]'}`}
                  >
                    {range === 'all' ? 'All' : range}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {filteredAudit.length ? filteredAudit.map((event) => (
                <div key={event.id} className="rounded-[14px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${event.actionKind === 'training-milestone' ? 'text-[#2d8a56]' : 'text-[var(--blue-700)]'}`}>{event.actionKind.replaceAll('-', ' ')}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{event.summary}</p>
                    </div>
                    <div className="text-right text-xs text-[var(--ink-600)]">
                      <p>{event.relativeTime}</p>
                      <p>{event.timeLabel}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">{event.detail}</p>
                </div>
              )) : (
                <p className="text-sm text-[var(--ink-600)]">No activity recorded{timeRange !== 'all' ? ` in the last ${timeRange}` : ''} for {agent.name}.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AGENT_FILTER_NAMES = ['Gus', 'Cleo', 'Sammy', 'Neil', 'Gentry'] as const;

function OperationsLog({ activity }: { activity: Array<{ id: string; time: string; actor: string; summary: string; object: string }> }) {
  const [agentFilter, setAgentFilter] = useState<string | null>(null);

  const filtered = agentFilter
    ? activity.filter((item) => item.actor === agentFilter)
    : activity;

  return (
    <section className="mb-6">
      <Panel>
        <details>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading eyebrow="Activity" title="Latest operations log" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)] transition-transform">
                {activity.length} entries · click to expand
              </span>
            </div>
          </summary>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAgentFilter(null)}
                className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${!agentFilter ? 'bg-[var(--navy-900)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:text-[var(--blue-700)]'}`}
              >
                All
              </button>
              {AGENT_FILTER_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setAgentFilter(agentFilter === name ? null : name)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${agentFilter === name ? 'bg-[var(--navy-900)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:text-[var(--blue-700)]'}`}
                >
                  {name}
                </button>
              ))}
            </div>
            {filtered.length ? filtered.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-[var(--line-soft)] bg-white p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--navy-900)] text-[10px] font-semibold text-white">
                      {item.actor.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink-900)]">{item.actor}</span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-600)]">{item.time}</span>
                </div>
                <p className="text-xs leading-5 text-[var(--ink-700)]">{item.summary}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--blue-700)]">{item.object}</p>
              </div>
            )) : <EmptyState title="No operations logged yet" detail="New runtime changes, approvals, and control actions will appear here." />}
          </div>
        </details>
      </Panel>
    </section>
  );
}

function LiveBadge({
  isRefreshing,
  refreshStatus,
  staleState
}: {
  isRefreshing: boolean;
  refreshStatus: string;
  staleState: 'healthy' | 'warning' | 'critical';
}) {
  const tone = isRefreshing
    ? 'border-[rgba(45,116,215,0.18)] bg-[#eef6ff]'
    : staleState === 'critical'
      ? 'border-[#ffd6c7] bg-[#fff4ef]'
      : staleState === 'warning'
        ? 'border-[#e4d4af] bg-[#fff8e8]'
        : 'border-[var(--line-soft)] bg-white';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${tone}`}>
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isRefreshing ? 'bg-[var(--blue-500)] mission-pulse' : staleState === 'critical' ? 'bg-[#d27b45]' : staleState === 'warning' ? 'bg-[#c29927]' : 'bg-[#2db56f]'}`} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-700)]">
        {isRefreshing ? 'Refreshing' : staleState === 'critical' ? `Stale · ${refreshStatus}` : staleState === 'warning' ? `Aging · ${refreshStatus}` : `Live-ish · ${refreshStatus}`}
      </span>
    </div>
  );
}

function StatusBanner({
  staleState,
  refreshStatus,
  refreshError
}: {
  staleState: 'healthy' | 'warning' | 'critical';
  refreshStatus: string;
  refreshError: string | null;
}) {
  if (refreshError) {
    return (
      <div className="rounded-[24px] border border-[#ffd6c7] bg-[#fff4ef] p-4 text-sm leading-6 text-[#9a5325]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Refresh issue</p>
        <p className="mt-2">Mission Control could not pull a fresh snapshot. The screen is still showing the last successful state from {refreshStatus}.</p>
      </div>
    );
  }

  if (staleState === 'critical') {
    return (
      <div className="rounded-[24px] border border-[#ffd6c7] bg-[#fff4ef] p-4 text-sm leading-6 text-[#9a5325]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Data freshness</p>
        <p className="mt-2">This view is now stale. Refresh before taking action so approvals and runtime controls reflect the latest local state.</p>
      </div>
    );
  }

  if (staleState === 'warning') {
    return (
      <div className="rounded-[24px] border border-[#e4d4af] bg-[#fff8e8] p-4 text-sm leading-6 text-[#876a18]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Data freshness</p>
        <p className="mt-2">Snapshot is getting old. Polling should recover shortly, but manual refresh is available before making a high-risk decision.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[rgba(94,168,255,0.16)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(45,116,215,0.06))] p-4 text-sm leading-6 text-[var(--ink-800)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Control posture</p>
      <p className="mt-2">Snapshot is fresh. Operator actions, approval decisions, and model changes will rehydrate the dashboard automatically after each write.</p>
    </div>
  );
}

function MiniBanner({ label, value, tone }: { label: string; value: string; tone: 'navy' | 'blue' | 'soft' }) {
  const styles = {
    navy: 'bg-[linear-gradient(180deg,#1f3e5f_0%,#16324a_100%)] text-white',
    blue: 'bg-[linear-gradient(180deg,#5ea8ff_0%,#2d74d7_100%)] text-white',
    soft: 'border border-[var(--line-soft)] bg-white text-[var(--ink-900)]'
  } as const;

  return (
    <div className={`rounded-[22px] p-4 shadow-[0_16px_32px_rgba(19,44,74,0.06)] ${styles[tone]}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'soft' ? 'text-[var(--ink-600)]' : 'text-white/76'}`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function formatAbsolute(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatRefreshReason(value: RefreshReason) {
  const labels: Record<RefreshReason, string> = {
    manual: 'manual refresh',
    poll: 'polling',
    action: 'control write',
    focus: 'window focus'
  };

  return labels[value];
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
      {children}
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{title}</h2>
    </div>
  );
}

function StatCard({ label, value, detail, href }: { label: string; value: string; detail: string; href?: string }) {
  const content = (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-white/90 p-4 shadow-[0_16px_32px_rgba(19,44,74,0.06)] transition-transform hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-950)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">{detail}</p>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}

function CostSummaryCard({ rangeLabel, value, detail, href }: { rangeLabel: string; value: string; detail: string; href?: string }) {
  const content = (
    <div className="rounded-[22px] border border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,#1f3e5f_0%,#16324a_100%)] p-4 text-white shadow-[0_16px_32px_rgba(19,44,74,0.06)] transition-transform hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">Cost view</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/80">{rangeLabel} · {detail}</p>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}

function LeaderCard({ name, title, note, tone }: { name: string; title: string; note: string; tone: 'dark' | 'blue' }) {
  const styles = tone === 'dark'
    ? 'bg-[linear-gradient(180deg,#1f3e5f_0%,#16324a_100%)] text-white'
    : 'bg-[linear-gradient(180deg,#3a8df2_0%,#2d74d7_100%)] text-white';

  return (
    <div className={`rounded-[26px] p-5 shadow-[0_24px_50px_rgba(19,44,74,0.16)] ${styles}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{title}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{name}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/82">{note}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-[#e7f2ff] text-[#1f6fcb]',
    busy: 'bg-[#eaf0ff] text-[#315fc8]',
    idle: 'bg-[#eef2f6] text-[#627587]',
    blocked: 'bg-[#fff0e8] text-[#b15d27]',
    future: 'bg-[#f3eefc] text-[#7b52b9]'
  };

  const labels: Record<string, string> = {
    idle: 'Not Active',
    future: 'Future Agent'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status] ?? styles.idle}`}>{labels[status] ?? status}</span>;
}

function SeverityPill({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-[#16324a] text-white',
    high: 'bg-[#2d74d7] text-white',
    medium: 'bg-[#eaf2ff] text-[#315fc8]'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[severity] ?? styles.medium}`}>{severity}</span>;
}

function DecisionDetail({
  label,
  value,
  emphasize = false
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`rounded-[18px] border p-4 ${emphasize ? 'border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))]' : 'border-[var(--line-soft)] bg-[var(--panel-muted)]'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'bg-[#16324a] text-white',
    medium: 'bg-[#eaf2ff] text-[#315fc8]',
    low: 'bg-[#eef2f6] text-[#627587]'
  };

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${styles[priority] ?? styles.low}`}>{priority}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--panel-muted)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function EmptyState({ title, detail, className }: { title: string; detail: string; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] p-5 text-sm leading-6 text-[var(--ink-700)] ${className ?? ''}`}>
      <p className="font-semibold text-[var(--ink-900)]">{title}</p>
      <p className="mt-2">{detail}</p>
    </div>
  );
}

function EmptyColumnState({ title }: { title: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--line-soft)] bg-white/70 p-3 text-xs leading-5 text-[var(--ink-600)]">
      {title}
    </div>
  );
}


function buildCostView({
  usageHistory,
  selectedRange,
  customStartDate,
  customEndDate
}: {
  usageHistory: UsageHistoryDay[];
  selectedRange: CostRangeKey;
  customStartDate: string;
  customEndDate: string;
}) {
  const normalizedHistory = [...usageHistory].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = normalizedHistory.at(-1)?.date ?? null;
  const lastDateValue = lastDate ? new Date(`${lastDate}T00:00:00`).getTime() : null;

  const filteredDays = normalizedHistory.filter((day) => {
    if (!lastDateValue) return false;
    const dayValue = new Date(`${day.date}T00:00:00`).getTime();
    if (selectedRange === 'today') return day.date === lastDate;
    if (selectedRange === 'yesterday') return dayValue === lastDateValue - 86400000;
    if (selectedRange === 'last7') return dayValue >= lastDateValue - (6 * 86400000) && dayValue <= lastDateValue;
    if (selectedRange === 'month') {
      const last = new Date(`${lastDate}T00:00:00`);
      const monthStart = new Date(last.getFullYear(), last.getMonth(), 1).getTime();
      return dayValue >= monthStart && dayValue <= lastDateValue;
    }
    if (!customStartDate || !customEndDate) return false;
    return day.date >= customStartDate && day.date <= customEndDate;
  });

  const totals = new Map<string, { provider: string; spend: number; requests: number; tokens: number; trend: number[] }>();
  for (const day of filteredDays) {
    for (const item of day.providers) {
      const current = totals.get(item.provider) ?? { provider: item.provider, spend: 0, requests: 0, tokens: 0, trend: [] };
      current.spend += item.spend;
      current.requests += item.requests;
      current.tokens += item.tokens;
      current.trend.push(Math.max(12, Math.round(item.spend * 12)));
      totals.set(item.provider, current);
    }
  }

  const providers = Array.from(totals.values())
    .sort((a, b) => b.spend - a.spend)
    .map((item) => ({
      provider: item.provider,
      spend: Number(item.spend.toFixed(2)),
      requests: item.requests,
      tokens: formatCompactNumber(item.tokens),
      trend: item.trend
    }));

  const totalSpend = providers.reduce((sum, item) => sum + item.spend, 0);
  const totalRequests = Array.from(totals.values()).reduce((sum, item) => sum + item.requests, 0);
  const totalTokens = Array.from(totals.values()).reduce((sum, item) => sum + item.tokens, 0);
  const rangeLabel = COST_RANGE_OPTIONS.find((option) => option.key === selectedRange)?.label ?? 'Custom';
  const dateLabel = filteredDays.length
    ? `${formatDateLabel(filteredDays[0].date)}${filteredDays.length > 1 ? ` → ${formatDateLabel(filteredDays.at(-1)!.date)}` : ''}`
    : 'No dates in range';

  return {
    providers,
    totalSpend,
    totalRequests,
    totalTokens,
    daysIncluded: filteredDays.length,
    rangeLabel,
    summaryDetail: filteredDays.length ? `${dateLabel} · ${providers.length} providers rolled up` : 'Choose a valid range inside the available snapshot window.'
  };
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCompactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}
