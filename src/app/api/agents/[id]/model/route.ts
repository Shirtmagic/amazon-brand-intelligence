import { NextRequest, NextResponse } from 'next/server';
import { updateAgentModel } from '@/lib/mission-control-store';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { model?: string };

    if (!body.model?.trim()) {
      return NextResponse.json({ error: 'Model is required.' }, { status: 400 });
    }

    const agent = await updateAgentModel({ id, model: body.model.trim() });

    return NextResponse.json(
      { ok: true, agent },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to change agent model.';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
