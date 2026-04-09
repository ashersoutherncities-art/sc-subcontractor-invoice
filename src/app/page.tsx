"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Contractor {
  id: number;
  company_name: string;
  rep_name: string;
  tax_id: string | null;
  label: string | null;
  last_invoice_date: string | null;
  total_paid: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;
  return (
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      background: `hsl(${hue}, 40%, 88%)`,
      color: `hsl(${hue}, 50%, 30%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
      letterSpacing: "0.04em",
    }}>
      {initials}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ company_name: "", rep_name: "", tax_id: "", label: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchContractors() {
    try {
      const res = await fetch("/api/contractors");
      if (!res.ok) throw new Error();
      setContractors(await res.json());
    } catch {
      setError("Failed to load contractors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchContractors(); }, []);

  const filtered = contractors.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.rep_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = contractors.reduce((sum, c) => sum + (c.total_paid || 0), 0);

  async function handleAddContractor(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.company_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      setFormData({ company_name: "", rep_name: "", tax_id: "", label: "" });
      await fetchContractors();
    } catch {
      setError("Failed to add contractor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: 0 }}>
            Contractor Directory
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {loading ? "Loading..." : `${contractors.length} contractor${contractors.length !== 1 ? "s" : ""} on record`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add Contractor
          </button>
          <Link href="/invoice/new" className="btn-navy" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            New Invoice
          </Link>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Total Contractors
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)", lineHeight: 1 }}>
              {loading ? "—" : contractors.length}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Total Disbursed
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)", lineHeight: 1 }}>
              {loading ? "—" : formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Active This Month
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)", lineHeight: 1 }}>
              {loading ? "—" : contractors.filter((c) => {
                if (!c.last_invoice_date) return false;
                const d = new Date(c.last_invoice_date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search contractors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 34 }}
            />
          </div>
          {search && (
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="card">
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              Loading contractors...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              {search ? "No contractors match your search." : "No contractors yet. Create your first invoice to get started."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Last Invoice</th>
                    <th style={{ textAlign: "right" }}>Total Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} onClick={() => router.push(`/contractor/${c.id}`)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <InitialsAvatar name={c.company_name} />
                          <span style={{ fontWeight: 600, color: "var(--navy)" }}>{c.company_name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.rep_name || "—"}</td>
                      <td>
                        {c.label ? (
                          <span style={{
                            display: "inline-block",
                            background: "rgba(250,140,65,0.1)",
                            color: "#c05e18",
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: "2px 10px",
                            borderRadius: 20,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}>{c.label}</span>
                        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatDate(c.last_invoice_date)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(c.total_paid || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Contractor Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
        }}>
          <div style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", margin: 0 }}>Add Contractor</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddContractor} style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input type="text" required value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="form-input" placeholder="e.g. Apex Electrical LLC" />
                </div>
                <div>
                  <label className="form-label">Rep Name</label>
                  <input type="text" value={formData.rep_name}
                    onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })}
                    className="form-input" placeholder="First Last" />
                </div>
                <div>
                  <label className="form-label">Tax ID (EIN)</label>
                  <input type="text" value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="form-input" placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <label className="form-label">Payment Type</label>
                  <input type="text" value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="form-input" placeholder="Wire / Zelle / Venmo / Check" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding..." : "Add Contractor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
