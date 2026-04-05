import { NextRequest, NextResponse } from 'next/server';
import { submitFacebookCommentRevision } from '@/lib/mission-control-store';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { feedback?: string; operatorDraft?: string };

    const result = await submitFacebookCommentRevision({
      id,
      feedback: body.feedback,
      operatorDraft: body.operatorDraft
    });

    return NextResponse.json(
      { ok: true, ...result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to revise Facebook comment response.';
    const status = message.includes('not found') ? 404 : message.includes('required') || message.includes('only available') ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
