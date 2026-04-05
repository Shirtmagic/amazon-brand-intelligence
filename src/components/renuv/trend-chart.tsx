'use client';

import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface TrendChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  type?: 'area' | 'line';
  height?: number;
  color?: 'blue' | 'green' | 'navy' | 'mint';
  showGrid?: boolean;
  className?: string;
}

const COLOR_MAP = {
  blue: { primary: '#5ea8ff', gradient: '#2d74d7' },
  green: { primary: '#4ade80', gradient: '#22c55e' },
  navy: { primary: '#1f3e5f', gradient: '#16324a' },
  mint: { primary: '#6ee7b7', gradient: '#34d399' }
};

export function TrendChart({
  data,
  xKey,
  yKey,
  type = 'area',
  height = 240,
  color = 'blue',
  showGrid = true,
  className
}: TrendChartProps) {
  const colors = COLOR_MAP[color];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border border-[var(--line-soft)] bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-[var(--ink-900)]">
          {payload[0].payload[xKey]}
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--ink-950)]">
          {formatChartValue(payload[0].value)}
        </p>
      </div>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 36, 51, 0.06)" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              stroke="var(--ink-600)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--ink-600)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatChartValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.gradient} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={colors.gradient}
              strokeWidth={2.5}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 36, 51, 0.06)" vertical={false} />
            )}
            <XAxis
              dataKey={xKey}
              stroke="var(--ink-600)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--ink-600)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatChartValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={colors.gradient}
              strokeWidth={2.5}
              dot={{ fill: colors.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function formatChartValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  if (value < 1 && value > 0) {
    return value.toFixed(2);
  }
  return new Intl.NumberFormat('en-US').format(value);
}
