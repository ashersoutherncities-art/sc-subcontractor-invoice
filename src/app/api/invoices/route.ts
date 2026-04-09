import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractorId = searchParams.get('contractor_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const db = getDb();
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (status) {
      conditions.push('i.status = ?');
      values.push(status);
    }
    if (contractorId) {
      conditions.push('i.contractor_id = ?');
      values.push(contractorId);
    }
    if (dateFrom) {
      conditions.push('i.invoice_date >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('i.invoice_date <= ?');
      values.push(dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const invoices = db.prepare(`
      SELECT i.*, c.company_name, j.job_name
      FROM invoices i
      LEFT JOIN contractors c ON c.id = i.contractor_id
      LEFT JOIN jobs j ON j.id = i.job_id
      ${whereClause}
      ORDER BY i.invoice_date DESC
    `).all(...values);

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      scc_invoice_num,
      internal_invoice_num,
      invoice_date,
      scope_of_work,
      subtotal,
      tax_rate,
      tax_amount,
      total,
      status,
      items,
      retention_pct,
      job_id,
      // Contractor fields
      company_name,
      rep_name,
      tax_id,
      wire_bank_name,
      wire_routing,
      wire_account,
      wire_account_type,
      wire_account_holder,
      zelle_contact,
      venmo_handle,
    } = body;

    // Calculate retention
    const retPct = retention_pct || 0;
    const retAmount = (total || 0) * (retPct / 100);

    const result = db.transaction(() => {
      // Step 1: Find or create contractor
      let contractor = db.prepare('SELECT * FROM contractors WHERE company_name = ?').get(company_name) as Record<string, unknown> | undefined;

      if (contractor) {
        // Update payment info on existing contractor
        db.prepare(`
          UPDATE contractors SET
            rep_name = COALESCE(@rep_name, rep_name),
            tax_id = COALESCE(@tax_id, tax_id),
            wire_bank_name = COALESCE(@wire_bank_name, wire_bank_name),
            wire_routing = COALESCE(@wire_routing, wire_routing),
            wire_account = COALESCE(@wire_account, wire_account),
            wire_account_type = COALESCE(@wire_account_type, wire_account_type),
            wire_account_holder = COALESCE(@wire_account_holder, wire_account_holder),
            zelle_contact = COALESCE(@zelle_contact, zelle_contact),
            venmo_handle = COALESCE(@venmo_handle, venmo_handle),
            updated_at = datetime('now')
          WHERE id = @id
        `).run({
          id: contractor.id,
          rep_name: rep_name || null,
          tax_id: tax_id || null,
          wire_bank_name: wire_bank_name || null,
          wire_routing: wire_routing || null,
          wire_account: wire_account || null,
          wire_account_type: wire_account_type || null,
          wire_account_holder: wire_account_holder || null,
          zelle_contact: zelle_contact || null,
          venmo_handle: venmo_handle || null,
        });
      } else {
        const insertResult = db.prepare(`
          INSERT INTO contractors (company_name, rep_name, tax_id, wire_bank_name, wire_routing, wire_account, wire_account_type, wire_account_holder, zelle_contact, venmo_handle)
          VALUES (@company_name, @rep_name, @tax_id, @wire_bank_name, @wire_routing, @wire_account, @wire_account_type, @wire_account_holder, @zelle_contact, @venmo_handle)
        `).run({
          company_name,
          rep_name: rep_name || '',
          tax_id: tax_id || null,
          wire_bank_name: wire_bank_name || null,
          wire_routing: wire_routing || null,
          wire_account: wire_account || null,
          wire_account_type: wire_account_type || null,
          wire_account_holder: wire_account_holder || null,
          zelle_contact: zelle_contact || null,
          venmo_handle: venmo_handle || null,
        });
        contractor = { id: insertResult.lastInsertRowid };
      }

      // Step 2: Insert invoice
      const invoiceResult = db.prepare(`
        INSERT INTO invoices (scc_invoice_num, internal_invoice_num, contractor_id, invoice_date, scope_of_work, subtotal, tax_rate, tax_amount, total, status, retention_pct, retention_amount, job_id)
        VALUES (@scc_invoice_num, @internal_invoice_num, @contractor_id, @invoice_date, @scope_of_work, @subtotal, @tax_rate, @tax_amount, @total, @status, @retention_pct, @retention_amount, @job_id)
      `).run({
        scc_invoice_num,
        internal_invoice_num: internal_invoice_num || null,
        contractor_id: contractor.id,
        invoice_date,
        scope_of_work: scope_of_work || null,
        subtotal: subtotal || 0,
        tax_rate: tax_rate || 0,
        tax_amount: tax_amount || 0,
        total: total || 0,
        status: status || 'pending',
        retention_pct: retPct,
        retention_amount: retAmount,
        job_id: job_id || null,
      });

      const invoiceId = invoiceResult.lastInsertRowid;

      // Step 3: Insert line items
      if (items && Array.isArray(items)) {
        const insertItem = db.prepare(`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
          VALUES (@invoice_id, @description, @quantity, @unit_price, @total)
        `);

        for (const item of items) {
          insertItem.run({
            invoice_id: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          });
        }
      }

      return db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    })();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
