import { NextResponse } from 'next/server';
import { getMemberCount } from '@/lib/db';

export async function GET() {
  try {
    const count = getMemberCount();
    return NextResponse.json({ count });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
