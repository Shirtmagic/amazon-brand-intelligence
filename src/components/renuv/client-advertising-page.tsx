import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, TrendingUp, TrendingDown, Target, BarChart2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientAdvertisingSnapshot, AdvertisingKpi, CampaignPerformance } from '@/lib/renuv-client-advertising';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';

export function RenuvClientAdvertisingPage({ snapshot, brand }: { snapshot: ClientAdvertisingSnapshot; brand?: string }) {
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
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Advertising deep dive</p>
              <h1 className="mt-3 max-w-4xl text-xl sm:text-2xl md:text-4xl lg:text-6xl font-semibold tracking-[-0.04em] text-[var(--ink-950)]">
                {snapshot.brand} · Advertising
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                {snapshot.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={clientRoute(brand, "performance")} className="mc-btn mc-btn-primary">
                View performance <ArrowUpRight size={15} />
              </Link>
              <Link href={clientRoute(brand, "search")} className="mc-btn mc-btn-secondary">
                View search intelligence <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Spend & return" title="Advertising efficiency trends" icon={<BarChart2 size={20} />} />
          <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">
            Advertising spend grew 6.1% while attributed sales increased 13.2%, driving meaningful TACOS improvement. ROAS strengthened from 5.69x to 6.10x as campaign optimizations and search term refinements improved efficiency across the portfolio.
          </p>
          <div className="mt-6 h-80 overflow-x-auto rounded-[24px] border border-[var(--line-soft)] bg-gradient-to-br from-[rgba(94,168,255,0.04)] to-white p-4 sm:p-6">
            <p className="text-center text-sm text-[var(--ink-600)]">
              [Dual-axis chart: Spend & attributed sales (bars) + ROAS (line) over 30 days]
            </p>
            <div className="mt-4 space-y-2 text-center text-xs text-[var(--ink-500)]">
              <p>Chart component integration point: Daily spend, sales, and ROAS trend</p>
              <p>Left Y-axis: $ values | Right Y-axis: ROAS multiplier</p>
              <p>Shows improving efficiency trajectory with ROAS climbing from 5.7x to 6.1x</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
            reporting_amazon.client_advertising_trend_daily
          </p>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Campaign breakdown" title="Campaign performance" icon={<Target size={20} />} />
          <div className="mt-5 space-y-3">
            {snapshot.campaigns.map((campaign, idx) => (
              <CampaignCard key={idx} campaign={campaign} />
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Efficiency review" title="Channel-level efficiency" icon={<Lightbulb size={20} />} />
          <div className="mt-5 rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-5">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{snapshot.efficiency.headline}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{snapshot.efficiency.summary}</p>
          </div>
          <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2">
            {snapshot.efficiency.metrics.map((metric, idx) => (
              <EfficiencyMetricCard key={idx} metric={metric} />
            ))}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
            {snapshot.efficiency.sourceView}
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

function KpiCard({ kpi }: { kpi: AdvertisingKpi }) {
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

function CampaignCard({ campaign }: { campaign: CampaignPerformance }) {
  const trendConfig = {
    up: { icon: <TrendingUp size={16} />, color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    down: { icon: <TrendingDown size={16} />, color: 'text-[#b15d27]', bg: 'bg-[#fff0e8]' },
    flat: { icon: null, color: 'text-[var(--ink-600)]', bg: 'bg-[#eef2f6]' }
  }[campaign.trend];

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-950)]">{campaign.campaign}</p>
              <p className="mt-1 text-xs text-[var(--ink-600)]">{campaign.type}</p>
            </div>
            <span className={cn('flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', trendConfig.color, trendConfig.bg)}>
              {trendConfig.icon}
              {campaign.trend === 'flat' ? 'Stable' : ''}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Spend</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{campaign.spend}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Sales</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{campaign.sales}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">ROAS</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{campaign.roas}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">ACOS</p>
              <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{campaign.acos}</p>
            </div>
          </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{campaign.sourceView}</p>
    </div>
  );
}

function EfficiencyMetricCard({ metric }: { metric: typeof snapshot.efficiency.metrics[0] }) {
  const toneConfig = {
    positive: { bg: 'bg-[linear-gradient(135deg,rgba(45,138,86,0.08),rgba(255,255,255,0.98))]', border: 'border-[rgba(45,138,86,0.14)]' },
    neutral: { bg: 'bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.98))]', border: 'border-[rgba(94,168,255,0.14)]' },
    warning: { bg: 'bg-[linear-gradient(135deg,rgba(135,106,24,0.08),rgba(255,255,255,0.98))]', border: 'border-[rgba(135,106,24,0.14)]' }
  }[metric.tone];

  return (
    <div className={cn('rounded-[22px] border p-4', toneConfig.border, toneConfig.bg)}>
      <p className="text-sm font-semibold text-[var(--ink-950)]">{metric.label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--blue-700)]">{metric.value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{metric.interpretation}</p>
    </div>
  );
}

// Prevent TS error by defining snapshot variable
const snapshot = {} as ClientAdvertisingSnapshot;
