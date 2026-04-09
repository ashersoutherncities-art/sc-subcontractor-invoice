"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Contractor {
  id: number;
  company_name: string;
  rep_name: string;
  tax_id: string | null;
  wire_bank_name: string | null;
  wire_routing: string | null;
  wire_account: string | null;
  wire_account_type: string | null;
  wire_account_holder: string | null;
  zelle_contact: string | null;
  venmo_handle: string | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Job {
  id: number;
  job_name: string;
}

function formatTaxId(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 9);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "-" + digits.slice(2);
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function NewInvoicePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NewInvoicePage />
    </Suspense>
  );
}

function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);

  // Contractor info
  const [companyName, setCompanyName] = useState("");
  const [repName, setRepName] = useState("");
  const [taxId, setTaxId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contractorId, setContractorId] = useState<number | null>(null);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<Contractor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Invoice details
  const [sccInvoiceNum, setSccInvoiceNum] = useState("");
  const [internalInvoiceNum, setInternalInvoiceNum] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [scopeOfWork, setScopeOfWork] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
  const [taxRate, setTaxRate] = useState(0);

  // Retention
  const [retentionPct, setRetentionPct] = useState(10);

  // Job linking
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Payment info
  const [wireBankName, setWireBankName] = useState("");
  const [wireRouting, setWireRouting] = useState("");
  const [wireAccount, setWireAccount] = useState("");
  const [wireAccountType, setWireAccountType] = useState("Checking");
  const [wireAccountHolder, setWireAccountHolder] = useState("");
  const [zelleContact, setZelleContact] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Computed values
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;
  const retentionAmount = grandTotal * (retentionPct / 100);
  const netDue = grandTotal - retentionAmount;

  // Fetch next invoice number and jobs on mount
  useEffect(() => {
    fetch("/api/invoices/next-number")
      .then((res) => res.json())
      .then((data) => { if (data.next_number) setSccInvoiceNum(data.next_number); })
      .catch(() => {});
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setJobs(data); })
      .catch(() => {});
  }, []);

  // Pre-fill from ?contractor=ID
  useEffect(() => {
    const cid = searchParams.get("contractor");
    if (cid) fetchAndFillContractor(Number(cid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchAndFillContractor = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/contractors/${id}`);
      if (!res.ok) return;
      const c: Contractor = await res.json();
      fillContractorFields(c);
    } catch { /* silent */ }
  }, []);

  function fillContractorFields(c: Contractor) {
    setContractorId(c.id);
    setCompanyName(c.company_name);
    setRepName(c.rep_name || "");
    setTaxId(c.tax_id ? formatTaxId(c.tax_id) : "");
    setWireBankName(c.wire_bank_name || "");
    setWireRouting(c.wire_routing || "");
    setWireAccount(c.wire_account || "");
    setWireAccountType(c.wire_account_type || "Checking");
    setWireAccountHolder(c.wire_account_holder || "");
    setZelleContact(c.zelle_contact || "");
    setVenmoHandle(c.venmo_handle || "");
  }

  function handleCompanyNameChange(value: string) {
    setCompanyName(value);
    setContractorId(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length === 0) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/contractors/search?q=${encodeURIComponent(value.trim())}`);
        if (!res.ok) return;
        const data: Contractor[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
    }, 300);
  }

  function selectContractor(c: Contractor) {
    fillContractorFields(c);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === "description") { item.description = value; }
      else if (field === "quantity") { item.quantity = parseFloat(value) || 0; item.total = item.quantity * item.unit_price; }
      else if (field === "unit_price") { item.unit_price = parseFloat(value) || 0; item.total = item.quantity * item.unit_price; }
      next[index] = item;
      return next;
    });
  }

  function addItem() { setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0, total: 0 }]); }
  function removeItem(index: number) { if (items.length <= 1) return; setItems((prev) => prev.filter((_, i) => i !== index)); }
  function handleTaxIdChange(value: string) { setTaxId(formatTaxId(value)); }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Company name is required.";
    if (!repName.trim()) errs.repName = "Representative name is required.";
    const taxDigits = taxId.replace(/[^0-9]/g, "");
    if (taxDigits.length !== 9) errs.taxId = "Tax ID must be 9 digits (XX-XXXXXXX).";
    if (!sccInvoiceNum.trim()) errs.sccInvoiceNum = "SCC Invoice # is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        company_name: companyName.trim(),
        rep_name: repName.trim(),
        tax_id: taxId.trim(),
        wire_bank_name: wireBankName.trim() || null,
        wire_routing: wireRouting.trim() || null,
        wire_account: wireAccount.trim() || null,
        wire_account_type: wireAccountType || null,
        wire_account_holder: wireAccountHolder.trim() || null,
        zelle_contact: zelleContact.trim() || null,
        venmo_handle: venmoHandle.trim() || null,
        scc_invoice_num: sccInvoiceNum.trim(),
        internal_invoice_num: internalInvoiceNum.trim() || null,
        invoice_date: invoiceDate,
        scope_of_work: scopeOfWork.trim() || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: grandTotal,
        retention_pct: retentionPct,
        job_id: selectedJobId ? parseInt(selectedJobId) : null,
        items: items.map((item) => ({ description: item.description, quantity: item.quantity, unit_price: item.unit_price, total: item.total })),
      };
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to create invoice."); }
      const invoice = await res.json();
      router.push(`/invoice/${invoice.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally { setSubmitting(false); }
  }

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const inputCls = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/40 focus:border-navy";
  const errorCls = "text-red-600 text-xs mt-1";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-navy mb-6">Create New Invoice</h1>

        {/* Step indicator */}
        <div className="flex items-center mb-8 gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 1 ? "bg-navy text-white" : "bg-navy/20 text-navy"}`}>1</div>
          <span className={`text-sm font-medium ${step === 1 ? "text-navy" : "text-gray-400"}`}>Invoice Details</span>
          <div className="w-12 h-px bg-gray-300" />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 2 ? "bg-navy text-white" : "bg-navy/20 text-navy"}`}>2</div>
          <span className={`text-sm font-medium ${step === 2 ? "text-navy" : "text-gray-400"}`}>Payment Info</span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-navy">Invoice Details</h2>

            {/* Contractor Company Name with autocomplete */}
            <div ref={autocompleteRef} className="relative">
              <label className={labelCls}>Contractor Company Name <span className="text-red-500">*</span></label>
              <input type="text" value={companyName} onChange={(e) => handleCompanyNameChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className={`${inputCls} ${errors.companyName ? "border-red-500" : ""}`} placeholder="Start typing to search..." />
              {errors.companyName && <p className={errorCls}>{errors.companyName}</p>}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((c) => (
                    <li key={c.id} className="px-3 py-2 text-sm hover:bg-navy/5 cursor-pointer" onMouseDown={() => selectContractor(c)}>
                      <span className="font-medium">{c.company_name}</span>
                      {c.rep_name && <span className="text-gray-400 ml-2">-- {c.rep_name}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Rep Name */}
            <div>
              <label className={labelCls}>Representative Name <span className="text-red-500">*</span></label>
              <input type="text" value={repName} onChange={(e) => setRepName(e.target.value)} className={`${inputCls} ${errors.repName ? "border-red-500" : ""}`} />
              {errors.repName && <p className={errorCls}>{errors.repName}</p>}
            </div>

            {/* Tax ID */}
            <div>
              <label className={labelCls}>Tax ID Number <span className="text-red-500">*</span></label>
              <input type="text" value={taxId} onChange={(e) => handleTaxIdChange(e.target.value)} placeholder="XX-XXXXXXX" maxLength={10}
                className={`${inputCls} ${errors.taxId ? "border-red-500" : ""}`} />
              {errors.taxId && <p className={errorCls}>{errors.taxId}</p>}
            </div>

            {/* SCC Invoice # and Internal Invoice # */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>SCC Invoice # <span className="text-red-500">*</span></label>
                <input type="text" value={sccInvoiceNum} readOnly className={`${inputCls} bg-gray-100 cursor-not-allowed ${errors.sccInvoiceNum ? "border-red-500" : ""}`} />
                {errors.sccInvoiceNum && <p className={errorCls}>{errors.sccInvoiceNum}</p>}
              </div>
              <div>
                <label className={labelCls}>Internal Invoice #</label>
                <input type="text" value={internalInvoiceNum} onChange={(e) => setInternalInvoiceNum(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Invoice Date */}
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputCls} />
            </div>

            {/* Link to Job */}
            <div>
              <label className={labelCls}>Link to Job (optional)</label>
              <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className={inputCls}>
                <option value="">-- No job linked --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.job_name}</option>
                ))}
              </select>
            </div>

            {/* Scope of Work */}
            <div>
              <label className={labelCls}>Description / Scope of Work</label>
              <textarea value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} rows={3} className={inputCls} />
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 font-medium text-gray-600">Description</th>
                      <th className="px-3 py-2 font-medium text-gray-600 w-24">Quantity</th>
                      <th className="px-3 py-2 font-medium text-gray-600 w-32">Unit Price</th>
                      <th className="px-3 py-2 font-medium text-gray-600 w-28 text-right">Total</th>
                      <th className="px-2 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="px-2 py-2">
                          <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} className={inputCls} placeholder="Item description" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="any" value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className={inputCls} />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.01" value={item.unit_price || ""} onChange={(e) => updateItem(idx, "unit_price", e.target.value)} className={inputCls} />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-700">{currency(item.total)}</td>
                        <td className="px-2 py-2 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none" title="Remove item">X</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addItem} className="mt-2 text-sm text-navy font-medium hover:underline">+ Add Line Item</button>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{currency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <label className="text-gray-600">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={taxRate || ""} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy/40 focus:border-navy" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax Amount</span>
                <span className="font-medium">{currency(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-bold text-navy">Contract Amount</span>
                <span className="text-xl font-bold text-navy">{currency(grandTotal)}</span>
              </div>

              {/* Retention */}
              <div className="flex justify-between items-center text-sm pt-2 border-t">
                <label className="text-gray-600">Retention (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={retentionPct || ""} onChange={(e) => setRetentionPct(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-navy/40 focus:border-navy" />
              </div>
              {retentionPct > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Retention Held</span>
                    <span className="font-medium text-red-600">-{currency(retentionAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-800">Net Due</span>
                    <span className="text-lg font-bold text-navy">{currency(netDue)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => { if (validateStep1()) setStep(2); }}
                className="bg-navy text-white px-6 py-2.5 rounded font-medium text-sm hover:bg-navy/90 transition-colors">
                Next: Payment Info
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-8">
            <h2 className="text-lg font-semibold text-navy">Payment Information</h2>
            <p className="text-sm text-gray-500">All payment fields are optional. Fill in the methods this contractor accepts.</p>

            {/* Wire Transfer */}
            <fieldset className="border border-gray-200 rounded p-4 space-y-4">
              <legend className="text-sm font-semibold text-gray-700 px-1">Wire Transfer</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Bank Name</label>
                  <input type="text" value={wireBankName} onChange={(e) => setWireBankName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Routing Number</label>
                  <input type="text" value={wireRouting} onChange={(e) => setWireRouting(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Account Number</label>
                  <input type="text" value={wireAccount} onChange={(e) => setWireAccount(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Account Type</label>
                  <select value={wireAccountType} onChange={(e) => setWireAccountType(e.target.value)} className={inputCls}>
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Account Holder Name</label>
                  <input type="text" value={wireAccountHolder} onChange={(e) => setWireAccountHolder(e.target.value)} className={inputCls} />
                </div>
              </div>
            </fieldset>

            {/* Zelle */}
            <fieldset className="border border-gray-200 rounded p-4 space-y-4">
              <legend className="text-sm font-semibold text-gray-700 px-1">Zelle</legend>
              <div>
                <label className={labelCls}>Zelle Phone or Email</label>
                <input type="text" value={zelleContact} onChange={(e) => setZelleContact(e.target.value)} className={inputCls} placeholder="phone number or email" />
              </div>
            </fieldset>

            {/* Venmo */}
            <fieldset className="border border-gray-200 rounded p-4 space-y-4">
              <legend className="text-sm font-semibold text-gray-700 px-1">Venmo</legend>
              <div>
                <label className={labelCls}>Venmo Username</label>
                <input type="text" value={venmoHandle} onChange={(e) => setVenmoHandle(e.target.value)} className={inputCls} placeholder="@handle" />
              </div>
            </fieldset>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">{submitError}</div>
            )}

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(1)} className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded font-medium text-sm hover:bg-gray-50 transition-colors">Back</button>
              <button type="button" disabled={submitting} onClick={handleSubmit}
                className="bg-orange text-white px-6 py-2.5 rounded font-medium text-sm hover:bg-orange/90 transition-colors disabled:opacity-50">
                {submitting ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
