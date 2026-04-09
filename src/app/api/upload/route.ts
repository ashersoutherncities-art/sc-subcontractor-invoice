import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

function getUploadDir(): string {
  if (process.env.VERCEL) {
    return '/tmp/uploads';
  }
  return path.join(process.cwd(), 'public', 'uploads');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('doc_type') as string || 'general';
    const appId = formData.get('app_id') as string || 'temp';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: PDF, JPG, PNG' },
        { status: 400 }
      );
    }

    const uploadBase = getUploadDir();
    const uploadDir = path.join(uploadBase, appId, docType);
    fs.mkdirSync(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'bin';
    const safeName = `${docType}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return the relative path for storing in DB
    const relativePath = `/uploads/${appId}/${docType}/${safeName}`;

    return NextResponse.json({
      path: relativePath,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('POST /api/upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
