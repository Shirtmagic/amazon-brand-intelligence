import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandRoot, internalRoute } from '@/lib/renuv-routes';
import {
  renuvTrafficConversionContracts,
  type RenuvTrafficConversionPageSnapshot,
  type Tone,
  type TrendDirection
} from '@/lib/renuv-traffic-conversion';
import { KpiLabel } from './metric-tooltip';

export function RenuvInternalTrafficConversionPage({ snapshot, brand }: { snapshot: RenuvTrafficConversionPageSnapshot; brand?: string }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,420px)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <Link href={internalRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                  <ArrowLeft size={14} /> Back to Renuv overview
                </Link>
                <Badge tone="navy">Internal workspace</Badge>
                <Badge tone="blue">Traffic &amp; conversion</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Amazon intelligence</p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Traffic &amp; conversion · {snapshot.brand}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Analyze session quality, conversion rates, and traffic sources across the Renuv portfolio.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Internal-only</Tag>
                <Tag>Read-only demand review</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-primary">
                  Cross-check ASIN performance <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-secondary">
                  Cross-check advertising <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                  Cross-check retail health <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Primary source family"
                value="Traffic + conversion"
                detail="Traffic, conversion, daily review, ASIN risk, and freshness data for operational decision-making."
                icon={<Database size={18} />}
              />
              <MiniSummaryCard
                title="Trust posture"
                value="Operationally usable"
                detail="Source and view labels stay visible per block so traffic-quality claims remain auditable."
                icon={<ShieldCheck size={18} />}
              />
              <MiniSummaryCard
                title="Operator focus"
                value="Quality over volume"
                detail="The sharper question this period is session quality and PDP efficiency, not a broad demand failure."
                icon={<TriangleAlert size={18} />}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {snapshot.kpis.map((kpi) => (
            <article key={kpi.key} className="rounded-[24px] border border-[var(--line-soft)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <KpiLabel>{kpi.label}</KpiLabel>
                <TrendPill trend={kpi.trend}>{kpi.delta}</TrendPill>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl">{kpi.value}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{kpi.note}</p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{kpi.sourceView}</p>
            </article>
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Panel>
            <SectionHeading eyebrow="Period review" title="Sessions and conversion review" />
            <DataTable
              columns={['Period', 'Sessions', 'Orders', 'CVR', 'Revenue / session', 'Read']}
              rows={snapshot.review.map((row) => [
                row.period,
                row.sessions,
                row.orders,
                row.conversionRate,
                row.revenuePerSession,
                row.read
              ])}
              footer={snapshot.review[0]?.sourceView}
            />
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Demand-quality framing" title="Traffic quality posture" />
            <div className="mt-5 rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-5">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{snapshot.trafficQuality.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{snapshot.trafficQuality.summary}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {snapshot.trafficQuality.signals.map((signal) => (
                <div key={signal.label} className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{signal.label}</p>
                    <ToneBadge tone={signal.tone}>{signal.value}</ToneBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{signal.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{snapshot.trafficQuality.sourceView}</p>
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Panel>
            <SectionHeading eyebrow="Source health" title="Freshness + trust framing" />
            <div className="mt-5 space-y-3">
              {snapshot.freshness.map((item) => (
                <div key={item.source} className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-950)]">{item.source}</p>
                      <p className="mt-1 text-xs text-[var(--ink-600)]">{item.updatedAt}</p>
                    </div>
                    <ToneBadge tone={item.tone}>{item.lag}</ToneBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{item.readiness}</p>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{item.sourceView}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Diagnostics" title="Useful internal risk flags" />
            <div className="mt-5 space-y-3">
              {snapshot.diagnostics.map((item) => (
                <div key={item.title} className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink-950)]">{item.title}</p>
                    <ToneBadge tone={item.severity}>{formatToneLabel(item.severity)}</ToneBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{item.detail}</p>
                  <div className="mt-4 rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Action bias</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-800)]">{item.actionBias}</p>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{item.sourceView}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="ASIN conversion risk" title="Traffic-heavy products that need review" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                  This table isolates which products are actually causing the account-level softness so the next diagnostic pass can separate demand problems from PDP or retail issues.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-secondary">
                  ASIN view <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                  Retail health <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
            <DataTable
              columns={['ASIN', 'Product', 'Traffic share', 'Sessions Δ', 'CVR', 'CVR Δ', 'Demand quality', 'Diagnosis', 'Status']}
              rows={snapshot.asinRisks.map((row) => [
                row.asin,
                row.title,
                row.trafficShare,
                row.sessionsChange,
                row.conversionRate,
                row.conversionChange,
                row.demandQuality,
                row.diagnosis,
                <ToneBadge key={`${row.asin}-severity`} tone={row.severity}>{formatToneLabel(row.severity)}</ToneBadge>
              ])}
              footer={snapshot.asinRisks[0]?.sourceView}
            />
          </Panel>
        </section>

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionHeading eyebrow="Data sources" title="Traffic/conversion reporting views" />
              <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--ink-700)]">
                Each section is backed by a named reporting view. Source labels are visible per block so traffic-quality claims remain auditable.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={internalRoute(brand)} className="mc-btn mc-btn-ghost">
                Overview <ArrowUpRight size={15} />
              </Link>
              <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-secondary">
                Advertising <ArrowUpRight size={15} />
              </Link>
              <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-secondary">
                ASIN performance <ArrowUpRight size={15} />
              </Link>
              <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                Retail health <ArrowUpRight size={15} />
              </Link>
              <Link href={brandRoot(brand)} className="mc-btn mc-btn-primary">
                Mission Control <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(renuvTrafficConversionContracts).map(([key, source]) => (
              <div key={key} className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{key}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-900)]">{source}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">{children}</section>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{title}</h2>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}

function Badge({ tone, children }: { tone: 'navy' | 'blue' | 'soft'; children: ReactNode }) {
  const styles = {
    navy: 'bg-[var(--navy-900)] text-white',
    blue: 'bg-[var(--blue-700)] text-white',
    soft: 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)]'
  } as const;

  return <span className={cn('inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]', styles[tone])}>{children}</span>;
}

function TrendPill({ trend, children }: { trend: TrendDirection; children: ReactNode }) {
  const styles = {
    up: 'bg-[#e7f4ee] text-[#2d8a56]',
    down: 'bg-[#fff0e8] text-[#b15d27]',
    flat: 'bg-[#eef2f6] text-[#627587]'
  } as const;

  return <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', styles[trend])}>{children}</span>;
}

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const styles: Record<Tone, string> = {
    positive: 'bg-[#e7f4ee] text-[#2d8a56]',
    warning: 'bg-[#fff8e8] text-[#876a18]',
    critical: 'bg-[#16324a] text-white',
    neutral: 'bg-[#eef2f6] text-[#627587]'
  };

  return <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', styles[tone])}>{children}</span>;
}

function MiniSummaryCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_16px_32px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{title}</p>
        {icon ? <span className="text-[var(--blue-700)]">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p>
    </div>
  );
}

function DataTable({ columns, rows, footer }: { columns: string[]; rows: Array<Array<ReactNode>>; footer?: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[var(--panel-muted)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-[var(--line-soft)] align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-sm leading-6 text-[var(--ink-800)]">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-[var(--line-soft)]">
        {rows.map((row, index) => (
          <div key={index} className="space-y-2 p-4">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{columns[cellIndex]}</span>
                <span className="text-right text-sm leading-6 text-[var(--ink-800)]">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer ? <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{footer}</p> : null}
    </div>
  );
}

function formatToneLabel(tone: Tone) {
  if (tone === 'positive') return 'Healthy';
  if (tone === 'warning') return 'Watch';
  if (tone === 'critical') return 'Critical';
  return 'Stable';
}
