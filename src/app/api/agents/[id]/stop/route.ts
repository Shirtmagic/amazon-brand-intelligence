import { NextResponse } from 'next/server';
import { stopAgentTask } from '@/lib/mission-control-store';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const agent = await stopAgentTask({ id });

    return NextResponse.json(
      { ok: true, agent },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to stop task.';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
