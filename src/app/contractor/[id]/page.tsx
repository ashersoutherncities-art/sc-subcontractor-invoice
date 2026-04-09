"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Contractor {
  id: number;
  company_name: string;
  rep_name: string;
  tax_id: string | null;
  label: string | null;
  wire_bank_name: string | null;
  wire_routing: string | null;
  wire_account: string | null;
  wire_account_type: string | null;
  wire_account_holder: string | null;
  zelle_contact: string | null;
  venmo_handle: string | null;
  last_invoice_date: string | null;
  total_paid: number;
}

interface Invoice {
  id: number;
  scc_invoice_num: string;
  invoice_date: string;
  total: number;
  status: string;
  lien_waiver_path: string | null;
  lien_waiver_override_note: string | null;
}

interface Insurance {
  gl_carrier: string | null;
  gl_expiry: string | null;
  wc_carrier: string | null;
  wc_expiry: string | null;
  auto_carrier: string | null;
  auto_expiry: string | null;
  umbrella_carrier: string | null;
  umbrella_expiry: string | null;
}

interface RetentionStats {
  total_contracted: number;
  total_paid: number;
  total_retention_held: number;
  total_retention_released: number;
}

interface Review {
  id: number;
  quality: number;
  timeliness: number;
  communication: number;
  would_hire_again: number;
  notes: string | null;
  admin_notes: string | null;
  rated_at: string;
  scc_invoice_num: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function maskAccount(account: string | null): string {
  if (!account) return "--";
  if (account.length <= 4) return account;
  return "****" + account.slice(-4);
}

function getInsuranceBadge(expiryStr: string | null): { label: string; bg: string; text: string } {
  if (!expiryStr) return { label: "N/A", bg: "#f3f4f6", text: "#6b7280" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryStr + "T00:00:00");
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", bg: "#fee2e2", text: "#991b1b" };
  if (diffDays < 60) return { label: `${diffDays}d left`, bg: "#fef3c7", text: "#92400e" };
  return { label: "Valid", bg: "#dcfce7", text: "#166534" };
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span style={{ fontSize: 14, letterSpacing: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: value >= n ? "#fa8c41" : "#d1d5db" }}>*</span>
      ))}
    </span>
  );
}

export default function ContractorProfile() {
  const params = useParams();
  const id = params.id;

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contractor>>({});
  const [saving, setSaving] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchContractor = useCallback(async () => {
    try {
      const res = await fetch(`/api/contractors/${id}`);
      if (!res.ok) throw new Error("Not found");
      return await res.json();
    } catch {
      setError("Failed to load contractor.");
      return null;
    }
  }, [id]);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices?contractor_id=${id}`);
      if (res.ok) setInvoices(await res.json());
    } catch { /* silent */ }
  }, [id]);

  const fetchInsurance = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurance?contractor_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) setInsurance(data);
      }
    } catch { /* silent */ }
  }, [id]);

  const fetchRetention = useCallback(async () => {
    try {
      // Use invoices data to compute retention stats client-side
      const res = await fetch(`/api/invoices?contractor_id=${id}`);
      if (res.ok) {
        const invs = await res.json();
        const stats = {
          total_contracted: invs.reduce((s: number, i: Record<string, number>) => s + (i.total || 0), 0),
          total_paid: invs.filter((i: Record<string, string>) => i.status === "paid").reduce((s: number, i: Record<string, number>) => s + (i.total || 0), 0),
          total_retention_held: invs.reduce((s: number, i: Record<string, number>) => s + (i.retention_amount || 0), 0),
          total_retention_released: invs.filter((i: Record<string, number>) => i.retention_released).reduce((s: number, i: Record<string, number>) => s + (i.retention_amount || 0), 0),
        };
        setRetentionStats(stats);
      }
    } catch { /* silent */ }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?contractor_id=${id}`);
      if (res.ok) setReviews(await res.json());
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const c = await fetchContractor();
      if (c) setContractor(c);
      await Promise.all([fetchInvoices(), fetchInsurance(), fetchRetention(), fetchReviews()]);
      setLoading(false);
    }
    load();
  }, [fetchContractor, fetchInvoices, fetchInsurance, fetchRetention, fetchReviews]);

  function startEditing() {
    if (!contractor) return;
    setEditData({
      company_name: contractor.company_name, rep_name: contractor.rep_name,
      tax_id: contractor.tax_id || "", label: contractor.label || "",
      wire_bank_name: contractor.wire_bank_name || "", wire_routing: contractor.wire_routing || "",
      wire_account: contractor.wire_account || "", wire_account_type: contractor.wire_account_type || "",
      wire_account_holder: contractor.wire_account_holder || "",
      zelle_contact: contractor.zelle_contact || "", venmo_handle: contractor.venmo_handle || "",
    } as Partial<Contractor>);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/contractors/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editData) });
      if (!res.ok) throw new Error("Failed to update");
      setContractor(await res.json());
      setEditing(false);
    } catch { setError("Failed to save changes."); }
    finally { setSaving(false); }
  }

  function updateField(field: string, value: string) { setEditData((prev) => ({ ...prev, [field]: value })); }

  async function handleAddAdminNote() {
    if (!adminNote.trim()) return;
    setSavingNote(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractor_id: parseInt(id as string), admin_notes: adminNote, quality: 0, timeliness: 0, communication: 0, would_hire_again: 0 }),
      });
      setAdminNote("");
      await fetchReviews();
    } catch { /* silent */ }
    finally { setSavingNote(false); }
  }

  const hasWire = contractor?.wire_bank_name || contractor?.wire_routing || contractor?.wire_account;
  const hasZelle = contractor?.zelle_contact;
  const hasVenmo = contractor?.venmo_handle;

  // Average ratings
  const ratedReviews = reviews.filter((r) => r.quality > 0);
  const avgRating = ratedReviews.length > 0
    ? ratedReviews.reduce((s, r) => s + (r.quality + r.timeliness + r.communication + r.would_hire_again) / 4, 0) / ratedReviews.length
    : 0;

  if (loading) {
    return <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">Loading contractor...</div>;
  }

  if (error && !contractor) {
    return (
      <div>
        <Link href="/" className="text-navy hover:underline font-medium inline-block mb-4">&larr; Back to Directory</Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!contractor) return null;

  return (
    <div>
      <Link href="/" className="text-navy hover:underline font-medium inline-block mb-6">&larr; Back to Directory</Link>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {/* Contractor Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">{contractor.company_name}</h1>
            {contractor.rep_name && <p className="text-gray-600 mt-1">Rep: {contractor.rep_name}</p>}
            {contractor.tax_id && <p className="text-gray-500 text-sm mt-1">Tax ID: {contractor.tax_id}</p>}
            {contractor.label && (
              <span className="inline-block mt-2 bg-orange/10 text-orange text-xs font-medium px-2.5 py-0.5 rounded-full">{contractor.label}</span>
            )}
            {ratedReviews.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <StarDisplay value={Math.round(avgRating)} />
                <span className="text-sm text-gray-500">({avgRating.toFixed(1)} avg, {ratedReviews.length} review{ratedReviews.length !== 1 ? "s" : ""})</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Lifetime Paid</p>
            <p className="text-2xl font-bold text-navy">{formatCurrency(contractor.total_paid || 0)}</p>
          </div>
        </div>
      </div>

      {/* Retention Stats */}
      {retentionStats && retentionStats.total_retention_held > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-navy mb-3">Retention Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Contracted", value: retentionStats.total_contracted, color: "var(--navy)" },
              { label: "Total Paid", value: retentionStats.total_paid, color: "#059669" },
              { label: "Retention Held", value: retentionStats.total_retention_held, color: "#d97706" },
              { label: "Retention Released", value: retentionStats.total_retention_released, color: "#2563eb" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl shadow p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-lg font-bold" style={{ color, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Status */}
      {insurance && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-navy mb-3">Insurance Certificates</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { label: "General Liability", carrier: insurance.gl_carrier, expiry: insurance.gl_expiry },
              { label: "Workers Comp", carrier: insurance.wc_carrier, expiry: insurance.wc_expiry },
              { label: "Auto Insurance", carrier: insurance.auto_carrier, expiry: insurance.auto_expiry },
              { label: "Umbrella", carrier: insurance.umbrella_carrier, expiry: insurance.umbrella_expiry },
            ] as const).map((cert) => {
              const badge = getInsuranceBadge(cert.expiry);
              return (
                <div key={cert.label} className="bg-white rounded-xl shadow p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cert.label}</p>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.text }}>
                    {badge.label}
                  </span>
                  {cert.carrier && <p className="text-xs text-gray-500 mt-2">{cert.carrier}</p>}
                  {cert.expiry && <p className="text-xs text-gray-400">Exp: {formatDate(cert.expiry)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {(hasWire || hasZelle || hasVenmo) && !editing && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-navy mb-3">Payment Methods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hasWire && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Wire Transfer</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Bank:</span> <span className="text-gray-800">{contractor.wire_bank_name || "--"}</span></div>
                  <div><span className="text-gray-500">Routing:</span> <span className="text-gray-800">{contractor.wire_routing || "--"}</span></div>
                  <div><span className="text-gray-500">Account:</span> <span className="text-gray-800">{maskAccount(contractor.wire_account)}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="text-gray-800">{contractor.wire_account_type || "--"}</span></div>
                  <div><span className="text-gray-500">Holder:</span> <span className="text-gray-800">{contractor.wire_account_holder || "--"}</span></div>
                </div>
              </div>
            )}
            {hasZelle && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Zelle</h3>
                <div className="text-sm"><span className="text-gray-500">Phone/Email:</span> <span className="text-gray-800">{contractor.zelle_contact}</span></div>
              </div>
            )}
            {hasVenmo && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Venmo</h3>
                <div className="text-sm"><span className="text-gray-500">Handle:</span> <span className="text-gray-800">@{contractor.venmo_handle}</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Button / Form */}
      {!editing ? (
        <div className="mb-6">
          <button onClick={startEditing} className="bg-navy text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Edit Profile</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-navy mb-4">Edit Profile</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  ["company_name", "Company Name", true],
                  ["rep_name", "Rep Name", false],
                  ["tax_id", "Tax ID", false],
                  ["label", "Label", false],
                ] as const).map(([field, label, req]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="text" required={req as boolean} value={(editData[field] as string) || ""}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Wire Transfer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  ["wire_bank_name", "Bank Name"],
                  ["wire_routing", "Routing Number"],
                  ["wire_account", "Account Number"],
                ] as const).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="text" value={(editData[field] as string) || ""}
                      onChange={(e) => updateField(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select value={(editData.wire_account_type as string) || ""} onChange={(e) => updateField("wire_account_type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy">
                    <option value="">Select...</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input type="text" value={(editData.wire_account_holder as string) || ""} onChange={(e) => updateField("wire_account_holder", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Zelle</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone or Email</label>
                <input type="text" value={(editData.zelle_contact as string) || ""} onChange={(e) => updateField("zelle_contact", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Venmo</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Handle (without @)</label>
                <input type="text" value={(editData.venmo_handle as string) || ""} onChange={(e) => updateField("venmo_handle", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="bg-orange text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice History */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-navy">Invoice History</h2>
          <Link href={`/invoice/new?contractor=${contractor.id}`} className="bg-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            New Invoice for This Contractor
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No invoices yet for this contractor.</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy/5 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-navy">SCC Invoice #</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-navy">Date</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-navy">Amount</th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-navy">Waiver</th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-navy">Status</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-navy">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-navy">{inv.scc_invoice_num || "--"}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(inv.invoice_date)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">{formatCurrency(inv.total || 0)}</td>
                      <td className="px-6 py-4 text-center">
                        {inv.lien_waiver_path ? (
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>On File</span>
                        ) : inv.lien_waiver_override_note ? (
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>Override</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 11 }}>--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange/10 text-orange"
                        }`}>
                          {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/invoice/${inv.id}`} className="text-navy hover:underline text-sm font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-navy mb-3">Performance Reviews</h2>
        {ratedReviews.length === 0 && reviews.filter((r) => r.admin_notes).length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No reviews yet.</div>
        ) : (
          <div className="space-y-4">
            {/* Rating breakdown */}
            {ratedReviews.length > 0 && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">Average Ratings ({ratedReviews.length} review{ratedReviews.length !== 1 ? "s" : ""})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(["quality", "timeliness", "communication", "would_hire_again"] as const).map((field) => {
                    const avg = ratedReviews.reduce((s, r) => s + r[field], 0) / ratedReviews.length;
                    return (
                      <div key={field}>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {field === "would_hire_again" ? "Hire Again" : field}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <StarDisplay value={Math.round(avg)} />
                          <span className="text-sm font-medium text-gray-700 ml-1">{avg.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual reviews */}
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {r.quality > 0 && <StarDisplay value={Math.round((r.quality + r.timeliness + r.communication + r.would_hire_again) / 4)} />}
                    {r.scc_invoice_num && <span className="text-xs text-gray-500 ml-2">Invoice: {r.scc_invoice_num}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{r.rated_at ? new Date(r.rated_at).toLocaleDateString() : ""}</span>
                </div>
                {r.notes && <p className="text-sm text-gray-700 mt-1">{r.notes}</p>}
                {r.admin_notes && (
                  <div className="mt-2 p-2 bg-navy/5 rounded text-sm">
                    <span className="text-xs font-semibold text-navy uppercase">Admin Note: </span>
                    <span className="text-gray-700">{r.admin_notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Admin private notes */}
        <div className="mt-4 bg-white rounded-xl shadow p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">Add Admin Note (Private)</h3>
          <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} placeholder="Private note about this contractor..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy" />
          <div className="mt-2 flex justify-end">
            <button onClick={handleAddAdminNote} disabled={savingNote || !adminNote.trim()}
              className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {savingNote ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
