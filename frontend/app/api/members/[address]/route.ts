import { NextRequest, NextResponse } from 'next/server';
import { getMember } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const member = getMember(address);

    if (member) {
      return NextResponse.json({ isMember: true, member });
    } else {
      return NextResponse.json({ isMember: false });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
