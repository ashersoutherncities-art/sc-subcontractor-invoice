import { NextResponse } from 'next/server';
import getDb, { get1099Data } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const data = get1099Data(year);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/1099 error:', error);
    return NextResponse.json({ error: 'Failed to fetch 1099 data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { contractor_id, tax_year, filed, total_paid } = body;

    if (!contractor_id || !tax_year) {
      return NextResponse.json({ error: 'contractor_id and tax_year required' }, { status: 400 });
    }

    // Upsert tax_records
    db.prepare(`
      INSERT INTO tax_records (contractor_id, tax_year, total_paid, filed, filed_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(contractor_id, tax_year)
      DO UPDATE SET filed = ?, filed_at = ?, total_paid = ?
    `).run(
      contractor_id, tax_year, total_paid || 0,
      filed ? 1 : 0, filed ? new Date().toISOString() : null,
      filed ? 1 : 0, filed ? new Date().toISOString() : null, total_paid || 0
    );

    return NextResponse.json({ message: 'Tax record updated' });
  } catch (error) {
    console.error('PUT /api/1099 error:', error);
    return NextResponse.json({ error: 'Failed to update tax record' }, { status: 500 });
  }
}
