# Client Portal BigQuery Wiring - Complete

## Summary
Successfully wired 4 client portal pages to live BigQuery data. All pages now fetch real data from `reporting_amazon.executive_kpi_daily` and related views, with fallback to mock data on error.

## Changes Made

### 1. Client Advertising (`/client/renuv/advertising`)
**File:** `src/app/client/renuv/advertising/page.tsx`
- Changed from static to dynamic rendering
- Now imports and calls `fetchAdvertisingSnapshot()` from existing server module
- Fetches live ad spend, ROAS, ACOS, campaign performance data

### 2. Client Search (`/client/renuv/search`)
**File:** `src/app/client/renuv/search/page.tsx`
- Changed from static to dynamic rendering
- Now imports and calls `fetchSearchSnapshot()` from existing server module
- Fetches live search term data, branded/non-branded metrics, CTR, conversion rates

### 3. Client Performance (`/client/renuv/performance`)
**Files:** 
- `src/app/client/renuv/performance/page.tsx` (wired)
- `src/lib/renuv-performance.server.ts` (created)

**New Server Fetcher:**
- Queries `reporting_amazon.executive_kpi_daily` for 60 days
- Calculates current vs prior period KPIs:
  - Revenue, Orders, Units, Sessions, CVR, AOV
  - Includes deltas, trends, and interpretations
- Generates 30-day chart data with daily metrics
- Falls back to mock on error

### 4. Client Portal Overview (`/client/renuv`)
**Files:**
- `src/app/client/renuv/page.tsx` (wired)
- `src/lib/renuv-client-portal.server.ts` (created)

**New Server Fetcher:**
- Queries `reporting_amazon.executive_kpi_daily` for 60 days
- Calculates current vs prior period KPIs:
  - Revenue, Orders, Ad Spend, TACOS, CVR, AOV
  - Includes deltas, trends, and interpretations
- Generates 30-day trend data (revenue, orders, adSpend, sessions)
- Falls back to mock on error
- Keeps mock data for Growth Drivers, Risks, Next Steps, Market Context (no direct sources)

## Pattern Used

All pages follow the same pattern:
```tsx
// Import server fetcher
import { fetchXyzSnapshot } from '@/lib/xyz.server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Async page component
export default async function Page() {
  const snapshot = await fetchXyzSnapshot();
  return <Component snapshot={snapshot} />;
}
```

## BigQuery Queries

All server fetchers query:
- **Primary source:** `reporting_amazon.executive_kpi_daily`
- **Project:** `renuv-amazon-data-warehouse`
- **Filters:** `brand_key = 'renuv'` AND `marketplace_key = 'US'`
- **Time range:** Last 60 days (30 current + 30 prior for comparisons)

### Verified Column Names
- `date_day`
- `ordered_revenue`
- `orders`
- `units_ordered`
- `sessions`
- `conversion_rate`
- `ad_spend`
- `ad_attributed_sales`
- `acos`
- `roas`

## Pages NOT Changed (as instructed)
- `/client/renuv/recommendations` - stays mock (no data source)
- `/client/renuv/retail-health` - stays mock (no data source)

## Build Verification
```bash
cd /Users/augustbot/.openclaw/workspace/mission-control/app && npx next build
```

**Result:** ✅ Build passed with zero errors

All wired pages now show `ƒ (Dynamic)` in route listing:
- ✅ `/client/renuv` - Dynamic
- ✅ `/client/renuv/advertising` - Dynamic
- ✅ `/client/renuv/performance` - Dynamic
- ✅ `/client/renuv/search` - Dynamic

Static pages remain as expected:
- ○ `/client/renuv/recommendations` - Static
- ○ `/client/renuv/retail-health` - Static

## Error Handling
All server fetchers include try-catch with:
- Console error logging
- Automatic fallback to mock data
- Graceful degradation (no user-facing errors)

## Date & Time
Completed: 2026-04-02 10:45 EDT
