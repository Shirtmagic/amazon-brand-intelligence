'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays,
  isSameMonth, isSameDay, isToday, getDay
} from 'date-fns';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type WorkflowItem = {
  id: string;
  name: string;
  owner: string;
  cadence: string;
  nextRun: string;
  lastCompleted: string;
  status: 'on-track' | 'review' | 'blocked' | 'paused';
  approval: string;
  output: string;
};

type AgentRegistryItem = {
  id: string;
  name: string;
  role: string;
  laneId: string;
  lane: string;
};

type CalendarEvent = {
  workflow: WorkflowItem;
  time: string;
  color: string;
};

type ViewMode = 'month' | 'week' | 'day';

/* ------------------------------------------------------------------ */
/*  Owner → color mapping via lane                                     */
/* ------------------------------------------------------------------ */

const laneColors: Record<string, string> = {
  command:      '#16324a',
  creative:     '#4285f4',
  'paid-media': '#7b61ff',
  retention:    '#0b8043',
  storefront:   '#e67c00',
  systems:      '#1f3e5f',
};

function ownerColor(owner: string, agents: AgentRegistryItem[]): string {
  const names = owner.split(/\s*\+\s*/);
  for (const n of names) {
    const agent = agents.find(a => a.name.toLowerCase() === n.trim().toLowerCase());
    if (agent) return laneColors[agent.laneId] ?? '#627587';
  }
  return '#627587';
}

/* ------------------------------------------------------------------ */
/*  Generate calendar events for a date range                          */
/* ------------------------------------------------------------------ */

function generateEvents(
  workflows: WorkflowItem[],
  rangeStart: Date,
  rangeEnd: Date,
  agents: AgentRegistryItem[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  for (const wf of workflows) {
    const color = ownerColor(wf.owner, agents);
    const time = extractTime(wf.nextRun);

    if (wf.cadence === 'Daily') {
      for (const day of days) {
        const key = format(day, 'yyyy-MM-dd');
        const arr = map.get(key) ?? [];
        arr.push({ workflow: wf, time, color });
        map.set(key, arr);
      }
    } else if (wf.cadence === 'Weekly') {
      for (const day of days) {
        if (getDay(day) === 5) {
          const key = format(day, 'yyyy-MM-dd');
          const arr = map.get(key) ?? [];
          arr.push({ workflow: wf, time, color });
          map.set(key, arr);
        }
      }
    }
  }

  return map;
}

function extractTime(nextRun: string): string {
  const parts = nextRun.split('·');
  return parts.length > 1 ? parts[1].trim() : '';
}

/* ------------------------------------------------------------------ */
/*  Status colors                                                      */
/* ------------------------------------------------------------------ */

const statusDotColor: Record<string, string> = {
  'on-track': '#0b8043',
  review:     '#4285f4',
  blocked:    '#d93025',
  paused:     '#80868b',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type WorkflowCalendarProps = {
  workflows: WorkflowItem[];
  agents: AgentRegistryItem[];
};

export function WorkflowCalendar({ workflows, agents }: WorkflowCalendarProps) {
  const [view, setView] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  /* --- navigation --- */
  const navigate = useCallback((dir: -1 | 1) => {
    setAnchor(prev => {
      if (!prev) return new Date();
      if (view === 'month') return dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1);
      if (view === 'week')  return dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1);
      return dir === 1 ? addDays(prev, 1) : subDays(prev, 1);
    });
    setSelectedDay(null);
  }, [view]);

  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDay(null);
  }, []);

  /* --- compute visible range --- */
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    const ref = anchor ?? new Date();
    let start: Date, end: Date;
    if (view === 'month') {
      const ms = startOfMonth(ref);
      const me = endOfMonth(ref);
      start = startOfWeek(ms, { weekStartsOn: 0 });
      end   = endOfWeek(me, { weekStartsOn: 0 });
    } else if (view === 'week') {
      start = startOfWeek(ref, { weekStartsOn: 0 });
      end   = endOfWeek(ref, { weekStartsOn: 0 });
    } else {
      start = ref;
      end   = ref;
    }
    return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }) };
  }, [view, anchor]);

  /* --- events --- */
  const eventMap = useMemo(
    () => generateEvents(workflows, rangeStart, rangeEnd, agents),
    [workflows, rangeStart, rangeEnd, agents]
  );

  /* --- heading label --- */
  const headingLabel = useMemo(() => {
    const ref = anchor ?? new Date();
    if (view === 'month') return format(ref, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(ref, { weekStartsOn: 0 });
      const we = endOfWeek(ref, { weekStartsOn: 0 });
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(ref, 'EEEE, MMMM d, yyyy');
  }, [view, anchor]);

  /* --- detail day (for sidebar / day-view) --- */
  const detailDay = view === 'day' ? anchor : selectedDay;
  const detailEvents = detailDay ? (eventMap.get(format(detailDay, 'yyyy-MM-dd')) ?? []) : [];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col gap-3">
      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-700)] transition-colors hover:bg-[var(--panel-muted)]"
            aria-label="Previous"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => navigate(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink-700)] transition-colors hover:bg-[var(--panel-muted)]"
            aria-label="Next"
          >
            <ChevronRight />
          </button>
          <h3 className="ml-3 text-[22px] font-normal tracking-[-0.01em] text-[var(--ink-950)]">
            {headingLabel}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="rounded-md border border-[var(--line-soft)] bg-white px-4 py-1.5 text-[13px] font-medium text-[var(--ink-800)] transition-colors hover:bg-[var(--panel-muted)] hover:border-[var(--ink-600)]/20"
          >
            Today
          </button>
          <div className="flex overflow-hidden rounded-lg border border-[var(--line-soft)] bg-white">
            {(['month', 'week', 'day'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setView(m); setSelectedDay(null); }}
                className={`px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                  view === m
                    ? 'bg-[var(--blue-700)]/10 text-[var(--blue-700)]'
                    : 'text-[var(--ink-700)] hover:bg-[var(--panel-muted)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── calendar body ── */}
      <div className="flex gap-4">
        {/* grid area */}
        <div className="min-w-0 flex-1">
          {view === 'month' && (
            <MonthGrid
              days={days}
              anchor={anchor}
              eventMap={eventMap}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}
          {view === 'week' && (
            <WeekGrid
              days={days}
              eventMap={eventMap}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}
          {view === 'day' && (
            <DayView events={detailEvents} day={anchor} />
          )}
        </div>

        {/* detail sidebar (month/week only, when a day is clicked) */}
        {view !== 'day' && detailDay && (
          <div className="w-72 shrink-0">
            <DayDetail day={detailDay} events={detailEvents} onClose={() => setSelectedDay(null)} />
          </div>
        )}
      </div>

      {/* ── legend ── */}
      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-[var(--line-soft)] pt-3 text-[12px] text-[var(--ink-700)]">
        {workflows.map(wf => (
          <span key={wf.id} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ownerColor(wf.owner, agents) }} />
            {wf.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Month grid                                                         */
/* ================================================================== */

function MonthGrid({
  days, anchor, eventMap, selectedDay, onSelectDay
}: {
  days: Date[];
  anchor: Date;
  eventMap: Map<string, CalendarEvent[]>;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div>
      {/* header */}
      <div className="grid grid-cols-7 border-b border-[var(--line-soft)]">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-medium tracking-[0.08em] text-[var(--ink-600)]">
            {d}
          </div>
        ))}
      </div>
      {/* cells */}
      <div className="grid grid-cols-7 border-l border-[var(--line-soft)]">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const events = eventMap.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const today = isToday(day);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`relative flex min-h-[88px] flex-col items-start border-b border-r border-[var(--line-soft)] p-1.5 text-left transition-colors ${
                inMonth ? 'bg-white' : 'bg-[var(--bg-2)]'
              } ${selected ? 'bg-[var(--blue-700)]/[0.03]' : ''} hover:bg-[var(--blue-700)]/[0.02]`}
            >
              <span className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                today
                  ? 'bg-[var(--blue-700)] text-white'
                  : inMonth ? 'text-[var(--ink-900)]' : 'text-[var(--ink-600)]/40'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="flex w-full flex-col gap-[3px]">
                {events.slice(0, 3).map((ev, i) => (
                  <div
                    key={`${ev.workflow.id}-${i}`}
                    className="flex items-center gap-1 truncate rounded-[4px] px-1.5 py-[2px] text-[11px] font-medium leading-tight"
                    style={{ backgroundColor: `${ev.color}18`, color: ev.color }}
                    title={`${ev.workflow.name} · ${ev.workflow.owner} · ${ev.time}`}
                  >
                    <span
                      className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                      style={{ backgroundColor: ev.color }}
                    />
                    <span className="truncate">{ev.workflow.name}</span>
                  </div>
                ))}
                {events.length > 3 && (
                  <span className="pl-1 text-[10px] font-medium text-[var(--ink-600)]">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Week grid                                                          */
/* ================================================================== */

function WeekGrid({
  days, eventMap, selectedDay, onSelectDay
}: {
  days: Date[];
  eventMap: Map<string, CalendarEvent[]>;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
}) {
  return (
    <div>
      {/* header */}
      <div className="grid grid-cols-7 border-b border-[var(--line-soft)]">
        {days.map(day => {
          const today = isToday(day);
          return (
            <div key={format(day, 'yyyy-MM-dd')} className="flex flex-col items-center py-2">
              <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--ink-600)]">
                {format(day, 'EEE').toUpperCase()}
              </span>
              <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-medium ${
                today ? 'bg-[var(--blue-700)] text-white' : 'text-[var(--ink-900)]'
              }`}>
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>
      {/* cells */}
      <div className="grid grid-cols-7 border-l border-[var(--line-soft)]">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const events = eventMap.get(key) ?? [];
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`flex min-h-[240px] flex-col items-start border-b border-r border-[var(--line-soft)] bg-white p-2 text-left transition-colors ${
                selected ? 'bg-[var(--blue-700)]/[0.03]' : ''
              } hover:bg-[var(--blue-700)]/[0.02]`}
            >
              <div className="flex w-full flex-col gap-1.5">
                {events.map((ev, i) => (
                  <div
                    key={`${ev.workflow.id}-${i}`}
                    className="rounded-md border-l-[3px] bg-white px-2.5 py-2 text-[12px] font-medium leading-tight shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    style={{ borderLeftColor: ev.color, color: 'var(--ink-950)' }}
                    title={`${ev.workflow.name} · ${ev.workflow.owner} · ${ev.time}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                        style={{ backgroundColor: statusDotColor[ev.workflow.status] ?? '#80868b' }}
                      />
                      <span className="truncate font-semibold">{ev.workflow.name}</span>
                    </div>
                    <div className="mt-1 text-[11px] font-normal text-[var(--ink-600)]">{ev.time}</div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Day view                                                           */
/* ================================================================== */

function DayView({ events, day }: { events: CalendarEvent[]; day: Date }) {
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-white">
      <div className="border-b border-[var(--line-soft)] px-5 py-3">
        <h4 className="text-[15px] font-semibold text-[var(--ink-950)]">
          {format(day, 'EEEE, MMMM d, yyyy')}
        </h4>
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--ink-600)]">No workflows scheduled</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((ev, i) => (
              <div
                key={`${ev.workflow.id}-${i}`}
                className="flex items-start gap-4 rounded-xl border border-[var(--line-soft)] p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: ev.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-semibold text-[var(--ink-950)]">{ev.workflow.name}</span>
                    <WorkflowStatusBadge status={ev.workflow.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--ink-600)]">
                    {ev.workflow.owner} · {ev.time || 'All day'} · {ev.workflow.cadence}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <MicroStat label="Output" value={ev.workflow.output} />
                    <MicroStat label="Approval" value={ev.workflow.approval} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Day detail sidebar                                                 */
/* ================================================================== */

function DayDetail({ day, events, onClose }: { day: Date; events: CalendarEvent[]; onClose: () => void }) {
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-white shadow-[0_4px_24px_rgba(19,44,74,0.08)]">
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3">
        <h4 className="text-[14px] font-semibold text-[var(--ink-950)]">{format(day, 'EEEE, MMM d')}</h4>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-600)] transition-colors hover:bg-[var(--panel-muted)] hover:text-[var(--ink-900)]"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>
      <div className="p-3">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[var(--ink-600)]">No workflows</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((ev, i) => (
              <div
                key={`${ev.workflow.id}-${i}`}
                className="rounded-lg border-l-[3px] px-3 py-2.5"
                style={{ borderLeftColor: ev.color, backgroundColor: `${ev.color}08` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusDotColor[ev.workflow.status] ?? '#80868b' }}
                  />
                  <span className="text-[13px] font-semibold text-[var(--ink-950)]">{ev.workflow.name}</span>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--ink-600)]">
                  <span>{ev.workflow.owner}</span>
                  <span className="text-[var(--ink-600)]/40">·</span>
                  <span>{ev.time || '—'}</span>
                  <span className="text-[var(--ink-600)]/40">·</span>
                  <WorkflowStatusBadge status={ev.workflow.status} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tiny helpers                                                       */
/* ================================================================== */

function WorkflowStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'on-track': 'bg-[#e6f4ea] text-[#0b8043]',
    review:     'bg-[#e8f0fe] text-[#4285f4]',
    blocked:    'bg-[#fce8e6] text-[#d93025]',
    paused:     'bg-[#f1f3f4] text-[#80868b]',
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles[status] ?? styles.paused}`}>
      {status}
    </span>
  );
}

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--panel-muted)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

/* ── inline SVG icons (no extra dep) ── */

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 15 7.5 10l5-5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 5l5 5-5 5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 3.5 3.5 10.5M3.5 3.5l7 7" />
    </svg>
  );
}
