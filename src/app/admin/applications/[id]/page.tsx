"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompletedProject {
  project_name?: string;
  property_address?: string;
  scope_of_work?: string;
  contract_value?: string;
  owner_gc_name?: string;
  owner_gc_phone?: string;
  completion_date?: string;
  project_type?: string;
  // Legacy field names
  name?: string;
  owner?: string;
  location?: string;
  value?: string;
  scope?: string;
  year?: string;
  reference?: string;
  reference_phone?: string;
}

interface Application {
  id: number;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  admin_notes?: string;

  // Section 1 – Company Information
  company_name: string;
  dba_name?: string;
  business_type?: string;
  tax_id?: string;
  date_established?: string;
  employees_count?: number;
  sub_count?: number;
  annual_revenue?: string;
  duns_number?: string;
  bonded?: number | boolean;
  bond_amount?: string;
  bonding_company?: string;
  bond_expiry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  mailing_same?: number | boolean;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  business_phone?: string;
  business_email?: string;
  website?: string;

  // Section 2 – Contact & Representative
  rep_name?: string;
  contact_title?: string;
  direct_phone?: string;
  direct_email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  preferred_communication?: string;

  // Section 3 – Trade & Experience
  services?: string;
  other_service?: string;
  service_area?: string;
  project_size?: string;
  largest_project?: string;
  occupied_properties?: number | boolean;
  commercial_properties?: number | boolean;
  union_status?: string;
  completed_projects?: string;

  // Section 4 – Licenses, Insurance & Compliance
  gc_license_num?: string;
  gc_license_state?: string;
  gc_license_expiry?: string;
  gc_license_path?: string;
  specialty_license_type?: string;
  specialty_license_num?: string;
  specialty_license_state?: string;
  specialty_license_expiry?: string;
  specialty_license_path?: string;
  business_license_num?: string;
  business_license_jurisdiction?: string;
  business_license_expiry?: string;
  business_license_path?: string;
  gl_carrier?: string;
  gl_policy_num?: string;
  gl_coverage_amount?: string;
  gl_expiry?: string;
  gl_cert_path?: string;
  has_employees?: number | boolean;
  wc_carrier?: string;
  wc_policy_num?: string;
  wc_expiry?: string;
  wc_cert_path?: string;
  wc_exempt_reason?: string;
  auto_carrier?: string;
  auto_policy_num?: string;
  auto_expiry?: string;
  auto_coverage?: string;
  auto_cert_path?: string;
  umbrella_carrier?: string;
  umbrella_policy_num?: string;
  umbrella_expiry?: string;
  umbrella_coverage?: string;
  umbrella_cert_path?: string;
  w9_path?: string;
  osha10?: number | boolean;
  osha30?: number | boolean;
  written_safety?: number | boolean;
  emr?: string;
  osha_citations?: number | boolean;
  citation_description?: string;

  // Section 5 – Payment & References
  wire_bank?: string;
  wire_routing?: string;
  wire_account?: string;
  wire_account_type?: string;
  wire_holder?: string;
  zelle_contact?: string;
  venmo_handle?: string;
  cashapp_tag?: string;
  check_payable_to?: string;
  ref1_name?: string;
  ref1_company?: string;
  ref1_relationship?: string;
  ref1_phone?: string;
  ref1_email?: string;
  ref1_years?: string;
  ref2_name?: string;
  ref2_company?: string;
  ref2_relationship?: string;
  ref2_phone?: string;
  ref2_email?: string;
  ref2_years?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(str?: string | null): string {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return str;
  }
}

function parseJSON<T>(str?: string | null): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

function bool(val?: number | boolean | null): boolean {
  if (val === null || val === undefined) return false;
  return val === true || val === 1;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    more_info: "bg-orange-100 text-orange-800 border-orange-200",
    more_info_requested: "bg-orange-100 text-orange-800 border-orange-200",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    more_info: "More Info Requested",
    more_info_requested: "More Info Requested",
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const label = labels[status] ?? status;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#f8f9fb" }}>
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#132452" }}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
      {children}
    </dl>
  );
}

function DocField({ label, path }: { label: string; path?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {path ? (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Uploaded — View
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Not uploaded
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const fetchApp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error("Application not found");
      const data: Application = await res.json();
      setApp(data);
      setAdminNotes(data.admin_notes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  async function saveNotes() {
    if (!app) return;
    setSavingNotes(true);
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setSavingNotes(false);
    }
  }

  async function performAction(action: string) {
    setActionLoading(action);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (action === "approve") {
        setActionMessage({ type: "success", text: "Application approved. Contractor added to network. Redirecting..." });
        await fetchApp();
        setTimeout(() => router.push("/admin"), 2000);
      } else if (action === "request_info") {
        setActionMessage({ type: "success", text: "More information has been requested." });
        await fetchApp();
      } else if (action === "reject") {
        setActionMessage({ type: "success", text: "Application has been rejected." });
        setShowRejectConfirm(false);
        await fetchApp();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err instanceof Error ? err.message : "Action failed" });
    } finally {
      setActionLoading(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Red flag checks
  // ---------------------------------------------------------------------------

  function getRedFlags(a: Application): string[] {
    const flags: string[] = [];
    if (!a.w9_path) flags.push("Missing W-9");
    if (!a.gl_cert_path) flags.push("Missing general liability certificate");
    if (a.gl_expiry && new Date(a.gl_expiry) < new Date()) flags.push("Expired general liability insurance");
    const projects = parseJSON<CompletedProject[]>(a.completed_projects);
    if (!projects || projects.length === 0) flags.push("No completed projects listed");
    if (!a.wc_cert_path && bool(a.has_employees)) flags.push("Missing workers compensation certificate");
    return flags;
  }

  // ---------------------------------------------------------------------------
  // Render helpers for sections
  // ---------------------------------------------------------------------------

  function renderCompanyInfo(a: Application) {
    const addressLine = [a.address, a.city, a.state, a.zip].filter(Boolean).join(", ");
    const mailingLine = bool(a.mailing_same)
      ? "Same as business address"
      : [a.mailing_address, a.mailing_city, a.mailing_state, a.mailing_zip].filter(Boolean).join(", ") || "—";

    return (
      <SectionCard title="Section 1 — Company Information">
        <FieldGrid>
          <Field label="Company Name" value={a.company_name} />
          <Field label="DBA" value={a.dba_name} />
          <Field label="Business Type" value={a.business_type} />
          <Field label="Tax ID / EIN" value={a.tax_id} />
          <Field label="Date Established" value={formatDate(a.date_established)} />
          <Field label="Employees" value={a.employees_count != null ? String(a.employees_count) : undefined} />
          <Field label="Subcontractors" value={a.sub_count != null ? String(a.sub_count) : undefined} />
          <Field label="Annual Revenue" value={a.annual_revenue} />
          <Field label="DUNS Number" value={a.duns_number} />
          <Field
            label="Bonded"
            value={
              bool(a.bonded) ? (
                <span className="text-green-700 font-semibold">Yes</span>
              ) : (
                <span className="text-gray-400">No</span>
              )
            }
          />
          {bool(a.bonded) && (
            <>
              <Field label="Bond Amount" value={a.bond_amount} />
              <Field label="Bonding Company" value={a.bonding_company} />
              <Field label="Bond Expiry" value={formatDate(a.bond_expiry)} />
            </>
          )}
          <Field label="Business Address" value={addressLine || undefined} />
          <Field label="Mailing Address" value={mailingLine} />
          <Field label="Business Phone" value={a.business_phone} />
          <Field label="Business Email" value={a.business_email} />
          <Field label="Website" value={a.website} />
        </FieldGrid>
      </SectionCard>
    );
  }

  function renderContactInfo(a: Application) {
    return (
      <SectionCard title="Section 2 — Contact & Representative">
        <FieldGrid>
          <Field label="Contact Name" value={a.rep_name} />
          <Field label="Title" value={a.contact_title} />
          <Field label="Direct Phone" value={a.direct_phone} />
          <Field label="Direct Email" value={a.direct_email} />
          <Field label="Emergency Contact" value={a.emergency_contact_name} />
          <Field label="Emergency Phone" value={a.emergency_contact_phone} />
          <Field label="Preferred Communication" value={a.preferred_communication} />
        </FieldGrid>
      </SectionCard>
    );
  }

  function renderTradeInfo(a: Application) {
    const services = parseJSON<string[]>(a.services) ?? [];
    const projects = parseJSON<CompletedProject[]>(a.completed_projects) ?? [];

    return (
      <SectionCard title="Section 3 — Trade & Experience">
        <div className="space-y-6">
          <FieldGrid>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Services Offered</dt>
              <dd>
                {services.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {services.map((s) => (
                      <span
                        key={s}
                        className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "#fff3ea", color: "#fa8c41", border: "1px solid #fbd5b2" }}
                      >
                        {s}
                      </span>
                    ))}
                    {a.other_service && (
                      <span
                        className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "#fff3ea", color: "#fa8c41", border: "1px solid #fbd5b2" }}
                      >
                        {a.other_service}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-300 text-sm">—</span>
                )}
              </dd>
            </div>
            <Field label="Service Area" value={a.service_area} />
            <Field label="Typical Project Size" value={a.project_size} />
            <Field label="Largest Project" value={a.largest_project} />
            <Field
              label="Occupied Properties"
              value={bool(a.occupied_properties) ? "Yes" : "No"}
            />
            <Field
              label="Commercial Properties"
              value={bool(a.commercial_properties) ? "Yes" : "No"}
            />
            <Field label="Union Status" value={a.union_status} />
          </FieldGrid>

          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Completed Projects ({projects.length})
              </h3>
              <div className="space-y-3">
                {projects.map((p, i) => {
                  const projectName = p.project_name || p.name;
                  const ownerName = p.owner_gc_name || p.owner;
                  const address = p.property_address || p.location;
                  const projectValue = p.contract_value || p.value;
                  const scopeText = p.scope_of_work || p.scope;
                  const completionDate = p.completion_date || p.year;
                  const phone = p.owner_gc_phone || p.reference_phone;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        {projectName || `Project ${i + 1}`}
                      </p>
                      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                        {ownerName && <Field label="Owner / GC" value={ownerName} />}
                        {address && <Field label="Location" value={address} />}
                        {projectValue && <Field label="Contract Value" value={`$${projectValue}`} />}
                        {p.project_type && <Field label="Project Type" value={p.project_type} />}
                        {completionDate && <Field label="Completion Date" value={formatDate(completionDate)} />}
                        {scopeText && (
                          <div className="col-span-2 sm:col-span-3">
                            <Field label="Scope of Work" value={scopeText} />
                          </div>
                        )}
                        {phone && <Field label="Contact Phone" value={phone} />}
                        {p.reference && <Field label="Reference" value={p.reference} />}
                      </dl>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    );
  }

  function renderLicensesInsurance(a: Application) {
    return (
      <SectionCard title="Section 4 — Licenses, Insurance & Compliance">
        <div className="space-y-7">
          {/* Licenses */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Licenses</h3>
            <FieldGrid>
              <Field label="GC License Number" value={a.gc_license_num} />
              <Field label="GC License State" value={a.gc_license_state} />
              <Field label="GC License Expiry" value={formatDate(a.gc_license_expiry)} />
              <Field label="Specialty License Type" value={a.specialty_license_type} />
              <Field label="Specialty License Number" value={a.specialty_license_num} />
              <Field label="Specialty License State" value={a.specialty_license_state} />
              <Field label="Specialty License Expiry" value={formatDate(a.specialty_license_expiry)} />
              <Field label="Business License Number" value={a.business_license_num} />
              <Field label="Business License Jurisdiction" value={a.business_license_jurisdiction} />
              <Field label="Business License Expiry" value={formatDate(a.business_license_expiry)} />
            </FieldGrid>
          </div>

          {/* Insurance */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">General Liability Insurance</h3>
            <FieldGrid>
              <Field label="Carrier" value={a.gl_carrier} />
              <Field label="Policy Number" value={a.gl_policy_num} />
              <Field label="Coverage Amount" value={a.gl_coverage_amount} />
              <Field label="Expiry" value={formatDate(a.gl_expiry)} />
            </FieldGrid>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Workers Compensation</h3>
            <FieldGrid>
              <Field label="Has Employees" value={bool(a.has_employees) ? "Yes" : "No"} />
              <Field label="Carrier" value={a.wc_carrier} />
              <Field label="Policy Number" value={a.wc_policy_num} />
              <Field label="Expiry" value={formatDate(a.wc_expiry)} />
              <Field label="Exempt Reason" value={a.wc_exempt_reason} />
            </FieldGrid>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Auto Insurance</h3>
            <FieldGrid>
              <Field label="Carrier" value={a.auto_carrier} />
              <Field label="Policy Number" value={a.auto_policy_num} />
              <Field label="Coverage" value={a.auto_coverage} />
              <Field label="Expiry" value={formatDate(a.auto_expiry)} />
            </FieldGrid>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Umbrella / Excess Liability</h3>
            <FieldGrid>
              <Field label="Carrier" value={a.umbrella_carrier} />
              <Field label="Policy Number" value={a.umbrella_policy_num} />
              <Field label="Coverage" value={a.umbrella_coverage} />
              <Field label="Expiry" value={formatDate(a.umbrella_expiry)} />
            </FieldGrid>
          </div>

          {/* Safety & Compliance */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Safety & Compliance</h3>
            <FieldGrid>
              <Field label="OSHA 10 Certified" value={bool(a.osha10) ? "Yes" : "No"} />
              <Field label="OSHA 30 Certified" value={bool(a.osha30) ? "Yes" : "No"} />
              <Field label="Written Safety Program" value={bool(a.written_safety) ? "Yes" : "No"} />
              <Field label="EMR" value={a.emr} />
              <Field label="OSHA Citations" value={bool(a.osha_citations) ? "Yes" : "No"} />
              {bool(a.osha_citations) && (
                <div className="sm:col-span-2">
                  <Field label="Citation Description" value={a.citation_description} />
                </div>
              )}
            </FieldGrid>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Documents</h3>
            <div className="rounded-lg border border-gray-100 divide-y divide-gray-50">
              <DocField label="W-9 Form" path={a.w9_path} />
              <DocField label="General Liability Certificate" path={a.gl_cert_path} />
              <DocField label="Workers Comp Certificate" path={a.wc_cert_path} />
              <DocField label="Auto Insurance Certificate" path={a.auto_cert_path} />
              <DocField label="Umbrella / Excess Certificate" path={a.umbrella_cert_path} />
              <DocField label="GC License Document" path={a.gc_license_path} />
              <DocField label="Specialty License Document" path={a.specialty_license_path} />
              <DocField label="Business License Document" path={a.business_license_path} />
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  function renderPaymentReferences(a: Application) {
    return (
      <SectionCard title="Section 5 — Payment & References">
        <div className="space-y-7">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Payment Methods</h3>
            <FieldGrid>
              <Field label="Wire Bank" value={a.wire_bank} />
              <Field label="Wire Routing Number" value={a.wire_routing} />
              <Field label="Wire Account Number" value={a.wire_account} />
              <Field label="Wire Account Type" value={a.wire_account_type} />
              <Field label="Wire Account Holder" value={a.wire_holder} />
              <Field label="Zelle Contact" value={a.zelle_contact} />
              <Field label="Venmo Handle" value={a.venmo_handle} />
              <Field label="CashApp Tag" value={a.cashapp_tag} />
              <Field label="Check Payable To" value={a.check_payable_to} />
            </FieldGrid>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Reference 1</h3>
            <FieldGrid>
              <Field label="Name" value={a.ref1_name} />
              <Field label="Company" value={a.ref1_company} />
              <Field label="Relationship" value={a.ref1_relationship} />
              <Field label="Phone" value={a.ref1_phone} />
              <Field label="Email" value={a.ref1_email} />
              <Field label="Years Known" value={a.ref1_years} />
            </FieldGrid>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Reference 2</h3>
            <FieldGrid>
              <Field label="Name" value={a.ref2_name} />
              <Field label="Company" value={a.ref2_company} />
              <Field label="Relationship" value={a.ref2_relationship} />
              <Field label="Phone" value={a.ref2_phone} />
              <Field label="Email" value={a.ref2_email} />
              <Field label="Years Known" value={a.ref2_years} />
            </FieldGrid>
          </div>
        </div>
      </SectionCard>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full mx-auto animate-spin" style={{ borderTopColor: "#132452" }} />
          <p className="text-sm text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-700 font-medium">{error ?? "Application not found"}</p>
          <Link href="/admin" className="text-sm font-semibold underline" style={{ color: "#132452" }}>
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const redFlags = getRedFlags(app);

  // ---------------------------------------------------------------------------
  // Full render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-base font-bold truncate" style={{ color: "#132452" }}>
              {app.company_name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={app.status} />
            <span className="text-xs text-gray-400">
              Submitted {formatDate(app.submitted_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 flex flex-col gap-6">

          {/* Left column: Application details */}
          <div className="lg:col-span-2 space-y-6">
            {renderCompanyInfo(app)}
            {renderContactInfo(app)}
            {renderTradeInfo(app)}
            {renderLicensesInsurance(app)}
            {renderPaymentReferences(app)}
          </div>

          {/* Right column: Decision panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Red Flags */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: "#f8f9fb" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#132452" }}>
                    Red Flag Check
                  </h2>
                </div>
                <div className="px-5 py-4">
                  {redFlags.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">No issues found</span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {redFlags.map((flag) => (
                        <li key={flag} className="flex items-start gap-2 text-red-700">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          <span className="text-sm">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Current Status</span>
                <StatusBadge status={app.status} />
              </div>

              {/* Action Message */}
              {actionMessage && (
                <div
                  className={`rounded-xl px-5 py-4 text-sm font-medium border ${
                    actionMessage.type === "success"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {actionMessage.text}
                </div>
              )}

              {/* Admin Notes */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: "#f8f9fb" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#132452" }}>
                    Admin Notes
                  </h2>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={5}
                    placeholder="Add internal notes about this application..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
                    style={{ focusRingColor: "#132452" } as React.CSSProperties}
                  />
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="w-full text-sm font-semibold py-2 rounded-lg border transition-colors disabled:opacity-50"
                    style={{ borderColor: "#132452", color: "#132452", backgroundColor: "white" }}
                  >
                    {savingNotes ? "Saving..." : notesSaved ? "Saved" : "Save Notes"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100" style={{ backgroundColor: "#f8f9fb" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#132452" }}>
                    Actions
                  </h2>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {/* Approve */}
                  <button
                    onClick={() => performAction("approve")}
                    disabled={actionLoading !== null || app.status === "approved"}
                    className="w-full text-sm font-semibold py-2.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: app.status === "approved" ? "#6b7280" : "#16a34a" }}
                  >
                    {actionLoading === "approve" ? "Processing..." : "Approve & Add to Network"}
                  </button>

                  {/* Request More Info */}
                  <button
                    onClick={() => performAction("request_info")}
                    disabled={actionLoading !== null}
                    className="w-full text-sm font-semibold py-2.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#fa8c41" }}
                  >
                    {actionLoading === "request_info" ? "Processing..." : "Request More Information"}
                  </button>

                  {/* Reject */}
                  {!showRejectConfirm ? (
                    <button
                      onClick={() => setShowRejectConfirm(true)}
                      disabled={actionLoading !== null || app.status === "rejected"}
                      className="w-full text-sm font-semibold py-2.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                    >
                      Reject Application
                    </button>
                  ) : (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-3">
                      <p className="text-sm text-red-700 font-medium">
                        Are you sure you want to reject this application? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => performAction("reject")}
                          disabled={actionLoading !== null}
                          className="flex-1 text-sm font-semibold py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === "reject" ? "Rejecting..." : "Confirm Reject"}
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(false)}
                          className="flex-1 text-sm font-semibold py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission meta */}
              {app.reviewed_at && (
                <p className="text-xs text-gray-400 text-center">
                  Last reviewed {formatDate(app.reviewed_at)}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
