import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, ArrowLeft, ArrowUpRight, CheckCircle2, Clock, Database, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalRoute } from '@/lib/renuv-routes';
import {
  renuvFreshnessContracts,
  type RenuvFreshnessPageSnapshot,
  type Tone,
  type FreshnessStatus
} from '@/lib/renuv-freshness';

export function RenuvInternalFreshnessPage({ snapshot, brand }: { snapshot: RenuvFreshnessPageSnapshot; brand?: string }) {
  const liveReady = snapshot.dataSources.filter(s => s.status === 'live-ready').length;
  const stale = snapshot.dataSources.filter(s => s.status === 'usable-stale' || s.status === 'stale-review').length;
  const failed = snapshot.ingestionHealth.filter(p => p.status === 'failed').length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-6 py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] px-6 py-6 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,420px)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <Link href={internalRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                  <ArrowLeft size={14} /> Back to Renuv overview
                </Link>
                <Badge tone="navy">Internal workspace</Badge>
                <Badge tone="blue">Data freshness</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Amazon intelligence</p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Data freshness &amp; source health · {snapshot.brand}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Monitor data pipeline health and ingestion status across all data sources.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Internal-only</Tag>
                <Tag>Infrastructure monitoring</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-primary">
                  Check advertising data <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "search")} className="mc-btn mc-btn-secondary">
                  Check search data <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                  Check retail data <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Live-ready sources"
                value={`${liveReady}/${snapshot.dataSources.length}`}
                detail="Data sources with &lt;12h lag, suitable for operational decision-making."
                icon={<Database size={18} />}
              />
              <MiniSummaryCard
                title="Stale or missing"
                value={String(stale)}
                detail="Sources with &gt;12h lag or missing expected updates; review required."
                icon={<Clock size={18} />}
              />
              <MiniSummaryCard
                title="Failed pipelines"
                value={String(failed)}
                detail="Ingestion pipelines with errors or authentication failures needing attention."
                icon={<AlertTriangle size={18} />}
              />
            </div>
          </div>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Data sources" title="Source freshness status" />
            <DataTable
              columns={['Source', 'Category', 'Last updated', 'Lag', 'Status', 'Coverage', 'Records', 'Notes']}
              rows={snapshot.dataSources.map((source) => [
                <span key="source" className="font-mono text-sm font-medium text-[var(--ink-950)]">{source.source}</span>,
                <CategoryBadge key="cat" category={source.category} />,
                <div key="updated" className="text-sm">
                  <div className="text-[var(--ink-900)]">{source.lastUpdatedAt}</div>
                  <div className="mt-0.5 text-xs text-[var(--ink-600)]">{source.lastUpdatedUtc}</div>
                </div>,
                <div key="lag" className="text-sm">
                  <div className="font-mono text-[var(--ink-900)]">{source.lagHours}</div>
                  <div className="mt-0.5 text-xs text-[var(--ink-600)]">{source.lagMinutes}</div>
                </div>,
                <StatusBadge key="status" status={source.status} />,
                <span key="cov" className="font-mono text-sm text-[var(--ink-800)]">{source.coverage}</span>,
                <span key="rec" className="font-mono text-sm text-[var(--ink-800)]">{source.recordCount}</span>,
                <span key="notes" className="text-sm text-[var(--ink-700)]">{source.notes}</span>
              ])}
            />
            <SourceTag>reporting_amazon.data_freshness_status</SourceTag>
          </Panel>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Panel>
            <SectionHeading eyebrow="Pipeline status" title="Ingestion health" />
            <div className="space-y-4">
              {snapshot.ingestionHealth.map((pipeline) => (
                <PipelineCard key={pipeline.pipeline} pipeline={pipeline} />
              ))}
            </div>
            <SourceTag>reporting_amazon.ingestion_pipeline_status</SourceTag>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Data quality" title="Quality checks" />
            <div className="space-y-4">
              {snapshot.qualityChecks.map((check) => (
                <QualityCheckCard key={check.check} check={check} />
              ))}
            </div>
            <SourceTag>reporting_amazon.data_quality_checks</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Data sources" title="Reporting views" />
            <p className="mb-6 text-sm leading-7 text-[var(--ink-700)]">
              Each section is backed by a named reporting view for auditability and traceability.
            </p>
            <div className="space-y-6">
              <ContractBlock title="Data source freshness" sql={renuvFreshnessContracts.sources} />
              <ContractBlock title="Ingestion pipeline status" sql={renuvFreshnessContracts.pipelines} />
              <ContractBlock title="Data quality checks" sql={renuvFreshnessContracts.quality} />
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
    <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-soft)] bg-white/60 px-2.5 py-1.5 font-mono text-xs text-[var(--ink-600)]">
      {children}
    </span>
  );
}

function MiniSummaryCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <article className="rounded-[20px] border border-[var(--line-soft)] bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[var(--blue-700)]">{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">{title}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--ink-950)]" dangerouslySetInnerHTML={{ __html: value }} />
      <p className="mt-2 text-xs leading-5 text-[var(--ink-700)]">{detail}</p>
    </article>
  );
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

function CategoryBadge({ category }: { category: string }) {
  const categoryStyles: Record<string, string> = {
    advertising: 'bg-[var(--purple-100)] text-[var(--purple-800)]',
    search: 'bg-[var(--blue-100)] text-[var(--blue-800)]',
    traffic: 'bg-[var(--green-100)] text-[var(--green-800)]',
    retail: 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    inventory: 'bg-[var(--orange-100)] text-[var(--orange-800)]',
    financial: 'bg-[var(--red-100)] text-[var(--red-800)]'
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', categoryStyles[category])}>{category}</span>;
}

function StatusBadge({ status }: { status: FreshnessStatus }) {
  const statusStyles: Record<FreshnessStatus, string> = {
    'live-ready': 'bg-[var(--green-100)] text-[var(--green-800)]',
    'usable-stale': 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    'stale-review': 'bg-[var(--red-100)] text-[var(--red-800)]',
    'missing': 'bg-[var(--ink-200)] text-[var(--ink-700)]'
  };

  let icon = null;
  if (status === 'live-ready') icon = <CheckCircle2 size={10} />;
  if (status === 'usable-stale') icon = <Clock size={10} />;
  if (status === 'stale-review' || status === 'missing') icon = <AlertTriangle size={10} />;

  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', statusStyles[status])}>{icon} {status}</span>;
}

function PipelineCard({ pipeline }: { pipeline: { pipeline: string; category: string; lastRunAt: string; status: string; tone: Tone; recordsIngested: string; errorCount: string; errorDetail?: string; nextScheduled: string } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <CategoryBadge category={pipeline.category} />
            <PipelineStatusBadge status={pipeline.status as 'success' | 'partial' | 'failed'} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink-950)]">{pipeline.pipeline}</h3>
        </div>
      </div>
      <div className="mb-3 grid gap-2 text-sm">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--ink-600)]">Last run:</span>
          <span className="font-medium text-[var(--ink-900)]">{pipeline.lastRunAt}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--ink-600)]">Records ingested:</span>
          <span className="font-mono text-[var(--ink-900)]">{pipeline.recordsIngested}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--ink-600)]">Errors:</span>
          <span className={cn('font-mono', pipeline.errorCount === '0' ? 'text-[var(--green-700)]' : 'text-[var(--red-700)]')}>{pipeline.errorCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--ink-600)]">Next scheduled:</span>
          <span className="font-medium text-[var(--ink-900)]">{pipeline.nextScheduled}</span>
        </div>
      </div>
      {pipeline.errorDetail && (
        <div className="rounded-lg border border-[var(--red-200)] bg-[var(--red-50)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--red-800)]">Error detail</p>
          <p className="mt-1 text-sm text-[var(--red-900)]">{pipeline.errorDetail}</p>
        </div>
      )}
    </div>
  );
}

function PipelineStatusBadge({ status }: { status: 'success' | 'partial' | 'failed' }) {
  const pipelineStatusStyles: Record<'success' | 'partial' | 'failed', string> = {
    'success': 'bg-[var(--green-100)] text-[var(--green-800)]',
    'partial': 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    'failed': 'bg-[var(--red-100)] text-[var(--red-800)]'
  };

  let icon = <CheckCircle2 size={10} />;
  if (status === 'partial') icon = <AlertTriangle size={10} />;
  if (status === 'failed') icon = <XCircle size={10} />;

  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', pipelineStatusStyles[status])}>{icon} {status}</span>;
}

function QualityCheckCard({ check }: { check: { check: string; description: string; status: string; tone: Tone; detail: string; lastCheckedAt: string } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--ink-950)]">{check.check}</h3>
        <QualityStatusBadge status={check.status as 'pass' | 'warn' | 'fail'} />
      </div>
      <p className="mb-2 text-xs text-[var(--ink-600)]">{check.description}</p>
      <p className="mb-3 text-sm leading-6 text-[var(--ink-800)]">{check.detail}</p>
      <p className="text-xs text-[var(--ink-600)]">
        Last checked: {check.lastCheckedAt}
      </p>
    </div>
  );
}

function QualityStatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const qualityStatusStyles: Record<'pass' | 'warn' | 'fail', string> = {
    'pass': 'bg-[var(--green-100)] text-[var(--green-800)]',
    'warn': 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    'fail': 'bg-[var(--red-100)] text-[var(--red-800)]'
  };

  let icon = <CheckCircle2 size={10} />;
  if (status === 'warn') icon = <AlertTriangle size={10} />;
  if (status === 'fail') icon = <XCircle size={10} />;

  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', qualityStatusStyles[status])}>{icon} {status}</span>;
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
