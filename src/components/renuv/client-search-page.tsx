import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, TrendingUp, TrendingDown, Search, Target, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientSearchSnapshot, SearchKpi, TopSearchTerm, SearchOpportunity } from '@/lib/renuv-client-search';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';

export function RenuvClientSearchPage({ snapshot, brand }: { snapshot: ClientSearchSnapshot; brand?: string }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] p-4 sm:p-6 md:p-8 lg:p-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 md:p-8 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
              <Link href={clientRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                <ArrowLeft size={14} /> Back to overview
              </Link>
              <Badge tone="blue">Client portal</Badge>
              <Badge tone="soft">{snapshot.periodLabel}</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Search intelligence</p>
              <h1 className="mt-3 max-w-4xl text-xl sm:text-2xl md:text-4xl lg:text-6xl font-semibold tracking-[-0.04em] text-[var(--ink-950)]">
                {snapshot.brand} · Search
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                {snapshot.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={clientRoute(brand, "performance")} className="mc-btn mc-btn-primary">
                View performance <ArrowUpRight size={15} />
              </Link>
              <Link href={clientRoute(brand, "advertising")} className="mc-btn mc-btn-secondary">
                View advertising <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {snapshot.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Top search terms" title="Highest-impact search queries" icon={<Search size={20} />} />
          <div className="mt-5 space-y-3">
            {snapshot.topTerms.map((term, idx) => (
              <SearchTermCard key={idx} term={term} />
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Growth opportunities" title="Expansion & optimization targets" icon={<Target size={20} />} />
          <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.opportunities.map((opp, idx) => (
              <OpportunityCard key={idx} opportunity={opp} />
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Market context" title="Search landscape analysis" icon={<Lightbulb size={20} />} />
          <div className="mt-5 rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-5">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{snapshot.searchLandscape.headline}</h3>
          </div>
          <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
            <ContextBlock title="Category trend" content={snapshot.searchLandscape.categoryTrend} />
            <ContextBlock title="Competitive pressure" content={snapshot.searchLandscape.competitivePressure} />
          </div>
          <div className="mt-3 rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Share of voice</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{snapshot.searchLandscape.shareOfVoice}</p>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
            {snapshot.searchLandscape.sourceView}
          </p>
        </section>

        <section className="mb-6 rounded-[28px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)]">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">Implications</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">{snapshot.implications}</p>
        </section>

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Recommended actions" title="Next steps" />
          <ul className="mt-5 space-y-3">
            {snapshot.nextSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3 rounded-[20px] border border-[var(--line-soft)] bg-white p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--blue-700)] text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <p className="text-sm leading-6 text-[var(--ink-800)]">{step}</p>
              </li>
            ))}
          </ul>
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

function SectionHeading({ eyebrow, title, icon }: { eyebrow: string; title: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-1 text-[var(--blue-700)]">{icon}</span>}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">{eyebrow}</p>
        <h2 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{title}</h2>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: SearchKpi }) {
  const trendConfig = {
    up: { icon: <TrendingUp size={18} />, color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    down: { icon: <TrendingDown size={18} />, color: 'text-[#b15d27]', bg: 'bg-[#fff0e8]' },
    flat: { icon: null, color: 'text-[var(--ink-600)]', bg: 'bg-[#eef2f6]' }
  }[kpi.trend];

  return (
    <article className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{kpi.label}</p>
        <span className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', trendConfig.color, trendConfig.bg)}>
          {trendConfig.icon}
          {kpi.delta}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl">{kpi.value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{kpi.interpretation}</p>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{kpi.sourceView}</p>
    </article>
  );
}

function SearchTermCard({ term }: { term: TopSearchTerm }) {
  const categoryConfig = {
    Brand: { bg: 'bg-[var(--blue-700)]', text: 'text-white' },
    'Non-brand': { bg: 'bg-[#8860d8]', text: 'text-white' },
    Competitor: { bg: 'bg-[#876a18]', text: 'text-white' }
  }[term.category];

  const trendConfig = {
    up: { icon: <TrendingUp size={16} />, color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    down: { icon: <TrendingDown size={16} />, color: 'text-[#b15d27]', bg: 'bg-[#fff0e8]' },
    flat: { icon: null, color: 'text-[var(--ink-600)]', bg: 'bg-[#eef2f6]' }
  }[term.trend];

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--ink-950)]">{term.term}</p>
            <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', categoryConfig.bg, categoryConfig.text)}>
              {term.category}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Clicks</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{term.clicks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">CVR</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{term.cvr}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Rank</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{term.rank}</p>
            </div>
            <div className="flex items-start justify-end">
              <span className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', trendConfig.color, trendConfig.bg)}>
                {trendConfig.icon}
                {term.trend === 'flat' ? 'Stable' : ''}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{term.sourceView}</p>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: SearchOpportunity }) {
  return (
    <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.98))] p-5">
      <h3 className="text-base font-semibold text-[var(--ink-950)]">{opportunity.title}</h3>
      <p className="mt-2 text-sm italic text-[var(--ink-700)]">&ldquo;{opportunity.query}&rdquo;</p>
      <div className="mt-4 space-y-3">
        <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Search volume</p>
          <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{opportunity.volume}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Current</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink-900)]">{opportunity.currentRank}</p>
          </div>
          <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Target</p>
            <p className="mt-1 text-sm font-semibold text-[var(--blue-700)]">{opportunity.targetRank}</p>
          </div>
        </div>
        <div className="rounded-[18px] border border-[rgba(45,138,86,0.14)] bg-[rgba(45,138,86,0.08)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Estimated impact</p>
          <p className="mt-1 text-sm font-semibold text-[#2d8a56]">{opportunity.impact}</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{opportunity.sourceView}</p>
    </div>
  );
}

function ContextBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-5">
      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{title}</h4>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-800)]">{content}</p>
    </div>
  );
}

// Prevent TS error by defining snapshot variable
const snapshot = {} as ClientSearchSnapshot;
