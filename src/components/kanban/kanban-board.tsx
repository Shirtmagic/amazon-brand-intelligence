import { KanbanColumn } from '@/lib/types';

interface Props {
  columns: KanbanColumn[];
}

const columnColors: Record<string, string> = {
  backlog: 'border-white/15',
  'in-progress': 'border-honey-400/50',
  blocked: 'border-sunstone/50',
  done: 'border-emerald-400/40'
};

export function KanbanBoard({ columns }: Props) {
  return (
    <section className="card-shell">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-white/60">Workstream</p>
          <h2 className="text-xl font-semibold">Kanban Overview</h2>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`rounded-2xl border ${columnColors[column.id] ?? 'border-white/15'} bg-white/[0.02] p-3 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{column.title}</h3>
              <span className="text-xs text-white/60">{column.cards.length}</span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <article
                  key={card.id}
                  className="p-3 rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  <p className="text-sm font-medium text-white">{card.title}</p>
                  <p className="text-xs text-white/60 mt-1">{card.assignee}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
