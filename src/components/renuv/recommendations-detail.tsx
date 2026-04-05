import Link from 'next/link';
import { ArrowLeft, Lightbulb, TrendingUp, Shield, BarChart3, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecommendationsSnapshot, Recommendation } from '@/lib/renuv-recommendations';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';

export function RecommendationsDetail({ snapshot, brand }: { snapshot: RecommendationsSnapshot; brand?: string }) {
  const highPriority = snapshot.recommendations.filter(r => r.priority === 'high');
  const mediumPriority = snapshot.recommendations.filter(r => r.priority === 'medium');
  const lowPriority = snapshot.recommendations.filter(r => r.priority === 'low');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-6 py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] px-6 py-6 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
              <Link href={clientRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                <ArrowLeft size={14} /> Back to overview
              </Link>
              <Badge tone="blue">Recommendations</Badge>
              <Badge tone="soft">{snapshot.periodLabel}</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Strategic recommendations</p>
              <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-5xl">
                {snapshot.brand} · Recommended actions
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                {snapshot.summary}
              </p>
            </div>
          </div>
        </section>

        {highPriority.length > 0 && (
          <section className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Zap size={18} className="text-[#c42e1f]" />
              <h2 className="text-xl font-semibold text-[var(--ink-950)]">High priority</h2>
              <span className="rounded-full bg-[#c42e1f] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                {highPriority.length} items
              </span>
            </div>
            <div className="space-y-4">
              {highPriority.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        {mediumPriority.length > 0 && (
          <section className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#876a18]" />
              <h2 className="text-xl font-semibold text-[var(--ink-950)]">Medium priority</h2>
              <span className="rounded-full bg-[#fff8e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#876a18]">
                {mediumPriority.length} items
              </span>
            </div>
            <div className="space-y-4">
              {mediumPriority.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        {lowPriority.length > 0 && (
          <section className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-[var(--blue-700)]" />
              <h2 className="text-xl font-semibold text-[var(--ink-950)]">Lower priority</h2>
              <span className="rounded-full bg-[rgba(94,168,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--blue-700)]">
                {lowPriority.length} items
              </span>
            </div>
            <div className="space-y-4">
              {lowPriority.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Strategic context" title="Overall commentary" icon={<Lightbulb size={20} />} />
          <div className="mt-5 rounded-[22px] border border-[var(--line-soft)] bg-white p-6">
            <p className="text-sm leading-7 text-[var(--ink-800)]">{snapshot.commentary}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Badge({ tone, children }: { tone: 'blue' | 'soft'; children: string }) {
  const styles = {
    blue: 'bg-[var(--blue-700)] text-white',
    soft: 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)]'
  } as const;

  return <span className={cn('inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]', styles[tone])}>{children}</span>;
}

function SectionHeading({ eyebrow, title, icon }: { eyebrow: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-1 text-[var(--blue-700)]">{icon}</span>}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{title}</h2>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const categoryConfig = {
    optimization: { icon: '⚡', color: 'text-[var(--blue-700)]', bg: 'bg-[rgba(94,168,255,0.12)]' },
    expansion: { icon: '🚀', color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    protection: { icon: '🛡️', color: 'text-[#876a18]', bg: 'bg-[#fff8e8]' },
    analysis: { icon: '🔍', color: 'text-[#8860d8]', bg: 'bg-[rgba(147,108,230,0.12)]' }
  }[recommendation.category];

  const priorityConfig = {
    high: { badge: 'bg-[#c42e1f] text-white', border: 'border-[rgba(196,46,31,0.2)]' },
    medium: { badge: 'bg-[#fff8e8] text-[#876a18]', border: 'border-[rgba(135,106,24,0.18)]' },
    low: { badge: 'bg-[rgba(94,168,255,0.12)] text-[var(--blue-700)]', border: 'border-[rgba(94,168,255,0.14)]' }
  }[recommendation.priority];

  const effortConfig = {
    low: { label: 'Low effort', color: 'text-[#2d8a56]' },
    medium: { label: 'Medium effort', color: 'text-[#876a18]' },
    high: { label: 'High effort', color: 'text-[#b15d27]' }
  }[recommendation.effort];

  return (
    <article className={cn('rounded-[28px] border bg-white p-6 shadow-[0_18px_40px_rgba(19,44,74,0.06)]', priorityConfig.border)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl', categoryConfig.bg)}>
            {categoryConfig.icon}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-[var(--ink-950)]">{recommendation.title}</h3>
              <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', priorityConfig.badge)}>
                {recommendation.priority} priority
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={cn('text-xs font-semibold uppercase tracking-[0.14em]', categoryConfig.color)}>
                {recommendation.category}
              </span>
              <span className="text-xs text-[var(--ink-500)]">•</span>
              <span className={cn('text-xs font-semibold', effortConfig.color)}>{effortConfig.label}</span>
              <span className="text-xs text-[var(--ink-500)]">•</span>
              <span className="text-xs font-semibold text-[var(--ink-700)]">{recommendation.timeline}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Impact</p>
          <p className="mt-1 text-sm font-semibold text-[#2d8a56]">{recommendation.impact}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Description</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{recommendation.description}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Rationale</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{recommendation.rationale}</p>
        </div>

        <div className="rounded-[18px] border border-[var(--line-soft)] bg-[rgba(94,168,255,0.04)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Expected outcome</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{recommendation.expectedOutcome}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
        {recommendation.sourceView} · {recommendation.id}
      </p>
    </article>
  );
}
