import { NextResponse } from 'next/server';
import getDb, { getJobs } from '@/lib/db';

export async function GET() {
  try {
    const jobs = getJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { job_name, address, description, start_date, end_date, status, budget } = body;

    if (!job_name) {
      return NextResponse.json({ error: 'job_name is required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO jobs (job_name, address, description, start_date, end_date, status, budget)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(job_name, address || null, description || null, start_date || null, end_date || null, status || 'active', budget || null);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
