'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import type { CampaignPerformanceRow, SpendMixRow } from '@/lib/renuv-advertising';

export function RoasByCampaignChart({ campaigns }: { campaigns: CampaignPerformanceRow[] }) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <p className="text-sm text-[var(--ink-600)]">No campaign data available</p>
      </div>
    );
  }

  const data = campaigns
    .map(c => ({ campaign: c.campaign.length > 28 ? c.campaign.slice(0, 28) + '...' : c.campaign, roas: parseFloat(c.roas) || 0 }))
    .sort((a, b) => b.roas - a.roas);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 140, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} domain={[0, 'auto']} />
          <YAxis type="category" dataKey="campaign" tick={{ fontSize: 10, fill: '#627587' }} width={130} />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`${v.toFixed(2)}x`, 'ROAS']}
          />
          <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.roas >= 4 ? '#10b981' : entry.roas >= 3 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const CHANNEL_COLORS: Record<string, string> = { SP: '#2563eb', SB: '#8b5cf6', SD: '#06b6d4' };

export function SpendMixDonut({ spendMix }: { spendMix: SpendMixRow[] }) {
  if (!spendMix || spendMix.length === 0) return null;

  const data = spendMix.map(r => ({
    name: r.channel,
    value: parseFloat(r.spendShare) || 0,
    color: CHANNEL_COLORS[r.channel] || '#94a3b8',
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
              {data.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-[var(--ink-800)]">{d.name}: <span className="font-semibold">{d.value.toFixed(1)}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
