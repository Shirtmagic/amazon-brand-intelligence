'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { InventoryStatus } from '@/lib/renuv-retail-health';

const STATUS_COLORS = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };

type Window = 7 | 30 | 60 | 90;
const WINDOWS: Window[] = [7, 30, 60, 90];

function statusForDos(dos: number): 'healthy' | 'warning' | 'critical' {
  if (dos <= 7) return 'critical';
  if (dos <= 21) return 'warning';
  return 'healthy';
}

/**
 * Inventory levels bar chart — units available per SKU, color-coded by health status.
 */
export function InventoryLevelChart({ inventory }: { inventory: InventoryStatus[] }) {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No inventory data available</p>
      </div>
    );
  }

  const data = inventory.map(i => ({
    sku: i.sku,
    name: i.name.length > 22 ? i.name.slice(0, 22) + '...' : i.name,
    Units: i.unitsAvailable,
    status: i.status,
  }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="sku" tick={{ fontSize: 10, fill: '#627587' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [v.toLocaleString(), 'Units available']}
          />
          <Bar dataKey="Units" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Days of supply panel — owns its own heading row so the 7/30/60/90 window
 * toggle can sit inline to the right of the title without taking an extra
 * row of vertical space. Days of supply is recomputed client-side as
 * unitsAvailable / avgDailyUnits[selected window] and bars are re-bucketed
 * into healthy / watch / critical from the computed runway.
 */
export function DaysOfSupplyChart({ inventory }: { inventory: InventoryStatus[] }) {
  const [windowDays, setWindowDays] = useState<Window>(30);

  const toggle = (
    <div
      role="group"
      aria-label="Sales window for days of supply"
      className="inline-flex shrink-0 rounded-full border border-[var(--line-soft)] bg-white p-0.5 shadow-[0_8px_20px_rgba(19,44,74,0.04)]"
    >
      {WINDOWS.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => setWindowDays(w)}
          aria-pressed={windowDays === w}
          className={
            'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition ' +
            (windowDays === w
              ? 'bg-[var(--blue-700)] text-white shadow-[0_4px_12px_rgba(26,84,144,0.25)]'
              : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]')
          }
        >
          {w}d
        </button>
      ))}
    </div>
  );

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">Supply runway</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">Days of supply</h2>
      </div>
      {toggle}
    </div>
  );

  if (!inventory || inventory.length === 0) {
    return (
      <div>
        {header}
        <div className="mt-5 flex h-[240px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
          <p className="text-sm text-[var(--ink-600)]">No inventory data available</p>
        </div>
      </div>
    );
  }

  const windowKey = `d${windowDays}` as keyof InventoryStatus['avgDailyByWindow'];

  const data = inventory.map(i => {
    const avgDaily = i.avgDailyByWindow?.[windowKey] ?? 0;
    // If we have no sales data for the window, fall back to the source daysOfSupply
    // so we never show a bar as "Infinity" or 0 incorrectly.
    const computedDos = avgDaily > 0
      ? Math.round(i.unitsAvailable / avgDaily)
      : i.daysOfSupply;
    return {
      sku: i.sku,
      'Days of Supply': computedDos,
      avgDaily,
      unitsAvailable: i.unitsAvailable,
      status: statusForDos(computedDos),
    };
  }).sort((a, b) => a['Days of Supply'] - b['Days of Supply']);

  return (
    <div>
      {header}
      <div className="mt-5 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} tickFormatter={(v: number) => `${v}d`} />
            <YAxis type="category" dataKey="sku" tick={{ fontSize: 10, fill: '#627587' }} width={70} />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              formatter={(value: number, _name: string, item: { payload?: { avgDaily?: number; unitsAvailable?: number } }) => {
                const avg = item?.payload?.avgDaily ?? 0;
                const units = item?.payload?.unitsAvailable ?? 0;
                return [
                  `${value} days`,
                  `${units.toLocaleString()} units ÷ ${avg.toFixed(1)}/day (${windowDays}d avg)`,
                ];
              }}
            />
            <Bar dataKey="Days of Supply" radius={[0, 6, 6, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
