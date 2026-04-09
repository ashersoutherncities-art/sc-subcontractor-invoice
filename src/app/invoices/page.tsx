"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Invoice {
  id: number;
  scc_invoice_num: string;
  company_name: string | null;
  invoice_date: string;
  total: number;
  status: string;
  lien_waiver_path: string | null;
  lien_waiver_override_note: string | null;
  job_name: string | null;
}

interface Contractor {
  id: number;
  company_name: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isPaid = status === "paid";
  return (
    <span className={isPaid ? "badge badge-paid" : "badge badge-pending"}>
      {isPaid ? "Paid" : "Pending"}
    </span>
  );
}

function WaiverBadge({ invoice }: { invoice: Invoice }) {
  if (invoice.lien_waiver_path) {
    return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>On File</span>;
  }
  if (invoice.lien_waiver_override_note) {
    return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>Override</span>;
  }
  return <span style={{ color: "var(--text-muted)", fontSize: 11 }}>--</span>;
}

export default function InvoiceListPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [contractorFilter, setContractorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (contractorFilter) params.set("contractor_id", contractorFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    return params.toString();
  }, [statusFilter, contractorFilter, dateFrom, dateTo]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryString();
      const res = await fetch(`/api/invoices${qs ? `?${qs}` : ""}`);
      if (res.ok) setInvoices(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [buildQueryString]);

  const fetchContractors = useCallback(async () => {
    try {
      const res = await fetch("/api/contractors");
      if (res.ok) setContractors(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);
  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleExportCSV = async () => {
    const qs = buildQueryString();
    try {
      const res = await fetch(`/api/invoices/export${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "invoices.csv";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { alert("Failed to export CSV"); }
  };

  const totalAmount = invoices.reduce((sum, i) => sum + i.total, 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0);
  const pendingCount = invoices.filter((i) => i.status !== "paid").length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: 0 }}>All Invoices</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {loading ? "Loading..." : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleExportCSV} className="btn-secondary">Export CSV</button>
          <button onClick={() => router.push("/invoice/new")} className="btn-primary">+ New Invoice</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Value</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(totalAmount)}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Paid</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(paidAmount)}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Pending</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#c96a18" }}>{pendingCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: "14px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label className="form-label">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ width: "auto", minWidth: 130 }}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="form-label">Contractor</label>
              <select value={contractorFilter} onChange={(e) => setContractorFilter(e.target.value)} className="form-input" style={{ width: "auto", minWidth: 160 }}>
                <option value="">All Contractors</option>
                {contractors.map((c) => (<option key={c.id} value={c.id}>{c.company_name}</option>))}
              </select>
            </div>
            <div>
              <label className="form-label">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" style={{ width: "auto" }} />
            </div>
            <div>
              <label className="form-label">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" style={{ width: "auto" }} />
            </div>
            {(statusFilter || contractorFilter || dateFrom || dateTo) && (
              <button onClick={() => { setStatusFilter(""); setContractorFilter(""); setDateFrom(""); setDateTo(""); }} className="btn-secondary" style={{ padding: "8px 14px" }}>Clear</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No invoices found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Contractor</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "center" }}>Waiver</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} onClick={() => router.push(`/invoice/${inv.id}`)}>
                      <td>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                          {inv.scc_invoice_num}
                        </span>
                        {inv.job_name && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{inv.job_name}</div>}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{inv.company_name || "--"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatDate(inv.invoice_date)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(inv.total)}</td>
                      <td style={{ textAlign: "center" }}><WaiverBadge invoice={inv} /></td>
                      <td style={{ textAlign: "center" }}><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
