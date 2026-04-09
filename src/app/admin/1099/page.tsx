"use client";

import { useEffect, useState } from "react";

interface TaxRow {
  id: number;
  company_name: string;
  tax_id: string | null;
  total_paid: number;
  filed: number | null;
  filed_at: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function Page1099() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<TaxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/1099?year=${year}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [year]);

  async function toggleFiled(row: TaxRow) {
    const newFiled = !row.filed;
    try {
      await fetch("/api/1099", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: row.id,
          tax_year: year,
          filed: newFiled,
          total_paid: row.total_paid,
        }),
      });
      setData((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, filed: newFiled ? 1 : 0, filed_at: newFiled ? new Date().toISOString() : null }
            : r
        )
      );
    } catch { /* silent */ }
  }

  async function handleExport() {
    try {
      const res = await fetch(`/api/1099/export?year=${year}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1099-report-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export CSV");
    }
  }

  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  const total1099 = data.filter((r) => r.total_paid > 600).length;
  const totalFiled = data.filter((r) => r.filed).length;
  const totalPaid = data.reduce((s, r) => s + r.total_paid, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", margin: 0 }}>1099 Preparation</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            Tax year {year} -- {total1099} contractor{total1099 !== 1 ? "s" : ""} requiring 1099
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="form-input" style={{ width: "auto", minWidth: 120 }}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-secondary">Export CSV</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Contractors Paid</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--navy)" }}>{data.length}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>1099 Required</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#d97706" }}>{total1099}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Filed</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#059669" }}>{totalFiled}</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Total Paid</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(totalPaid)}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 8 }}>
          <div style={{ padding: "10px 20px", fontSize: 11, color: "var(--text-muted)", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            1099-NEC threshold: $600. Contractors paid more than $600 in a calendar year require a 1099.
          </div>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No paid contractors found for {year}.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th>EIN / Tax ID</th>
                    <th style={{ textAlign: "right" }}>Total Paid</th>
                    <th style={{ textAlign: "center" }}>1099 Required</th>
                    <th style={{ textAlign: "center" }}>Filed</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const required = row.total_paid > 600;
                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600, color: "var(--navy)" }}>{row.company_name}</td>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text-secondary)" }}>{row.tax_id || "--"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(row.total_paid)}</td>
                        <td style={{ textAlign: "center" }}>
                          {required ? (
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>Yes</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {row.filed ? (
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Filed</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>--</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => toggleFiled(row)}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: row.filed ? "#dc2626" : "#059669",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            {row.filed ? "Unmark" : "Mark as Filed"}
                          </button>
                        </td>
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
