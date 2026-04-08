'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { TrendDataPoint } from '@/lib/renuv-client-portal';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmt(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function ClientTrendChart({ data }: { data: TrendDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">Performance trends shown in detailed reports</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    Revenue: d.revenue,
    'Ad Spend': d.adSpend,
    Orders: d.orders,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradClientRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} width={55} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(value: number, name: string) => {
              if (name === 'Orders') return [value.toLocaleString(), name];
              return [fmt(value), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gradClientRev)" />
          <Area type="monotone" dataKey="Ad Spend" stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrganicPpcDonut({ organicRevenue, ppcRevenue }: { organicRevenue: number; ppcRevenue: number }) {
  const total = organicRevenue + ppcRevenue;
  if (total === 0) return null;

  const data = [
    { name: 'Organic', value: Math.round((organicRevenue / total) * 100), color: '#10b981' },
    { name: 'PPC', value: Math.round((ppcRevenue / total) * 100), color: '#2563eb' },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
              {data.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-[var(--ink-800)]">{d.name}: <span className="font-semibold">{d.value}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
