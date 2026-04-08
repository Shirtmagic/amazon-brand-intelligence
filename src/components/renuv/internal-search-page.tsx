import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Database, ShieldCheck, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalRoute } from '@/lib/renuv-routes';
import {
  renuvSearchContracts,
  type SearchSnapshot,
  type SearchFreshnessSummary,
} from '@/lib/renuv-search';
import { KpiLabel, MetricTooltip } from './metric-tooltip';
import { SearchIntelligenceCard } from './search-intelligence-card';
import { VisibilityTrendChart } from './search-charts';

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
              columns={[
                { label: 'Query', help: 'The shopper search term being evaluated.' },
                { label: 'Volume', help: 'Estimated demand for the query in the selected period.' },
                { label: 'Brand appear', help: 'How often Renuv appears on the results page for this query.' },
                { label: 'Share of voice', help: 'Estimated share of overall visible placements captured by Renuv.' },
                { label: 'Impressions', help: 'How many times Renuv was shown on this query.' },
                { label: 'Clicks', help: 'How many shopper clicks this query generated for Renuv.' },
                { label: 'Click share', help: 'Estimated share of clicks Renuv captured versus the rest of the market on this query.' },
                { label: 'Diagnosis', help: 'A plain-English read of the current search posture for this query.' }
              ]}
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
                <SearchIntelligenceCard key={idx} diagnostic={diagnostic} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Visibility trends" title="ASIN search visibility" />
            <p className="mb-4 text-sm leading-6 text-[var(--ink-700)]">Impression, click, and purchase share by ASIN from Brand Analytics data.</p>
            <VisibilityTrendChart positions={snapshot.positionTracking} />
            <SourceTag>ops_amazon.sp_ba_search_query_by_week_v1_view</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Position tracking" title="ASIN search position trends" />
            <DataTable
              columns={[
                { label: 'ASIN', help: 'Amazon product identifier. Tap to open the listing on Amazon.' },
                { label: 'Title', help: 'The product/ASIN being tracked.' },
                { label: 'Top query', help: 'The most important tracked query for this ASIN in the selected period.' },
                { label: 'Query volume', help: 'Estimated search demand for the tracked query.' },
                { label: 'Impression share', help: 'Share of total search impressions captured by this ASIN on the tracked query.' },
                { label: 'Click share', help: 'Share of total clicks captured by this ASIN on the tracked query.' },
                { label: 'Purchase share', help: 'Share of total purchases captured by this ASIN on the tracked query.' },
                { label: 'CTR', help: 'Click-through rate from search impressions to product clicks.' },
                { label: 'Diagnosis', help: 'A combined read of visibility quality, trend, and click behavior.' }
              ]}
              rows={snapshot.positionTracking.map((row) => [
                <a key="asin" href={`https://www.amazon.com/dp/${row.asin}`} target="_blank" rel="noreferrer" className="font-mono text-sm font-medium text-[var(--blue-700)] underline-offset-2 hover:underline">{row.asin}</a>,
                <span key="title" className="text-sm text-[var(--ink-900)]">{row.title}</span>,
                <span key="query" className="text-sm italic text-[var(--ink-700)]">{row.topQuery}</span>,
                <span key="volume" className="font-mono text-sm text-[var(--ink-800)]">{row.queryVolume}</span>,
                <span key="imprshare" className="font-mono text-sm text-[var(--ink-800)]">{row.impressionShare}</span>,
                <span key="clickshare" className="font-mono text-sm text-[var(--ink-800)]">{row.clickShare}</span>,
                <span key="purchaseshare" className="font-mono text-sm text-[var(--ink-800)]">{row.purchaseShare}</span>,
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
            <p className="mb-4 text-sm leading-6 text-[var(--ink-700)]">Use these cards to see whether Renuv is gaining or losing competitive standing in its most relevant categories and whether the movement is worth acting on.</p>
            <div className="space-y-4">
              {snapshot.categoryRanks.map((cat, idx) => (
                <CategoryRankCard key={idx} rank={cat} />
              ))}
            </div>
            <SourceTag>reporting_amazon.category_rank_daily</SourceTag>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Data freshness" title="Source health" />
            <p className="mb-4 text-sm leading-6 text-[var(--ink-700)]">This tells you whether the search data on this page is current enough to trust for decision-making right now.</p>

            {snapshot.freshnessSummary && (
              <div className={cn(
                'mb-5 rounded-[18px] border p-4',
                snapshot.freshnessSummary.overallTone === 'positive' && 'border-[var(--green-200)] bg-[var(--green-50)]',
                snapshot.freshnessSummary.overallTone === 'warning' && 'border-[var(--yellow-200)] bg-[var(--yellow-50)]',
                snapshot.freshnessSummary.overallTone === 'critical' && 'border-[var(--red-200)] bg-[var(--red-50)]',
                (!snapshot.freshnessSummary.overallTone || snapshot.freshnessSummary.overallTone === 'neutral') && 'border-[var(--line-soft)] bg-[var(--ink-25)]',
              )}>
                <p className="text-sm leading-6 text-[var(--ink-800)]">{snapshot.freshnessSummary.headline}</p>
              </div>
            )}

            <div className="space-y-4">
              {snapshot.freshness.map((fresh, idx) => (
                <SourceHealthRow key={idx} freshness={fresh} />
              ))}
            </div>

            {snapshot.freshnessSummary && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--ink-25)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Decision readiness:</p>
                <DecisionReadinessBadge readiness={snapshot.freshnessSummary.decisionReadiness} />
              </div>
            )}

            <SourceTag>reporting_amazon.data_freshness_status</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="How to use this page" title="Operator guide" />
            <div className="grid gap-4 md:grid-cols-3">
              <QuickGuideCard title="Top queries" detail="Use this block to spot where demand is large, where Renuv is earning click share, and where search momentum supports more investment." />
              <QuickGuideCard title="ASIN position" detail="Use this to identify which ASINs are holding visibility and which ones are slipping on the queries that matter most." />
              <QuickGuideCard title="Category + freshness" detail="Use category rank and source health together before acting so you know both the strategic signal and whether the underlying data is current." />
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

function DataTable({ columns, rows }: { columns: Array<string | { label: string; help?: string }>; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--line-soft)]">
            {columns.map((col, idx) => {
              const label = typeof col === 'string' ? col : col.label;
              const help = typeof col === 'string' ? undefined : col.help;
              return (
                <th key={idx} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">
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

function SourceHealthRow({ freshness }: { freshness: { source: string; updatedAt: string; lag: string; readiness: string; tone: Tone; interpretation?: string } }) {
  const readinessStyles: Partial<Record<string, string>> = {
    Healthy: 'bg-[var(--green-100)] text-[var(--green-800)]',
    Warning: 'bg-[var(--yellow-100)] text-[var(--yellow-800)]',
    Stale: 'bg-[var(--red-100)] text-[var(--red-800)]',
  };

  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--ink-700)]">{freshness.source}</p>
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', readinessStyles[freshness.readiness] || 'bg-[var(--ink-100)] text-[var(--ink-700)]')}>
          {freshness.readiness}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-[var(--ink-700)]">
        <div>
          <span className="font-semibold">Last updated:</span> {freshness.updatedAt}
        </div>
        <div>
          <span className="font-semibold">Lag:</span> {freshness.lag}
        </div>
      </div>
      {freshness.interpretation && (
        <p className="text-xs leading-5 text-[var(--ink-600)] italic">{freshness.interpretation}</p>
      )}
    </div>
  );
}

function DecisionReadinessBadge({ readiness }: { readiness: SearchFreshnessSummary['decisionReadiness'] }) {
  const styles: Record<string, string> = {
    'Ready for optimization': 'bg-[var(--green-100)] text-[var(--green-800)]',
    'Use with caution': 'bg-[var(--yellow-100)] text-[var(--yellow-800)]',
    'Delay major decisions': 'bg-[var(--red-100)] text-[var(--red-800)]',
  };

  return (
    <span className={cn('rounded-full px-3 py-1 text-[11px] font-semibold', styles[readiness])}>
      {readiness}
    </span>
  );
}

function QuickGuideCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
      <p className="text-sm font-semibold text-[var(--ink-900)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p>
    </div>
  );
}
