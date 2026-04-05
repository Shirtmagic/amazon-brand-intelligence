import { ActivityItem, DependencyItem } from '@/lib/types';

interface Props {
  activity: ActivityItem[];
  dependencies: DependencyItem[];
}

export function ActivityStack({ activity, dependencies }: Props) {
  return (
    <section className="card-shell space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">Activity</p>
        <h2 className="text-xl font-semibold mb-3">Latest</h2>
        <ol className="space-y-3">
          {activity.map((item) => (
            <li key={item.timestamp} className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-honey-400 mt-2" />
              <div>
                <p className="text-sm text-white">{item.summary}</p>
                <p className="text-xs text-white/60">{item.actor} · {new Date(item.timestamp).toLocaleTimeString()}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">Dependencies</p>
        <h2 className="text-xl font-semibold mb-3">Awaiting Input</h2>
        <ul className="space-y-2">
          {dependencies.map((dep) => (
            <li key={dep.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
              <div>
                <p className="text-white">{dep.title}</p>
                <p className="text-xs text-white/60">Owner: {dep.owner}</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">{dep.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
