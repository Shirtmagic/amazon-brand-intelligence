'use client';

import { ApiProviderUsage } from '@/lib/types';
import { useMissionControlStore } from '@/lib/store';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface Props {
  providers: ApiProviderUsage[];
}

export function ApiUsageWidget({ providers }: Props) {
  const { selectedProvider, setSelectedProvider } = useMissionControlStore();
  const active = providers.find((p) => p.id === selectedProvider) ?? providers[0];

  return (
    <section className="card-shell">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-white/60">API Usage</p>
          <h2 className="text-xl font-semibold">Provider Health</h2>
        </div>
        <div className="flex gap-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                provider.id === active.id ? 'bg-honey-400/30 border-honey-400 text-white' : 'border-white/10 text-white/60'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>
      </header>
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Requests" value={active.requests.toLocaleString()} />
        <Stat label="Tokens" value={active.tokens.toLocaleString()} />
        <Stat label="Est. Cost" value={`$${active.cost.toFixed(2)}`} />
      </div>
      <div className="h-32 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={active.sparkline.map((value, idx) => ({ idx, value }))}>
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F4A48A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F4A48A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#F4A48A" fillOpacity={1} fill="url(#usageGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <footer className="mt-4 text-xs text-white/60">
        Quota usage: {(active.quota * 100).toFixed(0)}%
      </footer>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
