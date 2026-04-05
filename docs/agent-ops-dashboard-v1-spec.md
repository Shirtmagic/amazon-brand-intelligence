# Todd Agent OS Dashboard — V1 Scope

_Last updated: 2026-03-10_

## Goal
Ship an impressive internal operating dashboard in **2–3 days max** that gives Todd a premium control layer over the agent org without waiting on full backend integrations.

This is **not** a fully automated data platform in v1.
This **is** a polished operating surface that can:
- communicate the mission clearly
- show the org structure and ownership model
- make active work visible
- surface agent activity, model usage, and alerts
- be demoed internally and extended safely

## Mission Statement
> **Our mission is to help brands achieve 10X growth through sharper strategy, stronger execution, and AI-powered leverage.**

## Product Positioning
A premium internal "mission control" for Todd’s agent operating system.

Tone:
- executive but fast-moving
- premium, clean, blue/navy
- more "operating cockpit" than "analytics spreadsheet"
- good enough to show off internally right now

## Hard Constraint
If a feature cannot be credibly built and polished in **2–3 days**, it is **not v1**.

---

## V1 User Story
Todd opens the dashboard and can answer, in under 60 seconds:
1. What is the mission and operating model?
2. Which agents exist and who owns what?
3. What is each team/agent working on right now?
4. What happened recently?
5. Which models/providers are consuming tokens/cost?
6. What needs escalation or human review?

---

## V1 Information Architecture

### 1. Executive Header / Hero
**Purpose:** instantly frame the system.

**Widgets:**
- Product title: `Mission Control`
- Subtitle: `Agent Operating Dashboard`
- Mission statement block
- Small system meta row:
  - timezone
  - active agents
  - open escalations
  - today’s spend

**Why it belongs in v1:** fast visual clarity, low engineering effort, high demo value.

### 2. Command Summary Row
**Purpose:** give Todd quick status at a glance.

**Widgets:**
- Active agents
- Tasks in progress
- Pending approvals / escalations
- Token spend today

**Data source in v1:** mocked/static JSON with a clear future API shape.

### 3. Org Command View
**Purpose:** reflect the org-chart thinking directly in product.

**Widgets:**
- Top command cards:
  - Todd — CEO
  - Gus — COO / Agent Operator
- Functional lanes:
  - Creative & Content
  - Paid Media
  - Retention & Owned
  - Storefront & Organic
  - Intelligence / Systems
- Per-lane cards showing:
  - agent name
  - role
  - current status
  - top responsibilities
  - escalation owner

**V1 implementation note:** do **not** build draggable graph logic yet. Use a premium, card-based lane layout inspired by the Blue Bees org visuals.

### 4. Agent Role Cards
**Purpose:** show each agent’s operating context.

**Fields per card:**
- agent name
- role title
- status (`online`, `busy`, `idle`, `blocked`)
- owner / reports to
- primary responsibilities (2–4 bullets)
- current focus
- model/provider
- last update time

**V1 note:** limit to ~8–12 cards max to keep the screen sharp.

### 5. Task Board
**Purpose:** make execution visible.

**Columns:**
- Backlog
- In Progress
- Awaiting Review
- Done

**Card fields:**
- title
- assignee
- lane/team
- priority
- blocker flag (optional)

**V1 note:** read-only board only. No drag-and-drop required.

### 6. Activity Feed
**Purpose:** prove the system is alive.

**Feed item fields:**
- timestamp
- actor
- action summary
- linked object (task / escalation / run)

**Display:** reverse chronological list with actor badges.

### 7. Model / Token Usage
**Purpose:** show resource awareness and cost discipline.

**Widgets:**
- spend by provider
- tokens by provider/model
- daily trend sparkline
- top expensive agents/runs

**V1 note:** fake the live feed if needed, but shape the card exactly like future reality.

### 8. Alerts & Escalations
**Purpose:** put human review where it belongs.

**Alert types in v1:**
- high token spend
- blocked access / missing credentials
- agent waiting on Todd
- high-risk external reply requires approval

**Fields:**
- severity
- title
- owning agent
- required action
- age / opened at

**V1 note:** this panel matters more than extra charts.

---

## Explicitly In V1
- Polished landing dashboard in Next.js
- Blue/navy design system aligned to Blue Bees org charts
- Static/mock data shaped for future APIs
- Mission statement hero
- Org command view
- Per-agent role cards
- Read-only task board
- Activity log
- Model/token usage cards and simple chart
- Alerts/escalations panel
- Clear distinction between now / next

## Explicitly Out of V1
- Real-time websocket updates
- Drag-and-drop kanban
- Full auth / RBAC
- Multi-brand deep drilldowns
- Editable org-chart graph engine
- Historical analytics warehouse
- Slack/Telegram live sync
- Provider billing reconciliation
- Full audit trail and replay UI
- Granular settings/admin console

---

## Recommended Data Model (V1-friendly)

### `agents`
```ts
{
  id: string
  name: string
  role: string
  lane: 'creative' | 'paid-media' | 'retention' | 'storefront' | 'systems'
  status: 'online' | 'busy' | 'idle' | 'blocked'
  reportsTo: string
  provider: string
  model: string
  focus: string
  responsibilities: string[]
  lastUpdate: string
}
```

### `taskColumns`
```ts
{
  id: string
  title: string
  cards: {
    id: string
    title: string
    assignee: string
    lane: string
    priority: 'low' | 'medium' | 'high'
    blocked?: boolean
  }[]
}
```

### `activity`
```ts
{
  id: string
  timestamp: string
  actor: string
  summary: string
  object?: string
}
```

### `usageSummary`
```ts
{
  provider: string
  spend: number
  tokens: number
  requests: number
  trend: number[]
}
```

### `alerts`
```ts
{
  id: string
  severity: 'critical' | 'high' | 'medium'
  title: string
  owner: string
  action: string
  openedAt: string
}
```

---

## Design System Direction
Derived from:
- `tmp/bluebees_agent_org_chart_no_overlap_v6.png`
- `tmp/bluebees_agent_org_chart_mission_v7.png`
- `tmp/bluebees_agent_org_chart_extra_long_v5.png`

### Visual Principles
- deep navy + bright blue accents
- soft cloudy light-blue background
- white cards with subtle top accent bars
- pill-shaped headers and labels
- spacious layout and soft shadows
- restrained use of accent colors
- absolutely no green-driven theme

### Recommended Tokens
- Background: `#eef5fb`, `#f7f9fc`
- Navy: `#16324a`
- Deep text: `#0f2433`
- Bright blue: `#1f90f3`
- Mid blue: `#5ea8ff`
- Soft border: `rgba(15,36,51,0.08)`
- Muted text: `#667a8d`
- Card radius: `20px`
- Pill radius: `999px`
- Card shadow: `0 20px 50px rgba(21,43,68,0.10)`

### Component Rules
- cards stay white or near-white
- lane identity via top border/accent strip only
- keep connector/graph lines subtle if used later
- avoid heavy gradients inside cards
- use blue for emphasis, not decoration spam

---

## Fastest Implementation Path

### Day 1 — Structure + Design System
- Replace current warm/green palette with blue/navy tokens
- Build hero/header
- Build summary stats row
- Build org command section
- Build alert panel shell
- Load all sections from a single mock data file

### Day 2 — Core Dashboard Modules
- Build agent cards grid
- Build read-only task board
- Build activity feed
- Build usage section with Recharts sparklines
- Tighten spacing, hierarchy, shadows, responsive behavior

### Day 3 — Polish + Future-Proofing
- Add hover/focus states
- Tight copy pass and visual cleanup
- Document the data contract for real integrations
- Add README notes for next builder
- Optional: route split or tabs if the home screen feels too dense

---

## What To Fake vs What To Wire

### Fake in v1
- agent status heartbeat
- live token numbers
- approval queue counts
- recent activity timestamps

### Wire for real as soon as possible
- task source from workspace/json or orchestration service
- alerts from blocker/approval events
- token usage from provider logs
- agent roster from agent config registry

---

## Recommended File Structure
```text
mission-control/app/
  docs/
    agent-ops-dashboard-v1-spec.md
  src/
    app/page.tsx
    components/dashboard-v1/*
    data/dashboard-v1.ts
```

---

## Ship Standard
V1 is done when:
- it looks premium enough to show internally
- all key widgets render coherently on desktop
- the story of the agent org is obvious without explanation
- the implementation is clean enough for a second pass to hook into real data

## Opinionated Recommendation
Do **not** try to build a perfect enterprise control plane yet.
Ship a beautiful, opinionated, mostly static **command dashboard** first.
If Todd likes opening it every day, the real integrations can follow.
If not, extra plumbing is wasted effort.
