'use client';

import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

export type DailyTrafficPoint = {
  date: string;
  sessions: number;
  orders: number;
  cvr: number;
  revenuePerSession: number;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Sessions & CVR trend over time — dual-axis area + line chart.
 */
export function SessionCvrTrendChart({ data }: { data: DailyTrafficPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No daily traffic data available for chart</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    Sessions: d.sessions,
    'CVR %': +d.cvr.toFixed(1),
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area yAxisId="left" type="monotone" dataKey="Sessions" stroke="#2563eb" strokeWidth={2} fill="url(#sessionsFill)" />
          <Line yAxisId="right" type="monotone" dataKey="CVR %" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * ASIN conversion risk bar chart — shows CVR by ASIN, color-coded by health.
 */
export function AsinCvrBarChart({ risks }: { risks: Array<{ asin: string; title: string; conversionRate: string; severity: string }> }) {
  if (!risks || risks.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No ASIN risk data available</p>
      </div>
    );
  }

  const data = risks.map(r => ({
    asin: r.asin.length > 12 ? r.asin.slice(0, 12) + '...' : r.asin,
    CVR: parseFloat(r.conversionRate) || 0,
    severity: r.severity,
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="asin" tick={{ fontSize: 10, fill: '#627587' }} width={90} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'CVR']}
          />
          <Bar dataKey="CVR" radius={[0, 6, 6, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.severity === 'positive' ? '#10b981' : entry.severity === 'warning' ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
