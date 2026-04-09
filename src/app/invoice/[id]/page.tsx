"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ChangeOrder {
  id: number;
  invoice_id: number;
  co_number: string | null;
  description: string | null;
  amount: number;
  approved_date: string | null;
  approved_by: string | null;
  created_at: string;
}

interface Invoice {
  id: number;
  scc_invoice_num: string;
  internal_invoice_num: string | null;
  contractor_id: number;
  invoice_date: string;
  scope_of_work: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  paid_at: string | null;
  company_name: string;
  rep_name: string | null;
  tax_id: string | null;
  contractor_email: string | null;
  wire_bank_name: string | null;
  wire_routing: string | null;
  wire_account: string | null;
  wire_account_type: string | null;
  wire_account_holder: string | null;
  zelle_contact: string | null;
  venmo_handle: string | null;
  items: InvoiceItem[];
  change_orders: ChangeOrder[];
  lien_waiver_path: string | null;
  lien_waiver_type: string | null;
  lien_waiver_date: string | null;
  lien_waiver_override_note: string | null;
  retention_pct: number;
  retention_amount: number;
  retention_released: number;
  retention_released_at: string | null;
  job_id: number | null;
  job_name: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function InvoiceViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  // Lien waiver
  const [showWaiverUpload, setShowWaiverUpload] = useState(false);
  const [waiverType, setWaiverType] = useState("conditional");
  const [waiverDate, setWaiverDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadingWaiver, setUploadingWaiver] = useState(false);

  // Change orders
  const [showAddCO, setShowAddCO] = useState(false);
  const [coForm, setCoForm] = useState({ co_number: "", description: "", amount: "", approved_date: "", approved_by: "" });
  const [savingCO, setSavingCO] = useState(false);

  // Override waiver
  const [showOverride, setShowOverride] = useState(false);
  const [overrideNote, setOverrideNote] = useState("");

  // Rating
  const [showRating, setShowRating] = useState(false);
  const [ratingForm, setRatingForm] = useState({ quality: 0, timeliness: 0, communication: 0, would_hire_again: 0, notes: "" });
  const [savingRating, setSavingRating] = useState(false);

  // Retention
  const [releasingRetention, setReleasingRetention] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const toggleStatus = async () => {
    if (!invoice || toggling) return;

    // Check lien waiver requirement before marking as paid
    if (invoice.status !== "paid") {
      const hasWaiver = invoice.lien_waiver_path;
      const hasOverride = invoice.lien_waiver_override_note;
      if (!hasWaiver && !hasOverride) {
        setShowOverride(true);
        return;
      }
    }

    setToggling(true);
    try {
      const newStatus = invoice.status === "paid" ? "pending" : "paid";
      const body: Record<string, string | null> = { status: newStatus };
      if (newStatus === "paid") {
        body.paid_at = new Date().toISOString();
      } else {
        body.paid_at = null;
      }
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchInvoice();

      // Show rating prompt after marking as paid
      if (newStatus === "paid") {
        setShowRating(true);
      }
    } catch {
      setError("Failed to update invoice status");
    } finally {
      setToggling(false);
    }
  };

  const handleOverrideAndPay = async () => {
    if (!overrideNote.trim()) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paid_at: new Date().toISOString(),
          lien_waiver_override_note: overrideNote,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setShowOverride(false);
      setOverrideNote("");
      await fetchInvoice();
      setShowRating(true);
    } catch {
      setError("Failed to update invoice status");
    } finally {
      setToggling(false);
    }
  };

  const handleWaiverUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput?.files?.[0]) return;

    setUploadingWaiver(true);
    try {
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      formData.append("waiver_type", waiverType);
      formData.append("waiver_date", waiverDate);

      const res = await fetch(`/api/invoices/${id}/lien-waiver`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload");
      setShowWaiverUpload(false);
      await fetchInvoice();
    } catch {
      setError("Failed to upload lien waiver");
    } finally {
      setUploadingWaiver(false);
    }
  };

  const handleAddCO = async () => {
    if (!coForm.description.trim()) return;
    setSavingCO(true);
    try {
      const res = await fetch("/api/change-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...coForm, invoice_id: parseInt(id), amount: parseFloat(coForm.amount) || 0 }),
      });
      if (!res.ok) throw new Error("Failed to add change order");
      setCoForm({ co_number: "", description: "", amount: "", approved_date: "", approved_by: "" });
      setShowAddCO(false);
      await fetchInvoice();
    } catch {
      setError("Failed to add change order");
    } finally {
      setSavingCO(false);
    }
  };

  const handleDeleteCO = async (coId: number) => {
    try {
      await fetch(`/api/change-orders/${coId}`, { method: "DELETE" });
      await fetchInvoice();
    } catch { /* silent */ }
  };

  const handleReleaseRetention = async () => {
    setReleasingRetention(true);
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retention_released: 1, retention_released_at: new Date().toISOString() }),
      });
      await fetchInvoice();
    } catch {
      setError("Failed to release retention");
    } finally {
      setReleasingRetention(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!invoice) return;
    setSavingRating(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: invoice.contractor_id,
          invoice_id: invoice.id,
          ...ratingForm,
        }),
      });
      setShowRating(false);
      setRatingForm({ quality: 0, timeliness: 0, communication: 0, would_hire_again: 0, notes: "" });
    } catch { /* silent */ }
    finally { setSavingRating(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg">{error || "Invoice not found"}</p>
        <Link href="/invoices" className="text-navy underline">Back to Invoices</Link>
      </div>
    );
  }

  const hasWire = invoice.wire_bank_name || invoice.wire_routing || invoice.wire_account;
  const hasZelle = invoice.zelle_contact;
  const hasVenmo = invoice.venmo_handle;
  const hasPaymentInfo = hasWire || hasZelle || hasVenmo;
  const netDue = invoice.total - (invoice.retention_amount || 0);
  const coTotal = (invoice.change_orders || []).reduce((s, co) => s + co.amount, 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Rating Modal */}
      {showRating && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 32, maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#132452", marginBottom: 4 }}>Rate this Contractor</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Optional -- you can skip this step</p>
            {(["quality", "timeliness", "communication", "would_hire_again"] as const).map((field) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  {field === "would_hire_again" ? "Would Hire Again" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRatingForm((p) => ({ ...p, [field]: n }))}
                      style={{
                        width: 32, height: 32, border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer",
                        background: ratingForm[field] >= n ? "#fa8c41" : "white",
                        color: ratingForm[field] >= n ? "white" : "#9ca3af",
                        fontWeight: 700, fontSize: 14,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Notes</label>
              <textarea
                value={ratingForm.notes}
                onChange={(e) => setRatingForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="form-input"
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowRating(false)} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6, background: "white", cursor: "pointer" }}>
                Skip
              </button>
              <button onClick={handleSubmitRating} disabled={savingRating} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, background: "#132452", color: "white", border: "none", cursor: "pointer", fontWeight: 600, opacity: savingRating ? 0.5 : 1 }}>
                {savingRating ? "Saving..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverride && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 32, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#132452", marginBottom: 8 }}>Lien Waiver Required</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              This invoice has no lien waiver on file. Upload a waiver or provide an override note to proceed.
            </p>
            <textarea
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              placeholder="Reason for waiver override..."
              rows={3}
              className="form-input"
              style={{ width: "100%", marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowOverride(false); setOverrideNote(""); }} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6, background: "white", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => { setShowOverride(false); setShowWaiverUpload(true); }} style={{ padding: "8px 16px", fontSize: 13, border: "1px solid #132452", borderRadius: 6, background: "white", color: "#132452", cursor: "pointer", fontWeight: 600 }}>
                Upload Waiver
              </button>
              <button onClick={handleOverrideAndPay} disabled={!overrideNote.trim() || toggling} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, background: "#059669", color: "white", border: "none", cursor: "pointer", fontWeight: 600, opacity: !overrideNote.trim() || toggling ? 0.5 : 1 }}>
                Override and Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex flex-wrap items-center gap-3">
        <Link href="/invoices" className="px-4 py-2 text-sm font-medium text-navy border border-navy rounded hover:bg-navy hover:text-white transition-colors">
          Back to Invoices
        </Link>
        <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-white bg-navy rounded hover:bg-navy/90 transition-colors">
          Print Invoice
        </button>
        <button
          onClick={toggleStatus}
          disabled={toggling}
          className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50 ${
            invoice.status === "paid" ? "bg-orange hover:bg-orange/90" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {toggling ? "Updating..." : invoice.status === "paid" ? "Mark as Pending" : "Mark as Paid"}
        </button>
        {invoice.job_name && (
          <Link href={`/job/${invoice.job_id}`} className="px-4 py-2 text-sm font-medium text-navy border border-navy/30 rounded hover:bg-navy/5 transition-colors" style={{ textDecoration: "none" }}>
            Job: {invoice.job_name}
          </Link>
        )}
      </div>

      {/* Invoice Container */}
      <div className="print-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-navy text-white px-8 py-6">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold tracking-tight">Southern Cities Construction LLC</h1>
            <span className="text-2xl font-bold tracking-widest opacity-80">INVOICE</span>
          </div>
          <div className="mt-3 flex gap-8 text-sm text-white/80">
            <div><span className="font-semibold text-white">SCC Invoice #:</span> {invoice.scc_invoice_num}</div>
            <div><span className="font-semibold text-white">Invoice Date:</span> {formatDate(invoice.invoice_date)}</div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Bill From / Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bill From</h2>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-900">{invoice.company_name}</p>
                {invoice.rep_name && <p className="text-gray-600">{invoice.rep_name}</p>}
                {invoice.tax_id && <p className="text-gray-600">Tax ID: {invoice.tax_id}</p>}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bill To</h2>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-900">Southern Cities Construction LLC</p>
                <p className="text-gray-600">806 Green Valley Rd STE 200</p>
                <p className="text-gray-600">Greensboro, NC 27408</p>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          {invoice.scope_of_work && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Scope of Work</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.scope_of_work}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="py-2 px-3 text-left font-semibold w-12">#</th>
                  <th className="py-2 px-3 text-left font-semibold">Description</th>
                  <th className="py-2 px-3 text-right font-semibold w-20">Qty</th>
                  <th className="py-2 px-3 text-right font-semibold w-28">Unit Price</th>
                  <th className="py-2 px-3 text-right font-semibold w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-2 px-3 text-gray-500">{index + 1}</td>
                    <td className="py-2 px-3 text-gray-800">{item.description}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 px-3 text-right text-gray-800 font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                {invoice.items.length === 0 && (
                  <tr><td colSpan={5} className="py-4 px-3 text-center text-gray-400">No line items</td></tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                    <span className="text-gray-800">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {coTotal !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Change Orders</span>
                    <span className={coTotal >= 0 ? "text-green-700" : "text-red-600"}>
                      {coTotal >= 0 ? "+" : ""}{formatCurrency(coTotal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-base font-bold text-gray-900">Contract Amount</span>
                  <span className="text-base font-bold text-navy">{formatCurrency(invoice.total)}</span>
                </div>
                {(invoice.retention_pct || 0) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Retention Held ({invoice.retention_pct}%)</span>
                      <span className="text-red-600">-{formatCurrency(invoice.retention_amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-lg font-bold text-gray-900">Net Due</span>
                      <span className="text-lg font-bold text-navy">{formatCurrency(netDue)}</span>
                    </div>
                  </>
                )}
                {!(invoice.retention_pct > 0) && (
                  <div className="flex justify-between border-t border-gray-200 pt-2" style={{ marginTop: -8 }}>
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-lg font-bold text-navy">{formatCurrency(invoice.total)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Retention Status */}
          {(invoice.retention_pct || 0) > 0 && (
            <div className="no-print">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Retention</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p><span className="text-gray-500">Retention:</span> <span className="font-medium">{formatCurrency(invoice.retention_amount)} ({invoice.retention_pct}%)</span></p>
                    <p className="mt-1">
                      <span className="text-gray-500">Status:</span>{" "}
                      {invoice.retention_released ? (
                        <span className="text-green-700 font-medium">Released</span>
                      ) : (
                        <span className="text-orange font-medium">Held</span>
                      )}
                    </p>
                  </div>
                  {!invoice.retention_released && (
                    <button
                      onClick={handleReleaseRetention}
                      disabled={releasingRetention}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {releasingRetention ? "Releasing..." : "Release Retention"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lien Waiver Section */}
          <div className="no-print">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Lien Waiver</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              {invoice.lien_waiver_path ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-green-700">Waiver on file</p>
                    <p className="text-gray-500 mt-1">
                      Type: {invoice.lien_waiver_type === "conditional" ? "Conditional Waiver on Progress Payment" : "Unconditional Waiver on Final Payment"}
                    </p>
                    {invoice.lien_waiver_date && <p className="text-gray-500">Date: {formatDate(invoice.lien_waiver_date)}</p>}
                  </div>
                  <button onClick={() => setShowWaiverUpload(true)} className="text-sm text-navy font-medium hover:underline">
                    Replace
                  </button>
                </div>
              ) : invoice.lien_waiver_override_note ? (
                <div className="text-sm">
                  <p className="font-medium text-orange">Waiver override</p>
                  <p className="text-gray-500 mt-1">Note: {invoice.lien_waiver_override_note}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">No lien waiver uploaded</p>
                  <button onClick={() => setShowWaiverUpload(true)} className="text-sm text-navy font-medium hover:underline">
                    Upload Waiver
                  </button>
                </div>
              )}

              {showWaiverUpload && (
                <form onSubmit={handleWaiverUpload} className="mt-4 border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waiver Type</label>
                    <select value={waiverType} onChange={(e) => setWaiverType(e.target.value)} className="form-input" style={{ width: "auto" }}>
                      <option value="conditional">Conditional Waiver on Progress Payment</option>
                      <option value="unconditional">Unconditional Waiver on Final Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waiver Date</label>
                    <input type="date" value={waiverDate} onChange={(e) => setWaiverDate(e.target.value)} className="form-input" style={{ width: "auto" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF or image)</label>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={uploadingWaiver} className="px-4 py-2 text-sm font-medium text-white bg-navy rounded hover:bg-navy/90 disabled:opacity-50">
                      {uploadingWaiver ? "Uploading..." : "Upload"}
                    </button>
                    <button type="button" onClick={() => setShowWaiverUpload(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Change Orders Section */}
          <div className="no-print">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Change Orders</h2>
              <button onClick={() => setShowAddCO(!showAddCO)} className="text-sm text-navy font-medium hover:underline">
                {showAddCO ? "Cancel" : "+ Add Change Order"}
              </button>
            </div>

            {showAddCO && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CO #</label>
                    <input type="text" value={coForm.co_number} onChange={(e) => setCoForm({ ...coForm, co_number: e.target.value })} className="form-input" placeholder="CO-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (+/-)</label>
                    <input type="number" step="0.01" value={coForm.amount} onChange={(e) => setCoForm({ ...coForm, amount: e.target.value })} className="form-input" placeholder="0.00" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={coForm.description} onChange={(e) => setCoForm({ ...coForm, description: e.target.value })} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                    <input type="date" value={coForm.approved_date} onChange={(e) => setCoForm({ ...coForm, approved_date: e.target.value })} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                    <input type="text" value={coForm.approved_by} onChange={(e) => setCoForm({ ...coForm, approved_by: e.target.value })} className="form-input" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={handleAddCO} disabled={savingCO || !coForm.description.trim()} className="px-4 py-2 text-sm font-medium text-white bg-navy rounded hover:bg-navy/90 disabled:opacity-50">
                    {savingCO ? "Adding..." : "Add Change Order"}
                  </button>
                </div>
              </div>
            )}

            {invoice.change_orders && invoice.change_orders.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-600">CO #</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600">Amount</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Approved</th>
                      <th className="px-3 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.change_orders.map((co) => (
                      <tr key={co.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-navy">{co.co_number || "--"}</td>
                        <td className="px-3 py-2 text-gray-700">{co.description || "--"}</td>
                        <td className={`px-3 py-2 text-right font-medium ${co.amount >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {co.amount >= 0 ? "+" : ""}{formatCurrency(co.amount)}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{co.approved_by || "--"}{co.approved_date ? ` (${co.approved_date})` : ""}</td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => handleDeleteCO(co.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-400 text-center">No change orders</div>
            )}
          </div>

          {/* Payment Information */}
          {hasPaymentInfo && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Payment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hasWire && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase text-navy mb-2">Wire Transfer</h3>
                    <div className="text-sm space-y-1">
                      {invoice.wire_bank_name && <p><span className="text-gray-500">Bank:</span> <span className="text-gray-800">{invoice.wire_bank_name}</span></p>}
                      {invoice.wire_routing && <p><span className="text-gray-500">Routing:</span> <span className="text-gray-800">{invoice.wire_routing}</span></p>}
                      {invoice.wire_account && <p><span className="text-gray-500">Account:</span> <span className="text-gray-800">{invoice.wire_account}</span></p>}
                      {invoice.wire_account_type && <p><span className="text-gray-500">Type:</span> <span className="text-gray-800">{invoice.wire_account_type}</span></p>}
                      {invoice.wire_account_holder && <p><span className="text-gray-500">Holder:</span> <span className="text-gray-800">{invoice.wire_account_holder}</span></p>}
                    </div>
                  </div>
                )}
                {hasZelle && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase text-navy mb-2">Zelle</h3>
                    <p className="text-sm text-gray-800">{invoice.zelle_contact}</p>
                  </div>
                )}
                {hasVenmo && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-xs font-bold uppercase text-navy mb-2">Venmo</h3>
                    <p className="text-sm text-gray-800">{invoice.venmo_handle}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 italic">Thank you for your work with Southern Cities Construction</p>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                invoice.status === "paid"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-orange/10 text-orange border border-orange/30"
              }`}
            >
              {invoice.status === "paid" ? "PAID" : "PENDING"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
