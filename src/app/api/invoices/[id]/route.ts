import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { sendPaymentConfirmation } from '@/lib/email';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();

    const invoice = db.prepare(`
      SELECT i.*, c.company_name, c.rep_name, c.tax_id, c.email as contractor_email,
        c.wire_bank_name, c.wire_routing, c.wire_account, c.wire_account_type, c.wire_account_holder,
        c.zelle_contact, c.venmo_handle,
        j.job_name
      FROM invoices i
      LEFT JOIN contractors c ON c.id = i.contractor_id
      LEFT JOIN jobs j ON j.id = i.job_id
      WHERE i.id = ?
    `).get(params.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(params.id);
    const change_orders = db.prepare('SELECT * FROM change_orders WHERE invoice_id = ? ORDER BY created_at ASC').all(params.id);

    return NextResponse.json({ ...invoice as Record<string, unknown>, items, change_orders });
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: Record<string, unknown> = {};

    const allowedFields = [
      'scc_invoice_num', 'internal_invoice_num', 'invoice_date', 'scope_of_work',
      'subtotal', 'tax_rate', 'tax_amount', 'total', 'status', 'paid_at',
      'lien_waiver_path', 'lien_waiver_type', 'lien_waiver_date', 'lien_waiver_override_note',
      'retention_pct', 'retention_amount', 'retention_released', 'retention_released_at',
      'job_id',
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

    values.id = params.id;

    db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE id = @id`).run(values);

    // Send payment confirmation email when marked as paid
    if (body.status === 'paid' && existing.status !== 'paid') {
      const contractor = db.prepare('SELECT * FROM contractors WHERE id = ?').get(existing.contractor_id) as Record<string, unknown> | undefined;
      if (contractor && contractor.email) {
        sendPaymentConfirmation(
          contractor.email as string,
          contractor.company_name as string,
          existing.scc_invoice_num as string,
          (existing.total as number) || 0,
          parseInt(params.id, 10)
        ).catch(console.error);
      }
    }

    const invoice = db.prepare(`
      SELECT i.*, c.company_name
      FROM invoices i
      LEFT JOIN contractors c ON c.id = i.contractor_id
      WHERE i.id = ?
    `).get(params.id);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
