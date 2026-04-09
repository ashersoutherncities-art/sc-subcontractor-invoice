import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const contractors = db.prepare(`
      SELECT c.*,
        (SELECT MAX(i.invoice_date) FROM invoices i WHERE i.contractor_id = c.id) AS last_invoice_date,
        (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.contractor_id = c.id AND i.status = 'paid') AS total_paid
      FROM contractors c
      ORDER BY c.company_name
    `).all();
    return NextResponse.json(contractors);
  } catch (error) {
    console.error('GET /api/contractors error:', error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      INSERT INTO contractors (company_name, rep_name, tax_id, wire_bank_name, wire_routing, wire_account, wire_account_type, wire_account_holder, zelle_contact, venmo_handle, label)
      VALUES (@company_name, @rep_name, @tax_id, @wire_bank_name, @wire_routing, @wire_account, @wire_account_type, @wire_account_holder, @zelle_contact, @venmo_handle, @label)
    `);

    const result = stmt.run({
      company_name: body.company_name,
      rep_name: body.rep_name,
      tax_id: body.tax_id || null,
      wire_bank_name: body.wire_bank_name || null,
      wire_routing: body.wire_routing || null,
      wire_account: body.wire_account || null,
      wire_account_type: body.wire_account_type || null,
      wire_account_holder: body.wire_account_holder || null,
      zelle_contact: body.zelle_contact || null,
      venmo_handle: body.venmo_handle || null,
      label: body.label || null,
    });

    const contractor = db.prepare('SELECT * FROM contractors WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(contractor, { status: 201 });
  } catch (error) {
    console.error('POST /api/contractors error:', error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
