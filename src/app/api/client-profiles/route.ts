import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type ProfilePayload = {
  profileName?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  sourceType?: string;
  sourceKey?: string | null;
};

export async function GET() {
  try {
    const db = getDb();
    const profiles = db.prepare(`
      SELECT
        id,
        profile_name as profileName,
        company_name as companyName,
        contact_name as contactName,
        email,
        phone,
        address,
        source_type as sourceType,
        source_key as sourceKey,
        created_at as createdAt,
        updated_at as updatedAt
      FROM client_profiles
      ORDER BY updated_at DESC, profile_name ASC
    `).all();

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('GET /api/client-profiles error:', error);
    return NextResponse.json({ error: 'Failed to fetch client profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json() as ProfilePayload;

    const profileName = body.profileName?.trim();
    const companyName = body.companyName?.trim();
    const contactName = body.contactName?.trim();

    if (!profileName || !contactName) {
      return NextResponse.json({ error: 'Profile name and client contact name are required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM client_profiles WHERE lower(profile_name) = lower(?)').get(profileName) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE client_profiles
        SET profile_name = @profile_name,
            company_name = @company_name,
            contact_name = @contact_name,
            email = @email,
            phone = @phone,
            address = @address,
            source_type = @source_type,
            source_key = @source_key,
            updated_at = datetime('now')
        WHERE id = @id
      `).run({
        id: existing.id,
        profile_name: profileName,
        company_name: companyName || null,
        contact_name: contactName,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        source_type: body.sourceType?.trim() || 'manual',
        source_key: body.sourceKey?.trim() || null,
      });

      const updated = db.prepare(`
        SELECT
          id,
          profile_name as profileName,
          company_name as companyName,
          contact_name as contactName,
          email,
          phone,
          address,
          source_type as sourceType,
          source_key as sourceKey,
          created_at as createdAt,
          updated_at as updatedAt
        FROM client_profiles
        WHERE id = ?
      `).get(existing.id);

      return NextResponse.json(updated);
    }

    const result = db.prepare(`
      INSERT INTO client_profiles (
        profile_name,
        company_name,
        contact_name,
        email,
        phone,
        address,
        source_type,
        source_key,
        updated_at
      ) VALUES (
        @profile_name,
        @company_name,
        @contact_name,
        @email,
        @phone,
        @address,
        @source_type,
        @source_key,
        datetime('now')
      )
    `).run({
      profile_name: profileName,
      company_name: companyName || null,
      contact_name: contactName,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      source_type: body.sourceType?.trim() || 'manual',
      source_key: body.sourceKey?.trim() || null,
    });

    const created = db.prepare(`
      SELECT
        id,
        profile_name as profileName,
        company_name as companyName,
        contact_name as contactName,
        email,
        phone,
        address,
        source_type as sourceType,
        source_key as sourceKey,
        created_at as createdAt,
        updated_at as updatedAt
      FROM client_profiles
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/client-profiles error:', error);
    return NextResponse.json({ error: 'Failed to save client profile' }, { status: 500 });
  }
}
