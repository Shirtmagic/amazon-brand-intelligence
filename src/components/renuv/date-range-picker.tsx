'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useCallback, Suspense } from 'react';

const PRESETS = [
  { key: '1d', label: 'Today' },
  { key: '7d', label: '7d' },
  { key: '14d', label: '14d' },
  { key: '30d', label: '30d' },
  { key: '60d', label: '60d' },
  { key: 'custom', label: 'Custom' },
] as const;

function DateRangePickerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPreset = searchParams.get('preset') || '14d';
  const isCustom = currentPreset === 'custom';

  const [showCustom, setShowCustom] = useState(isCustom);
  const [fromInput, setFromInput] = useState(searchParams.get('from') || '');
  const [toInput, setToInput] = useState(searchParams.get('to') || '');

  const navigate = useCallback(
    (params: URLSearchParams) => {
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname],
  );

  function selectPreset(key: string) {
    if (key === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const params = new URLSearchParams();
    params.set('preset', key);
    navigate(params);
  }

  function applyCustomRange() {
    if (!fromInput || !toInput) return;
    const params = new URLSearchParams();
    params.set('from', fromInput);
    params.set('to', toInput);
    params.set('preset', 'custom');
    navigate(params);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Preset pills */}
      <div className="flex items-center gap-0.5 rounded-lg border border-[var(--line-soft)] bg-[var(--bg-2)] p-0.5">
        {PRESETS.map((p) => {
          const isActive =
            p.key === 'custom'
              ? showCustom
              : currentPreset === p.key && !showCustom;

          return (
            <button
              key={p.key}
              onClick={() => selectPreset(p.key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-white text-[var(--navy-900)] shadow-sm'
                  : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="h-7 rounded-md border border-[var(--line-soft)] bg-white px-2 text-[11px] text-[var(--ink-900)] outline-none focus:border-[var(--blue-700)]"
          />
          <span className="text-[11px] text-[var(--ink-600)]">–</span>
          <input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="h-7 rounded-md border border-[var(--line-soft)] bg-white px-2 text-[11px] text-[var(--ink-900)] outline-none focus:border-[var(--blue-700)]"
          />
          <button
            onClick={applyCustomRange}
            disabled={!fromInput || !toInput}
            className="h-7 rounded-md bg-[var(--navy-900)] px-3 text-[11px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export function DateRangePicker() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-0.5 rounded-lg border border-[var(--line-soft)] bg-[var(--bg-2)] p-0.5">
          <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-600)]">
            Loading…
          </span>
        </div>
      }
    >
      <DateRangePickerInner />
    </Suspense>
  );
}
