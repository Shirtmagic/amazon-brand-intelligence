import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCompetitiveTrackerData,
  DEFAULT_TRACKED_KEYWORDS,
} from '@/lib/renuv-competitive-tracker.server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/competitive-tracker
 *
 * Body: { keywords: string[] }
 *
 * Returns a full CompetitiveTrackerData payload for the supplied
 * keyword list. The UI calls this whenever the user adds, removes,
 * or resets their tracked keywords in the Competitive Tracker tab.
 *
 * Capped at 30 keywords — this is both a sanity check against
 * runaway BigQuery cost and roughly the point where the UI table
 * stops being scannable.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawKeywords: unknown = body?.keywords;

    const keywords = Array.isArray(rawKeywords)
      ? rawKeywords
          .filter((k): k is string => typeof k === 'string')
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0)
      : DEFAULT_TRACKED_KEYWORDS;

    const limited = keywords.slice(0, 30);
    const data = await fetchCompetitiveTrackerData(limited);

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('[api/competitive-tracker] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
