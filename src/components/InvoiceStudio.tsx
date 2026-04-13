"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

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

type SavedProfile = {
  id: number;
  profileName: string;
  companyName: string | null;
  contactName?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  licenseNumber?: string | null;
  accentColor?: string | null;
  logoDataUrl?: string | null;
  sourceType: string | null;
  sourceKey: string | null;
  createdAt: string;
  updatedAt: string;
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

function subcontractorProfileToInvoicePatch(profile: SavedProfile): Partial<InvoiceState> {
  return {
    subcontractorName: profile.companyName || "",
    subcontractorEmail: profile.email || "",
    subcontractorPhone: profile.phone || "",
    subcontractorAddress: profile.address || "",
    subcontractorLicense: profile.licenseNumber || "",
    accentColor: profile.accentColor || initialState.accentColor,
    logoDataUrl: profile.logoDataUrl || "",
  };
}

function clientProfileToInvoicePatch(profile: SavedProfile): Partial<InvoiceState> {
  return {
    clientName: profile.contactName || profile.companyName || "",
    clientCompany: profile.companyName || "",
    clientEmail: profile.email || "",
    projectAddress: profile.address || "",
  };
}

export default function InvoiceStudio() {
  const [invoice, setInvoice] = useState<InvoiceState>(initialState);
  const [lineItems, setLineItems] = useState<LineItem[]>(sampleItems);

  const [subcontractorProfiles, setSubcontractorProfiles] = useState<SavedProfile[]>([]);
  const [selectedSubcontractorProfileId, setSelectedSubcontractorProfileId] = useState<string>("");
  const [subcontractorProfileName, setSubcontractorProfileName] = useState(initialState.subcontractorName);
  const [subcontractorProfilesLoading, setSubcontractorProfilesLoading] = useState(true);
  const [subcontractorProfileActionMessage, setSubcontractorProfileActionMessage] = useState<string>("");
  const [subcontractorProfileError, setSubcontractorProfileError] = useState<string>("");
  const [isSavingSubcontractorProfile, setIsSavingSubcontractorProfile] = useState(false);

  const [clientProfiles, setClientProfiles] = useState<SavedProfile[]>([]);
  const [selectedClientProfileId, setSelectedClientProfileId] = useState<string>("");
  const [clientProfileName, setClientProfileName] = useState(initialState.clientName);
  const [clientProfilesLoading, setClientProfilesLoading] = useState(true);
  const [clientProfileActionMessage, setClientProfileActionMessage] = useState<string>("");
  const [clientProfileError, setClientProfileError] = useState<string>("");
  const [isSavingClientProfile, setIsSavingClientProfile] = useState(false);

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [lineItems]);
  const taxAmount = subtotal * (invoice.taxPercent / 100);
  const total = subtotal + taxAmount;
  const balanceDue = Math.max(total - invoice.depositAmount, 0);
  const activeTemplate = templates.find((template) => template.id === invoice.template) ?? templates[0];

  useEffect(() => {
    void Promise.all([loadSubcontractorProfiles(), loadClientProfiles()]);
  }, []);

  async function loadSubcontractorProfiles() {
    setSubcontractorProfilesLoading(true);
    setSubcontractorProfileError("");
    try {
      const response = await fetch("/api/subcontractor-profiles", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load profiles");
      setSubcontractorProfiles((await response.json()) as SavedProfile[]);
    } catch (error) {
      console.error(error);
      setSubcontractorProfileError("Could not load saved subcontractor profiles right now.");
    } finally {
      setSubcontractorProfilesLoading(false);
    }
  }

  async function loadClientProfiles() {
    setClientProfilesLoading(true);
    setClientProfileError("");
    try {
      const response = await fetch("/api/client-profiles", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load profiles");
      setClientProfiles((await response.json()) as SavedProfile[]);
    } catch (error) {
      console.error(error);
      setClientProfileError("Could not load saved client profiles right now.");
    } finally {
      setClientProfilesLoading(false);
    }
  }

  function updateField<K extends keyof InvoiceState>(key: K, value: InvoiceState[K]) {
    setInvoice((current) => ({ ...current, [key]: value }));
    if (key === "subcontractorName") setSubcontractorProfileName(String(value));
    if (key === "clientName") setClientProfileName(String(value));
  }

  function updateItem(id: string, key: keyof LineItem, value: string | number) {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function addItem() {
    setLineItems((current) => [...current, { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }]);
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
    setSelectedSubcontractorProfileId("");
    setSubcontractorProfileName(initialState.subcontractorName);
    setSubcontractorProfileActionMessage("");
    setSubcontractorProfileError("");
    setSelectedClientProfileId("");
    setClientProfileName(initialState.clientName);
    setClientProfileActionMessage("");
    setClientProfileError("");
  }

  function selectTemplate(templateId: InvoiceTemplate) {
    const template = templates.find((entry) => entry.id === templateId);
    setInvoice((current) => ({
      ...current,
      template: templateId,
      accentColor: template?.accent ?? current.accentColor,
    }));
  }

  function applySelectedSubcontractorProfile(profileId: string) {
    setSelectedSubcontractorProfileId(profileId);
    if (!profileId) return;
    const selectedProfile = subcontractorProfiles.find((profile) => String(profile.id) === profileId);
    if (!selectedProfile) return;

    setInvoice((current) => ({ ...current, ...subcontractorProfileToInvoicePatch(selectedProfile) }));
    setSubcontractorProfileName(selectedProfile.profileName);
    setSubcontractorProfileActionMessage(`Loaded subcontractor profile: ${selectedProfile.profileName}`);
    setSubcontractorProfileError("");
  }

  function applySelectedClientProfile(profileId: string) {
    setSelectedClientProfileId(profileId);
    if (!profileId) return;
    const selectedProfile = clientProfiles.find((profile) => String(profile.id) === profileId);
    if (!selectedProfile) return;

    setInvoice((current) => ({ ...current, ...clientProfileToInvoicePatch(selectedProfile) }));
    setClientProfileName(selectedProfile.profileName);
    setClientProfileActionMessage(`Loaded client profile: ${selectedProfile.profileName}`);
    setClientProfileError("");
  }

  async function saveSubcontractorProfile() {
    setIsSavingSubcontractorProfile(true);
    setSubcontractorProfileActionMessage("");
    setSubcontractorProfileError("");

    try {
      const response = await fetch("/api/subcontractor-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileName: subcontractorProfileName.trim() || invoice.subcontractorName.trim(),
          companyName: invoice.subcontractorName.trim(),
          email: invoice.subcontractorEmail.trim(),
          phone: invoice.subcontractorPhone.trim(),
          address: invoice.subcontractorAddress.trim(),
          licenseNumber: invoice.subcontractorLicense.trim(),
          accentColor: invoice.accentColor.trim(),
          logoDataUrl: invoice.logoDataUrl,
          sourceType: "manual",
          sourceKey: null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save profile");

      const savedProfile = payload as SavedProfile;
      setSubcontractorProfiles((current) => {
        const filtered = current.filter((profile) => profile.id !== savedProfile.id);
        return [savedProfile, ...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
      setSelectedSubcontractorProfileId(String(savedProfile.id));
      setSubcontractorProfileName(savedProfile.profileName);
      setSubcontractorProfileActionMessage(`Saved subcontractor profile: ${savedProfile.profileName}`);
    } catch (error) {
      console.error(error);
      setSubcontractorProfileError(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setIsSavingSubcontractorProfile(false);
    }
  }

  async function saveClientProfile() {
    setIsSavingClientProfile(true);
    setClientProfileActionMessage("");
    setClientProfileError("");

    try {
      const response = await fetch("/api/client-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileName: clientProfileName.trim() || invoice.clientName.trim(),
          contactName: invoice.clientName.trim(),
          companyName: invoice.clientCompany.trim(),
          email: invoice.clientEmail.trim(),
          phone: "",
          address: invoice.projectAddress.trim(),
          sourceType: "manual",
          sourceKey: null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save profile");

      const savedProfile = payload as SavedProfile;
      setClientProfiles((current) => {
        const filtered = current.filter((profile) => profile.id !== savedProfile.id);
        return [savedProfile, ...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
      setSelectedClientProfileId(String(savedProfile.id));
      setClientProfileName(savedProfile.profileName);
      setClientProfileActionMessage(`Saved client profile: ${savedProfile.profileName}`);
    } catch (error) {
      console.error(error);
      setClientProfileError(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setIsSavingClientProfile(false);
    }
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
            <SectionTitle eyebrow="Brand" title="Company setup" body="Set the identity clients will see at the top of every invoice, then save it as a reusable profile for next time." />
            <div className="profile-tools">
              <div className="form-grid two-col compact-grid profile-toolbar-grid">
                <div>
                  <label>Saved subcontractor profile</label>
                  <select value={selectedSubcontractorProfileId} onChange={(e) => applySelectedSubcontractorProfile(e.target.value)}>
                    <option value="">Select a saved profile</option>
                    {subcontractorProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.profileName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Profile name</label>
                  <input value={subcontractorProfileName} onChange={(e) => setSubcontractorProfileName(e.target.value)} placeholder="Oakline default profile" />
                </div>
              </div>
              <div className="profile-actions-row">
                <button className="btn btn-secondary" type="button" onClick={saveSubcontractorProfile} disabled={isSavingSubcontractorProfile || !invoice.subcontractorName.trim()}>
                  {isSavingSubcontractorProfile ? "Saving..." : "Save current profile"}
                </button>
                <button className="text-link" type="button" onClick={() => void loadSubcontractorProfiles()}>
                  Refresh profiles
                </button>
              </div>
              <p className="support-copy">Subcontractor profiles keep branding, contact info, license data, accent color, and logo together.</p>
              {subcontractorProfilesLoading && <p className="status-copy">Loading saved profiles...</p>}
              {!subcontractorProfilesLoading && subcontractorProfiles.length === 0 && <p className="status-copy">No saved profiles yet. Fill in your subcontractor details and save one.</p>}
              {subcontractorProfileActionMessage && <p className="status-copy success-copy">{subcontractorProfileActionMessage}</p>}
              {subcontractorProfileError && <p className="status-copy error-copy">{subcontractorProfileError}</p>}
            </div>
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
            <div className="profile-tools">
              <div className="form-grid two-col compact-grid profile-toolbar-grid">
                <div>
                  <label>Saved client profile</label>
                  <select value={selectedClientProfileId} onChange={(e) => applySelectedClientProfile(e.target.value)}>
                    <option value="">Select a saved client profile</option>
                    {clientProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.profileName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Profile name</label>
                  <input value={clientProfileName} onChange={(e) => setClientProfileName(e.target.value)} placeholder="Southern Cities default client" />
                </div>
              </div>
              <div className="profile-actions-row">
                <button className="btn btn-secondary" type="button" onClick={saveClientProfile} disabled={isSavingClientProfile || !invoice.clientName.trim()}>
                  {isSavingClientProfile ? "Saving..." : "Save client profile"}
                </button>
                <button className="text-link" type="button" onClick={() => void loadClientProfiles()}>
                  Refresh client profiles
                </button>
              </div>
              <p className="support-copy">Client profiles keep bill-to details ready for repeat jobs. Project address is saved with the client for quick reuse.</p>
              {clientProfilesLoading && <p className="status-copy">Loading saved client profiles...</p>}
              {!clientProfilesLoading && clientProfiles.length === 0 && <p className="status-copy">No saved client profiles yet. Fill in your client details and save one.</p>}
              {clientProfileActionMessage && <p className="status-copy success-copy">{clientProfileActionMessage}</p>}
              {clientProfileError && <p className="status-copy error-copy">{clientProfileError}</p>}
            </div>
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
            <header className="invoice-cover-row">
              <div className="invoice-cover-block">
                <span className="mini-label">Prepared for</span>
                <strong>{invoice.clientCompany || invoice.clientName || "Client"}</strong>
                <span>{invoice.projectName || "Project"}</span>
              </div>
              <div className="invoice-cover-block invoice-cover-block-right">
                <span className="mini-label">Payment due</span>
                <strong>{formatCurrency(balanceDue)}</strong>
                <span>Due {formatDisplayDate(invoice.dueDate)}</span>
              </div>
            </header>

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
                  <p>{invoice.subcontractorPhone || "Phone"}{invoice.subcontractorEmail ? ` • ${invoice.subcontractorEmail}` : ""}</p>
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

            <section className="invoice-story-band">
              <div>
                <span className="mini-label">Summary</span>
                <p>This invoice covers the labor, materials, and closeout items listed below for the referenced project.</p>
              </div>
              <div className="invoice-story-metrics">
                <div><span>Items</span><strong>{lineItems.length}</strong></div>
                <div><span>Tax</span><strong>{formatCurrency(taxAmount)}</strong></div>
                <div><span>Deposit</span><strong>{formatCurrency(invoice.depositAmount)}</strong></div>
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

            <footer className="invoice-footer-band">
              <div>
                <span className="mini-label">Remit to</span>
                <p>{invoice.subcontractorName || "Your company name"}</p>
              </div>
              <div>
                <span className="mini-label">Client reference</span>
                <p>{invoice.clientCompany || invoice.clientName || "Client"}</p>
              </div>
              <div>
                <span className="mini-label">Invoice reference</span>
                <p>{invoice.invoiceNumber}</p>
              </div>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}
