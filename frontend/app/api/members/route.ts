import { NextRequest, NextResponse } from 'next/server';
import { addMember, getAllMembers, getMemberCount } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '100'),
      500
    );

    const members = getAllMembers(page, pageSize);
    const total = getMemberCount();

    return NextResponse.json({
      members,
      page,
      pageSize,
      total,
      hasMore: (page + 1) * pageSize < total,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, txHash } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const added = addMember(address, txHash);
    const count = getMemberCount();

    if (added) {
      return NextResponse.json(
        {
          success: true,
          message: 'Member registered',
          count,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json({
        success: false,
        message: 'Member already exists',
        count,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
