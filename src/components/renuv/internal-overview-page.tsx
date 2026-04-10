import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RenuvOverviewSnapshot, Tone } from '@/lib/renuv-overview';
import { AlertSummaryWidget } from './alert-summary-widget';
import { DateRangePicker } from './date-range-picker';
import { OverviewChart } from './overview-chart';
import { CvrAcosTrendChart, OverviewRevenueDonut } from './overview-secondary-charts';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';
import { KpiLabel, MetricTooltip } from './metric-tooltip';

function findKpi(kpis: RenuvOverviewSnapshot['kpis'], key: string) {
  return kpis.find((k) => k.key === key);
}

function isFeeDataAvailable(feeSummary: RenuvOverviewSnapshot['feeSummary']) {
  const rate = feeSummary.feeRate;
  const fees = feeSummary.estimatedFees;
  if (!rate || !fees) return false;
  if (rate === 'N/A' || rate === '$0' || rate === '0') return false;
  if (fees === 'N/A' || fees === '$0' || fees === '0' || fees === '$0.00') return false;
  return true;
}

export function RenuvInternalOverviewPage({ snapshot, brand }: { snapshot: RenuvOverviewSnapshot; brand?: string }) {
  const revenueKpi = findKpi(snapshot.kpis, 'ordered-revenue');
  const tacosKpi = findKpi(snapshot.kpis, 'tacos');
  const cvrKpi = findKpi(snapshot.kpis, 'conversion-rate');
  const feeAvailable = isFeeDataAvailable(snapshot.feeSummary);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,420px)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <Link href={brandRoot(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                  <ArrowLeft size={14} /> Back to Mission Control
                </Link>
                <Badge tone="navy">Internal</Badge>
                <Badge tone="blue">Renuv</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Amazon intelligence</p>
                <DateRangePicker />
              </div>

              <div>
                <h1 className="max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  {snapshot.brand} overview
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Consolidated performance view across advertising, search, fees, and brand health — updated daily from live reporting.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Read-only</Tag>
                <Tag>Daily refresh</Tag>
                <Tag>All channels</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "alerts")} className="mc-btn mc-btn-primary">
                  View active alerts <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-secondary">
                  Advertising <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "search")} className="mc-btn mc-btn-secondary">
                  Search intelligence <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "traffic-conversion")} className="mc-btn mc-btn-secondary">
                  Traffic &amp; conversion <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-secondary">
                  ASIN performance <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                  Inventory <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "notes")} className="mc-btn mc-btn-secondary">
                  Notes &amp; actions <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "freshness")} className="mc-btn mc-btn-secondary">
                  Data freshness <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Revenue"
                value={revenueKpi?.value ?? '—'}
                detail={revenueKpi?.delta ?? ''}
                icon={<DollarSign size={18} />}
              />
              <MiniSummaryCard
                title="TACOS"
                value={tacosKpi?.value ?? '—'}
                detail={tacosKpi?.delta ?? ''}
                icon={<TrendingUp size={18} />}
              />
              <MiniSummaryCard
                title="Conversion rate"
                value={cvrKpi?.value ?? '—'}
                detail={cvrKpi?.delta ?? ''}
                icon={<BarChart3 size={18} />}
              />
            </div>
          </div>
        </section>

        <div className="mb-6">
          <AlertSummaryWidget brand={brand} />
        </div>

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

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Performance over time" title="Revenue, ad spend &amp; sessions" />
            <div className="mt-5">
              <OverviewChart data={snapshot.dailyData} />
            </div>
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
          <Panel>
            <SectionHeading eyebrow="Efficiency trends" title="CVR vs ACOS" />
            <div className="mt-5">
              <CvrAcosTrendChart data={snapshot.dailyData} />
            </div>
          </Panel>
          <Panel>
            <SectionHeading eyebrow="Revenue mix" title="Organic vs PPC" />
            <div className="mt-5 flex items-center justify-center">
              <OverviewRevenueDonut data={snapshot.dailyData} />
            </div>
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Panel>
            <SectionHeading eyebrow="Data freshness" title="Source health &amp; reporting readiness" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {snapshot.freshness.map((item) => (
                <div key={item.source} className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-950)]">{item.source}</p>
                      <p className="mt-1 text-xs text-[var(--ink-600)]">{item.updatedAt}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Lag" value={item.lag} />
                    <MiniMetric label="Coverage" value={item.coverage} />
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{item.sourceView}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Brand health" title="Attention summary" />
            <div className="mt-5 rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.96))] p-5">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{snapshot.brandHealth.headline}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{snapshot.brandHealth.summary}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {snapshot.brandHealth.signals.map((signal) => (
                <div key={signal.label} className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{signal.label}</p>
                    <ToneBadge tone={signal.tone}>{signal.value}</ToneBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{signal.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Priority actions</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--ink-800)]">
                {snapshot.brandHealth.priorityActions.map((action) => (
                  <li key={action} className="flex gap-3">
                    <CheckCircle2 size={16} className="mt-1 shrink-0 text-[var(--blue-700)]" /> <span>{action}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{snapshot.brandHealth.sourceView}</p>
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Campaign performance" title="Top campaigns" />
            <DataTable
              columns={['Campaign', 'Channel', 'Revenue', 'Spend', 'ROAS', 'TACOS impact', 'Status']}
              rows={snapshot.campaigns.map((row) => [
                row.campaign,
                row.channel,
                row.revenue,
                row.spend,
                row.roas,
                row.tacosImpact,
                <ToneBadge key={`${row.campaign}-status`} tone={row.status}>{formatToneLabel(row.status)}</ToneBadge>
              ])}
              footer={snapshot.campaigns[0]?.sourceView}
            />
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <Panel>
            <SectionHeading eyebrow="Paid search" title="Search term diagnostics" />
            {snapshot.paidSearchDiagnostics.length > 0 ? (
              <DataTable
                columns={['Query', 'Match type', 'Spend', 'Sales', 'ACOS', 'Clicks', 'Diagnosis']}
                rows={snapshot.paidSearchDiagnostics.map((row) => [
                  row.query,
                  row.matchType,
                  row.spend,
                  row.sales,
                  row.acos,
                  row.clicks,
                  row.diagnosis
                ])}
                footer={snapshot.paidSearchDiagnostics[0]?.sourceView}
              />
            ) : (
              <p className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-5 py-4 text-sm text-[var(--ink-600)]">
                No paid search diagnostic data available for this period.
              </p>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel>
              <SectionHeading eyebrow="Fees" title="Fee summary" />
              {feeAvailable ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <MiniSummaryCard title="Fee rate" value={snapshot.feeSummary.feeRate} detail="" />
                    <MiniSummaryCard title="Estimated fees" value={snapshot.feeSummary.estimatedFees} detail="" />
                    <MiniSummaryCard title="Reimbursement watch" value={snapshot.feeSummary.reimbursementWatch} detail="" />
                  </div>
                  {snapshot.feeSummary.notes.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink-700)]">
                      {snapshot.feeSummary.notes.map((note) => (
                        <li key={note} className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3">{note}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{snapshot.feeSummary.sourceView}</p>
                </>
              ) : (
                <p className="mt-5 rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] px-5 py-4 text-sm text-[var(--ink-600)]">
                  Fee data is not yet available for this period. This section will populate automatically once fee reporting is active.
                </p>
              )}
            </Panel>

            <Panel>
              <SectionHeading eyebrow="Reconciliation" title="Revenue reconciliation" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniMetric label="Revenue delta" value={snapshot.reconciliation.revenueDelta} large />
                <MiniMetric label="Tolerance band" value={snapshot.reconciliation.tolerance} large />
                <MiniMetric label="Order revenue" value={snapshot.reconciliation.orderRevenue} />
                <MiniMetric label="Retail revenue" value={snapshot.reconciliation.retailRevenue} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-700)]">{snapshot.reconciliation.note}</p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{snapshot.reconciliation.sourceView}</p>
            </Panel>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
          <SectionHeading eyebrow="Explore" title="Detailed views" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NavCard href={internalRoute(brand, "advertising")} label="Advertising" description="Campaign efficiency and spend analysis" />
            <NavCard href={internalRoute(brand, "traffic-conversion")} label="Traffic &amp; conversion" description="Session quality and CVR diagnostics" />
            <NavCard href={internalRoute(brand, "asins")} label="ASIN performance" description="Ranked product-level analysis" />
            <NavCard href={internalRoute(brand, "retail-health")} label="Inventory" description="Stock levels, days of supply, and inbound pipeline" />
          </div>
        </section>
      </div>
    </main>
  );
}

function NavCard({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="group rounded-[22px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_12px_30px_rgba(19,44,74,0.05)] transition-shadow hover:shadow-[0_16px_40px_rgba(19,44,74,0.10)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--ink-950)]">{label}</p>
        <ArrowUpRight size={15} className="text-[var(--blue-700)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-600)]">{description}</p>
    </Link>
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

function TrendPill({ trend, children }: { trend: 'up' | 'down' | 'flat'; children: ReactNode }) {
  const styles = {
    up: 'bg-[#e7f4ee] text-[#2d8a56]',
    down: 'bg-[#fff0e8] text-[#b15d27]',
    flat: 'bg-[#eef2f6] text-[#627587]'
  } as const;

  return <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', styles[trend])}>{children}</span>;
}

function StatusBadge({ status }: { status: 'healthy' | 'watch' | 'stale' }) {
  const styles = {
    healthy: 'bg-[#e7f4ee] text-[#2d8a56]',
    watch: 'bg-[#fff8e8] text-[#876a18]',
    stale: 'bg-[#fff0e8] text-[#b15d27]'
  } as const;

  return <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', styles[status])}>{status}</span>;
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
        <KpiLabel>{title}</KpiLabel>
        {icon ? <span className="text-[var(--blue-700)]">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p> : null}
    </div>
  );
}

function MiniMetric({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <KpiLabel className="text-[11px] tracking-[0.16em]">{label}</KpiLabel>
      <p className={cn('mt-2 font-semibold tracking-[-0.03em] text-[var(--ink-950)]', large ? 'text-2xl' : 'text-base')}>{value}</p>
    </div>
  );
}

function DataTable({ columns, rows, footer }: { columns: Array<string | { label: string; help?: string }>; rows: Array<Array<ReactNode>>; footer?: string }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[var(--panel-muted)]">
            <tr>
              {columns.map((column) => {
                const label = typeof column === 'string' ? column : column.label;
                const help = typeof column === 'string' ? undefined : column.help;
                return (
                  <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {help ? <MetricTooltip label={label} helpText={help} /> : null}
                    </span>
                  </th>
                );
              })}
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
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{typeof columns[cellIndex] === 'string' ? columns[cellIndex] : columns[cellIndex].label}</span>
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
