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
      SELECT i.scc_invoice_num, c.company_name, i.invoice_date, i.total, i.status
      FROM invoices i
      LEFT JOIN contractors c ON c.id = i.contractor_id
      ${whereClause}
      ORDER BY i.invoice_date DESC
    `).all(...values) as Array<{
      scc_invoice_num: string;
      company_name: string | null;
      invoice_date: string;
      total: number | null;
      status: string;
    }>;

    const header = 'SCC Invoice #,Contractor,Date,Amount,Status';
    const rows = invoices.map((inv) => {
      const escapedCompany = inv.company_name
        ? `"${inv.company_name.replace(/"/g, '""')}"`
        : '';
      return `${inv.scc_invoice_num},${escapedCompany},${inv.invoice_date},${inv.total ?? 0},${inv.status}`;
    });

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="invoices.csv"',
      },
    });
  } catch (error) {
    console.error('GET /api/invoices/export error:', error);
    return NextResponse.json({ error: 'Failed to export invoices' }, { status: 500 });
  }
}
