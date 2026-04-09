# Additional Features — Add to SCE Invoice Tool

## 1. Lien Waiver Tracking
- Each invoice has a lien waiver section
- Types: Conditional Waiver on Progress Payment, Unconditional Waiver on Final Payment
- Upload signed waiver (PDF/image) per invoice
- Invoice cannot be marked "Paid" without a waiver on file (or explicit override with note)
- Waiver status shown on invoice view and contractor profile
- DB: add lien_waiver_path, lien_waiver_type, lien_waiver_date to invoices table

## 2. Retention Tracking
- Per-invoice retention percentage (default 10%, editable)
- System calculates: Contract Amount, Retention Held, Net Due
- Retention release: separate "Release Retention" action after punch list
- Contractor profile shows: Total Contracted, Total Paid, Total Retention Held, Total Retention Released
- DB: add retention_pct, retention_amount, retention_released, retention_released_at to invoices

## 3. Change Order Log
- Each job/invoice can have change orders attached
- Change order fields: CO #, description, amount (+/-), date approved, approved by
- Change orders adjust the invoice total
- CO history table on invoice view
- DB: change_orders table (id, invoice_id, co_number, description, amount, approved_date, approved_by)

## 4. Insurance Expiration Alerts
- On contractor profile: show colored status for each insurance cert
  - Green: expires 60+ days out
  - Yellow: expires within 60 days
  - Red: expired
- Admin dashboard: "Expiring Insurance" section shows all contractors with certs expiring within 60 days
- /admin page shows count badge: "3 contractors with expiring insurance"

## 5. 1099 Prep
- /admin/1099 page
- Year selector (default current year)
- Table: Contractor | EIN | Total Paid (that year) | 1099 Required (>$600)
- Export to CSV (formatted for 1099-NEC filing)
- Mark as "1099 Filed" per contractor per year
- DB: add 1099_filed boolean + year to a tax_records table

## 6. Job/Project Linking
- Jobs table: id, job_name, address, description, start_date, end_date, status, budget
- Invoices can be linked to a job (job_id foreign key)
- Job detail page (/job/[id]) shows:
  - All invoices for that job
  - Total invoiced vs budget
  - % complete
  - All contractors who worked it
  - Total spend by trade
- New Invoice form: "Link to Job" dropdown (optional)
- DB: jobs table + job_id on invoices

## 7. Contractor Performance Ratings
- After marking invoice paid: prompt "Rate this contractor" (optional, can skip)
- Rating: 1-5 stars on: Quality of Work, Timeliness, Communication, Would Hire Again
- Notes field
- Contractor profile shows: average rating, rating breakdown, all reviews
- Admin can add private notes (never shown to contractor)
- DB: contractor_reviews table (id, contractor_id, invoice_id, quality, timeliness, communication, would_hire_again, notes, rated_at)

## 8. Email Notifications
- When vendor application submitted: 
  - Auto-confirm to applicant: "We received your application. We'll review within 3-5 business days."
- When approved:
  - Email to contractor: "Congratulations — You've been added to the SCC Vendor Network"
  - Include: their vendor ID, what to expect, how to submit invoices
- When rejected:
  - Email to contractor: "Thank you for your interest — we'll keep your application on file"
  - Optional custom rejection note from admin
- When invoice marked paid:
  - Email to contractor with payment confirmation + invoice PDF attached
- Email sender: asher@developthesouth.com via gog CLI
- All emails logged to DB: email_log table (id, to, subject, type, sent_at, related_id)

---

## DATABASE ADDITIONS

```sql
-- Lien waivers
ALTER TABLE invoices ADD COLUMN lien_waiver_path TEXT;
ALTER TABLE invoices ADD COLUMN lien_waiver_type TEXT; -- conditional, unconditional
ALTER TABLE invoices ADD COLUMN lien_waiver_date TEXT;

-- Retention
ALTER TABLE invoices ADD COLUMN retention_pct REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN retention_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN retention_released INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN retention_released_at TEXT;

-- Change orders
CREATE TABLE change_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER REFERENCES invoices(id),
  co_number TEXT,
  description TEXT,
  amount REAL,
  approved_date TEXT,
  approved_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Jobs
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active', -- active, complete, on_hold
  budget REAL,
  created_at TEXT DEFAULT (datetime('now'))
);
ALTER TABLE invoices ADD COLUMN job_id INTEGER REFERENCES jobs(id);

-- Reviews
CREATE TABLE contractor_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER REFERENCES contractors(id),
  invoice_id INTEGER REFERENCES invoices(id),
  quality INTEGER, -- 1-5
  timeliness INTEGER,
  communication INTEGER,
  would_hire_again INTEGER, -- 1-5
  notes TEXT,
  admin_notes TEXT,
  rated_at TEXT DEFAULT (datetime('now'))
);

-- 1099 tracking
CREATE TABLE tax_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER REFERENCES contractors(id),
  tax_year INTEGER,
  total_paid REAL,
  filed INTEGER DEFAULT 0,
  filed_at TEXT,
  UNIQUE(contractor_id, tax_year)
);

-- Email log
CREATE TABLE email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT,
  subject TEXT,
  type TEXT, -- application_confirm, approved, rejected, payment_confirm
  related_id INTEGER,
  sent_at TEXT DEFAULT (datetime('now'))
);
```
