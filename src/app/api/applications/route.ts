import { NextRequest, NextResponse } from 'next/server';
import getDb, { getApplications } from '@/lib/db';
import { sendApplicationConfirmation } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const apps = getApplications(status);
    return NextResponse.json(apps);
  } catch (err) {
    console.error('GET /api/applications error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];

    const allowedFields = [
      'company_name', 'dba_name', 'business_type', 'tax_id', 'date_established',
      'employees_count', 'sub_count', 'annual_revenue', 'duns_number',
      'bonded', 'bond_amount', 'bonding_company', 'bond_expiry',
      'address', 'city', 'state', 'zip',
      'mailing_same', 'mailing_address', 'mailing_city', 'mailing_state', 'mailing_zip',
      'business_phone', 'business_email', 'website',
      'rep_name', 'contact_title', 'direct_phone', 'direct_email',
      'emergency_contact_name', 'emergency_contact_phone', 'preferred_communication',
      'services', 'other_service', 'service_area', 'project_size',
      'largest_project', 'occupied_properties', 'commercial_properties', 'union_status',
      'completed_projects',
      'gc_license_num', 'gc_license_state', 'gc_license_expiry', 'gc_license_path',
      'specialty_license_type', 'specialty_license_num', 'specialty_license_state',
      'specialty_license_expiry', 'specialty_license_path',
      'business_license_num', 'business_license_jurisdiction', 'business_license_expiry', 'business_license_path',
      'gl_carrier', 'gl_policy_num', 'gl_coverage_amount', 'gl_expiry', 'gl_cert_path',
      'has_employees', 'wc_carrier', 'wc_policy_num', 'wc_expiry', 'wc_cert_path', 'wc_exempt_reason',
      'auto_carrier', 'auto_policy_num', 'auto_expiry', 'auto_coverage', 'auto_cert_path',
      'umbrella_carrier', 'umbrella_policy_num', 'umbrella_expiry', 'umbrella_coverage', 'umbrella_cert_path',
      'w9_path',
      'osha10', 'osha30', 'written_safety', 'emr', 'osha_citations', 'citation_description',
      'wire_bank', 'wire_routing', 'wire_account', 'wire_account_type', 'wire_holder',
      'zelle_contact', 'venmo_handle', 'cashapp_tag', 'check_payable_to',
      'ref1_name', 'ref1_company', 'ref1_relationship', 'ref1_phone', 'ref1_email', 'ref1_years',
      'ref2_name', 'ref2_company', 'ref2_relationship', 'ref2_phone', 'ref2_email', 'ref2_years',
      'cert_accurate', 'cert_authorize', 'cert_understand', 'digital_signature',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        columns.push(field);
        placeholders.push('?');
        if (field === 'services' && Array.isArray(body[field])) {
          values.push(JSON.stringify(body[field]));
        } else if (field === 'completed_projects' && typeof body[field] === 'object') {
          values.push(JSON.stringify(body[field]));
        } else if (typeof body[field] === 'boolean') {
          values.push(body[field] ? 1 : 0);
        } else {
          values.push(body[field]);
        }
      }
    }

    if (!body.company_name || !body.rep_name) {
      return NextResponse.json({ error: 'Company name and representative name are required' }, { status: 400 });
    }

    const sql = `INSERT INTO vendor_applications (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const result = db.prepare(sql).run(...values);

    // Send confirmation email to applicant
    const applicantEmail = body.direct_email || body.business_email;
    if (applicantEmail) {
      sendApplicationConfirmation(applicantEmail, body.company_name, Number(result.lastInsertRowid)).catch(console.error);
    }

    return NextResponse.json({ id: result.lastInsertRowid, message: 'Application submitted' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/applications error:', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
