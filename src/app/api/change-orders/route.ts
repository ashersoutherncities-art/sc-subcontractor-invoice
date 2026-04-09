import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');
    const db = getDb();

    if (invoiceId) {
      const orders = db.prepare('SELECT * FROM change_orders WHERE invoice_id = ? ORDER BY created_at ASC').all(invoiceId);
      return NextResponse.json(orders);
    }

    const orders = db.prepare('SELECT * FROM change_orders ORDER BY created_at DESC').all();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/change-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { invoice_id, co_number, description, amount, approved_date, approved_by } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO change_orders (invoice_id, co_number, description, amount, approved_date, approved_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(invoice_id, co_number || null, description || null, amount || 0, approved_date || null, approved_by || null);

    // Update invoice total with change order amount
    db.prepare(`
      UPDATE invoices SET total = total + ? WHERE id = ?
    `).run(amount || 0, invoice_id);

    const co = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(co, { status: 201 });
  } catch (error) {
    console.error('POST /api/change-orders error:', error);
    return NextResponse.json({ error: 'Failed to create change order' }, { status: 500 });
  }
}
