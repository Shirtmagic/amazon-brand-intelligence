'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2, AlertTriangle, ArrowLeft, Lightbulb, Shield, BarChart3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientPortalSnapshot, ClientKpi } from '@/lib/renuv-client-portal';
import { ReviewExportControls } from './review-export-controls';
import type { ExportFormat } from '@/lib/renuv-export';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';
import { KpiLabel } from './metric-tooltip';

export interface RenuvClientPortalPageProps {
  snapshot: ClientPortalSnapshot;
  hideControls?: boolean;
  brand?: string;
}

export function RenuvClientPortalPage({ snapshot, hideControls = false, brand }: RenuvClientPortalPageProps) {
  const [reviewMode, setReviewMode] = useState<'normal' | 'presentation'>('normal');

  const handleExport = (format: ExportFormat) => {
    console.log('Exporting as:', format);
    // Export logic is handled by ReviewExportControls component
  };

  return (
    <main 
      className={cn(
        "min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]",
        reviewMode === 'presentation' && 'bg-white'
      )}
      data-review-mode={reviewMode}
    >
      <div className="mx-auto max-w-[1680px] p-4 sm:p-6 md:p-8 lg:p-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 md:p-8 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <div className="print-hide flex flex-wrap items-center gap-3">
                  <Link href={brandRoot(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                    <ArrowLeft size={14} /> Back to Mission Control
                  </Link>
                  <Badge tone="blue">Client portal</Badge>
                  <Badge tone="soft">{snapshot.periodLabel}</Badge>
                </div>
                <div className="hidden print:block text-xs text-[var(--ink-700)]">
                  {snapshot.brand} · {snapshot.periodLabel}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Performance overview</p>
                <h1 className="mt-3 max-w-4xl text-xl sm:text-2xl md:text-4xl lg:text-6xl font-semibold tracking-[-0.04em] text-[var(--ink-950)]">
                  {snapshot.brand} · Amazon performance
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  {snapshot.executiveSummary}
                </p>
              </div>

              {!hideControls && (
                <div className="flex flex-wrap gap-3">
                  <div className="print-hide flex flex-wrap gap-3">
                    <Link href="#growth-drivers" className="mc-btn mc-btn-primary">
                      View growth drivers <ArrowUpRight size={15} />
                    </Link>
                    <Link href="#next-steps" className="mc-btn mc-btn-secondary">
                      View next steps <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <ReviewExportControls
                    brand={snapshot.brand}
                    periodLabel={snapshot.periodLabel}
                    onModeChange={setReviewMode}
                    onExport={handleExport}
                  />
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-6 shadow-[0_20px_50px_rgba(19,44,74,0.08)]">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">Performance at a glance</h3>
              <div className="mt-5 space-y-3">
                <QuickMetric label="Revenue growth" value="+12.4%" trend="up" />
                <QuickMetric label="Advertising efficiency" value="TACOS 16.4% (improved)" trend="up" />
                <QuickMetric label="Conversion rate" value="19.2% (+1.4 pts)" trend="up" />
                <QuickMetric label="Order volume" value="3,248 orders (+9.8%)" trend="up" />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Trend overview" title="Performance trends" icon={<BarChart3 size={20} />} />
          <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">
            Revenue and order volume showed consistent growth throughout the period with strong week-over-week momentum. Advertising spend increased modestly while efficiency improved.
          </p>
          <div className="mt-6 flex h-64 items-center justify-center overflow-x-auto rounded-[24px] border border-[var(--line-soft)] bg-gradient-to-br from-[rgba(94,168,255,0.04)] to-white p-4 sm:p-6">
            <p className="text-center text-sm text-[var(--ink-600)]">
              Performance trends shown in detailed reports
            </p>
          </div>
        </section>

        <section id="growth-drivers" className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Growth analysis" title="What drove performance this period" icon={<Lightbulb size={20} />} />
          <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
            {snapshot.growthDrivers.map((driver, idx) => (
              <GrowthDriverCard key={idx} driver={driver} />
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Risk monitoring" title="Items to watch" icon={<Shield size={20} />} />
          <div className="mt-5 space-y-4">
            {snapshot.risks.map((risk, idx) => (
              <RiskCard key={idx} risk={risk} />
            ))}
          </div>
        </section>

        <section id="next-steps" className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Recommended actions" title="Next steps" icon={<CheckCircle2 size={20} />} />
          <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.nextSteps.map((step, idx) => (
              <NextStepCard key={idx} step={step} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6 lg:p-8 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur">
          <SectionHeading eyebrow="Market intelligence" title="Market & search context" icon={<Search size={20} />} />
          <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
            <ContextBlock title="Category trend" content={snapshot.marketContext.categoryTrend} />
            <ContextBlock title="Competitive pressure" content={snapshot.marketContext.competitivePressure} />
            <ContextBlock title="Seasonal outlook" content={snapshot.marketContext.seasonalNote} />
            <ContextBlock title="Search landscape" content={snapshot.marketContext.searchLandscape} />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{snapshot.marketContext.sourceView}</p>
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

function QuickMetric({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-[rgba(94,168,255,0.14)] bg-white/80 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{label}</p>
        <p className="mt-1 text-base font-semibold text-[var(--ink-950)]">{value}</p>
      </div>
      {trend === 'up' ? <TrendingUp size={20} className="text-[#2d8a56]" /> : <TrendingDown size={20} className="text-[#b15d27]" />}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: ClientKpi }) {
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

function GrowthDriverCard({ driver }: { driver: typeof snapshot.growthDrivers[0] }) {
  return (
    <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.98))] p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--ink-950)]">{driver.title}</h3>
        <span className="shrink-0 rounded-full bg-[#e7f4ee] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2d8a56]">
          {driver.impact}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{driver.summary}</p>
      <div className="mt-4 rounded-[18px] border border-[var(--line-soft)] bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Key metric</p>
        <p className="mt-1 text-sm font-semibold text-[var(--blue-700)]">{driver.metric}</p>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{driver.sourceView}</p>
    </div>
  );
}

function RiskCard({ risk }: { risk: typeof snapshot.risks[0] }) {
  const severityConfig = {
    high: { color: 'text-[#c42e1f]', bg: 'bg-[linear-gradient(135deg,rgba(196,46,31,0.08),rgba(255,255,255,0.98))]', border: 'border-[#c42e1f]/30', badge: 'bg-[#16324a] text-white' },
    medium: { color: 'text-[#876a18]', bg: 'bg-[linear-gradient(135deg,rgba(255,248,232,0.7),rgba(255,255,255,0.98))]', border: 'border-[rgba(135,106,24,0.18)]', badge: 'bg-[#fff8e8] text-[#876a18]' },
    low: { color: 'text-[var(--blue-700)]', bg: 'bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.98))]', border: 'border-[rgba(94,168,255,0.14)]', badge: 'bg-[rgba(94,168,255,0.12)] text-[var(--blue-700)]' }
  }[risk.severity];

  return (
    <div className={cn('rounded-[24px] border p-5', severityConfig.border, severityConfig.bg)}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className={cn('mt-0.5 shrink-0', severityConfig.color)} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--ink-950)]">{risk.title}</h3>
            <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]', severityConfig.badge)}>
              {risk.severity} risk
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{risk.summary}</p>
          <div className="mt-4 rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Mitigation</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{risk.mitigation}</p>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{risk.sourceView}</p>
        </div>
      </div>
    </div>
  );
}

function NextStepCard({ step }: { step: typeof snapshot.nextSteps[0] }) {
  const categoryConfig = {
    optimization: { icon: '⚡', color: 'text-[var(--blue-700)]', bg: 'bg-[rgba(94,168,255,0.12)]' },
    expansion: { icon: '🚀', color: 'text-[#2d8a56]', bg: 'bg-[#e7f4ee]' },
    protection: { icon: '🛡️', color: 'text-[#876a18]', bg: 'bg-[#fff8e8]' },
    analysis: { icon: '🔍', color: 'text-[#8860d8]', bg: 'bg-[rgba(147,108,230,0.12)]' }
  }[step.category];

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xl', categoryConfig.bg)}>
          {categoryConfig.icon}
        </span>
        <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">
          {step.timeline}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--ink-950)]">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{step.description}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{step.category}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{step.sourceView}</p>
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
const snapshot = {} as ClientPortalSnapshot;
