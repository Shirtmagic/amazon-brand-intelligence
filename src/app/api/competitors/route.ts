import { NextRequest, NextResponse } from 'next/server';
import { fetchCompetitorIntelligence } from '@/lib/renuv-competitors.server';

export const dynamic = 'force-dynamic';

/**
 * API route for fetching competitor intelligence with custom focus keywords.
 * POST body: { focusKeywords: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const focusKeywords: string[] = body.focusKeywords || [];

    if (focusKeywords.length === 0) {
      return NextResponse.json({ error: 'No focus keywords provided' }, { status: 400 });
    }

    const limited = focusKeywords.slice(0, 30);
    const data = await fetchCompetitorIntelligence(limited);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API competitors] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor data' }, { status: 500 });
  }
}
