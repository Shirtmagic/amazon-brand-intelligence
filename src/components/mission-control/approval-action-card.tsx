'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import type { DashboardSnapshot } from '@/lib/mission-control';
import { cn } from '@/lib/utils';

type ApprovalItem = DashboardSnapshot['approvalQueue'][number];
type Decision = 'approve' | 'revise' | 'reject';

export function ApprovalActionCard({
  item,
  onDataChanged
}: {
  item: ApprovalItem;
  onDataChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState(item.decisionNote ?? '');
  const [isExpanded, setIsExpanded] = useState(item.status === 'needs-review' || item.status === 'draft-ready');

  const canAct = item.status === 'needs-review' || item.status === 'draft-ready';
  const statusLabel = useMemo(() => {
    if (item.status === 'needs-review') return 'Waiting for Todd to decide';
    if (item.status === 'draft-ready') return 'Draft is ready to approve or send back';
    if (item.status === 'approved') return 'Approved and cleared to move';
    if (item.status === 'revision-requested') return 'Sent back with changes requested';
    return 'Closed';
  }, [item.status]);

  const handleDecision = (decision: Decision) => {
    if (!canAct) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/approval-queue/${item.id}/decision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ decision, note: note.trim() || undefined })
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to update approval item.');
        }

        const messages = {
          approve: 'Approved. The agent can now execute the work.',
          revise: 'Sent back with changes requested. The agent now owns the revision.',
          reject: 'Rejected for now. The work has been removed from the live approval path.'
        } as const;

        setMessage(messages[decision]);
        onDataChanged?.();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
      }
    });
  };

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_16px_38px_rgba(19,44,74,0.08)] md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ApprovalStatusPill status={item.status} />
            <RiskPill risk={item.risk} />
            <Tag>{item.type}</Tag>
            <Tag>{item.destination}</Tag>
          </div>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--ink-950)] md:text-xl">{item.title}</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--ink-700)]">{item.summary}</p>
            </div>
            <div className="shrink-0 text-left text-xs text-[var(--ink-600)] lg:text-right">
              <p>{statusLabel}</p>
              <p className="mt-1">Requested · {item.requestedAt}</p>
              <p className="mt-1">SLA · {item.sla}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ActionBrief label="Why this is here" value={`This surfaced because ${item.owner} needs ${item.decisionOwner} to decide how ${item.destination.toLowerCase()} should move forward.`} />
            <ActionBrief label="What you should do" value={canAct ? 'Review the context, then approve it, send it back with changes, or reject it for now.' : 'Use this record for context only. The live decision has already been made.'} emphasize />
            <ActionBrief label="What happens next" value={canAct ? 'Your decision updates the queue, writes to the audit trail, and tells the agent whether to execute, revise, or stop.' : 'The queue keeps this visible as history so you can trace what happened and why.'} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
            <Tag>Owner {item.owner}</Tag>
            <Tag>Decision owner {item.decisionOwner}</Tag>
            {item.channel ? <Tag>Channel {item.channel}</Tag> : null}
            {item.account ? <Tag>Account {item.account}</Tag> : null}
            {item.decidedAt ? <Tag>Decided {new Date(item.decidedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Tag> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="mc-btn mc-btn-secondary"
          >
            {isExpanded ? 'Hide preview' : 'Preview details'}
          </button>
          <button
            type="button"
            disabled={isPending || !canAct}
            onClick={() => handleDecision('approve')}
            className="mc-btn mc-btn-primary"
          >
            {isPending ? 'Working…' : 'Approve & move forward'}
          </button>
          <button
            type="button"
            disabled={isPending || !canAct}
            onClick={() => handleDecision('revise')}
            className="mc-btn mc-btn-ghost"
          >
            Send back with changes
          </button>
          <button
            type="button"
            disabled={isPending || !canAct}
            onClick={() => handleDecision('reject')}
            className="mc-btn mc-btn-danger"
          >
            Reject for now
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 grid gap-4 border-t border-[var(--line-soft)] pt-4 xl:grid-cols-[0.95fr_1.05fr_0.8fr]">
          <PreviewPanel
            eyebrow={item.workflowKind === 'facebook-comment' ? 'Original public comment' : item.previewEyebrow ?? 'Original comment'}
            title={item.workflowKind === 'facebook-comment' ? 'What the customer posted on Facebook' : item.previewTitle ?? 'Customer context'}
            body={item.originalComment ?? item.summary}
            footer={item.commentMeta ?? item.owner}
          />
          <PreviewPanel
            eyebrow={item.workflowKind === 'facebook-comment' ? 'Reply that will post if approved' : 'Suggested response'}
            title={item.workflowKind === 'facebook-comment' ? 'Approve Reply uses this exact text' : item.responseTitle ?? 'Draft reply ready for approval'}
            body={item.workflowKind === 'facebook-comment' ? item.replyReadyToPost ?? item.revisedResponse ?? item.suggestedResponse ?? 'No suggested response is attached to this approval item yet.' : item.suggestedResponse ?? 'No suggested response is attached to this approval item yet.'}
            footer={item.responseMeta ?? item.destination}
            emphasize
          />
          <div className="space-y-4">
            <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]" htmlFor={`note-${item.id}`}>
                Operator note
              </label>
              <textarea
                id={`note-${item.id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={isPending || !canAct}
                placeholder={canAct ? 'Optional context for the agent or audit trail…' : 'This item is no longer actionable from the queue.'}
                className="mt-2 min-h-[140px] w-full resize-y rounded-[14px] border border-[var(--line-soft)] bg-white px-3 py-3 text-sm leading-6 text-[var(--ink-900)] outline-none transition focus:border-[rgba(45,116,215,0.35)] focus:ring-2 focus:ring-[rgba(94,168,255,0.18)] disabled:cursor-not-allowed disabled:bg-[var(--panel-muted)]"
              />
            </div>

            {item.audit.lastAction ? (
              <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-3 text-xs text-[var(--ink-700)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Recent decision history</span>
                  <span>{item.audit.count} event{item.audit.count === 1 ? '' : 's'}</span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[var(--ink-900)]">{item.audit.lastAction}</p>
                {item.audit.lastActionDetail ? <p className="mt-1 leading-5">{item.audit.lastActionDetail}</p> : null}
                {item.audit.lastActionAt ? <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--blue-700)]">Updated {item.audit.lastActionAt}</p> : null}
              </div>
            ) : null}

            {item.decisionNote ? (
              <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-2 text-xs text-[var(--ink-700)]">
                Note · {item.decisionNote}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!canAct ? (
        <div className="mt-3 rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-2 text-xs leading-5 text-[var(--ink-700)]">
          This record stays visible for context and audit history, but it is no longer actionable from the live queue.
        </div>
      ) : null}

      {(message || error) ? (
        <div className={cn(
          'mt-4 rounded-[16px] border px-3 py-2 text-xs',
          error
            ? 'border-[#ffd6c7] bg-[#fff4ef] text-[#b15d27]'
            : 'border-[#d8e8ff] bg-[#eef6ff] text-[#215ea9]'
        )}>
          {error ?? message}
        </div>
      ) : null}
    </div>
  );
}

function PreviewPanel({
  eyebrow,
  title,
  body,
  footer,
  emphasize = false
}: {
  eyebrow: string;
  title: string;
  body: string;
  footer?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-[18px] border p-4',
      emphasize
        ? 'border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))]'
        : 'border-[var(--line-soft)] bg-[var(--panel-muted)]'
    )}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">{eyebrow}</p>
      <h4 className="mt-2 text-sm font-semibold text-[var(--ink-950)]">{title}</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-800)]">{body}</p>
      {footer ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--ink-600)]">{footer}</p> : null}
    </div>
  );
}

function ActionBrief({
  label,
  value,
  emphasize = false
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-[18px] border p-3',
      emphasize
        ? 'border-[rgba(45,116,215,0.18)] bg-[linear-gradient(180deg,rgba(94,168,255,0.10),rgba(255,255,255,0.95))]'
        : 'border-[var(--line-soft)] bg-[var(--panel-muted)]'
    )}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function ApprovalStatusPill({ status }: { status: ApprovalItem['status'] }) {
  const styles: Record<ApprovalItem['status'], string> = {
    'needs-review': 'bg-[#16324a] text-white',
    approved: 'bg-[#e7f2ff] text-[#1f6fcb]',
    rejected: 'bg-[#fff0e8] text-[#b15d27]',
    'draft-ready': 'bg-[#eaf0ff] text-[#315fc8]',
    'revision-requested': 'bg-[#eef2f6] text-[#627587]'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status]}`}>{status}</span>;
}

function RiskPill({ risk }: { risk: ApprovalItem['risk'] }) {
  const styles: Record<ApprovalItem['risk'], string> = {
    high: 'bg-[#16324a] text-white',
    medium: 'bg-[#eaf0ff] text-[#315fc8]',
    low: 'bg-[#eef2f6] text-[#627587]'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[risk]}`}>{risk} risk</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}
