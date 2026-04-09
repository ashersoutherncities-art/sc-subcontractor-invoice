import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const waiverType = formData.get('waiver_type') as string || 'conditional';
    const waiverDate = formData.get('waiver_date') as string || new Date().toISOString().split('T')[0];

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save file to uploads directory
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads', 'waivers');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.pdf';
    const filename = `waiver-${params.id}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const relativePath = `/data/uploads/waivers/${filename}`;

    db.prepare(`
      UPDATE invoices SET lien_waiver_path = ?, lien_waiver_type = ?, lien_waiver_date = ?
      WHERE id = ?
    `).run(relativePath, waiverType, waiverDate, params.id);

    return NextResponse.json({ path: relativePath, type: waiverType, date: waiverDate });
  } catch (error) {
    console.error('POST /api/invoices/[id]/lien-waiver error:', error);
    return NextResponse.json({ error: 'Failed to upload lien waiver' }, { status: 500 });
  }
}
