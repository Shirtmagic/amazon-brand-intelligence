# Mission Control App

Internal dashboard prototype for Todd’s agent operating system.

## What this is
A **premium v1 internal dashboard** built in Next.js for fast demoing and iteration.

Current focus:
- blue/navy Mission Control visual system
- mission statement hero
- org command view
- agent runtime state
- approval queue
- read-only task board
- activity log
- model/provider usage
- alerts + escalations

## Where the spec lives
- `docs/agent-ops-dashboard-v1-spec.md`

## Data architecture
The home page is no longer powered by a single presentation-only mock module.

Current server-side snapshot composition lives in:
- `src/lib/mission-control.ts`

Dedicated state sources now live in:
- `src/data/mission-control-agent-registry.json`
- `src/data/mission-control-runtime.json`
- `src/data/mission-control-approvals.json`
- `src/data/mission-control-tasks.json`
- `src/data/mission-control-activity.json`
- `src/data/mission-control-workflows.json`
- `src/data/mission-control-usage.json`

The dashboard page composes those sources into a single snapshot, and API routes expose the same state for future polling/client hydration:
- `/api/dashboard`
- `/api/runtime`
- `/api/approval-queue`

## Getting started
```bash
cd mission-control/app
npm run dev
```

Open <http://localhost:3000>

## Recommended next hookup points
1. Replace `mission-control-runtime.json` with an orchestration/runtime feed.
2. Replace `mission-control-approvals.json` with real approval events and action writes.
3. Normalize usage into per-run event records rather than provider summary snapshots.
4. Add client polling or server streaming once upstream state is trustworthy.
5. Keep the single-screen story strong before splitting into sub-routes.

## Visual direction
Inspired by the Blue Bees org-chart graphics in `tmp/`:
- navy leadership pills
- bright blue accents
- white cards
- spacious layout
- soft shadows
- no green-led palette
deploy refresh
<!-- vercel redeploy trigger -->
