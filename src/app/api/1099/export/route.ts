import { NextResponse } from 'next/server';
import { get1099Data } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);
    const data = get1099Data(year) as Array<{
      company_name: string;
      tax_id: string | null;
      total_paid: number;
      filed: number | null;
    }>;

    const headers = ['Contractor', 'EIN', 'Total Paid', '1099 Required', 'Filed'];
    const rows = data.map((r) => [
      `"${(r.company_name || '').replace(/"/g, '""')}"`,
      `"${r.tax_id || ''}"`,
      r.total_paid.toFixed(2),
      r.total_paid > 600 ? 'Yes' : 'No',
      r.filed ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="1099-report-${year}.csv"`,
      },
    });
  } catch (error) {
    console.error('GET /api/1099/export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
