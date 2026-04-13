import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

type ProfilePayload = {
  profileName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  accentColor?: string;
  logoDataUrl?: string;
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
        email,
        phone,
        address,
        license_number as licenseNumber,
        accent_color as accentColor,
        logo_data_url as logoDataUrl,
        source_type as sourceType,
        source_key as sourceKey,
        created_at as createdAt,
        updated_at as updatedAt
      FROM subcontractor_profiles
      ORDER BY updated_at DESC, profile_name ASC
    `).all();

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('GET /api/subcontractor-profiles error:', error);
    return NextResponse.json({ error: 'Failed to fetch subcontractor profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json() as ProfilePayload;

    const profileName = body.profileName?.trim();
    const companyName = body.companyName?.trim();

    if (!profileName || !companyName) {
      return NextResponse.json({ error: 'Profile name and company name are required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM subcontractor_profiles WHERE lower(profile_name) = lower(?)').get(profileName) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE subcontractor_profiles
        SET profile_name = @profile_name,
            company_name = @company_name,
            email = @email,
            phone = @phone,
            address = @address,
            license_number = @license_number,
            accent_color = @accent_color,
            logo_data_url = @logo_data_url,
            source_type = @source_type,
            source_key = @source_key,
            updated_at = datetime('now')
        WHERE id = @id
      `).run({
        id: existing.id,
        profile_name: profileName,
        company_name: companyName,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        license_number: body.licenseNumber?.trim() || null,
        accent_color: body.accentColor?.trim() || null,
        logo_data_url: body.logoDataUrl?.trim() || null,
        source_type: body.sourceType?.trim() || 'manual',
        source_key: body.sourceKey?.trim() || null,
      });

      const updated = db.prepare(`
        SELECT
          id,
          profile_name as profileName,
          company_name as companyName,
          email,
          phone,
          address,
          license_number as licenseNumber,
          accent_color as accentColor,
          logo_data_url as logoDataUrl,
          source_type as sourceType,
          source_key as sourceKey,
          created_at as createdAt,
          updated_at as updatedAt
        FROM subcontractor_profiles
        WHERE id = ?
      `).get(existing.id);

      return NextResponse.json(updated);
    }

    const result = db.prepare(`
      INSERT INTO subcontractor_profiles (
        profile_name,
        company_name,
        email,
        phone,
        address,
        license_number,
        accent_color,
        logo_data_url,
        source_type,
        source_key,
        updated_at
      ) VALUES (
        @profile_name,
        @company_name,
        @email,
        @phone,
        @address,
        @license_number,
        @accent_color,
        @logo_data_url,
        @source_type,
        @source_key,
        datetime('now')
      )
    `).run({
      profile_name: profileName,
      company_name: companyName,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      license_number: body.licenseNumber?.trim() || null,
      accent_color: body.accentColor?.trim() || null,
      logo_data_url: body.logoDataUrl?.trim() || null,
      source_type: body.sourceType?.trim() || 'manual',
      source_key: body.sourceKey?.trim() || null,
    });

    const created = db.prepare(`
      SELECT
        id,
        profile_name as profileName,
        company_name as companyName,
        email,
        phone,
        address,
        license_number as licenseNumber,
        accent_color as accentColor,
        logo_data_url as logoDataUrl,
        source_type as sourceType,
        source_key as sourceKey,
        created_at as createdAt,
        updated_at as updatedAt
      FROM subcontractor_profiles
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/subcontractor-profiles error:', error);
    return NextResponse.json({ error: 'Failed to save subcontractor profile' }, { status: 500 });
  }
}
