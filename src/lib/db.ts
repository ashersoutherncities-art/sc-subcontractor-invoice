import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

function getDbPath(): string {
  if (process.env.VERCEL) {
    return '/tmp/invoices.db';
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'invoices.db');
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS contractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      rep_name TEXT NOT NULL,
      tax_id TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      wire_bank_name TEXT,
      wire_routing TEXT,
      wire_account TEXT,
      wire_account_type TEXT,
      wire_account_holder TEXT,
      zelle_contact TEXT,
      venmo_handle TEXT,
      cashapp_tag TEXT,
      check_payable_to TEXT,
      label TEXT,
      services TEXT,
      service_area TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scc_invoice_num TEXT UNIQUE NOT NULL,
      internal_invoice_num TEXT,
      contractor_id INTEGER REFERENCES contractors(id),
      invoice_date TEXT NOT NULL,
      scope_of_work TEXT,
      subtotal REAL,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL,
      total REAL,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vendor_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      dba_name TEXT,
      business_type TEXT,
      tax_id TEXT,
      date_established TEXT,
      employees_count INTEGER,
      sub_count INTEGER,
      annual_revenue TEXT,
      duns_number TEXT,
      bonded INTEGER DEFAULT 0,
      bond_amount TEXT,
      bonding_company TEXT,
      bond_expiry TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      mailing_same INTEGER DEFAULT 1,
      mailing_address TEXT,
      mailing_city TEXT,
      mailing_state TEXT,
      mailing_zip TEXT,
      business_phone TEXT,
      business_email TEXT,
      website TEXT,
      rep_name TEXT NOT NULL,
      contact_title TEXT,
      direct_phone TEXT,
      direct_email TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      preferred_communication TEXT,
      services TEXT,
      other_service TEXT,
      service_area TEXT,
      project_size TEXT,
      largest_project TEXT,
      occupied_properties INTEGER DEFAULT 0,
      commercial_properties INTEGER DEFAULT 0,
      union_status TEXT,
      completed_projects TEXT,
      gc_license_num TEXT,
      gc_license_state TEXT,
      gc_license_expiry TEXT,
      gc_license_path TEXT,
      specialty_license_type TEXT,
      specialty_license_num TEXT,
      specialty_license_state TEXT,
      specialty_license_expiry TEXT,
      specialty_license_path TEXT,
      business_license_num TEXT,
      business_license_jurisdiction TEXT,
      business_license_expiry TEXT,
      business_license_path TEXT,
      gl_carrier TEXT,
      gl_policy_num TEXT,
      gl_coverage_amount TEXT,
      gl_expiry TEXT,
      gl_cert_path TEXT,
      has_employees INTEGER DEFAULT 0,
      wc_carrier TEXT,
      wc_policy_num TEXT,
      wc_expiry TEXT,
      wc_cert_path TEXT,
      wc_exempt_reason TEXT,
      auto_carrier TEXT,
      auto_policy_num TEXT,
      auto_expiry TEXT,
      auto_coverage TEXT,
      auto_cert_path TEXT,
      umbrella_carrier TEXT,
      umbrella_policy_num TEXT,
      umbrella_expiry TEXT,
      umbrella_coverage TEXT,
      umbrella_cert_path TEXT,
      w9_path TEXT,
      osha10 INTEGER DEFAULT 0,
      osha30 INTEGER DEFAULT 0,
      written_safety INTEGER DEFAULT 0,
      emr TEXT,
      osha_citations INTEGER DEFAULT 0,
      citation_description TEXT,
      wire_bank TEXT,
      wire_routing TEXT,
      wire_account TEXT,
      wire_account_type TEXT,
      wire_holder TEXT,
      zelle_contact TEXT,
      venmo_handle TEXT,
      cashapp_tag TEXT,
      check_payable_to TEXT,
      ref1_name TEXT,
      ref1_company TEXT,
      ref1_relationship TEXT,
      ref1_phone TEXT,
      ref1_email TEXT,
      ref1_years TEXT,
      ref2_name TEXT,
      ref2_company TEXT,
      ref2_relationship TEXT,
      ref2_phone TEXT,
      ref2_email TEXT,
      ref2_years TEXT,
      cert_accurate INTEGER DEFAULT 0,
      cert_authorize INTEGER DEFAULT 0,
      cert_understand INTEGER DEFAULT 0,
      digital_signature TEXT,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT,
      contractor_id INTEGER REFERENCES contractors(id)
    );

    -- New tables for features
    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER REFERENCES invoices(id),
      co_number TEXT,
      description TEXT,
      amount REAL,
      approved_date TEXT,
      approved_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      address TEXT,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      budget REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contractor_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER REFERENCES contractors(id),
      invoice_id INTEGER REFERENCES invoices(id),
      quality INTEGER,
      timeliness INTEGER,
      communication INTEGER,
      would_hire_again INTEGER,
      notes TEXT,
      admin_notes TEXT,
      rated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tax_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER REFERENCES contractors(id),
      tax_year INTEGER,
      total_paid REAL,
      filed INTEGER DEFAULT 0,
      filed_at TEXT,
      UNIQUE(contractor_id, tax_year)
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT,
      subject TEXT,
      type TEXT,
      related_id INTEGER,
      sent_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subcontractor_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      license_number TEXT,
      accent_color TEXT,
      logo_data_url TEXT,
      source_type TEXT DEFAULT 'manual',
      source_key TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL,
      company_name TEXT,
      contact_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      source_type TEXT DEFAULT 'manual',
      source_key TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: add columns to existing tables if missing
  const addColIfMissing = (table: string, col: string, colType: string) => {
    const cols = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.find((c) => c.name === col)) {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${colType}`);
    }
  };

  const contractorMigrations: [string, string][] = [
    ['phone', 'TEXT'], ['email', 'TEXT'], ['address', 'TEXT'],
    ['city', 'TEXT'], ['state', 'TEXT'], ['zip', 'TEXT'],
    ['cashapp_tag', 'TEXT'], ['check_payable_to', 'TEXT'],
    ['services', 'TEXT'], ['service_area', 'TEXT'],
  ];
  for (const [col, colType] of contractorMigrations) {
    addColIfMissing('contractors', col, colType);
  }

  // Lien waiver columns on invoices
  addColIfMissing('invoices', 'lien_waiver_path', 'TEXT');
  addColIfMissing('invoices', 'lien_waiver_type', 'TEXT');
  addColIfMissing('invoices', 'lien_waiver_date', 'TEXT');

  // Retention columns on invoices
  addColIfMissing('invoices', 'retention_pct', 'REAL DEFAULT 0');
  addColIfMissing('invoices', 'retention_amount', 'REAL DEFAULT 0');
  addColIfMissing('invoices', 'retention_released', 'INTEGER DEFAULT 0');
  addColIfMissing('invoices', 'retention_released_at', 'TEXT');

  // Job linking
  addColIfMissing('invoices', 'job_id', 'INTEGER REFERENCES jobs(id)');

  // Lien waiver override
  addColIfMissing('invoices', 'lien_waiver_override_note', 'TEXT');

  addColIfMissing('subcontractor_profiles', 'accent_color', 'TEXT');
  addColIfMissing('subcontractor_profiles', 'logo_data_url', 'TEXT');
  addColIfMissing('subcontractor_profiles', 'source_type', "TEXT DEFAULT 'manual'");
  addColIfMissing('subcontractor_profiles', 'source_key', 'TEXT');

  addColIfMissing('client_profiles', 'company_name', 'TEXT');
  addColIfMissing('client_profiles', 'contact_name', 'TEXT');
  addColIfMissing('client_profiles', 'email', 'TEXT');
  addColIfMissing('client_profiles', 'phone', 'TEXT');
  addColIfMissing('client_profiles', 'address', 'TEXT');
  addColIfMissing('client_profiles', 'source_type', "TEXT DEFAULT 'manual'");
  addColIfMissing('client_profiles', 'source_key', 'TEXT');
}

// ---- Existing query functions ----

export function getContractors() {
  const d = getDb();
  return d.prepare(`
    SELECT c.*,
      (SELECT MAX(invoice_date) FROM invoices WHERE contractor_id = c.id) as last_invoice_date,
      (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE contractor_id = c.id AND status = 'paid') as total_paid
    FROM contractors c ORDER BY c.company_name ASC
  `).all();
}

export function getContractor(id: number) {
  const d = getDb();
  return d.prepare(`
    SELECT c.*,
      (SELECT MAX(invoice_date) FROM invoices WHERE contractor_id = c.id) as last_invoice_date,
      (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE contractor_id = c.id AND status = 'paid') as total_paid
    FROM contractors c WHERE c.id = ?
  `).get(id);
}

export function searchContractors(query: string) {
  const d = getDb();
  return d.prepare(
    'SELECT id, company_name, rep_name FROM contractors WHERE company_name LIKE ? LIMIT 10'
  ).all(`%${query}%`);
}

export function getApplications(status?: string) {
  const d = getDb();
  if (status && status !== 'all') {
    return d.prepare(
      'SELECT * FROM vendor_applications WHERE status = ? ORDER BY submitted_at DESC'
    ).all(status);
  }
  return d.prepare('SELECT * FROM vendor_applications ORDER BY submitted_at DESC').all();
}

export function getApplication(id: number) {
  const d = getDb();
  return d.prepare('SELECT * FROM vendor_applications WHERE id = ?').get(id);
}

export function getApplicationStats() {
  const d = getDb();
  const total = (d.prepare('SELECT COUNT(*) as count FROM vendor_applications').get() as { count: number }).count;
  const pending = (d.prepare("SELECT COUNT(*) as count FROM vendor_applications WHERE status = 'pending'").get() as { count: number }).count;
  const approved = (d.prepare("SELECT COUNT(*) as count FROM vendor_applications WHERE status = 'approved'").get() as { count: number }).count;
  const thisMonth = (d.prepare("SELECT COUNT(*) as count FROM vendor_applications WHERE submitted_at >= date('now', 'start of month')").get() as { count: number }).count;
  return { total, pending, approved, thisMonth };
}

export function getNextInvoiceNumber() {
  const d = getDb();
  const year = new Date().getFullYear();
  const prefix = `SCC-${year}-`;
  const last = d.prepare(
    "SELECT scc_invoice_num FROM invoices WHERE scc_invoice_num LIKE ? ORDER BY scc_invoice_num DESC LIMIT 1"
  ).get(`${prefix}%`) as { scc_invoice_num: string } | undefined;
  if (last) {
    const num = parseInt(last.scc_invoice_num.split('-')[2], 10);
    return `${prefix}${String(num + 1).padStart(4, '0')}`;
  }
  return `${prefix}0001`;
}

export function approveApplication(appId: number): number | null {
  const d = getDb();
  const app = d.prepare('SELECT * FROM vendor_applications WHERE id = ?').get(appId) as Record<string, unknown> | undefined;
  if (!app) return null;

  const result = d.prepare(`
    INSERT INTO contractors (company_name, rep_name, tax_id, phone, email, address, city, state, zip,
      wire_bank_name, wire_routing, wire_account, wire_account_type, wire_account_holder,
      zelle_contact, venmo_handle, cashapp_tag, check_payable_to, services, service_area)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    app.company_name, app.rep_name, app.tax_id,
    app.direct_phone || app.business_phone, app.direct_email || app.business_email,
    app.address, app.city, app.state, app.zip,
    app.wire_bank, app.wire_routing, app.wire_account, app.wire_account_type, app.wire_holder,
    app.zelle_contact, app.venmo_handle, app.cashapp_tag, app.check_payable_to,
    app.services, app.service_area
  );

  d.prepare(
    "UPDATE vendor_applications SET status = 'approved', reviewed_at = datetime('now'), contractor_id = ? WHERE id = ?"
  ).run(result.lastInsertRowid, appId);

  return Number(result.lastInsertRowid);
}

// ---- New query functions for features ----

export function getExpiringInsurance(daysOut: number = 60) {
  const d = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysOut);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  // Check vendor_applications for insurance dates for approved contractors
  return d.prepare(`
    SELECT va.contractor_id, c.company_name, c.rep_name,
      va.gl_expiry, va.wc_expiry, va.auto_expiry, va.umbrella_expiry
    FROM vendor_applications va
    JOIN contractors c ON c.id = va.contractor_id
    WHERE va.status = 'approved'
      AND va.contractor_id IS NOT NULL
      AND (
        (va.gl_expiry IS NOT NULL AND va.gl_expiry <= ?)
        OR (va.wc_expiry IS NOT NULL AND va.wc_expiry <= ?)
        OR (va.auto_expiry IS NOT NULL AND va.auto_expiry <= ?)
        OR (va.umbrella_expiry IS NOT NULL AND va.umbrella_expiry <= ?)
      )
    ORDER BY c.company_name
  `).all(cutoffStr, cutoffStr, cutoffStr, cutoffStr) as {
    contractor_id: number;
    company_name: string;
    rep_name: string;
    gl_expiry: string | null;
    wc_expiry: string | null;
    auto_expiry: string | null;
    umbrella_expiry: string | null;
  }[];
}

export function getContractorInsurance(contractorId: number) {
  const d = getDb();
  return d.prepare(`
    SELECT gl_carrier, gl_policy_num, gl_expiry, gl_coverage_amount,
      wc_carrier, wc_policy_num, wc_expiry,
      auto_carrier, auto_policy_num, auto_expiry, auto_coverage,
      umbrella_carrier, umbrella_policy_num, umbrella_expiry, umbrella_coverage
    FROM vendor_applications
    WHERE contractor_id = ? AND status = 'approved'
    ORDER BY submitted_at DESC LIMIT 1
  `).get(contractorId);
}

export function getContractorReviews(contractorId: number) {
  const d = getDb();
  return d.prepare(`
    SELECT cr.*, i.scc_invoice_num
    FROM contractor_reviews cr
    LEFT JOIN invoices i ON i.id = cr.invoice_id
    WHERE cr.contractor_id = ?
    ORDER BY cr.rated_at DESC
  `).all(contractorId);
}

export function getContractorRetentionStats(contractorId: number) {
  const d = getDb();
  return d.prepare(`
    SELECT
      COALESCE(SUM(total), 0) as total_contracted,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(retention_amount), 0) as total_retention_held,
      COALESCE(SUM(CASE WHEN retention_released = 1 THEN retention_amount ELSE 0 END), 0) as total_retention_released
    FROM invoices WHERE contractor_id = ?
  `).get(contractorId) as {
    total_contracted: number;
    total_paid: number;
    total_retention_held: number;
    total_retention_released: number;
  };
}

export function get1099Data(year: number) {
  const d = getDb();
  return d.prepare(`
    SELECT c.id, c.company_name, c.tax_id,
      COALESCE(SUM(i.total), 0) as total_paid,
      tr.filed, tr.filed_at
    FROM contractors c
    LEFT JOIN invoices i ON i.contractor_id = c.id
      AND i.status = 'paid'
      AND strftime('%Y', i.paid_at) = ?
    LEFT JOIN tax_records tr ON tr.contractor_id = c.id AND tr.tax_year = ?
    GROUP BY c.id
    HAVING total_paid > 0
    ORDER BY c.company_name
  `).all(String(year), year);
}

export function getJobs() {
  const d = getDb();
  return d.prepare(`
    SELECT j.*,
      COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.job_id = j.id), 0) as total_invoiced,
      (SELECT COUNT(*) FROM invoices i WHERE i.job_id = j.id) as invoice_count
    FROM jobs j ORDER BY j.created_at DESC
  `).all();
}

export function getJob(id: number) {
  const d = getDb();
  return d.prepare(`
    SELECT j.*,
      COALESCE((SELECT SUM(i.total) FROM invoices i WHERE i.job_id = j.id), 0) as total_invoiced,
      (SELECT COUNT(*) FROM invoices i WHERE i.job_id = j.id) as invoice_count
    FROM jobs j WHERE j.id = ?
  `).get(id);
}

export function getJobInvoices(jobId: number) {
  const d = getDb();
  return d.prepare(`
    SELECT i.*, c.company_name, c.services
    FROM invoices i
    LEFT JOIN contractors c ON c.id = i.contractor_id
    WHERE i.job_id = ?
    ORDER BY i.invoice_date DESC
  `).all(jobId);
}

export default getDb;
