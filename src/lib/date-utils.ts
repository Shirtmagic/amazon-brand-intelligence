/**
 * Shared date range utilities for parameterized queries
 */

export interface DateRange {
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
  preset: string; // '7d' | '14d' | '30d' | '60d' | 'custom'
  label: string;
}

const PRESETS: Record<string, { days: number; label: string }> = {
  '1d':  { days: 1,  label: 'Today' },
  '7d':  { days: 7,  label: 'Last 7 days' },
  '14d': { days: 14, label: 'Last 14 days' },
  '30d': { days: 30, label: 'Last 30 days' },
  '60d': { days: 60, label: 'Last 60 days' },
};

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00').getTime());
}

/**
 * Parse date range from URL search params.
 * Falls back to the preset (default: 14d).
 */
export function getDateRange(params: { from?: string; to?: string; preset?: string }): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Custom from/to
  if (params.from && params.to && isValidDate(params.from) && isValidDate(params.to)) {
    return {
      from: params.from,
      to: params.to,
      preset: 'custom',
      label: `${params.from} – ${params.to}`,
    };
  }

  // Preset
  const presetKey = params.preset && PRESETS[params.preset] ? params.preset : '14d';
  const { days, label } = PRESETS[presetKey];

  const to = formatDate(today);
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - days);
  const from = formatDate(fromDate);

  return { from, to, preset: presetKey, label };
}

/**
 * Given a current period [from, to], calculate the prior period
 * of the same duration ending the day before `from`.
 */
export function getPriorPeriod(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(from + 'T00:00:00');
  const toDate = new Date(to + 'T00:00:00');
  const durationDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  const priorEnd = new Date(fromDate);
  priorEnd.setDate(priorEnd.getDate() - 1);

  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - durationDays + 1);

  return { from: formatDate(priorStart), to: formatDate(priorEnd) };
}

/**
 * Validate and return a YYYY-MM-DD string safe for SQL interpolation.
 * Throws if the value is not a valid date.
 */
export function sanitizeDateParam(value: string): string {
  if (!isValidDate(value)) {
    throw new Error(`Invalid date parameter: ${value}`);
  }
  return value;
}

/**
 * Extract a date string from a BigQuery date value
 * (which can be a plain string or { value: string }).
 */
export function extractDateValue(d: unknown): string {
  if (typeof d === 'object' && d !== null && 'value' in d) {
    return String((d as { value: string }).value);
  }
  return String(d);
}

/**
 * Safe delta calculation — returns null when inputs are NaN/Infinity/zero-prior.
 */
export function safeDelta(current: number, prior: number): number | null {
  if (!prior || !isFinite(prior) || !isFinite(current)) return null;
  return ((current - prior) / prior) * 100;
}

/**
 * Safe toFixed — returns '—' when the value is NaN or Infinity.
 */
export function safeFixed(value: number, digits: number = 1): string {
  if (!isFinite(value)) return '\u2014';
  return value.toFixed(digits);
}

/**
 * Format a delta string, returning 'No prior data' when delta is null.
 */
export function formatDelta(delta: number | null, suffix: string = '% vs prior period'): string {
  if (delta === null) return 'No prior data';
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${suffix}`;
}

/**
 * Format a point-change delta string.
 */
export function formatPtsDelta(delta: number | null, suffix: string = ' pts vs prior period'): string {
  if (delta === null || !isFinite(delta)) return 'No prior data';
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${suffix}`;
}
