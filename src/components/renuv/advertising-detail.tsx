import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowLeft, BarChart3, CheckCircle2, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdvertisingSnapshot, AdvertisingKpi } from '@/lib/renuv-advertising';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';
import { KpiLabel } from './metric-tooltip';

export function AdvertisingDetail({ snapshot, brand }: { snapshot: AdvertisingSnapshot; brand?: string }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
              <Link href={clientRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                <ArrowLeft size={14} /> Back to overview
              </Link>
              <Badge tone="blue">Advertising</Badge>
              <Badge tone="soft">{snapshot.periodLabel}</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Advertising deep dive</p>
              <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-5xl">
                {snapshot.brand} · Advertising performance
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                {snapshot.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="30-day trend" title="Advertising metrics over time" icon={<BarChart3 size={20} />} />
          <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">
            Advertising spend increased modestly while sales accelerated, driving sustained ROAS improvement throughout the period.
          </p>
          <div className="mt-6 h-80 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-gradient-to-br from-[rgba(94,168,255,0.04)] to-white p-4 sm:p-6">
            <p className="text-center text-sm text-[var(--ink-600)]">
              [Multi-line chart: Ad Spend, Ad Sales, ROAS over 30 days]
            </p>
            <p className="mt-3 text-center text-xs text-[var(--ink-500)]">
              Chart showing {snapshot.chartData.length} daily data points with spend, sales, and ROAS trend
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Analysis" title="Commentary & insights" icon={<Megaphone size={20} />} />
          <div className="mt-5 rounded-[22px] border border-[var(--line-soft)] bg-white p-6">
            <p className="text-sm leading-7 text-[var(--ink-800)]">{snapshot.commentary}</p>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Strategic implications" title="What this means" icon={<CheckCircle2 size={20} />} />
          <div className="mt-5 space-y-3">
            {snapshot.implications.map((item, idx) => (
              <ImplicationCard key={idx} text={item} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Recommended actions" title="Next steps" icon={<CheckCircle2 size={20} />} />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {snapshot.nextSteps.map((step, idx) => (
              <NextStepCard key={idx} text={step} index={idx + 1} />
            ))}
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

function KpiCard({ kpi }: { kpi: AdvertisingKpi }) {
  const trendConfig = {
    up: { icon: <TrendingUp size={18} />, color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    down: { icon: <TrendingDown size={18} />, color: 'text-[#b15d27]', bg: 'bg-[#fff0e8]' },
    flat: { icon: null, color: 'text-[var(--ink-600)]', bg: 'bg-[#eef2f6]' }
  }[kpi.trend];

  return (
    <article className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <KpiLabel>{kpi.label}</KpiLabel>
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

function ImplicationCard({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-[22px] border border-[var(--line-soft)] bg-white p-4">
      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#2d8a56]" />
      <p className="text-sm leading-6 text-[var(--ink-800)]">{text}</p>
    </div>
  );
}

function NextStepCard({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex gap-4 rounded-[22px] border border-[var(--line-soft)] bg-white p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--blue-700)] text-sm font-semibold text-white">
        {index}
      </span>
      <p className="text-sm leading-6 text-[var(--ink-800)]">{text}</p>
    </div>
  );
}
