import { NextResponse } from 'next/server';
import { getRuntimeSnapshot } from '@/lib/mission-control';

export async function GET() {
  const snapshot = await getRuntimeSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
    }
  });
}
