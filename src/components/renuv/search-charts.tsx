'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
