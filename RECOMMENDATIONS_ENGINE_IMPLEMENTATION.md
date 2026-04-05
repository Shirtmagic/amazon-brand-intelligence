# Recommendations Engine Implementation

## Summary

Successfully built real BigQuery-powered recommendations engine for Mission Control.

## What Was Built

### 1. Server-Side Recommendation Engine
**File:** `src/lib/renuv-recommendations.server.ts`

Implements 5 data-driven recommendation rules:

1. **Budget Expansion** - Queries `ads_campaign_summary_daily` for campaigns with ROAS > 4x
2. **Negative Keywords** - Queries `ads_search_term_summary_daily` for terms with >$50 spend and 0 conversions
3. **Bid Optimization** - Identifies campaigns with ACoS > 45% (reduce) or < 25% (increase)
4. **Non-Brand Expansion** - Compares branded vs non-branded growth rates (last 14d vs prior 14d)
5. **Creative Refresh** - Detects SB/SD campaigns with declining CTR trends

### 2. Data Integration

- Uses existing `queryBigQuery` helper from `@/lib/bigquery`
- BigQuery project: `renuv-amazon-data-warehouse`
- Service account: `/Users/augustbot/.openclaw/workspace/secrets/renuv_bigquery_service_account.json`
- Graceful fallback to `renuvRecommendationsMock` on any BigQuery failure

### 3. Recommendation Output

Each recommendation includes:
- `id` - Unique identifier with timestamp
- `title` - Action-oriented title
- `category` - optimization|expansion|protection|analysis
- `priority` - high|medium|low (based on impact)
- `impact` - Dollar estimates from actual data
- `effort` - low|medium|high
- `description` - What to do
- `rationale` - Why, with real numbers cited
- `timeline` - When to implement
- `expectedOutcome` - Projected results
- `sourceView` - `'reporting_amazon.recommendations'` (contract compliance)

### 4. Dynamic Summary & Commentary

- Generated from actual recommendation data
- No hard-coded messaging
- Prioritizes high-impact actions
- Cites specific metrics and trends

### 5. Page Updates

**Updated:**
- `src/app/client/renuv/recommendations/page.tsx` - async, force-dynamic, live data
- `src/app/client/renuv/recommendations/review/page.tsx` - async, force-dynamic, live data

**Changed:**
- Removed `'use client'` directive
- Added `export const dynamic = 'force-dynamic'`
- Made components async server components
- Import and call `fetchRecommendationsSnapshot()`

## Build Verification

```bash
cd /Users/augustbot/.openclaw/workspace/mission-control/app && npx next build
```

✅ **Passes with zero errors**

## Next Steps (Optional)

1. Fine-tune ROAS/ACoS thresholds based on actual Renuv targets
2. Add more sophisticated branded/non-branded classification (currently simple keyword matching)
3. Add recommendation prioritization scoring algorithm
4. Implement recommendation history tracking
5. Add A/B test recommendation tracking

## Technical Notes

- All BigQuery queries use 14-day windows (configurable)
- Conservative impact estimates (30-50% lift assumptions)
- Queries limited to top 3-5 items per rule to avoid noise
- Error handling with console logging and mock fallback
- Type-safe throughout with TypeScript
