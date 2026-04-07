'use client';

import { ReactNode, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricTooltip } from './metric-tooltip';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => ReactNode;
  truncate?: boolean;
  helpText?: string;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  stickyHeader?: boolean;
  zebra?: boolean;
  compact?: boolean;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T = any>({
  columns,
  data,
  keyExtractor,
  stickyHeader = true,
  zebra = true,
  compact = false,
  className
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey);
    if (!column?.sortable) return;

    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-[var(--line-soft)] bg-white shadow-sm', className)}>
      <table className="w-full border-collapse text-sm">
        <thead
          className={cn(
            'border-b border-[var(--line-soft)] bg-[var(--panel-muted)]',
            stickyHeader && 'sticky top-0 z-10'
          )}
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                className={cn(
                  'px-4 text-left font-semibold text-[var(--ink-700)]',
                  compact ? 'py-2.5' : 'py-3.5',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer select-none hover:bg-[var(--bg-2)]'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider">{column.label}</span>
                  {column.helpText && <MetricTooltip label={column.helpText} />}
                  {column.sortable && (
                    <span className="opacity-40">
                      {sortKey === column.key && sortDirection === 'asc' && <ArrowUp size={12} />}
                      {sortKey === column.key && sortDirection === 'desc' && <ArrowDown size={12} />}
                      {sortKey !== column.key && <ArrowUpDown size={12} />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--ink-600)]">
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={cn(
                  'border-b border-[var(--line-soft)] transition-colors hover:bg-[var(--bg-2)]',
                  zebra && rowIndex % 2 === 1 && 'bg-[var(--panel-muted)]/30'
                )}
              >
                {columns.map((column) => {
                  const value = (row as any)[column.key];
                  const content = column.render ? column.render(value, row) : value;

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 text-[var(--ink-900)]',
                        compact ? 'py-2.5' : 'py-3.5',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.truncate && 'max-w-[200px] truncate'
                      )}
                      title={column.truncate && typeof content === 'string' ? content : undefined}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// React import for useMemo
import * as React from 'react';
