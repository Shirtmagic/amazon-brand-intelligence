import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock, Database, FileText, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalRoute } from '@/lib/renuv-routes';
import {
  renuvNotesContracts,
  type RenuvNotesPageSnapshot,
  type Priority,
  type ActionStatus,
  type Tone
} from '@/lib/renuv-notes';

export function RenuvInternalNotesPage({ snapshot, brand }: { snapshot: RenuvNotesPageSnapshot; brand?: string }) {
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
                <Badge tone="blue">Notes &amp; actions</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Amazon intelligence</p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Notes &amp; next actions · {snapshot.brand}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Team notes, action items, and decision log for the Renuv account.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Internal-only</Tag>
                <Tag>Team collaboration</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-primary">
                  Review advertising <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "search")} className="mc-btn mc-btn-secondary">
                  Review search <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "retail-health")} className="mc-btn mc-btn-secondary">
                  Review retail health <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Primary source family"
                value="Collaboration data"
                detail="Notes, action items, and decision logs stored in team collaboration schemas with cross-module tagging."
                icon={<Database size={18} />}
              />
              <MiniSummaryCard
                title="Trust posture"
                value="Internal team context"
                detail="No customer-facing exposure. Purely internal coordination surface with module cross-references."
                icon={<ShieldCheck size={18} />}
              />
              <MiniSummaryCard
                title="Operator focus"
                value="Action tracking"
                detail="5 pending/in-progress actions with clear ownership, priorities, and due dates."
                icon={<FileText size={18} />}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Panel>
            <SectionHeading eyebrow="Active items" title="Next actions" />
            <div className="space-y-4">
              {snapshot.nextActions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
            <SourceTag>reporting_amazon.next_actions</SourceTag>
          </Panel>

          <Panel>
            <SectionHeading eyebrow="Recent activity" title="Team notes" />
            <div className="space-y-4">
              {snapshot.recentNotes.slice(0, 8).map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
            <SourceTag>reporting_amazon.team_notes</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Decision log" title="Recent decisions" />
            <div className="space-y-4">
              {snapshot.recentDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
            <SourceTag>reporting_amazon.decision_log</SourceTag>
          </Panel>
        </section>

        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Data sources" title="Reporting views" />
            <p className="mb-6 text-sm leading-7 text-[var(--ink-700)]">
              Each section is backed by a named reporting view for auditability and traceability.
            </p>
            <div className="space-y-6">
              <ContractBlock title="Team notes" sql={renuvNotesContracts.notes} />
              <ContractBlock title="Next actions" sql={renuvNotesContracts.actions} />
              <ContractBlock title="Decision log" sql={renuvNotesContracts.decisions} />
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
      <p className="mt-2 text-lg font-semibold text-[var(--ink-950)]">{value}</p>
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

function SourceTag({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--blue-700)]">
      Source: {children}
    </p>
  );
}

function ActionCard({ action }: { action: { id: string; title: string; description: string; priority: Priority; status: ActionStatus; assignedTo: string; dueDate: string; relatedModule?: string; blockerDetail?: string } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <PriorityBadge priority={action.priority} />
            <StatusBadge status={action.status} />
            {action.relatedModule && <ModuleBadge module={action.relatedModule} />}
          </div>
          <h3 className="text-base font-semibold text-[var(--ink-950)]">{action.title}</h3>
        </div>
      </div>
      <p className="mb-3 text-sm leading-6 text-[var(--ink-700)]">{action.description}</p>
      {action.blockerDetail && (
        <div className="mb-3 rounded-lg border border-[var(--red-200)] bg-[var(--red-50)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--red-800)]">Blocked</p>
          <p className="mt-1 text-sm text-[var(--red-900)]">{action.blockerDetail}</p>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-[var(--ink-600)]">
        <div className="flex items-center gap-4">
          <span>
            <span className="font-semibold">Assigned:</span> {action.assignedTo}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Due {action.dueDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: { id: string; timestamp: string; author: string; category: string; title: string; detail: string; tags: string[]; relatedModule?: string } }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <CategoryBadge category={note.category} />
            {note.relatedModule && <ModuleBadge module={note.relatedModule} />}
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink-950)]">{note.title}</h3>
        </div>
      </div>
      <p className="mb-3 text-sm leading-6 text-[var(--ink-700)]">{note.detail}</p>
      <div className="flex items-center justify-between text-xs text-[var(--ink-600)]">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded bg-[var(--ink-100)] px-2 py-0.5 font-mono text-[10px]">
              {tag}
            </span>
          ))}
        </div>
        <span>
          {note.author} · {note.timestamp}
        </span>
      </div>
    </div>
  );
}

function DecisionCard({ decision }: { decision: { id: string; date: string; decision: string; context: string; outcome: string; participants: string[] } }) {
  return (
    <div className="rounded-xl border border-[var(--blue-200)] bg-[var(--blue-50)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-[var(--blue-700)]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--blue-800)]">Decision · {decision.date}</p>
      </div>
      <h3 className="mb-3 text-base font-semibold text-[var(--ink-950)]">{decision.decision}</h3>
      <div className="mb-3 space-y-2 text-sm leading-6 text-[var(--ink-800)]">
        <div>
          <span className="font-semibold">Context:</span> {decision.context}
        </div>
        <div>
          <span className="font-semibold">Expected outcome:</span> {decision.outcome}
        </div>
      </div>
      <p className="text-xs text-[var(--ink-600)]">
        <span className="font-semibold">Participants:</span> {decision.participants.join(', ')}
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const priorityStyles: Record<Priority, string> = {
    'high': 'bg-[var(--red-100)] text-[var(--red-800)]',
    'medium': 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    'low': 'bg-[var(--ink-100)] text-[var(--ink-700)]'
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', priorityStyles[priority])}>{priority}</span>;
}

function StatusBadge({ status }: { status: ActionStatus }) {
  const statusStyles: Record<ActionStatus, string> = {
    'in-progress': 'bg-[var(--blue-100)] text-[var(--blue-800)]',
    'blocked': 'bg-[var(--red-100)] text-[var(--red-800)]',
    'complete': 'bg-[var(--green-100)] text-[var(--green-800)]',
    'pending': 'bg-[var(--ink-100)] text-[var(--ink-700)]'
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', statusStyles[status])}>{status}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  const categoryStyles: Record<string, string> = {
    'decision': 'bg-[var(--purple-100)] text-[var(--purple-800)]',
    'observation': 'bg-[var(--blue-100)] text-[var(--blue-800)]',
    'question': 'bg-[var(--yellow-100)] text-[var(--yellow-900)]',
    'action-item': 'bg-[var(--green-100)] text-[var(--green-800)]'
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', categoryStyles[category])}>{category}</span>;
}

function ModuleBadge({ module }: { module: string }) {
  return (
    <span className="rounded bg-[var(--navy-100)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--navy-800)]">
      {module}
    </span>
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
