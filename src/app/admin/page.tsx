"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: number;
  company_name: string;
  rep_name: string;
  services: string;
  submitted_at: string;
  status: string;
  business_type: string;
  direct_email: string;
  business_email: string;
}

interface ExpiringContractor {
  contractor_id: number;
  company_name: string;
  rep_name: string;
  gl_expiry: string | null;
  wc_expiry: string | null;
  auto_expiry: string | null;
  umbrella_expiry: string | null;
}

function parseServices(services: string): string[] {
  try {
    const p = JSON.parse(services);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function getExpiryBadge(expiryStr: string | null): { label: string; bg: string; text: string } | null {
  if (!expiryStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryStr + "T00:00:00");
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", bg: "#fee2e2", text: "#991b1b" };
  if (diffDays < 60) return { label: `${diffDays}d`, bg: "#fef3c7", text: "#92400e" };
  return null;
}

type StatusKey = "pending" | "under_review" | "approved" | "rejected" | "more_info" | "more_info_requested";

const statusConfig: Record<StatusKey, { label: string; className: string }> = {
  pending:              { label: "Pending",              className: "badge badge-pending" },
  under_review:         { label: "Under Review",         className: "badge badge-review" },
  approved:             { label: "Approved",             className: "badge badge-approved" },
  rejected:             { label: "Rejected",             className: "badge badge-rejected" },
  more_info:            { label: "More Info",            className: "badge badge-moreinfo" },
  more_info_requested:  { label: "More Info Requested",  className: "badge badge-moreinfo" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as StatusKey] ?? { label: status, className: "badge" };
  return <span className={cfg.className}>{cfg.label}</span>;
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expiringInsurance, setExpiringInsurance] = useState<ExpiringContractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/applications").then((r) => r.json()).then((d) => setApplications(Array.isArray(d) ? d : [])).catch(() => setApplications([])),
      fetch("/api/insurance").then((r) => r.json()).then((d) => setExpiringInsurance(Array.isArray(d) ? d : [])).catch(() => setExpiringInsurance([])),
    ]).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const thisMonth = applications.filter((a) => {
    const d = new Date(a.submitted_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const filtered = applications.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSearch = !search.trim() || a.company_name.toLowerCase().includes(search.trim().toLowerCase());
    return matchStatus && matchSearch;
  });

  const pending = applications.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const approved = applications.filter((a) => a.status === "approved").length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>Vendor applications and contractor network</p>
        </div>
        <Link href="/apply" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Application
        </Link>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Applications", value: applications.length, color: "var(--navy)" },
            { label: "Pending Review", value: pending, color: "#d97706" },
            { label: "Approved", value: approved, color: "#059669" },
            { label: "This Month", value: thisMonth, color: "#2563eb" },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{loading ? "--" : value}</div>
            </div>
          ))}
        </div>

        {/* Expiring Insurance Alert */}
        {expiringInsurance.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: "4px solid #d97706" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>
              Expiring Insurance -- {expiringInsurance.length} contractor{expiringInsurance.length !== 1 ? "s" : ""}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th style={{ textAlign: "center" }}>GL</th>
                    <th style={{ textAlign: "center" }}>WC</th>
                    <th style={{ textAlign: "center" }}>Auto</th>
                    <th style={{ textAlign: "center" }}>Umbrella</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringInsurance.map((c) => (
                    <tr key={c.contractor_id}>
                      <td>
                        <Link href={`/contractor/${c.contractor_id}`} style={{ fontWeight: 600, color: "var(--navy)", textDecoration: "none" }}>
                          {c.company_name}
                        </Link>
                      </td>
                      {([c.gl_expiry, c.wc_expiry, c.auto_expiry, c.umbrella_expiry] as (string | null)[]).map((exp, i) => {
                        const badge = getExpiryBadge(exp);
                        return (
                          <td key={i} style={{ textAlign: "center" }}>
                            {badge ? (
                              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.text }}>
                                {badge.label}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>OK</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input" style={{ width: "auto", minWidth: 150 }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="more_info_requested">More Info Requested</option>
          </select>
          <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
            <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search by company..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input" style={{ paddingLeft: 32 }} />
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              No applications found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Company</th>
                    <th>Trade(s)</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => {
                    const services = parseServices(app.services);
                    const visible = services.slice(0, 2);
                    const extra = services.length - visible.length;
                    return (
                      <tr key={app.id}>
                        <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--navy)", lineHeight: 1.3 }}>{app.company_name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{app.rep_name}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {visible.map((s) => (
                              <span key={s} style={{
                                background: "#f1f5f9", color: "var(--text-secondary)",
                                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                              }}>{s}</span>
                            ))}
                            {extra > 0 && (
                              <span style={{
                                background: "#f1f5f9", color: "var(--text-muted)",
                                fontSize: 11, padding: "2px 8px", borderRadius: 12,
                              }}>+{extra}</span>
                            )}
                            {services.length === 0 && <span style={{ color: "var(--text-muted)" }}>--</span>}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatDate(app.submitted_at)}</td>
                        <td><StatusBadge status={app.status} /></td>
                        <td>
                          <Link href={`/admin/applications/${app.id}`}
                            style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", textDecoration: "none" }}
                            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            Showing <strong style={{ color: "var(--text-secondary)" }}>{filtered.length}</strong> of{" "}
            <strong style={{ color: "var(--text-secondary)" }}>{applications.length}</strong> application{applications.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}
