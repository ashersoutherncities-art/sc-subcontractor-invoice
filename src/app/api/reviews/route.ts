import { NextResponse } from 'next/server';
import getDb, { getContractorReviews } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractor_id');

    if (contractorId) {
      const reviews = getContractorReviews(parseInt(contractorId, 10));
      return NextResponse.json(reviews);
    }

    const db = getDb();
    const reviews = db.prepare('SELECT * FROM contractor_reviews ORDER BY rated_at DESC').all();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { contractor_id, invoice_id, quality, timeliness, communication, would_hire_again, notes, admin_notes } = body;

    if (!contractor_id) {
      return NextResponse.json({ error: 'contractor_id is required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO contractor_reviews (contractor_id, invoice_id, quality, timeliness, communication, would_hire_again, notes, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(contractor_id, invoice_id || null, quality || null, timeliness || null, communication || null, would_hire_again || null, notes || null, admin_notes || null);

    const review = db.prepare('SELECT * FROM contractor_reviews WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('POST /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
