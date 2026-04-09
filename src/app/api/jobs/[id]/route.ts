import { NextResponse } from 'next/server';
import getDb, { getJob, getJobInvoices } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const job = getJob(parseInt(params.id, 10));
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const invoices = getJobInvoices(parseInt(params.id, 10));
    return NextResponse.json({ ...(job as Record<string, unknown>), invoices });
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: Record<string, unknown> = {};
    const allowed = ['job_name', 'address', 'description', 'start_date', 'end_date', 'status', 'budget'];

    for (const field of allowed) {
      if (field in body) {
        fields.push(`${field} = @${field}`);
        values[field] = body[field];
      }
    }

    if (fields.length > 0) {
      values.id = params.id;
      db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = @id`).run(values);
    }

    const job = getJob(parseInt(params.id, 10));
    return NextResponse.json(job);
  } catch (error) {
    console.error('PUT /api/jobs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
