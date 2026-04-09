import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const contractor = db.prepare(`
      SELECT c.*,
        (SELECT MAX(i.invoice_date) FROM invoices i WHERE i.contractor_id = c.id) AS last_invoice_date,
        (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.contractor_id = c.id AND i.status = 'paid') AS total_paid
      FROM contractors c
      WHERE c.id = ?
    `).get(params.id);

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('GET /api/contractors/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM contractors WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: Record<string, unknown> = {};

    const allowedFields = [
      'company_name', 'rep_name', 'tax_id', 'wire_bank_name', 'wire_routing',
      'wire_account', 'wire_account_type', 'wire_account_holder', 'zelle_contact',
      'venmo_handle', 'label',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        fields.push(`${field} = @${field}`);
        values[field] = body[field];
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.id = params.id;

    db.prepare(`UPDATE contractors SET ${fields.join(', ')} WHERE id = @id`).run(values);

    const contractor = db.prepare(`
      SELECT c.*,
        (SELECT MAX(i.invoice_date) FROM invoices i WHERE i.contractor_id = c.id) AS last_invoice_date,
        (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.contractor_id = c.id AND i.status = 'paid') AS total_paid
      FROM contractors c
      WHERE c.id = ?
    `).get(params.id);

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('PUT /api/contractors/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}
