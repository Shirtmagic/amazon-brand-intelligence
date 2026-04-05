'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DashboardSnapshot } from '@/lib/mission-control';
import { cn } from '@/lib/utils';

type FacebookCommenterSnapshot = DashboardSnapshot['facebookCommenter'];
type CommentItem = FacebookCommenterSnapshot['items'][number];
type CommentCardItem = CommentItem & {
  audit?: CommentItem['audit'];
  learningNotes?: CommentItem['learningNotes'];
  noPublicReplyRecommended?: boolean;
  commentHidden?: boolean;
};

type LaneFlash = {
  tone: 'success' | 'info';
  message: string;
};

function isMetaAuthBlocked(detail: string) {
  return /session has expired|expired|invalid token|access token|oauth/i.test(detail);
}

function getPostingGuard(copy: FacebookCommenterSnapshot['integration']) {
  const detail = `${copy.posting.detail} ${copy.data.detail}`.trim();
  const blocked = copy.posting.status !== 'ready';
  const authBlocked = blocked && isMetaAuthBlocked(detail);

  return {
    blocked,
    authBlocked,
    title: authBlocked
      ? 'Meta session expired — posting and moderation are blocked'
      : blocked
        ? 'Meta posting unavailable — posting and moderation are blocked'
        : 'Meta posting healthy',
    summary: blocked
      ? 'Approve reply, Hide comment, and Unhide comment are disabled until Mission Control has a working Meta session again.'
      : 'Approve reply and moderation actions are currently available.',
    detail: copy.posting.detail
  };
}

function getItemReplyText(item: Pick<CommentCardItem, 'replyReadyToPost' | 'revisedResponse' | 'suggestedResponse'>) {
  return item.replyReadyToPost ?? item.revisedResponse ?? item.suggestedResponse ?? '';
}

function formatThreadEntryTimestamp(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getItemVersionTimestamp(item: Pick<CommentCardItem, 'revisedAt' | 'decidedAt'>) {
  const revisedAt = item.revisedAt ? new Date(item.revisedAt).getTime() : 0;
  const decidedAt = item.decidedAt ? new Date(item.decidedAt).getTime() : 0;
  return Math.max(revisedAt, decidedAt, 0);
}

function normalizeCommentItem(item: CommentCardItem): CommentItem {
  return {
    ...item,
    replyReadyToPost: item.replyReadyToPost ?? item.revisedResponse ?? item.suggestedResponse ?? null,
    audit: item.audit ?? {
      count: 0,
      lastAction: null,
      lastActionAt: null,
      lastActionDetail: null
    },
    learningNotes: item.learningNotes ?? []
  };
}

function isNoPublicReplyItem(item: CommentCardItem) {
  if (item.noPublicReplyRecommended === true) {
    return true;
  }

  if (item.noPublicReplyRecommended === false) {
    return false;
  }

  const hasReplyWorkflowFields = item.responseTitle?.toLowerCase().includes('reply that will post if approved')
    || Boolean(item.replyReadyToPost?.trim())
    || Boolean(item.revisedResponse?.trim());

  if (hasReplyWorkflowFields) {
    return false;
  }

  const haystack = [
    item.type,
    item.title,
    item.summary,
    item.responseTitle,
    item.suggestedResponse
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes('no public reply')
    || haystack.includes('no-reply')
    || haystack.includes('no reply recommended')
    || haystack.includes('no-reply decision');
}

function hasExistingPageReply(item: Pick<CommentCardItem, 'threadContext'>) {
  return (item.threadContext?.existingReplyCount ?? 0) > 0;
}

function isActiveReviewItem(item: CommentItem) {
  const isPendingStatus = item.status === 'needs-review' || item.status === 'draft-ready' || item.status === 'revision-requested';
  if (!isPendingStatus) {
    return false;
  }

  // Reopened items stay active even if the page already replied (the operator
  // chose to bring them back deliberately).  Items that were never touched and
  // already have a page reply are still filtered out of the working queue.
  const wasReopened = item.lastRevisionState === 'updated' && !item.decidedAt;
  if (wasReopened) {
    return true;
  }

  return !hasExistingPageReply(item);
}

function getDecisionFlashMessage(params: {
  decision: 'approve' | 'reject' | 'dismiss';
  item?: CommentCardItem;
  isNoPublicReply: boolean;
}) {
  const { decision, item, isNoPublicReply } = params;

  if (decision === 'approve') {
    return 'Approved. That comment left the active review queue and the next pending item is now in focus.';
  }

  if (decision === 'dismiss') {
    return 'Removed from the active review queue. The next pending Facebook comment is now loaded.';
  }

  if (item && isActiveReviewItem(item)) {
    return isNoPublicReply
      ? 'Rejected the no-reply recommendation and reopened this comment as a normal reply workflow.'
      : 'Kept this item active for more work.';
  }

  return isNoPublicReply
    ? 'Rejected the recommendation and moved on.'
    : 'Rejected for now. That item left the active review queue and the next pending comment is now loaded.';
}

export function FacebookCommenterLane({
  commenter,
  onDataChanged
}: {
  commenter: FacebookCommenterSnapshot;
  onDataChanged?: () => void;
}) {
  const revisedItems = commenter.items.filter((item) => item.lastRevisionState === 'updated');
  const postingGuard = getPostingGuard(commenter.integration);
  const activeItems = useMemo(() => commenter.items.filter(isActiveReviewItem), [commenter.items]);
  const resolvedItems = useMemo(() => commenter.items.filter((item) => !isActiveReviewItem(item)), [commenter.items]);
  const [activeItemId, setActiveItemId] = useState<string | null>(activeItems[0]?.id ?? null);
  const [laneFlash, setLaneFlash] = useState<LaneFlash | null>(null);

  const activeItem = activeItems.length
    ? (activeItems.find((item) => item.id === activeItemId) ?? activeItems[0])
    : null;
  const activeIndex = activeItem ? activeItems.findIndex((item) => item.id === activeItem.id) : -1;
  const currentPosition = activeIndex >= 0 ? activeIndex + 1 : 0;
  const remainingCount = activeIndex >= 0 ? Math.max(activeItems.length - currentPosition, 0) : 0;
  const nextItems = activeIndex >= 0 ? activeItems.slice(activeIndex + 1) : [];
  const queuePreviewItems = activeIndex >= 0 ? activeItems.slice(activeIndex, activeIndex + 4) : [];

  const handleActiveItemResolved = (params: {
    resolvedId: string;
    decision: 'approve' | 'reject' | 'dismiss';
    item?: CommentCardItem;
    isNoPublicReply: boolean;
  }) => {
    const { resolvedId, decision, item, isNoPublicReply } = params;
    const currentIndex = activeItems.findIndex((entry) => entry.id === resolvedId);
    const nextCandidate = activeItems[currentIndex + 1] ?? activeItems[currentIndex - 1] ?? null;
    const keepsItemActive = item ? isActiveReviewItem(item) : false;

    if (keepsItemActive && item) {
      setActiveItemId(item.id);
      setLaneFlash({
        tone: 'info',
        message: getDecisionFlashMessage({ decision, item, isNoPublicReply })
      });
      onDataChanged?.();
      return;
    }

    setActiveItemId(nextCandidate?.id ?? null);
    setLaneFlash({
      tone: 'success',
      message: getDecisionFlashMessage({ decision, item, isNoPublicReply })
    });
    onDataChanged?.();
  };

  return (
    <div className="space-y-5" id="facebook-commenter">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="rounded-[24px] border border-[var(--line-soft)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.92))] p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="dark">Dedicated workflow</Pill>
            <Pill tone="soft">Review + steering, not direct chat</Pill>
            <Pill tone="soft">Single postable reply</Pill>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">Meta comment workflow</h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
            This is the dedicated workspace for Meta comment-response items that still need action. Comments that already have a page reply stay visible for reference below, but they do not stay in the live working queue. When live Graph access is down, Mission Control reopens unresolved snapshot comments instead of pretending the queue is empty.
          </p>
          <div className={cn(
            'mt-4 rounded-[18px] border px-4 py-4',
            postingGuard.blocked
              ? 'border-[#ffd6c7] bg-[#fff4ef]'
              : 'border-[#d8e8ff] bg-[#eef6ff]'
          )}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={postingGuard.blocked ? 'dark' : 'soft'}>{postingGuard.title}</Pill>
              <Tag>{postingGuard.blocked ? 'Actions fail closed' : 'Actions enabled'}</Tag>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[var(--ink-950)]">{postingGuard.summary}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{postingGuard.detail}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Comment feed source</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                <Tag>{commenter.integration.source === 'graph-live' ? 'Live Graph' : commenter.integration.source === 'report-snapshot' ? 'Stored Meta snapshot' : 'Mock only'}</Tag>
                <Tag>Page {commenter.integration.pageId}</Tag>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-800)]">{commenter.integration.data.detail}</p>
              {commenter.integration.knownCommentCount ? (
                <p className="mt-2 text-xs leading-5 text-[var(--ink-600)]">
                  Known imported backlog: {commenter.integration.knownCommentCount} comment{commenter.integration.knownCommentCount === 1 ? '' : 's'} across {commenter.integration.knownStoryCount ?? '?'} stor{commenter.integration.knownStoryCount === 1 ? 'y' : 'ies'}.
                  {commenter.integration.newestKnownCommentAt ? ` Newest captured comment: ${formatThreadEntryTimestamp(commenter.integration.newestKnownCommentAt) ?? commenter.integration.newestKnownCommentAt}.` : ''}
                  {commenter.integration.snapshotFetchedAt ? ` Snapshot file updated ${formatThreadEntryTimestamp(commenter.integration.snapshotFetchedAt) ?? commenter.integration.snapshotFetchedAt}.` : ''}
                </p>
              ) : null}
            </div>
            <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Reply posting</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                <Tag>{commenter.integration.posting.status === 'ready' ? 'Posting enabled' : 'Posting blocked'}</Tag>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-800)]">{commenter.integration.posting.detail}</p>
            </div>
          </div>
          {commenter.agent ? (
            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Responsible agent</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-semibold text-[var(--ink-950)]">{commenter.agent.name}</h4>
                  <StatusPill status={commenter.agent.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--ink-700)]">{commenter.agent.role}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                  <Tag>{commenter.agent.provider}</Tag>
                  <Tag>{commenter.agent.model}</Tag>
                  <Tag>Reports to {commenter.agent.reportsTo}</Tag>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-800)]">Current focus · {commenter.agent.focus}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                <MetricCard label="Tracked comments" value={String(commenter.items.length)} />
                <MetricCard label="Needs action now" value={String(activeItems.length)} />
                <MetricCard label="Updated fast" value={String(revisedItems.length)} />
              </div>
            </div>
          ) : (
            <EmptyState title="Sammy not loaded" detail="The dedicated commenter lane is ready, but the responsible agent is missing from local runtime data." />
          )}
        </div>

        <details className="group rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Background learning</p>
              <h4 className="mt-2 text-lg font-semibold text-[var(--ink-950)]">Hidden by default, still improving</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                Feedback capture and reusable guidance still run locally, but the main workspace stays focused on comments and replies.
              </p>
            </div>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)] transition-transform group-open:rotate-180">Details</span>
          </summary>
          <div className="mt-4 space-y-4 border-t border-[var(--line-soft)] pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Stored guidance rules" value={String(commenter.guidance.totalRules)} />
              <MetricCard label="Feedback events saved" value={String(commenter.guidance.historyCount)} />
            </div>
            <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Latest captured steer</p>
              {commenter.guidance.latestFeedbackEvent ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-900)]">{commenter.guidance.latestFeedbackEvent.feedback}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--blue-700)]">Saved {commenter.guidance.latestFeedbackEvent.createdAt}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">No Facebook reply guidance has been captured yet.</p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Saved commenter rules</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                  These stay local and keep the fast revision loop consistent without cluttering the main working area.
                </p>
              </div>
              {commenter.guidance.recentRules.length ? commenter.guidance.recentRules.map((rule) => (
                <div key={rule.id} className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                  <p className="text-sm leading-6 text-[var(--ink-900)]">{rule.rule}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                    <Tag>Applied {rule.timesApplied}x</Tag>
                    <Tag>Last used {rule.lastAppliedAt}</Tag>
                  </div>
                </div>
              )) : <EmptyState title="No rules stored yet" detail="Once Todd sends feedback or replacement copy, the saved guidance will show up here." />}
            </div>
            <div className="rounded-[18px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">How the fast loop works</p>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-700)]">
                <li>1. Todd reviews the original public comment and the reply that will post if approved.</li>
                <li>2. Todd adds steering notes or pastes replacement copy.</li>
                <li>3. Mission Control updates the postable reply and writes the steering to local files.</li>
                <li>4. Sammy returns the updated postable reply in-app and marks what guidance was applied.</li>
                <li>5. Approve Reply uses that exact displayed reply.</li>
              </ol>
            </div>
          </div>
        </details>
      </div>

      {laneFlash ? (
        <div className={cn(
          'rounded-[18px] border px-4 py-3 text-sm leading-6',
          laneFlash.tone === 'success'
            ? 'border-[#d8e8ff] bg-[#eef6ff] text-[#215ea9]'
            : 'border-[var(--line-soft)] bg-white text-[var(--ink-800)]'
        )}>
          {laneFlash.message}
        </div>
      ) : null}

      {activeItem ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <FacebookCommentCard
            key={activeItem.id}
            item={activeItem}
            integration={commenter.integration}
            onDataChanged={onDataChanged}
            onResolved={handleActiveItemResolved}
          />

          <div className="space-y-4">
            <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Active review queue</p>
                  <h4 className="mt-2 text-lg font-semibold text-[var(--ink-950)]">
                    Item {currentPosition} of {activeItems.length}
                  </h4>
                </div>
                <div className="rounded-full border border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.14),rgba(255,255,255,0.95))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
                  {remainingCount === 0 ? 'Final item in queue' : `${remainingCount} remaining after this`}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                {'This queue only shows comments that still need action. When a page reply already exists on the thread, that comment leaves the live queue and stays below for reference only.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Current position" value={`${currentPosition}`} />
                <MetricCard label="Actionable now" value={`${activeItems.length}`} />
                <MetricCard label="Remaining after this" value={`${remainingCount}`} />
              </div>
              <div className="mt-4 rounded-[18px] border border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">Now reviewing</p>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
                    #{currentPosition} in queue
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-950)]">{activeItem.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{activeItem.summary}</p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Queue preview</p>
                  <p className="text-xs text-[var(--ink-600)]">
                    {remainingCount === 0 ? 'Nothing waiting behind the current item.' : `Next up: ${remainingCount} more ${remainingCount === 1 ? 'comment' : 'comments'}.`}
                  </p>
                </div>
                <div className="space-y-3">
                  {queuePreviewItems.map((item, index) => {
                    const queueNumber = currentPosition + index;
                    const isCurrentQueueItem = index === 0;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded-[18px] border p-4',
                          isCurrentQueueItem
                            ? 'border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))]'
                            : 'border-[var(--line-soft)] bg-[var(--panel-muted)]'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
                              {isCurrentQueueItem ? 'Now' : index === 1 ? 'Up next' : `Then #${queueNumber}`}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">#{queueNumber} · {item.title}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.summary}</p>
                      </div>
                    );
                  })}
                </div>
                {!nextItems.length ? (
                  <div className="rounded-[18px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] p-4 text-sm leading-6 text-[var(--ink-700)]">
                    No other pending Facebook comments are waiting behind this one.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState title="No Facebook comments currently need action" detail="The live queue is clear. Comments that already have a page reply — plus other resolved items — stay available below for reference and audit history." />
      )}

      {resolvedItems.length ? (
        <details className="group rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Resolved + reference items</p>
              <h4 className="mt-2 text-lg font-semibold text-[var(--ink-950)]">Not actionable now, still available for reference</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
                These comments are out of the live working queue because they were resolved, dismissed, or already have a page reply on the thread. Their local state and audit history are still preserved.
              </p>
            </div>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)] transition-transform group-open:rotate-180">Details</span>
          </summary>
          <div className="mt-4 grid gap-3 border-t border-[var(--line-soft)] pt-4 xl:grid-cols-2">
            {resolvedItems.map((item) => (
              <ResolvedItemCard key={item.id} item={item} onDataChanged={onDataChanged} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function ResolvedItemCard({ item, onDataChanged }: { item: CommentItem; onDataChanged?: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reopened, setReopened] = useState(false);

  async function handleReopen() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/approval-queue/${item.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'reopen' })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to reopen.' }));
        throw new Error(data.error ?? 'Failed to reopen.');
      }
      setReopened(true);
      onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <Tag>{item.type}</Tag>
        <Tag>{item.account ?? 'Facebook'}</Tag>
        {hasExistingPageReply(item) ? <Tag>Page already replied</Tag> : null}
        {reopened ? <Tag>Reopened</Tag> : null}
      </div>
      <h5 className="mt-3 text-base font-semibold text-[var(--ink-950)]">{item.title}</h5>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{item.summary}</p>
      {item.audit.lastAction ? (
        <div className="mt-3 rounded-[16px] border border-[var(--line-soft)] bg-white px-3 py-2 text-sm leading-6 text-[var(--ink-700)]">
          <p className="font-semibold text-[var(--ink-900)]">{item.audit.lastAction}</p>
          {item.audit.lastActionDetail ? <p className="mt-1">{item.audit.lastActionDetail}</p> : null}
        </div>
      ) : null}
      {!reopened ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handleReopen}
          className="mt-3 rounded-full border border-[var(--blue-600)] bg-white px-4 py-1.5 text-sm font-semibold text-[var(--blue-700)] transition-colors hover:bg-[var(--blue-50)] disabled:opacity-50"
        >
          {isPending ? 'Reopening…' : 'Reopen for review'}
        </button>
      ) : (
        <p className="mt-3 text-sm font-medium text-[var(--green-700)]">Reopened — refresh to see it in the active queue.</p>
      )}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function FacebookCommentCard({
  item,
  integration,
  onDataChanged,
  onResolved
}: {
  item: CommentItem;
  integration: FacebookCommenterSnapshot['integration'];
  onDataChanged?: () => void;
  onResolved?: (params: {
    resolvedId: string;
    decision: 'approve' | 'reject' | 'dismiss';
    item?: CommentCardItem;
    isNoPublicReply: boolean;
  }) => void;
}) {
  const [currentItem, setCurrentItem] = useState(() => normalizeCommentItem(item));
  const [feedback, setFeedback] = useState(item.operatorFeedback ?? '');
  const [operatorDraft, setOperatorDraft] = useState(item.operatorDraft ?? '');
  const [postableReply, setPostableReply] = useState(getItemReplyText(item));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const previousItemIdRef = useRef(item.id);
  const serverFeedbackRef = useRef(item.operatorFeedback ?? '');
  const serverOperatorDraftRef = useRef(item.operatorDraft ?? '');
  const serverPostableReplyRef = useRef(getItemReplyText(item));
  const currentItemVersionRef = useRef(getItemVersionTimestamp(item));

  useEffect(() => {
    const normalizedItem = normalizeCommentItem(item);
    const nextFeedback = item.operatorFeedback ?? '';
    const nextOperatorDraft = item.operatorDraft ?? '';
    const nextPostableReply = getItemReplyText(item);
    const itemChanged = previousItemIdRef.current !== item.id;
    const incomingVersion = getItemVersionTimestamp(normalizedItem);
    const currentVersion = currentItemVersionRef.current;
    const wouldRollbackVisibleReply = !itemChanged
      && incomingVersion < currentVersion
      && nextPostableReply !== serverPostableReplyRef.current;

    if (wouldRollbackVisibleReply) {
      return;
    }

    setCurrentItem(normalizedItem);

    if (itemChanged) {
      previousItemIdRef.current = item.id;
      currentItemVersionRef.current = incomingVersion;
      serverFeedbackRef.current = nextFeedback;
      serverOperatorDraftRef.current = nextOperatorDraft;
      serverPostableReplyRef.current = nextPostableReply;
      setFeedback(nextFeedback);
      setOperatorDraft(nextOperatorDraft);
      setPostableReply(nextPostableReply);
      setMessage(null);
      setError(null);
      return;
    }

    currentItemVersionRef.current = incomingVersion;

    setFeedback((current) => {
      const shouldSync = current === serverFeedbackRef.current;
      serverFeedbackRef.current = nextFeedback;
      return shouldSync ? nextFeedback : current;
    });

    setOperatorDraft((current) => {
      const shouldSync = current === serverOperatorDraftRef.current;
      serverOperatorDraftRef.current = nextOperatorDraft;
      return shouldSync ? nextOperatorDraft : current;
    });

    setPostableReply((current) => {
      const shouldSync = current === serverPostableReplyRef.current;
      serverPostableReplyRef.current = nextPostableReply;
      return shouldSync ? nextPostableReply : current;
    });
  }, [item]);

  const isActionable = currentItem.status === 'needs-review' || currentItem.status === 'draft-ready' || currentItem.status === 'revision-requested';
  const isNoPublicReply = isNoPublicReplyItem(currentItem);
  const postingGuard = getPostingGuard(integration);
  const areMetaWriteActionsBlocked = postingGuard.blocked;
  const revisedLabel = useMemo(() => {
    if (!currentItem.revisedAt) return 'No fast revision yet';
    const diffMs = Date.now() - new Date(currentItem.revisedAt).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
    if (diffMinutes < 1) return 'Updated just now';
    if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
    return `Updated ${Math.round(diffMinutes / 60)}h ago`;
  }, [currentItem.revisedAt]);
  const trimmedOperatorDraft = operatorDraft.trim();
  const visibleReplyThatWillPost = trimmedOperatorDraft || postableReply || 'No reply attached yet.';
  const isUsingUnsavedReplacementCopy = Boolean(trimmedOperatorDraft) && trimmedOperatorDraft !== postableReply;

  const handleFastRevision = async () => {
    if (!isActionable || isPending) return;

    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/facebook-commenter/${currentItem.id}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback, operatorDraft })
      });

      const payload = (await response.json()) as { error?: string; approval?: CommentCardItem };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to generate a fast revision.');
      }

      if (payload.approval) {
        const normalizedApproval = normalizeCommentItem(payload.approval);
        const revisedReply = getItemReplyText(payload.approval);
        setCurrentItem(normalizedApproval);
        currentItemVersionRef.current = getItemVersionTimestamp(normalizedApproval);
        serverFeedbackRef.current = normalizedApproval.operatorFeedback ?? '';
        serverOperatorDraftRef.current = normalizedApproval.operatorDraft ?? '';
        serverPostableReplyRef.current = revisedReply;
        setPostableReply(revisedReply);
      }

      setFeedback('');
      setOperatorDraft('');
      setMessage('Reply that will post has been updated in-app and saved to local guidance.');
      onDataChanged?.();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
    } finally {
      setIsPending(false);
    }
  };

  const handleVisibility = async (hidden: boolean) => {
    if (isPending) return;

    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/facebook-commenter/${currentItem.id}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hidden,
          note: feedback.trim() || undefined
        })
      });

      const payload = (await response.json()) as { error?: string; item?: CommentCardItem };
      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to ${hidden ? 'hide' : 'unhide'} Facebook comment.`);
      }

      if (payload.item) {
        const normalizedItem = normalizeCommentItem(payload.item);
        const nextReply = getItemReplyText(payload.item);
        setCurrentItem(normalizedItem);
        currentItemVersionRef.current = getItemVersionTimestamp(normalizedItem);
        serverFeedbackRef.current = normalizedItem.operatorFeedback ?? '';
        serverOperatorDraftRef.current = normalizedItem.operatorDraft ?? '';
        serverPostableReplyRef.current = nextReply;
        setPostableReply(nextReply);
        setFeedback(normalizedItem.operatorFeedback ?? '');
        setOperatorDraft(normalizedItem.operatorDraft ?? '');
      }

      setMessage(hidden ? 'Comment hidden on Facebook and recorded in the audit trail.' : 'Comment unhidden on Facebook and recorded in the audit trail.');
      onDataChanged?.();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDecision = async (decision: 'approve' | 'reject' | 'dismiss') => {
    if (isPending) return;

    setError(null);
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(`/api/approval-queue/${currentItem.id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          note: feedback.trim() || undefined,
          replyText: decision === 'approve' ? visibleReplyThatWillPost : undefined
        })
      });

      const payload = (await response.json()) as { error?: string; item?: CommentCardItem };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to update approval item.');
      }

      if (payload.item) {
        const normalizedItem = normalizeCommentItem(payload.item);
        const nextReply = getItemReplyText(payload.item);
        setCurrentItem(normalizedItem);
        currentItemVersionRef.current = getItemVersionTimestamp(normalizedItem);
        serverFeedbackRef.current = normalizedItem.operatorFeedback ?? '';
        serverOperatorDraftRef.current = normalizedItem.operatorDraft ?? '';
        serverPostableReplyRef.current = nextReply;
        setPostableReply(nextReply);
        setFeedback(normalizedItem.operatorFeedback ?? '');
        setOperatorDraft(normalizedItem.operatorDraft ?? '');
      }

      const nextMessage = getDecisionFlashMessage({
        decision,
        item: payload.item,
        isNoPublicReply
      });

      if (payload.item && isActiveReviewItem(payload.item)) {
        setMessage(nextMessage);
      }

      onResolved?.({
        resolvedId: currentItem.id,
        decision,
        item: payload.item,
        isNoPublicReply
      });
    } catch (caughtError) {
      const detail = caughtError instanceof Error ? caughtError.message : 'Something went wrong.';
      setError(decision === 'approve' ? `Approve reply failed: ${detail}` : detail);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="rounded-[26px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={currentItem.status} />
            <Tag>{currentItem.type}</Tag>
            <Tag>{currentItem.account ?? 'Facebook'}</Tag>
            <Tag>Agent {currentItem.owner}</Tag>
          </div>
          <h4 className="mt-3 text-xl font-semibold text-[var(--ink-950)]">{currentItem.title}</h4>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{currentItem.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
            <Tag>Decision owner {currentItem.decisionOwner}</Tag>
            <Tag>{currentItem.sla}</Tag>
            <Tag>{currentItem.commentHidden ? 'Hidden on Facebook' : 'Visible on Facebook'}</Tag>
            <Tag>{revisedLabel}</Tag>
            <Tag>{currentItem.revisionCount ?? 0} revision{currentItem.revisionCount === 1 ? '' : 's'}</Tag>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {!isNoPublicReply ? (
            <>
              <button type="button" onClick={handleFastRevision} disabled={isPending || !isActionable} className="mc-btn mc-btn-secondary">
                {isPending ? 'Updating…' : 'Update reply'}
              </button>
              <button type="button" onClick={() => handleDecision('approve')} disabled={isPending || areMetaWriteActionsBlocked || currentItem.status === 'approved' || currentItem.status === 'rejected'} className="mc-btn mc-btn-primary">
                Approve reply
              </button>
              <button type="button" onClick={() => handleVisibility(!(currentItem.commentHidden ?? false))} disabled={isPending || areMetaWriteActionsBlocked} className="mc-btn mc-btn-secondary">
                {isPending ? ((currentItem.commentHidden ?? false) ? 'Restoring…' : 'Hiding…') : ((currentItem.commentHidden ?? false) ? 'Unhide comment' : 'Hide comment')}
              </button>
              <button type="button" onClick={() => handleDecision('reject')} disabled={isPending || currentItem.status === 'approved' || currentItem.status === 'rejected'} className="mc-btn mc-btn-danger">
                Reject for now
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => handleDecision('dismiss')} disabled={isPending || currentItem.status === 'approved' || currentItem.status === 'rejected'} className="mc-btn mc-btn-primary">
                {isPending ? 'Removing…' : 'Remove from dashboard'}
              </button>
              <button type="button" onClick={() => handleVisibility(!(currentItem.commentHidden ?? false))} disabled={isPending || areMetaWriteActionsBlocked} className="mc-btn mc-btn-secondary">
                {isPending ? ((currentItem.commentHidden ?? false) ? 'Restoring…' : 'Hiding…') : ((currentItem.commentHidden ?? false) ? 'Unhide comment' : 'Hide comment')}
              </button>
              <button type="button" onClick={() => handleDecision('reject')} disabled={isPending || currentItem.status === 'approved' || currentItem.status === 'rejected'} className="mc-btn mc-btn-danger">
                {isPending ? 'Opening reply workflow…' : 'Reject recommendation → start reply workflow'}
              </button>
            </>
          )}
        </div>
      </div>

      {areMetaWriteActionsBlocked ? (
        <div className="mt-4 rounded-[16px] border border-[#ffd6c7] bg-[#fff4ef] px-4 py-3 text-sm leading-6 text-[#8f4a1f]">
          <p className="font-semibold text-[#7a3910]">{postingGuard.title}</p>
          <p className="mt-1">Approve reply, Hide comment, and Unhide comment are disabled on this item. {postingGuard.detail}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)]">
        <CurrentCustomerCommentCard
          item={currentItem}
        />
        <PreviewPanel
          eyebrow={isNoPublicReply ? 'Recommended action' : 'Reply that will post if approved'}
          title={isNoPublicReply ? 'No public reply is recommended for this thread — unless you reject that recommendation and open a reply workflow' : 'Approve Reply will use this exact text'}
          body={visibleReplyThatWillPost}
          footer={isNoPublicReply
            ? currentItem.responseMeta ?? 'Sammy recommendation'
            : isUsingUnsavedReplacementCopy
              ? 'Using replacement copy pasted below · approving now records this exact text'
              : currentItem.responseMeta ?? 'Sammy'}
          emphasize
        />
      </div>

      {currentItem.threadContext ? (
        <ThreadContextPreview context={currentItem.threadContext} />
      ) : null}

      <div className="mt-4">
        {!isNoPublicReply ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <EditorCard
              id={`feedback-${currentItem.id}`}
              label="Operator steering"
              description="Tell the agent what to change. After you click Update reply, this feeds the postable reply above."
              value={feedback}
              onChange={setFeedback}
              placeholder="Example: shorten this, answer the older-machine question first, and keep it warm but not salesy."
              disabled={isPending || !isActionable}
            />
            <EditorCard
              id={`draft-${currentItem.id}`}
              label="Replacement copy"
              description="Paste exact wording here if Todd wants to control the final post directly. The panel above updates immediately from this field."
              value={operatorDraft}
              onChange={setOperatorDraft}
              placeholder="Optional: paste the exact reply that should post if approved."
              disabled={isPending || !isActionable}
            />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <InfoCard
              label="No-reply handling"
              description="This starts as a no-public-reply recommendation, but you can still turn it into a normal reply workflow."
              body="Remove from dashboard = clear the item with no public reply. Reject recommendation = generate a normal Facebook reply workflow so Todd can steer, replace, update, and approve a real public reply."
            />
            <InfoCard
              label="Why there is no approval button yet"
              description="Nothing is being posted from this state. Mission Control is only holding a recommendation to not reply."
              body="If Todd wants to answer anyway, reject the recommendation and Mission Control will reopen the item as a standard reply flow with a draft reply ready to work on."
            />
            <InfoCard
              label="Comment moderation"
              description="Hide comment is available on normal reply items and calls the real Meta moderation path when the current token supports it."
              body={currentItem.commentHidden ? 'This comment is currently hidden from public view on Facebook. Use Unhide comment to reverse that exact Meta moderation state.' : 'This comment is currently visible on Facebook. Use Hide comment if it should stay in Mission Control but not be displayed publicly.'}
            />
          </div>
        )}
      </div>

      <details className="group mt-4 rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Background details</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">
              Applied guidance, workflow state, and recent learning stay available here when needed, without taking over the main reply workspace.
            </p>
          </div>
          <span className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)] transition-transform group-open:rotate-180">Details</span>
        </summary>

        <div className="mt-4 grid gap-4 border-t border-[var(--line-soft)] pt-4 xl:grid-cols-2">
          <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Applied guidance</p>
            <div className="mt-3 space-y-2">
              {currentItem.learningNotes?.length ? currentItem.learningNotes.map((note) => (
                <div key={note.id} className="rounded-[14px] bg-[var(--panel-muted)] px-3 py-2 text-sm leading-6 text-[var(--ink-800)]">
                  <p>{note.rule}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--blue-700)]">Applied {note.timesApplied}x · {note.lastAppliedAt}</p>
                </div>
              )) : <p className="text-sm leading-6 text-[var(--ink-700)]">No reusable guidance attached yet. The next fast revision will save it here.</p>}
            </div>
          </div>

          <div className="space-y-4">
            {isNoPublicReply ? (
              <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Workflow state</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-800)]">
                  <p><span className="font-semibold text-[var(--ink-950)]">Original public comment:</span> the customer’s live Facebook comment</p>
                  <p><span className="font-semibold text-[var(--ink-950)]">Recommended action:</span> do not post a public reply to this thread unless Todd chooses to open a reply workflow instead</p>
                  <p><span className="font-semibold text-[var(--ink-950)]">Remove from dashboard:</span> clears this no-reply recommendation from the local dashboard queue and leaves it as a no-reply outcome</p>
                  <p><span className="font-semibold text-[var(--ink-950)]">Reject recommendation:</span> converts this item into a normal Facebook reply workflow with a draft reply, steering, replacement copy, update reply, and approve reply controls</p>
                  <p><span className="font-semibold text-[var(--ink-950)]">State:</span> {currentItem.status === 'draft-ready' ? 'Updated and awaiting approval' : currentItem.status === 'needs-review' ? 'Awaiting first decision' : currentItem.status === 'approved' ? 'Approved' : currentItem.status === 'rejected' ? 'Rejected' : 'Sent back for revision'}</p>
                  <p><span className="font-semibold text-[var(--ink-950)]">Public visibility:</span> {currentItem.commentHidden ? 'Hidden on Facebook' : 'Still visible on Facebook'}</p>
                </div>
              </div>
            ) : null}

            {currentItem.audit.lastAction ? (
              <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4 text-sm text-[var(--ink-700)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Recent workflow event</span>
                  <span className="text-xs">{currentItem.audit.lastActionAt}</span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[var(--ink-900)]">{currentItem.audit.lastAction}</p>
                {currentItem.audit.lastActionDetail ? <p className="mt-1 text-sm leading-6">{currentItem.audit.lastActionDetail}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </details>

      {!isNoPublicReply && isUsingUnsavedReplacementCopy ? (
        <div className="mt-4 rounded-[16px] border border-[#d8e8ff] bg-[#eef6ff] px-3 py-2 text-xs text-[#215ea9]">
          Replacement copy is currently overriding the saved draft preview. If you approve now, Mission Control will record exactly the text shown above.
        </div>
      ) : null}

      {(message || error) ? (
        <div className={cn(
          'mt-4 rounded-[16px] border px-3 py-2 text-xs',
          error ? 'border-[#ffd6c7] bg-[#fff4ef] text-[#b15d27]' : 'border-[#d8e8ff] bg-[#eef6ff] text-[#215ea9]'
        )}>
          {error ?? message}
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({
  label,
  description,
  body
}: {
  label: string;
  description: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">{description}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-900)]">{body}</p>
    </div>
  );
}

function EditorCard({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</label>
      <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">{description}</p>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-3 min-h-[158px] w-full resize-y rounded-[14px] border border-[var(--line-soft)] bg-white px-3 py-3 text-sm leading-6 text-[var(--ink-900)] outline-none transition focus:border-[rgba(45,116,215,0.35)] focus:ring-2 focus:ring-[rgba(94,168,255,0.18)] disabled:cursor-not-allowed disabled:bg-[var(--panel-muted)]"
      />
    </div>
  );
}

function CurrentCustomerCommentCard({
  item
}: {
  item: CommentCardItem;
}) {
  const currentMessage = item.threadContext?.messages.find((entry) => entry.isCurrent);
  const authorLabel = currentMessage?.authorName ?? item.threadContext?.messages.find((entry) => entry.isCurrent)?.authorName ?? 'Customer';
  const timestampLabel = formatThreadEntryTimestamp(currentMessage?.createdTime);

  return (
    <div className="rounded-[18px] border border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))] p-4 shadow-[0_12px_30px_rgba(19,44,74,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">Current customer comment</p>
          <h5 className="mt-2 text-base font-semibold text-[var(--ink-950)]">This is the exact public comment you are replying to</h5>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-600)]">
          <Tag>{authorLabel}</Tag>
          {timestampLabel ? <Tag>{timestampLabel}</Tag> : null}
          <Tag>{item.commentHidden ? 'Hidden on Facebook' : 'Visible on Facebook'}</Tag>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-[rgba(45,116,215,0.16)] bg-white px-4 py-4">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--ink-950)]">{currentMessage?.message ?? item.originalComment ?? item.summary}</p>
      </div>

      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-600)]">{item.commentMeta ?? 'Customer thread'}</p>
    </div>
  );
}

function ThreadContextPreview({
  context
}: {
  context: NonNullable<CommentCardItem['threadContext']>;
}) {
  const priorMessages = context.messages.filter((entry) => !entry.isCurrent);
  const earlierMessages = priorMessages.filter((entry) => !entry.isReply);
  const replyMessages = priorMessages.filter((entry) => entry.isReply);
  const hasHistory = earlierMessages.length > 0 || replyMessages.length > 0;

  return (
    <div className="mt-4 rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Same-post context</p>
          <h5 className="mt-2 text-sm font-semibold text-[var(--ink-950)]">Other comments on this ad/post and replies on this exact comment</h5>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{context.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
          <Tag>{context.priorCustomerCommentCount} other comments on this ad/post</Tag>
          <Tag>{context.priorPageReplyCount} earlier page replies elsewhere on this post</Tag>
          <Tag>{context.existingReplyCount} replies on this exact comment</Tag>
        </div>
      </div>

      {hasHistory ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <ThreadMessageList
            title="Other comments on this ad/post"
            emptyLabel="No other customer comments from this same ad/post were included in the current data."
            items={earlierMessages.slice(-3)}
          />
          <ThreadMessageList
            title="Replies on this exact comment"
            emptyLabel="No prior replies were included under this exact customer comment."
            items={replyMessages.slice(-3)}
          />
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-[var(--line-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-700)]">
          The imported Meta data for this item only included the current comment, so the suggested reply is based on that comment itself plus saved operator guidance — not on other same-post comments.
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-700)]">
        <span className="font-semibold text-[var(--ink-950)]">Reading tip:</span> the large card above labeled <span className="font-semibold text-[var(--ink-950)]">Current customer comment</span> is the exact public comment you are responding to. This section below separates other comments on the same ad/post from replies attached to this exact comment.
      </div>
    </div>
  );
}

function ThreadMessageList({
  title,
  emptyLabel,
  items
}: {
  title: string;
  emptyLabel: string;
  items: Array<NonNullable<CommentCardItem['threadContext']>['messages'][number]>;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{title}</p>
      <div className="mt-3 space-y-3">
        {items.length ? items.map((entry) => (
          <div key={entry.id} className="rounded-[14px] bg-[var(--panel-muted)] px-3 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-600)]">
              <Tag>{entry.authorRole === 'page' ? 'Page reply' : entry.authorRole === 'customer' ? 'Customer comment' : 'Thread item'}</Tag>
              {formatThreadEntryTimestamp(entry.createdTime) ? <span>{formatThreadEntryTimestamp(entry.createdTime)}</span> : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-800)]">{entry.message}</p>
          </div>
        )) : (
          <p className="text-sm leading-6 text-[var(--ink-700)]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function PreviewPanel({ eyebrow, title, body, footer, emphasize = false }: { eyebrow: string; title: string; body: string; footer?: string; emphasize?: boolean }) {
  return (
    <div className={cn(
      'rounded-[18px] border p-4',
      emphasize
        ? 'border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))]'
        : 'border-[var(--line-soft)] bg-[var(--panel-muted)]'
    )}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">{eyebrow}</p>
      <h5 className="mt-2 text-sm font-semibold text-[var(--ink-950)]">{title}</h5>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-800)]">{body}</p>
      {footer ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-600)]">{footer}</p> : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-[#e7f2ff] text-[#1f6fcb]',
    busy: 'bg-[#eaf0ff] text-[#315fc8]',
    idle: 'bg-[#eef2f6] text-[#627587]',
    blocked: 'bg-[#fff0e8] text-[#b15d27]'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status] ?? styles.idle}`}>{status}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    'needs-review': 'awaiting review',
    'draft-ready': 'updated · awaiting approval',
    approved: 'approved',
    rejected: 'rejected',
    'revision-requested': 'feedback captured'
  };

  const styles: Record<string, string> = {
    'needs-review': 'bg-[#16324a] text-white',
    'draft-ready': 'bg-[#e7f2ff] text-[#1f6fcb]',
    approved: 'bg-[#e8f6ee] text-[#2f855a]',
    rejected: 'bg-[#fff0e8] text-[#b15d27]',
    'revision-requested': 'bg-[#eef2f6] text-[#627587]'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status] ?? styles['needs-review']}`}>{labels[status] ?? status}</span>;
}

function Pill({ children, tone }: { children: ReactNode; tone: 'dark' | 'soft' }) {
  return <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', tone === 'dark' ? 'bg-[var(--navy-900)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)]')}>{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] p-5 text-sm leading-6 text-[var(--ink-700)]">
      <p className="font-semibold text-[var(--ink-900)]">{title}</p>
      <p className="mt-2">{detail}</p>
    </div>
  );
}
