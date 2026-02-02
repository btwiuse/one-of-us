import { NextResponse } from 'next/server';
import { getMemberCount } from '@/lib/db';

export async function GET() {
  try {
    const count = getMemberCount();
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
