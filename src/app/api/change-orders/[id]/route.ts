import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const body = await request.json();
    const existing = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    const oldAmount = (existing.amount as number) || 0;
    const newAmount = body.amount !== undefined ? body.amount : oldAmount;
    const diff = newAmount - oldAmount;

    db.prepare(`
      UPDATE change_orders SET co_number = ?, description = ?, amount = ?, approved_date = ?, approved_by = ?
      WHERE id = ?
    `).run(
      body.co_number ?? existing.co_number,
      body.description ?? existing.description,
      newAmount,
      body.approved_date ?? existing.approved_date,
      body.approved_by ?? existing.approved_by,
      params.id
    );

    if (diff !== 0) {
      db.prepare('UPDATE invoices SET total = total + ? WHERE id = ?').run(diff, existing.invoice_id);
    }

    const updated = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/change-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update change order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    // Subtract amount from invoice total
    db.prepare('UPDATE invoices SET total = total - ? WHERE id = ?').run(existing.amount || 0, existing.invoice_id);
    db.prepare('DELETE FROM change_orders WHERE id = ?').run(params.id);

    return NextResponse.json({ message: 'Change order deleted' });
  } catch (error) {
    console.error('DELETE /api/change-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete change order' }, { status: 500 });
  }
}
