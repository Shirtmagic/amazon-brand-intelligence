'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { RenuvDailyDataPoint } from '@/lib/renuv-overview';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function OverviewChart({ data }: { data: RenuvDailyDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No daily data available for chart</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    Revenue: d.revenue,
    'Ad Spend': d.adSpend,
    Sessions: d.sessions,
  }));

  return (
    <div className="h-[320px] w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#627587' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: '#627587' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#627587' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => {
              const v = Number(value);
              if (name === 'Sessions') return [v.toLocaleString(), name];
              return [formatCurrency(v), name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Revenue"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#gradRevenue)"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Ad Spend"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradSpend)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Sessions"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
