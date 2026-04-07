'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'positive' | 'neutral' | 'warning' | 'critical' | 'healthy' | 'info' | 'negative';

function toneColor(tone: Tone) {
  if (tone === 'positive' || tone === 'healthy') return 'bg-emerald-500';
  if (tone === 'warning') return 'bg-amber-500';
  if (tone === 'critical' || tone === 'negative') return 'bg-rose-500';
  return 'bg-sky-500';
}

export function SearchIntelligenceCard({ diagnostic }: { diagnostic: { title: string; severity: Tone; detail: string; actionBias: string; sourceView: string; items?: { label: string; metric?: string; recommendation?: string }[] } }) {
  const [open, setOpen] = useState(false);
  const items = useMemo(() => diagnostic.items || [], [diagnostic.items]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4 text-left transition hover:border-[var(--blue-300)] hover:shadow-sm"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', toneColor(diagnostic.severity))} />
          <h3 className="text-sm font-semibold text-[var(--ink-950)]">{diagnostic.title}</h3>
        </div>
        <p className="mb-3 text-sm leading-6 text-[var(--ink-700)]">{diagnostic.detail}</p>
        <p className="mb-3 text-sm font-medium leading-6 text-[var(--ink-800)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-600)]">Action bias: </span>
          {diagnostic.actionBias}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--blue-700)]">
          Source: {diagnostic.sourceView}
        </p>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Search intelligence detail</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--ink-950)]">{diagnostic.title}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--line-soft)] p-2 text-[var(--ink-600)] hover:bg-[var(--panel-muted)]">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">What this means</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{diagnostic.detail}</p>
              </div>
              <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Recommended action</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{diagnostic.actionBias}</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--blue-700)]">{diagnostic.sourceView}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Underlying detail</p>
              {items.length > 0 ? (
                <div className="mt-3 max-h-[45vh] overflow-y-auto rounded-xl border border-[var(--line-soft)] bg-white">
                  <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[var(--line-soft)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">
                    <span>Keyword / bucket</span>
                    <span>Signal</span>
                    <span>Recommended action</span>
                  </div>
                  {items.map((item) => (
                    <div key={`${item.label}-${item.metric}`} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[var(--line-soft)] px-3 py-3 text-sm leading-6 text-[var(--ink-800)] last:border-0">
                      <span className="font-medium text-[var(--ink-900)]">{item.label}</span>
                      <span>{item.metric || '—'}</span>
                      <span>{item.recommendation || 'Review manually'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">This signal is derived from the underlying search-term rows for the selected period.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
