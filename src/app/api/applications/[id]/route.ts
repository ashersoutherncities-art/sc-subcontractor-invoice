import { NextRequest, NextResponse } from 'next/server';
import getDb, { getApplication, approveApplication } from '@/lib/db';
import { sendApplicationApproved, sendApplicationRejected } from '@/lib/email';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const app = getApplication(parseInt(params.id, 10));
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json(app);
  } catch (err) {
    console.error('GET /api/applications/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const id = parseInt(params.id, 10);
    const db = getDb();

    if (body.action === 'approve') {
      const contractorId = approveApplication(id);
      if (!contractorId) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Send approval email
      const app = getApplication(id) as Record<string, unknown> | undefined;
      if (app) {
        const email = (app.direct_email || app.business_email) as string;
        if (email) {
          sendApplicationApproved(email, app.company_name as string, contractorId).catch(console.error);
        }
      }

      return NextResponse.json({ message: 'Application approved', contractor_id: contractorId });
    }

    if (body.action === 'reject') {
      db.prepare(
        "UPDATE vendor_applications SET status = 'rejected', reviewed_at = datetime('now'), admin_notes = COALESCE(?, admin_notes) WHERE id = ?"
      ).run(body.admin_notes || null, id);

      // Send rejection email
      const app = getApplication(id) as Record<string, unknown> | undefined;
      if (app) {
        const email = (app.direct_email || app.business_email) as string;
        if (email) {
          sendApplicationRejected(email, app.company_name as string, id, body.admin_notes).catch(console.error);
        }
      }

      return NextResponse.json({ message: 'Application rejected' });
    }

    if (body.action === 'request_info') {
      db.prepare(
        "UPDATE vendor_applications SET status = 'more_info', reviewed_at = datetime('now'), admin_notes = COALESCE(?, admin_notes) WHERE id = ?"
      ).run(body.admin_notes || null, id);
      return NextResponse.json({ message: 'More info requested' });
    }

    // Generic update (status, notes)
    const updates: string[] = [];
    const vals: unknown[] = [];

    if (body.status) {
      updates.push('status = ?');
      vals.push(body.status);
    }
    if (body.admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      vals.push(body.admin_notes);
    }
    if (updates.length > 0) {
      updates.push("reviewed_at = datetime('now')");
      vals.push(id);
      db.prepare(`UPDATE vendor_applications SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
    }

    return NextResponse.json({ message: 'Application updated' });
  } catch (err) {
    console.error('PUT /api/applications/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
