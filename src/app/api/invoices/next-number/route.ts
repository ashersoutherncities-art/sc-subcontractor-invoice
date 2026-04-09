import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const year = new Date().getFullYear();
    const prefix = `SCC-${year}-`;

    const row = db.prepare(`
      SELECT scc_invoice_num FROM invoices
      WHERE scc_invoice_num LIKE ?
      ORDER BY scc_invoice_num DESC
      LIMIT 1
    `).get(`${prefix}%`) as { scc_invoice_num: string } | undefined;

    let nextSeq = 1;
    if (row) {
      const parts = row.scc_invoice_num.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const nextNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    return NextResponse.json({ next_number: nextNumber });
  } catch (error) {
    console.error('GET /api/invoices/next-number error:', error);
    return NextResponse.json({ error: 'Failed to generate next invoice number' }, { status: 500 });
  }
}
