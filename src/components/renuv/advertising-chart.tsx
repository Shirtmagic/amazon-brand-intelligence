'use client';

import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AdvertisingChartDataPoint } from '@/lib/renuv-advertising';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmt(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function AdvertisingChart({ data }: { data: AdvertisingChartDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No advertising data available for chart</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    'Ad Spend': d.spend,
    'Ad Sales': d.sales,
    ROAS: d.roas,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradAdSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAdSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
          <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} width={60} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} width={50} tickFormatter={(v: number) => `${v.toFixed(1)}x`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(value: number, name: string) => {
              if (name === 'ROAS') return [`${value.toFixed(2)}x`, name];
              return [fmt(value), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Area yAxisId="left" type="monotone" dataKey="Ad Sales" stroke="#2563eb" strokeWidth={2} fill="url(#gradAdSales)" />
          <Area yAxisId="left" type="monotone" dataKey="Ad Spend" stroke="#f59e0b" strokeWidth={2} fill="url(#gradAdSpend)" />
          <Line yAxisId="right" type="monotone" dataKey="ROAS" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
