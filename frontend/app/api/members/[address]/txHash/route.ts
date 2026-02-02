import { NextRequest, NextResponse } from 'next/server';
import { updateMemberTxHash } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const body = await request.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash is required' },
        { status: 400 }
      );
    }

    const updated = updateMemberTxHash(address, txHash);

    if (updated) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
