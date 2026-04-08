'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PositionTracking } from '@/lib/renuv-search';

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

/**
 * Displays ASIN visibility share trends as a line chart.
 * Uses impression share from Brand Analytics position tracking data.
 */
export function VisibilityTrendChart({ positions }: { positions: PositionTracking[] }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No position tracking data available</p>
      </div>
    );
  }

  // Transform position data into chart format — show impression share by ASIN
  const data = positions.map(p => ({
    asin: p.asin.length > 12 ? p.asin.slice(0, 12) + '...' : p.asin,
    'Impression Share': parseFloat(p.impressionShare) || 0,
    'Click Share': parseFloat(p.clickShare) || 0,
    'Purchase Share': parseFloat(p.purchaseShare) || 0,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="asin" tick={{ fontSize: 10, fill: '#627587' }} />
          <YAxis tick={{ fontSize: 11, fill: '#627587' }} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="Impression Share" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Click Share" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Purchase Share" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SearchTermBarChart({ terms }: { terms: Array<{ term: string; clicks: number; orders: number; category: string }> }) {
  if (!terms || terms.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No search term data available</p>
      </div>
    );
  }

  const CATEGORY_COLORS: Record<string, string> = {
    brand: '#10b981',
    category: '#2563eb',
    competitor: '#ef4444',
    recovery: '#8b5cf6',
    'post-surgery': '#f59e0b',
  };

  const data = terms
    .map(t => ({
      name: t.term.length > 22 ? t.term.slice(0, 22) + '...' : t.term,
      Clicks: t.clicks,
      Orders: t.orders,
      color: CATEGORY_COLORS[t.category] || '#94a3b8',
    }))
    .sort((a, b) => b.Clicks - a.Clicks)
    .slice(0, 10);

  return (
    <div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#627587' }} width={120} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            />
            <Bar dataKey="Clicks" fill="#2563eb" radius={[0, 6, 6, 0]} />
            <Bar dataKey="Orders" fill="#10b981" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
          <span className="text-[11px] text-[var(--ink-600)]">Brand terms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          <span className="text-[11px] text-[var(--ink-600)]">Category terms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
          <span className="text-[11px] text-[var(--ink-600)]">Recovery terms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
          <span className="text-[11px] text-[var(--ink-600)]">Competitor terms</span>
        </div>
      </div>
    </div>
  );
}

export function BrandedSplitDonut({ terms }: { terms: Array<{ sales: number; category: string }> }) {
  if (!terms || terms.length === 0) return null;

  const branded = terms.filter(t => t.category === 'brand').reduce((s, t) => s + t.sales, 0);
  const nonBranded = terms.filter(t => t.category !== 'brand').reduce((s, t) => s + t.sales, 0);
  const total = branded + nonBranded;
  if (total === 0) return null;

  const data = [
    { name: 'Branded', value: Math.round((branded / total) * 100), color: '#10b981' },
    { name: 'Non-branded', value: Math.round((nonBranded / total) * 100), color: '#2563eb' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-[200px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
              {data.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6">
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
