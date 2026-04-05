import { NextRequest, NextResponse } from 'next/server';
import { updateApprovalDecision } from '@/lib/mission-control-store';

function getErrorStatus(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('not found')) return 404;
  if (
    lower.includes('invalid decision')
    || lower.includes('dismiss is only available')
    || lower.includes('no reply is ready to post')
    || lower.includes('cannot approve this reply')
    || lower.includes('cannot change facebook comment visibility')
    || lower.includes('failed to post approved facebook reply')
  ) {
    return 400;
  }

  return 500;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      decision?: 'approve' | 'revise' | 'reject' | 'dismiss' | 'reopen';
      note?: string;
      replyText?: string;
    };

    if (!body.decision || !['approve', 'revise', 'reject', 'dismiss', 'reopen'].includes(body.decision)) {
      return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
    }

    const item = await updateApprovalDecision({
      id,
      decision: body.decision,
      note: body.note,
      replyText: body.replyText
    });

    return NextResponse.json(
      { ok: true, item },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update approval item.';
    return NextResponse.json({ error: message }, { status: getErrorStatus(message) });
  }
}
