import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const db = getDb();
    const contractors = db.prepare(`
      SELECT * FROM contractors
      WHERE company_name LIKE ?
      ORDER BY company_name
      LIMIT 10
    `).all(`%${q}%`);

    return NextResponse.json(contractors);
  } catch (error) {
    console.error('GET /api/contractors/search error:', error);
    return NextResponse.json({ error: 'Failed to search contractors' }, { status: 500 });
  }
}
