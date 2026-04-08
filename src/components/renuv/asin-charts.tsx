'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

/**
 * Horizontal bar chart showing revenue by ASIN, color-coded by tone.
 */
export function RevenueByAsinChart({ asins }: { asins: Array<{ asin: string; title: string; orderedRevenue: string; tone: string }> }) {
  if (!asins || asins.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No ASIN revenue data available</p>
      </div>
    );
  }

  const data = asins.map(a => {
    const rev = parseFloat(a.orderedRevenue.replace(/[$,k]/g, '')) || 0;
    const multiplied = a.orderedRevenue.includes('k') ? rev * 1000 : rev;
    return {
      name: a.title.length > 20 ? a.title.slice(0, 20) + '...' : a.title,
      Revenue: multiplied,
      tone: a.tone,
    };
  }).sort((a, b) => b.Revenue - a.Revenue).slice(0, 10);

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#627587' }} width={120} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
          />
          <Bar dataKey="Revenue" radius={[0, 6, 6, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.tone === 'positive' ? '#10b981' : entry.tone === 'warning' ? '#f59e0b' : entry.tone === 'critical' ? '#ef4444' : '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Concentration donut showing top ASIN revenue share.
 */
export function ConcentrationDonut({ asins }: { asins: Array<{ asin: string; title: string; orderedRevenue: string }> }) {
  if (!asins || asins.length === 0) return null;

  const parsed = asins.map((a, idx) => {
    const rev = parseFloat(a.orderedRevenue.replace(/[$,k]/g, '')) || 0;
    const multiplied = a.orderedRevenue.includes('k') ? rev * 1000 : rev;
    return { name: a.title.length > 18 ? a.title.slice(0, 18) + '...' : a.title, value: multiplied, color: COLORS[idx % COLORS.length] };
  });

  const total = parsed.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const donutData = parsed.map(d => ({ ...d, value: Math.round((d.value / total) * 100) }));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-[200px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
              {donutData.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {donutData.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-[var(--ink-800)] truncate">{d.name}: <span className="font-semibold">{d.value}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
