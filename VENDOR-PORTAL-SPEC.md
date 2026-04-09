# Vendor Portal — Additional Feature Spec

Add these pages to the invoice tool app.

## /apply — Public Vendor Application Form

Contractors fill this out to apply to join the SCC vendor network.

**Section 1: Company Info**
- Company Name (required)
- Representative / Owner Name (required)
- Business Type (dropdown: LLC, Sole Prop, Corporation, Partnership)
- Years in Business
- EIN / Tax ID (required)
- Business License # (optional)
- GC License # (optional)
- Insurance (checkbox: General Liability, Workers Comp) + Expiration Date fields

**Section 2: Contact Info**
- Phone (required)
- Email (required)
- Website (optional)
- Business Address (street, city, state, zip)

**Section 3: Documents & Compliance**
- W-9 Form upload (PDF/image, required) — label: "W-9 / TIN Certification"
- Certificate of General Liability Insurance upload (required) — with expiration date field
- Certificate of Workers Compensation Insurance upload (required if employees) — with expiration date field
- Business License upload (optional) — with license # and expiration date
- GC License upload (optional) — with license # and expiration date
- Note under uploads: "Accepted formats: PDF, JPG, PNG. Max 10MB per file."

**Section 4: Experience & Completed Projects**
- Years in business (number)
- Total projects completed (number)
- **4 Completed Projects in the Past Year** (required — must fill at least 1, up to 4):
  Each project entry:
  - Project Name / Address
  - Scope of Work
  - Project Value ($)
  - General Contractor / Owner Name
  - Contact Phone (for verification)
  - Completion Date
- Add/remove project rows dynamically (min 1, max 4)

**Section 5: Services Offered**
- Checkboxes (multi-select):
  Framing, Roofing, Drywall, Electrical, Plumbing, HVAC, Flooring, Concrete/Foundation,
  Painting, Excavation/Grading, Landscaping, Windows/Doors, Siding/Exterior, Demolition, Other
- "Other" text field if selected
- Service area (text: e.g. "Charlotte, Concord, Gastonia — 50 mile radius")
- Typical project size (dropdown: Under $5K, $5K-$25K, $25K-$100K, $100K+)

**Section 6: References**
- 2 references (name, company, phone) — optional but encouraged

**Section 7: Payment Info**
- Wire: Bank Name, Routing, Account #, Account Type, Account Holder
- Zelle: Phone or Email
- Venmo: @handle

Submit button → saves to applications table, shows confirmation page.

---

## /admin — Admin Dashboard (Darius only, no auth needed since internal tool)

### Applications tab
- Table: company name, trade, submitted date, status (Pending/Approved/Rejected)
- Click to view full application
- Approve button → creates contractor record in contractors table, sends approval email
- Reject button → marks rejected, sends rejection email
- Filter by: status, trade, date

### Application Detail View
- Full application info displayed
- Notes field (Darius can add private notes)
- Approve / Reject / Request More Info buttons
- "Approve & Add to Network" → auto-creates contractor profile from application data

---

## DATABASE ADDITIONS

```sql
CREATE TABLE vendor_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  business_type TEXT,
  years_in_business INTEGER,
  tax_id TEXT,
  license_num TEXT,
  gc_license TEXT,
  has_general_liability INTEGER DEFAULT 0,
  liability_expiry TEXT,
  has_workers_comp INTEGER DEFAULT 0,
  workers_comp_expiry TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  services TEXT, -- JSON array of selected services
  other_service TEXT,
  service_area TEXT,
  project_size TEXT,
  ref1_name TEXT, ref1_company TEXT, ref1_phone TEXT,
  ref2_name TEXT, ref2_company TEXT, ref2_phone TEXT,
  -- Documents (store file paths)
  w9_path TEXT,
  liability_cert_path TEXT,
  liability_expiry TEXT,
  workers_comp_path TEXT,
  workers_comp_expiry TEXT,
  business_license_path TEXT,
  business_license_num TEXT,
  business_license_expiry TEXT,
  gc_license_path TEXT,
  gc_license_num TEXT,
  gc_license_expiry TEXT,
  -- Completed projects (JSON array of {name, scope, value, gc_name, gc_phone, completed_date})
  completed_projects TEXT,
  wire_bank TEXT, wire_routing TEXT, wire_account TEXT,
  wire_account_type TEXT, wire_holder TEXT,
  zelle_contact TEXT,
  venmo_handle TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  contractor_id INTEGER REFERENCES contractors(id) -- set when approved
);
```

---

## IMPORTANT
- /apply is fully public (no login)
- /admin is internal only — just add it, no password needed (accessed by Darius directly)
- When approved, auto-populate contractor profile from application data
- Confirmation page after submit: "Thank you [Company Name]. We review applications within 2-3 business days. We will contact you at [email]."
- No emojis, SC brand colors (navy #132452, orange #fa8c41)
