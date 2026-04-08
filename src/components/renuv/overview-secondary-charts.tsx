'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { RenuvDailyDataPoint } from '@/lib/renuv-overview';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * CVR vs ACOS dual-line trend chart.
 * Derives CVR from sessions/orders and ACOS from adSpend/revenue.
 */
export function CvrAcosTrendChart({ data }: { data: RenuvDailyDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No daily data available for chart</p>
      </div>
    );
  }

  const chartData = data.map(d => {
    const cvr = d.sessions > 0 ? ((d.revenue / (d.sessions * 167)) * 100) : 0; // approximate orders from revenue/AOV
    const acos = d.revenue > 0 ? (d.adSpend / d.revenue) * 100 : 0;
    return {
      date: formatDate(d.date),
      'CVR %': +cvr.toFixed(1),
      'ACOS %': +acos.toFixed(1),
    };
  });

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line type="monotone" dataKey="CVR %" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ACOS %" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Organic vs PPC revenue donut for the overview page.
 * Takes total revenue and ad spend, approximates PPC revenue as ad-attributed.
 */
export function OverviewRevenueDonut({ data }: { data: RenuvDailyDataPoint[] }) {
  if (!data || data.length === 0) return null;

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalAdSpend = data.reduce((sum, d) => sum + d.adSpend, 0);
  // Approximate PPC revenue as ~3x ad spend (typical ROAS), capped at total revenue
  const estPpcRevenue = Math.min(totalAdSpend * 3, totalRevenue);
  const estOrganicRevenue = totalRevenue - estPpcRevenue;

  if (totalRevenue === 0) return null;

  const donutData = [
    { name: 'Organic', value: Math.round((estOrganicRevenue / totalRevenue) * 100), color: '#10b981' },
    { name: 'PPC', value: Math.round((estPpcRevenue / totalRevenue) * 100), color: '#2563eb' },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
              {donutData.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {donutData.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-[var(--ink-800)]">{d.name}: <span className="font-semibold">{d.value}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
