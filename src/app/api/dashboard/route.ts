import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/lib/mission-control';

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
    }
  });
}
