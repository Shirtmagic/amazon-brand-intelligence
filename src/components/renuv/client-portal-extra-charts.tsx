'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';

type TopAsinRow = {
  title: string;
  revenue: number;
  cvr: number;
};

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

/**
 * Top ASINs revenue bar for the client portal.
 */
export function TopAsinsChart({ asins }: { asins: TopAsinRow[] }) {
  if (!asins || asins.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No ASIN performance data available</p>
      </div>
    );
  }

  const data = asins.map((a, idx) => ({
    name: a.title.length > 22 ? a.title.slice(0, 22) + '...' : a.title,
    Revenue: a.revenue,
    color: COLORS[idx % COLORS.length],
  })).sort((a, b) => b.Revenue - a.Revenue);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 150, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#627587' }} width={140} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
          />
          <Bar dataKey="Revenue" radius={[0, 6, 6, 0]}>
            {data.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Performance health radial bar for client portal — shows key metrics as percentage of target.
 */
export function PerformanceHealthRadial({ metrics }: { metrics: Array<{ label: string; value: number; fill: string }> }) {
  if (!metrics || metrics.length === 0) return null;

  const data = metrics.map(m => ({
    name: m.label,
    value: m.value,
    fill: m.fill,
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={6} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
          <Tooltip formatter={(v: number) => `${v}%`} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
