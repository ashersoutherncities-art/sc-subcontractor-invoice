"use client";

import { ChangeEvent, useMemo, useState } from "react";

type InvoiceTemplate = "builder" | "studio" | "executive";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type InvoiceState = {
  logoDataUrl: string;
  accentColor: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subcontractorName: string;
  subcontractorEmail: string;
  subcontractorPhone: string;
  subcontractorAddress: string;
  subcontractorLicense: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectName: string;
  projectAddress: string;
  taxPercent: number;
  depositAmount: number;
  notes: string;
  template: InvoiceTemplate;
};

const today = new Date().toISOString().split("T")[0];
const due = new Date();
due.setDate(due.getDate() + 14);
const defaultDue = due.toISOString().split("T")[0];

const initialState: InvoiceState = {
  logoDataUrl: "",
  accentColor: "#c96a2b",
  invoiceNumber: "INV-2026-0413",
  issueDate: today,
  dueDate: defaultDue,
  subcontractorName: "Oakline Finish Carpentry",
  subcontractorEmail: "hello@oaklineco.com",
  subcontractorPhone: "(704) 555-0198",
  subcontractorAddress: "1720 Trade Yard Rd, Concord, NC 28025",
  subcontractorLicense: "NC License 18422",
  clientName: "Darius Ashborn",
  clientCompany: "Southern Cities Construction LLC",
  clientEmail: "ap@southerncitiesconstruction.com",
  projectName: "Elm Street Renovation",
  projectAddress: "214 Elm Street, Kannapolis, NC 28081",
  taxPercent: 7.5,
  depositAmount: 500,
  notes: "Thank you for the opportunity to support this project. Please include the invoice number with ACH, check, or Zelle payment.",
  template: "builder",
};

const templates: {
  id: InvoiceTemplate;
  name: string;
  description: string;
  accent: string;
}[] = [
  {
    id: "builder",
    name: "Builder Classic",
    description: "Warm construction-forward styling with a bold top band and practical layout.",
    accent: "#c96a2b",
  },
  {
    id: "studio",
    name: "Studio Slate",
    description: "Deep slate header, editorial spacing, and a modern card-based presentation.",
    accent: "#325d79",
  },
  {
    id: "executive",
    name: "Executive Ledger",
    description: "Minimal monochrome framing with refined dividers for a formal client-facing look.",
    accent: "#1f2937",
  },
];

const sampleItems: LineItem[] = [
  { id: crypto.randomUUID(), description: "Interior trim installation, first floor", quantity: 1, unitPrice: 1850 },
  { id: crypto.randomUUID(), description: "Door casing and baseboard material package", quantity: 24, unitPrice: 42 },
  { id: crypto.randomUUID(), description: "Punch list adjustments and final site cleanup", quantity: 6, unitPrice: 95 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function formatDisplayDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function makeInvoiceNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `INV-${stamp}-${Math.floor(100 + Math.random() * 900)}`;
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="section-head">
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export default function InvoiceStudio() {
  const [invoice, setInvoice] = useState<InvoiceState>(initialState);
  const [lineItems, setLineItems] = useState<LineItem[]>(sampleItems);

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [lineItems]);
  const taxAmount = subtotal * (invoice.taxPercent / 100);
  const total = subtotal + taxAmount;
  const balanceDue = Math.max(total - invoice.depositAmount, 0);
  const activeTemplate = templates.find((template) => template.id === invoice.template) ?? templates[0];

  function updateField<K extends keyof InvoiceState>(key: K, value: InvoiceState[K]) {
    setInvoice((current) => ({ ...current, [key]: value }));
  }

  function updateItem(id: string, key: keyof LineItem, value: string | number) {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addItem() {
    setLineItems((current) => [
      ...current,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(id: string) {
    setLineItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField("logoDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    updateField("logoDataUrl", "");
  }

  function resetDemo() {
    setInvoice({ ...initialState, invoiceNumber: makeInvoiceNumber() });
    setLineItems(sampleItems.map((item) => ({ ...item, id: crypto.randomUUID() })));
  }

  function selectTemplate(templateId: InvoiceTemplate) {
    const template = templates.find((entry) => entry.id === templateId);
    setInvoice((current) => ({
      ...current,
      template: templateId,
      accentColor: template?.accent ?? current.accentColor,
    }));
  }

  return (
    <main className="invoice-app-shell">
      <section className="hero-band">
        <div>
          <span className="pill">Subcontractor invoice generator</span>
          <h1>Build a clean invoice, brand it fast, print it with confidence.</h1>
          <p>
            Upload your logo, drop in project details, adjust tax and deposits, and hand over a polished invoice preview that is ready for PDF export or paper.
          </p>
        </div>
        <div className="hero-actions no-print">
          <button className="btn btn-ghost" onClick={resetDemo}>Load fresh sample</button>
          <button className="btn btn-primary" onClick={() => window.print()}>Print or save PDF</button>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="editor-panel no-print">
          <div className="panel-card">
            <SectionTitle eyebrow="Style" title="Invoice template" body="Pick the overall invoice look. The live preview updates instantly and stays ready for print or PDF." />
            <div className="template-picker" role="radiogroup" aria-label="Invoice template picker">
              {templates.map((template) => {
                const isActive = template.id === invoice.template;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-option${isActive ? " is-active" : ""}`}
                    onClick={() => selectTemplate(template.id)}
                    aria-pressed={isActive}
                  >
                    <span className="template-option-chip" style={{ background: template.accent }} />
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel-card">
            <SectionTitle eyebrow="Brand" title="Company setup" body="Set the identity clients will see at the top of every invoice." />
            <div className="form-grid two-col compact-grid">
              <div className="field field-full">
                <label>Company logo</label>
                <div className="upload-row">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  {invoice.logoDataUrl && <button className="text-link" onClick={clearLogo}>Remove</button>}
                </div>
              </div>
              <div>
                <label>Accent color</label>
                <div className="color-input-wrap">
                  <input type="color" value={invoice.accentColor} onChange={(e) => updateField("accentColor", e.target.value)} />
                  <input value={invoice.accentColor} onChange={(e) => updateField("accentColor", e.target.value)} />
                </div>
              </div>
              <div>
                <label>Invoice number</label>
                <input value={invoice.invoiceNumber} onChange={(e) => updateField("invoiceNumber", e.target.value)} />
              </div>
              <div>
                <label>Subcontractor / company</label>
                <input value={invoice.subcontractorName} onChange={(e) => updateField("subcontractorName", e.target.value)} />
              </div>
              <div>
                <label>Email</label>
                <input value={invoice.subcontractorEmail} onChange={(e) => updateField("subcontractorEmail", e.target.value)} />
              </div>
              <div>
                <label>Phone</label>
                <input value={invoice.subcontractorPhone} onChange={(e) => updateField("subcontractorPhone", e.target.value)} />
              </div>
              <div>
                <label>License / trade ID</label>
                <input value={invoice.subcontractorLicense} onChange={(e) => updateField("subcontractorLicense", e.target.value)} />
              </div>
              <div className="field field-full">
                <label>Business address</label>
                <textarea rows={3} value={invoice.subcontractorAddress} onChange={(e) => updateField("subcontractorAddress", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="panel-card">
            <SectionTitle eyebrow="Billing" title="Client and project" body="Capture who gets billed, what job this belongs to, and when payment is due." />
            <div className="form-grid two-col compact-grid">
              <div>
                <label>Client name</label>
                <input value={invoice.clientName} onChange={(e) => updateField("clientName", e.target.value)} />
              </div>
              <div>
                <label>Client company</label>
                <input value={invoice.clientCompany} onChange={(e) => updateField("clientCompany", e.target.value)} />
              </div>
              <div>
                <label>Client email</label>
                <input value={invoice.clientEmail} onChange={(e) => updateField("clientEmail", e.target.value)} />
              </div>
              <div>
                <label>Project name</label>
                <input value={invoice.projectName} onChange={(e) => updateField("projectName", e.target.value)} />
              </div>
              <div>
                <label>Issue date</label>
                <input type="date" value={invoice.issueDate} onChange={(e) => updateField("issueDate", e.target.value)} />
              </div>
              <div>
                <label>Due date</label>
                <input type="date" value={invoice.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} />
              </div>
              <div className="field field-full">
                <label>Project address</label>
                <textarea rows={3} value={invoice.projectAddress} onChange={(e) => updateField("projectAddress", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="panel-card">
            <SectionTitle eyebrow="Scope" title="Line items" body="List services, materials, or labor with quantities and unit pricing." />
            <div className="line-items-stack">
              {lineItems.map((item, index) => (
                <div className="line-item-card" key={item.id}>
                  <div className="line-item-head">
                    <strong>Item {index + 1}</strong>
                    <button className="text-link" onClick={() => removeItem(item.id)} disabled={lineItems.length === 1}>Remove</button>
                  </div>
                  <div className="form-grid line-grid">
                    <div className="field field-full">
                      <label>Description</label>
                      <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                    </div>
                    <div>
                      <label>Qty</label>
                      <input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} />
                    </div>
                    <div>
                      <label>Unit price</label>
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} />
                    </div>
                    <div>
                      <label>Line total</label>
                      <div className="readonly-pill">{formatCurrency(item.quantity * item.unitPrice)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost full-width" onClick={addItem}>Add line item</button>
          </div>

          <div className="panel-card">
            <SectionTitle eyebrow="Totals" title="Payment details" body="Adjust tax, deposits, and any notes that should appear on the final invoice." />
            <div className="form-grid two-col compact-grid">
              <div>
                <label>Tax %</label>
                <input type="number" min="0" step="0.01" value={invoice.taxPercent} onChange={(e) => updateField("taxPercent", Number(e.target.value))} />
              </div>
              <div>
                <label>Deposit / amount already paid</label>
                <input type="number" min="0" step="0.01" value={invoice.depositAmount} onChange={(e) => updateField("depositAmount", Number(e.target.value))} />
              </div>
              <div className="field field-full">
                <label>Notes / payment instructions</label>
                <textarea rows={4} value={invoice.notes} onChange={(e) => updateField("notes", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="preview-column print-full">
          <div className="summary-strip no-print">
            <div><span>Template</span><strong>{activeTemplate.name}</strong></div>
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Balance due</span><strong>{formatCurrency(balanceDue)}</strong></div>
          </div>

          <article className={`invoice-sheet invoice-template-${invoice.template}`} style={{ ["--invoice-accent" as string]: invoice.accentColor }}>
            <div className="invoice-topbar" />
            <header className="invoice-header">
              <div className="brand-lockup">
                {invoice.logoDataUrl ? (
                  <img src={invoice.logoDataUrl} alt="Company logo" className="brand-logo" />
                ) : (
                  <div className="brand-mark">SC</div>
                )}
                <div>
                  <div className="invoice-label">Invoice</div>
                  <h2>{invoice.subcontractorName || "Your company name"}</h2>
                  <p>{invoice.subcontractorAddress || "Business address"}</p>
                  <p>{invoice.subcontractorPhone || "Phone"} • {invoice.subcontractorEmail || "Email"}</p>
                  <p>{invoice.subcontractorLicense || "License / trade info"}</p>
                </div>
              </div>
              <div className="invoice-meta-card">
                <div><span>Invoice #</span><strong>{invoice.invoiceNumber}</strong></div>
                <div><span>Issued</span><strong>{formatDisplayDate(invoice.issueDate)}</strong></div>
                <div><span>Due</span><strong>{formatDisplayDate(invoice.dueDate)}</strong></div>
                <div><span>Balance due</span><strong>{formatCurrency(balanceDue)}</strong></div>
              </div>
            </header>

            <section className="invoice-subgrid">
              <div>
                <span className="mini-label">Bill to</span>
                <h3>{invoice.clientName || "Client name"}</h3>
                <p>{invoice.clientCompany || "Client company"}</p>
                <p>{invoice.clientEmail || "Client email"}</p>
              </div>
              <div>
                <span className="mini-label">Project</span>
                <h3>{invoice.projectName || "Project name"}</h3>
                <p>{invoice.projectAddress || "Project address"}</p>
              </div>
            </section>

            <section>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description || "Line item description"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="invoice-bottom-grid">
              <div className="notes-card">
                <span className="mini-label">Notes</span>
                <p>{invoice.notes || "Add payment instructions, scheduling notes, or warranty details here."}</p>
              </div>
              <div className="totals-card">
                <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                <div><span>Tax ({invoice.taxPercent.toFixed(2)}%)</span><strong>{formatCurrency(taxAmount)}</strong></div>
                <div><span>Deposit paid</span><strong>- {formatCurrency(invoice.depositAmount)}</strong></div>
                <div className="grand-total"><span>Balance due</span><strong>{formatCurrency(balanceDue)}</strong></div>
              </div>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}
