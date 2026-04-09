import { NextRequest, NextResponse } from 'next/server';
import { fetchKeywordTrackerData } from '@/lib/renuv-keyword-tracker.server';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching keyword tracker data.
 * Accepts a JSON body with { keywords: string[] }.
 * Used by the client component when the user adds/removes keywords.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const keywords: string[] = body.keywords || [];

    if (keywords.length === 0) {
      return NextResponse.json({ keywords: [], trackedKeywordList: [], weekCount: 0, latestWeekEnding: '', sourceView: '' });
    }

    // Limit to 30 keywords max
    const limited = keywords.slice(0, 30);
    const data = await fetchKeywordTrackerData(limited);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API keyword-tracker] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword tracker data' },
      { status: 500 }
    );
  }
}
