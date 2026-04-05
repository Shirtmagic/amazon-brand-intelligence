import { NextRequest, NextResponse } from 'next/server';
import { updateFacebookCommentVisibility } from '@/lib/mission-control-store';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { hidden?: boolean; note?: string };

    if (typeof body.hidden !== 'boolean') {
      return NextResponse.json({ error: 'hidden must be true or false.' }, { status: 400 });
    }

    const item = await updateFacebookCommentVisibility({
      id,
      hidden: body.hidden,
      note: body.note
    });

    return NextResponse.json(
      { ok: true, item },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update Facebook comment visibility.';
    const status = message.includes('not found') ? 404 : message.includes('only available') || message.includes('hidden must') ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
