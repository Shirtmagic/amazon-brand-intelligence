import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Database, ShieldCheck, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalRoute } from '@/lib/renuv-routes';
import {
  renuvSearchContracts,
  type SearchSnapshot
} from '@/lib/renuv-search';
import { KpiLabel } from './metric-tooltip';

type Tone = 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'critical' | 'active' | 'paused' | 'stale' | 'healthy' | 'degraded';
type TrendDirection = 'up' | 'down' | 'flat';

export function RenuvInternalSearchPage({ snapshot, brand }: { snapshot: SearchSnapshot; brand?: string }) {
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
                <Badge tone="blue">Search intelligence</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Amazon intelligence</p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Search intelligence · {snapshot.brand}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Search term performance, brand visibility, and keyword optimization opportunities.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Internal-only</Tag>
                <Tag>Read-only search review</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-primary">
                  Cross-check advertising <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-secondary">
                  Cross-check ASIN performance <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "traffic-conversion")} className="mc-btn mc-btn-secondary">
                  Cross-check traffic <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Primary source family"
                value="Search + position"
                detail="Query performance, position tracking, category rank, and freshness data for operational review."
                icon={<Database size={18} />}
              />
              <MiniSummaryCard
                title="Trust posture"
                value="Operationally usable"
                detail="Source and view labels stay visible per block so search visibility claims remain auditable later."
                icon={<ShieldCheck size={18} />}
              />
              <MiniSummaryCard
                title="Operator focus"
                value="Organic rank erosion"
                detail="Several ASINs have lost organic position on high-volume queries. The decline is not matched by conversion drops, suggesting competitive or algorithmic pressure."
                icon={<Target size={18} />}
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
            <SectionHeading eyebrow="Query performance" title="Top search queries" />
            <DataTable
              columns={['Query', 'Volume', 'Brand appear', 'Share of voice', 'Impressions', 'Clicks', 'Click share', 'Diagnosis']}
              rows={snapshot.topQueries.map((row) => [
                <span key="query" className="font-medium text-[var(--ink-950)]">{row.query}</span>,
                <span key="volume" className="font-mono text-sm text-[var(--ink-800)]">{row.queryVolume}</span>,
                <span key="appear" className="font-mono text-sm text-[var(--ink-800)]">{row.brandAppearance}</span>,
                <span key="sov" className="font-mono text-sm text-[var(--ink-800)]">{row.shareOfVoice}</span>,
                <span key="impr" className="font-mono text-sm text-[var(--ink-800)]">{row.impressions}</span>,
                <span key="clicks" className="font-mono text-sm text-[var(--ink-800)]">{row.clicks}</span>,
                <span key="share" className="font-mono text-sm text-[var(--ink-800)]">{row.clickShare}</span>,
                <div key="diag" className="flex items-center gap-2">
                  <SeverityDot tone={row.severity} />
                  <span className="text-sm text-[var(--ink-700)]">{row.diagnosis}</span>
                </div>
              ])}
            />
            <SourceTag>reporting_amazon.search_query_performance_daily</SourceTag>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Diagnostics" title="Search intelligence" />
            <div className="space-y-4">
              {snapshot.diagnostics.map((diagnostic, idx) => (
                <DiagnosticCard key={idx} diagnostic={diagnostic} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Position tracking" title="ASIN search position trends" />
            <DataTable
              columns={['ASIN', 'Title', 'Top query', 'Avg position', 'Δ position', 'Organic %', 'Sponsored %', 'CTR', 'Diagnosis']}
              rows={snapshot.positionTracking.map((row) => [
                <span key="asin" className="font-mono text-sm font-medium text-[var(--blue-700)]">{row.asin}</span>,
                <span key="title" className="text-sm text-[var(--ink-900)]">{row.title}</span>,
                <span key="query" className="text-sm italic text-[var(--ink-700)]">{row.topQuery}</span>,
                <span key="pos" className="font-mono text-sm text-[var(--ink-800)]">{row.avgPosition}</span>,
                <TrendCell key="trend" value={row.positionChange} inverse />,
                <span key="org" className="font-mono text-sm text-[var(--ink-800)]">{row.organicShare}</span>,
                <span key="spon" className="font-mono text-sm text-[var(--ink-800)]">{row.sponsoredShare}</span>,
                <span key="ctr" className="font-mono text-sm text-[var(--ink-800)]">{row.clickThroughRate}</span>,
                <div key="diag" className="flex items-center gap-2">
                  <SeverityDot tone={row.severity} />
                  <span className="text-sm text-[var(--ink-700)]">{row.diagnosis}</span>
                </div>
              ])}
            />
            <SourceTag>reporting_amazon.asin_search_position_daily</SourceTag>
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 md:grid-cols-2">
          <Panel>
            <SectionHeading eyebrow="Category performance" title="Category rank trends" />
            <div className="space-y-4">
              {snapshot.categoryRanks.map((cat, idx) => (
                <CategoryRankCard key={idx} rank={cat} />
              ))}
            </div>
            <SourceTag>reporting_amazon.category_rank_daily</SourceTag>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Data freshness" title="Source health" />
            <div className="space-y-3">
              {snapshot.freshness.map((fresh, idx) => (
                <FreshnessRow key={idx} freshness={fresh} />
              ))}
            </div>
            <SourceTag>reporting_amazon.data_freshness_status</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Data sources" title="Reporting views" />
            <p className="mb-6 text-sm leading-7 text-[var(--ink-700)]">
              Each section is backed by a named reporting view for auditability and traceability.
            </p>
            <div className="space-y-6">
              <ContractBlock title="Query performance rollup" sql={renuvSearchContracts.kpi} />
              <ContractBlock title="Daily query performance" sql={renuvSearchContracts.queryPerformance} />
              <ContractBlock title="ASIN search position" sql={renuvSearchContracts.asinPosition} />
              <ContractBlock title="Category rank" sql={renuvSearchContracts.categoryRank} />
              <ContractBlock title="Data freshness" sql={renuvSearchContracts.freshness} />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Badge({ tone, children }: { tone: 'navy' | 'blue' | 'soft'; children: ReactNode }) {
  const toneStyles = {
    navy: 'bg-[var(--navy-100)] text-[var(--navy-800)]',
    blue: 'bg-[var(--blue-100)] text-[var(--blue-800)]',
    soft: 'bg-[var(--ink-100)] text-[var(--ink-700)]'
  } as const;

  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]', toneStyles[tone])}>{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-soft)] bg-white/60 px-2.5 py-1.5 font-mono">
      {children}
    </span>
  );
}

function MiniSummaryCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <article className="rounded-[20px] border border-[var(--line-soft)] bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[var(--blue-700)]">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">{title}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--ink-950)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">{detail}</p>
    </article>
  );
}

function TrendPill({ trend, children }: { trend: TrendDirection; children: ReactNode }) {
  const trendStyles: Record<TrendDirection, string> = {
    up: 'bg-[var(--green-100)] text-[var(--green-800)]',
    down: 'bg-[var(--red-100)] text-[var(--red-800)]',
    flat: 'bg-[var(--ink-100)] text-[var(--ink-700)]'
  };
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums', trendStyles[trend])}>{children}</span>;
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white/90 p-6 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
      {children}
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-950)]">{title}</h2>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--line-soft)]">
            {columns.map((col, idx) => (
              <th key={idx} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="border-b border-[var(--line-soft)] last:border-0">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceTag({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--blue-700)]">
      Source: {children}
    </p>
  );
}

function SeverityDot({ tone }: { tone: Tone }) {
  const dotStyles: Partial<Record<Tone, string>> = {
    positive: 'bg-[var(--green-600)]',
    warning: 'bg-[var(--yellow-600)]',
    critical: 'bg-[var(--red-600)]',
    neutral: 'bg-[var(--ink-400)]'
  };
  return <span className={cn('h-2 w-2 rounded-full', dotStyles[tone])} />;
}

function TrendCell({ value, inverse }: { value: string; inverse?: boolean }) {
  const isPositive = value.startsWith('+');
  const isNegative = value.startsWith('−') || value.startsWith('-');
  
  let tone: 'positive' | 'warning' | 'neutral' = 'neutral';
  if (inverse) {
    if (isNegative) tone = 'positive';
    if (isPositive) tone = 'warning';
  } else {
    if (isPositive) tone = 'positive';
    if (isNegative) tone = 'warning';
  }

  const trendTextStyles: Record<'positive' | 'warning' | 'neutral', string> = {
    positive: 'text-[var(--green-700)]',
    warning: 'text-[var(--red-700)]',
    neutral: 'text-[var(--ink-700)]'
  };

  return <span className={cn('font-mono text-sm font-medium', trendTextStyles[tone])}>{value}</span>;
}

function DiagnosticCard({ diagnostic }: { diagnostic: { title: string; severity: Tone; detail: string; actionBias: string; sourceView: string } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <SeverityDot tone={diagnostic.severity} />
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
    </div>
  );
}

function CategoryRankCard({ rank }: { rank: { category: string; currentRank: string; rankChange: string; topCompetitors: string; trafficShare: string; tone: Tone } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--ink-700)]">{rank.category}</p>
        <SeverityDot tone={rank.tone} />
      </div>
      <div className="mb-3 flex items-baseline gap-3">
        <p className="text-2xl font-semibold text-[var(--ink-950)]">{rank.currentRank}</p>
        <TrendCell value={rank.rankChange} inverse />
      </div>
      <p className="mb-2 text-xs text-[var(--ink-700)]">
        <span className="font-semibold">Competitors:</span> {rank.topCompetitors}
      </p>
      <p className="text-xs text-[var(--ink-700)]">
        <span className="font-semibold">Traffic share:</span> {rank.trafficShare}
      </p>
    </div>
  );
}

function FreshnessRow({ freshness }: { freshness: { source: string; updatedAt: string; lag: string; readiness: string; tone: Tone } }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--line-soft)] bg-[var(--ink-25)] px-4 py-3">
      <div>
        <p className="font-mono text-xs font-medium text-[var(--ink-900)]">{freshness.source}</p>
        <p className="mt-1 text-[11px] text-[var(--ink-600)]">
          Updated {freshness.updatedAt} · Lag: {freshness.lag}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <SeverityDot tone={freshness.tone} />
        <span className="text-xs font-semibold text-[var(--ink-700)]">{freshness.readiness}</span>
      </div>
    </div>
  );
}

function ContractBlock({ title, sql }: { title: string; sql: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-600)]">{title}</p>
      <pre className="overflow-x-auto rounded-lg border border-[var(--line-soft)] bg-[var(--ink-950)] p-4 text-xs leading-6 text-[var(--ink-100)]">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
