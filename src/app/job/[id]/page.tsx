"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface JobInvoice {
  id: number;
  scc_invoice_num: string;
  invoice_date: string;
  total: number;
  status: string;
  company_name: string | null;
  services: string | null;
}

interface Job {
  id: number;
  job_name: string;
  address: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget: number | null;
  total_invoiced: number;
  invoice_count: number;
  invoices: JobInvoice[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.ok) setJob(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>Loading job...</div>;
  }
  if (!job) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "#dc2626", marginBottom: 16 }}>Job not found</p>
        <Link href="/jobs" style={{ color: "var(--navy)", textDecoration: "underline" }}>Back to Jobs</Link>
      </div>
    );
  }

  const pctComplete = job.budget && job.budget > 0 ? Math.min((job.total_invoiced / job.budget) * 100, 100) : 0;

  // Unique contractors
  const contractors = Array.from(new Map(
    job.invoices.filter((i) => i.company_name).map((i) => [i.company_name, i])
  ).values());

  // Spend by trade
  const tradeSpend: Record<string, number> = {};
  for (const inv of job.invoices) {
    let trades: string[] = [];
    if (inv.services) {
      try { trades = JSON.parse(inv.services); } catch { trades = [inv.services]; }
    }
    if (trades.length === 0) trades = ["General"];
    for (const t of trades) {
      tradeSpend[t] = (tradeSpend[t] || 0) + inv.total;
    }
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#dcfce7", text: "#166534" },
    complete: { bg: "#dbeafe", text: "#1e40af" },
    on_hold: { bg: "#fef3c7", text: "#92400e" },
  };
  const sc = statusColors[job.status] || statusColors.active;

  return (
    <>
      <div className="page-header">
        <div>
          <Link href="/jobs" style={{ fontSize: 13, color: "var(--navy)", textDecoration: "none", fontWeight: 500 }}>
            &larr; Back to Jobs
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: "4px 0 0" }}>{job.job_name}</h1>
          {job.address && <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>{job.address}</p>}
        </div>
        <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text }}>
          {job.status}
        </span>
      </div>

      <div className="page-body">
        {job.description && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{job.description}</p>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Budget</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{job.budget ? formatCurrency(job.budget) : "--"}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Invoiced</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: job.budget && job.total_invoiced > job.budget ? "#dc2626" : "#059669", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(job.total_invoiced)}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>% Complete</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)" }}>{pctComplete.toFixed(1)}%</div>
            {job.budget && job.budget > 0 && (
              <div style={{ marginTop: 8, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pctComplete}%`, background: pctComplete > 90 ? "#dc2626" : "var(--orange)", borderRadius: 3, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Invoices</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)" }}>{job.invoice_count}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Contractors */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>Contractors</h3>
            {contractors.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No contractors yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {contractors.map((c) => (
                  <span key={c.company_name} style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {c.company_name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Spend by Trade */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>Spend by Trade</h3>
            {Object.keys(tradeSpend).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No data yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(tradeSpend).sort((a, b) => b[1] - a[1]).map(([trade, amount]) => (
                  <div key={trade} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{trade}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 32, fontSize: 13 }}>
            <div><span style={{ color: "var(--text-muted)" }}>Start: </span><span style={{ fontWeight: 500 }}>{formatDate(job.start_date)}</span></div>
            <div><span style={{ color: "var(--text-muted)" }}>End: </span><span style={{ fontWeight: 500 }}>{formatDate(job.end_date)}</span></div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: 0 }}>Job Invoices</h3>
          </div>
          {job.invoices.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No invoices linked to this job yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Contractor</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {job.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link href={`/invoice/${inv.id}`} style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--navy)", textDecoration: "none" }}>
                          {inv.scc_invoice_num}
                        </Link>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{inv.company_name || "--"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatDate(inv.invoice_date)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(inv.total)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={inv.status === "paid" ? "badge badge-paid" : "badge badge-pending"}>
                          {inv.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
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
