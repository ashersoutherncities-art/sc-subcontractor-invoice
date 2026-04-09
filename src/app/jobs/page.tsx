"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#166534" },
  complete: { bg: "#dbeafe", text: "#1e40af" },
  on_hold: { bg: "#fef3c7", text: "#92400e" },
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ job_name: "", address: "", description: "", start_date: "", end_date: "", budget: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.job_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? parseFloat(form.budget) : null,
        }),
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs((prev) => [{ ...newJob, total_invoiced: 0, invoice_count: 0 }, ...prev]);
        setForm({ job_name: "", address: "", description: "", start_date: "", end_date: "", budget: "" });
        setShowForm(false);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: 0 }}>Jobs / Projects</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {loading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ New Job"}
        </button>
      </div>

      <div className="page-body">
        {showForm && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)", marginBottom: 16 }}>Create New Job</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Job Name *</label>
                <input type="text" value={form.job_name} onChange={(e) => setForm({ ...form, job_name: e.target.value })} className="form-input" placeholder="e.g. 123 Main St Renovation" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input" rows={2} />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Budget ($)</label>
                <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="form-input" placeholder="0.00" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCreate} disabled={saving || !form.job_name.trim()} className="btn-primary" style={{ opacity: saving || !form.job_name.trim() ? 0.5 : 1 }}>
                {saving ? "Creating..." : "Create Job"}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Jobs</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)" }}>{jobs.length}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Active</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#059669" }}>{jobs.filter((j) => j.status === "active").length}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Budget</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(jobs.reduce((s, j) => s + (j.budget || 0), 0))}</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No jobs found. Create your first job above.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Name</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Budget</th>
                    <th style={{ textAlign: "right" }}>Invoiced</th>
                    <th style={{ textAlign: "center" }}>Invoices</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const sc = statusColors[job.status] || statusColors.active;
                    return (
                      <tr key={job.id} onClick={() => router.push(`/job/${job.id}`)} style={{ cursor: "pointer" }}>
                        <td><span style={{ fontWeight: 600, color: "var(--navy)" }}>{job.job_name}</span></td>
                        <td style={{ color: "var(--text-secondary)" }}>{job.address || "--"}</td>
                        <td>
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text }}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                          {job.budget ? formatCurrency(job.budget) : "--"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(job.total_invoiced)}
                        </td>
                        <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>{job.invoice_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
