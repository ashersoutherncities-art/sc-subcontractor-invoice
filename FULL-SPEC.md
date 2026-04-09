# SCE Vendor Portal — Professional Grade Full Spec

This is a professional contractor onboarding portal for Southern Cities Construction LLC.
Think: the quality of a Fortune 500 subcontractor prequalification system.

## Design Standards
- Navy #132452 primary, Orange #fa8c41 accents
- Clean white cards, subtle shadows, proper spacing
- Progress indicator showing steps (e.g. Step 2 of 5)
- Mobile-first responsive
- Inline validation with helpful error messages
- No emojis anywhere
- Professional copy throughout

---

## APPLICATION FORM — 5 STEPS

### Step 1: Company Information
- Legal Business Name (required)
- DBA / Trade Name (optional)
- Business Type (LLC, S-Corp, C-Corp, Sole Proprietorship, Partnership)
- Federal EIN / Tax ID (required, format XX-XXXXXXX with validation)
- Date Business Established (date picker)
- Number of Full-Time Employees (number)
- Number of Subcontractors Typically Used (number)
- Annual Revenue Range (dropdown: Under $250K / $250K-$1M / $1M-$5M / $5M+)
- DUNS Number (optional)
- Bonded? (Yes/No toggle) — if Yes: Bond Amount, Bonding Company, Expiration Date
- Primary Business Address (street, city, state, zip)
- Mailing Address (checkbox: same as above, or separate fields)
- Business Phone
- Business Email
- Website (optional)

### Step 2: Representative / Contact Info
- Primary Contact Name (required)
- Title / Role
- Direct Phone (required)
- Direct Email (required)
- Emergency Contact Name
- Emergency Contact Phone
- Preferred Communication Method (Phone / Email / Text)

### Step 3: Trade & Experience
**Trades / Services Offered** (multi-select checkboxes):
Framing, Rough Carpentry, Finish Carpentry, Roofing, Drywall & Framing, Insulation,
Electrical (Licensed), Plumbing (Licensed), HVAC, Flooring, Tile & Stone,
Concrete & Flatwork, Foundation Work, Masonry & Block, Painting & Coatings,
Siding & Exterior, Windows & Doors, Cabinetry & Millwork, Demolition,
Excavation & Grading, Landscaping & Site Work, Waterproofing, Other

**Service Area** (text: e.g. "Charlotte Metro, 60-mile radius")
**Typical Project Size** (dropdown: Under $5K / $5K-$25K / $25K-$100K / $100K+)
**Largest Single Project Completed** ($)
**Can you work on occupied properties?** (Yes/No)
**Can you work on commercial properties?** (Yes/No)
**Union or Non-Union?**

**Completed Projects — Past 12 Months** (1 required, up to 4):
Each project:
- Project Name / Description
- Property Address
- Scope of Work Performed
- Contract Value ($)
- Project Owner / GC Name
- Owner / GC Contact Phone
- Project Completion Date
- Project Type (Residential Rehab / New Construction / Commercial / Other)

### Step 4: Licenses, Insurance & Compliance

**Licenses:**
- General Contractor License # + State + Expiration Date + Upload
- Specialty License (if applicable) + Type + # + State + Expiration + Upload
- Business License # + Jurisdiction + Expiration + Upload

**Insurance (all fields required if applicable):**

General Liability Insurance:
- Carrier Name (required)
- Policy Number (required)
- Coverage Amount ($) (required)
- Expiration Date (required)
- Certificate Upload (required — PDF/JPG/PNG)

Workers Compensation:
- Do you have employees? (Yes/No toggle)
- If yes: Carrier Name, Policy #, Expiration Date, Certificate Upload (required if employees)
- If no employees: explanation field ("Sole proprietor — exempt")

Automobile Liability (optional):
- Carrier, Policy #, Expiration, Coverage Amount, Upload

Umbrella / Excess Liability (optional):
- Carrier, Policy #, Expiration, Coverage Amount, Upload

**Tax Documents:**
- W-9 Upload (required — PDF/JPG/PNG)
- Label: "W-9 / Request for Taxpayer Identification Number and Certification"
- Note: "Your W-9 is required for payment processing. Southern Cities uses this for 1099 reporting."

**Safety:**
- OSHA 10 Certified workers? (Yes/No)
- OSHA 30 Certified? (Yes/No)
- Written Safety Program? (Yes/No)
- EMR (Experience Modification Rate) if applicable (number field)
- Any OSHA citations in past 3 years? (Yes/No) — if Yes: describe

### Step 5: Payment & References

**Payment Information:**
Wire Transfer:
- Bank Name
- ABA Routing Number (9 digits, validated)
- Account Number
- Account Type (Checking/Savings)
- Account Holder Name (must match W-9)

Zelle:
- Phone Number or Email

Venmo:
- @handle

CashApp (optional):
- $Cashtag

Check Payable To: (name for paper checks)

**References (2 required):**
Each reference:
- Contact Name
- Company Name
- Relationship (General Contractor / Owner / Project Manager / Supplier)
- Phone
- Email
- Years Known

**Agreement & Certification:**
Checkbox: "I certify that all information provided is accurate and complete."
Checkbox: "I authorize Southern Cities Construction LLC to verify the information provided."
Checkbox: "I understand that false statements may result in immediate disqualification."
Digital Signature field (type full name)
Date (auto-filled today)

---

## ADMIN DASHBOARD (/admin)

### Overview Cards
- Total Applications (all time)
- Pending Review count
- Approved Contractors count
- Applications This Month

### Applications Table
Columns: Company | Trade(s) | Submitted | Status | Action
- Status badges: Pending (yellow), Under Review (blue), Approved (green), Rejected (red), More Info Requested (orange)
- Filter by: status, trade, date range, search by company
- Bulk actions: mark reviewed, export CSV

### Application Detail (/admin/applications/[id])
Full application displayed in clean sections matching the 5-step form.

Document verification panel:
- Each document shows: filename, upload date, status (Verified / Pending / Rejected)
- Click to view/download in new tab
- "Verify" / "Flag Issue" button per document

Decision panel (sticky sidebar or bottom):
- Status dropdown (Pending / Under Review / Approved / Rejected / More Info Requested)
- Internal Notes (rich textarea, visible only to admin)
- Red flags checklist (auto-checks): Missing W-9, Missing liability cert, Expired insurance, No completed projects
- "Approve & Add to Network" button → creates contractor profile
- "Request More Information" button → shows email template
- "Reject Application" button → shows rejection reason field

### Approved Contractors (/admin/contractors)
- Full directory of approved vendors
- Filter by trade, location, project size
- Export CSV

---

## CONFIRMATION & EMAIL FLOW

After submission:
- Confirmation page: "Application Received — Thank you [Company Name]"
- Show: application reference number, submitted timestamp, what to expect next
- Copy: "We review all applications within 3-5 business days. You will receive an email at [email] with our decision."

Admin notification: when new application submitted, log to /data/application-notifications.log

---

## FILE STORAGE
- Uploads: /public/uploads/[application_id]/[document_type]/[filename]
- API route: /api/upload handles multipart uploads
- Validate: PDF/JPG/PNG only, max 10MB per file
- Return stored path for DB save

---

## PROFESSIONAL COPY EXAMPLES

Application page header:
"Vendor Prequalification Application
Southern Cities Construction LLC requires all subcontractors to complete our prequalification process before being considered for project assignments. This ensures we maintain the highest standards of quality, safety, and compliance across all projects."

Step labels:
1. Company Information
2. Contact & Representative
3. Trade Experience
4. Licenses, Insurance & Compliance
5. Payment & References

Approval email subject: "Congratulations — You've Been Added to the SCC Vendor Network"
Rejection email subject: "SCC Vendor Application Update"
