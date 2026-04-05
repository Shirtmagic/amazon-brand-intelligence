'use client';

import { useEffect, useState, useTransition, type ReactNode } from 'react';
import type { DashboardSnapshot } from '@/lib/mission-control';
import { cn } from '@/lib/utils';

type Agent = DashboardSnapshot['activeAgents'][number];

export function AgentControlCard({
  agent,
  availableModels,
  onDataChanged
}: {
  agent: Agent;
  availableModels: string[];
  onDataChanged?: () => void;
}) {
  const [selectedModel, setSelectedModel] = useState(agent.model);
  const [currentModel, setCurrentModel] = useState(agent.model);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedModel(agent.model);
    setCurrentModel(agent.model);
  }, [agent.model]);

  const canStopTask = agent.status === 'online' || agent.status === 'busy' || agent.status === 'blocked';

  const handleModelChange = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/model`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model: selectedModel })
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to change model.');
        }

        setCurrentModel(selectedModel);
        setMessage(`Model updated to ${selectedModel}.`);
        onDataChanged?.();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
      }
    });
  };

  const handleStopTask = () => {
    if (!canStopTask) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/stop`, {
          method: 'POST'
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to stop task.');
        }

        setMessage('Task stopped. Agent is now parked for reassignment.');
        onDataChanged?.();
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong.');
      }
    });
  };

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-6 shadow-[0_18px_44px_rgba(19,44,74,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{agent.lane}</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--ink-950)]">{agent.name}</h3>
          <p className="text-sm text-[var(--ink-700)]">{agent.role}</p>
        </div>
        <StatusPill status={agent.status} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
        <Tag>{agent.provider}</Tag>
        <Tag>{currentModel}</Tag>
        <Tag>Reports to {agent.reportsTo}</Tag>
      </div>
      <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Current task</p>
          {agent.blocker ? <span className="rounded-full bg-[#fff4ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b15d27]">Blocked</span> : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-900)]">{agent.currentTask}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">Focus · {agent.focus}</p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Runtime model</p>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            className="mt-2 w-full rounded-[14px] border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-900)] shadow-sm"
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
          className="mc-btn mc-btn-ghost"
        >
          {isPending ? 'Saving…' : 'Apply model'}
        </button>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-[var(--ink-600)] md:grid-cols-2">
        <span>Heartbeat · {agent.lastHeartbeat}</span>
        <span>Tracked tasks · {agent.pendingTasks}</span>
        <span>Approvals waiting · {agent.pendingApprovals}</span>
        <span>Control events · {agent.audit.count}</span>
      </div>
      <div className="mt-4 flex flex-col gap-3 text-xs text-[var(--ink-600)]">
        <span>{agent.blocker ? `Blocker · ${agent.blocker}` : `Responsibilities · ${agent.responsibilities.join(' · ')}`}</span>
        <div className="flex items-center justify-between gap-3">
          <span>{canStopTask ? 'Use stop only to park active work for reassignment.' : agent.status === 'future' ? 'This agent is planned only and is not active in runtime yet.' : 'Agent is not active and is ready for reassignment.'}</span>
          <button
            type="button"
            disabled={isPending || !canStopTask}
            onClick={handleStopTask}
            className="mc-btn mc-btn-danger"
          >
            {canStopTask ? 'Stop task' : agent.status === 'future' ? 'Not live yet' : 'Not active'}
          </button>
        </div>
      </div>
      {agent.audit.lastAction ? (
        <div className="mt-4 rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-3 text-xs text-[var(--ink-700)]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Recent event</span>
            <span>{agent.audit.lastActionAt}</span>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[var(--ink-900)]">{agent.audit.lastAction}</p>
          {agent.audit.lastActionDetail ? <p className="mt-1 leading-5">{agent.audit.lastActionDetail}</p> : null}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-3 text-xs text-[var(--ink-600)]">
          No control actions have been recorded for this agent yet.
        </div>
      )}
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

function StatusPill({ status }: { status: Agent['status'] }) {
  const styles: Record<Agent['status'], string> = {
    online: 'bg-[#e7f2ff] text-[#1f6fcb]',
    busy: 'bg-[#eaf0ff] text-[#315fc8]',
    idle: 'bg-[#eef2f6] text-[#627587]',
    blocked: 'bg-[#fff0e8] text-[#b15d27]',
    future: 'bg-[#f3eefc] text-[#7b52b9]'
  };

  const labels: Record<Agent['status'], string> = {
    online: 'online',
    busy: 'busy',
    idle: 'Not Active',
    blocked: 'blocked',
    future: 'Future Agent'
  };

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${styles[status]}`}>{labels[status]}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}
