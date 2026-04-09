'use client';

import React, { useState, useRef, ChangeEvent } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompletedProject {
  project_name: string;
  property_address: string;
  scope_of_work: string;
  contract_value: string;
  owner_gc_name: string;
  owner_gc_phone: string;
  completion_date: string;
  project_type: string;
}

interface Reference {
  contact_name: string;
  company_name: string;
  relationship: string;
  phone: string;
  email: string;
  years_known: string;
}

interface FormState {
  // Step 1
  legal_business_name: string;
  dba_trade_name: string;
  business_type: string;
  federal_ein: string;
  date_established: string;
  full_time_employees: string;
  subcontractors_used: string;
  annual_revenue_range: string;
  duns_number: string;
  bonded: string;
  bond_amount: string;
  bonding_company: string;
  bond_expiration: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  mailing_same: boolean;
  mailing_street: string;
  mailing_city: string;
  mailing_state: string;
  mailing_zip: string;
  business_phone: string;
  business_email: string;
  website: string;
  // Step 2
  primary_contact_name: string;
  primary_title: string;
  direct_phone: string;
  direct_email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_comm: string;
  // Step 3
  services: string[];
  services_other_text: string;
  service_area: string;
  typical_project_size: string;
  largest_project: string;
  occupied_properties: string;
  commercial_properties: string;
  union_status: string;
  completed_projects: CompletedProject[];
  // Step 4
  gc_license_number: string;
  gc_license_state: string;
  gc_license_expiration: string;
  gc_license_file: string;
  specialty_license_type: string;
  specialty_license_number: string;
  specialty_license_state: string;
  specialty_license_expiration: string;
  specialty_license_file: string;
  business_license_number: string;
  business_license_jurisdiction: string;
  business_license_expiration: string;
  business_license_file: string;
  gl_carrier: string;
  gl_policy_number: string;
  gl_coverage_amount: string;
  gl_expiration: string;
  gl_certificate_file: string;
  has_employees: string;
  wc_carrier: string;
  wc_policy_number: string;
  wc_expiration: string;
  wc_certificate_file: string;
  wc_exemption_reason: string;
  auto_carrier: string;
  auto_policy_number: string;
  auto_expiration: string;
  auto_coverage_amount: string;
  auto_file: string;
  umbrella_carrier: string;
  umbrella_policy_number: string;
  umbrella_expiration: string;
  umbrella_coverage_amount: string;
  umbrella_file: string;
  w9_file: string;
  osha_10: string;
  osha_30: string;
  written_safety_program: string;
  emr: string;
  osha_citations: string;
  osha_citations_description: string;
  // Step 5
  bank_name: string;
  aba_routing: string;
  account_number: string;
  account_type: string;
  account_holder_name: string;
  zelle_contact: string;
  venmo_handle: string;
  cashapp_tag: string;
  check_payable_to: string;
  references: Reference[];
  agree_accurate: boolean;
  agree_authorize: boolean;
  agree_false_statements: boolean;
  digital_signature: string;
  signature_date: string;
}

interface ConfirmationData {
  company_name: string;
  email: string;
  reference_number: string;
  submitted_at: string;
}

interface Errors {
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICES_LIST = [
  'Framing',
  'Rough Carpentry',
  'Finish Carpentry',
  'Roofing',
  'Drywall & Framing',
  'Insulation',
  'Electrical (Licensed)',
  'Plumbing (Licensed)',
  'HVAC',
  'Flooring',
  'Tile & Stone',
  'Concrete & Flatwork',
  'Foundation Work',
  'Masonry & Block',
  'Painting & Coatings',
  'Siding & Exterior',
  'Windows & Doors',
  'Cabinetry & Millwork',
  'Demolition',
  'Excavation & Grading',
  'Landscaping & Site Work',
  'Waterproofing',
  'Other',
];

const EMPTY_PROJECT: CompletedProject = {
  project_name: '',
  property_address: '',
  scope_of_work: '',
  contract_value: '',
  owner_gc_name: '',
  owner_gc_phone: '',
  completion_date: '',
  project_type: '',
};

const EMPTY_REFERENCE: Reference = {
  contact_name: '',
  company_name: '',
  relationship: '',
  phone: '',
  email: '',
  years_known: '',
};

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_FORM: FormState = {
  legal_business_name: '',
  dba_trade_name: '',
  business_type: '',
  federal_ein: '',
  date_established: '',
  full_time_employees: '',
  subcontractors_used: '',
  annual_revenue_range: '',
  duns_number: '',
  bonded: 'No',
  bond_amount: '',
  bonding_company: '',
  bond_expiration: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  mailing_same: true,
  mailing_street: '',
  mailing_city: '',
  mailing_state: '',
  mailing_zip: '',
  business_phone: '',
  business_email: '',
  website: '',
  primary_contact_name: '',
  primary_title: '',
  direct_phone: '',
  direct_email: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  preferred_comm: 'Email',
  services: [],
  services_other_text: '',
  service_area: '',
  typical_project_size: '',
  largest_project: '',
  occupied_properties: '',
  commercial_properties: '',
  union_status: '',
  completed_projects: [{ ...EMPTY_PROJECT }],
  gc_license_number: '',
  gc_license_state: '',
  gc_license_expiration: '',
  gc_license_file: '',
  specialty_license_type: '',
  specialty_license_number: '',
  specialty_license_state: '',
  specialty_license_expiration: '',
  specialty_license_file: '',
  business_license_number: '',
  business_license_jurisdiction: '',
  business_license_expiration: '',
  business_license_file: '',
  gl_carrier: '',
  gl_policy_number: '',
  gl_coverage_amount: '',
  gl_expiration: '',
  gl_certificate_file: '',
  has_employees: 'Yes',
  wc_carrier: '',
  wc_policy_number: '',
  wc_expiration: '',
  wc_certificate_file: '',
  wc_exemption_reason: '',
  auto_carrier: '',
  auto_policy_number: '',
  auto_expiration: '',
  auto_coverage_amount: '',
  auto_file: '',
  umbrella_carrier: '',
  umbrella_policy_number: '',
  umbrella_expiration: '',
  umbrella_coverage_amount: '',
  umbrella_file: '',
  w9_file: '',
  osha_10: '',
  osha_30: '',
  written_safety_program: '',
  emr: '',
  osha_citations: '',
  osha_citations_description: '',
  bank_name: '',
  aba_routing: '',
  account_number: '',
  account_type: '',
  account_holder_name: '',
  zelle_contact: '',
  venmo_handle: '',
  cashapp_tag: '',
  check_payable_to: '',
  references: [{ ...EMPTY_REFERENCE }, { ...EMPTY_REFERENCE }],
  agree_accurate: false,
  agree_authorize: false,
  agree_false_statements: false,
  digital_signature: '',
  signature_date: TODAY,
};

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function inputClass(hasError?: boolean) {
  return `w-full border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`;
}

function selectClass(hasError?: boolean) {
  return `w-full border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-[#132452] mt-6 mb-3 pb-1 border-b border-gray-200">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// File Upload Button
// ---------------------------------------------------------------------------

interface FileUploadButtonProps {
  label: string;
  docType: string;
  value: string;
  onChange: (path: string, filename: string) => void;
}

function FileUploadButton({ label, docType, value, onChange }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      fd.append('app_id', 'temp');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setFilename(file.name);
        onChange(data.path || data.url || '', file.name);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {uploading ? 'Uploading...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />
      {(value || filename) && (
        <span className="flex items-center gap-1 text-sm text-green-700 font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          {filename || 'Uploaded'}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle (Yes / No)
// ---------------------------------------------------------------------------

function YesNoToggle({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="flex gap-3">
      {['Yes', 'No'].map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-[#fa8c41]"
          />
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step progress bar
// ---------------------------------------------------------------------------

const STEP_LABELS = [
  'Company Info',
  'Contacts',
  'Trade Experience',
  'Licenses & Insurance',
  'Payment & Refs',
];

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-start justify-between relative">
        {/* connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ top: '16px' }} />
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isComplete = step < current;
          const isActive = step === current;
          return (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                  ${isComplete ? 'bg-[#132452] border-[#132452] text-white' : ''}
                  ${isActive ? 'bg-[#fa8c41] border-[#fa8c41] text-white' : ''}
                  ${!isComplete && !isActive ? 'bg-gray-200 border-gray-200 text-gray-500' : ''}
                `}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={`mt-1 text-xs text-center leading-tight font-medium ${isActive ? 'text-[#fa8c41]' : isComplete ? 'text-[#132452]' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateStep(step: number, form: FormState): Errors {
  const errors: Errors = {};

  if (step === 1) {
    if (!form.legal_business_name.trim()) errors.legal_business_name = 'Legal business name is required.';
    if (!form.business_type) errors.business_type = 'Business type is required.';
    if (!form.federal_ein.trim()) errors.federal_ein = 'Federal EIN / Tax ID is required.';
    if (!form.address_street.trim()) errors.address_street = 'Street address is required.';
    if (!form.address_city.trim()) errors.address_city = 'City is required.';
    if (!form.address_state.trim()) errors.address_state = 'State is required.';
    if (!form.address_zip.trim()) errors.address_zip = 'ZIP code is required.';
    if (!form.business_phone.trim()) errors.business_phone = 'Business phone is required.';
    if (!form.business_email.trim()) errors.business_email = 'Business email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.business_email)) errors.business_email = 'Enter a valid email address.';
  }

  if (step === 2) {
    if (!form.primary_contact_name.trim()) errors.primary_contact_name = 'Primary contact name is required.';
    if (!form.direct_phone.trim()) errors.direct_phone = 'Direct phone is required.';
    if (!form.direct_email.trim()) errors.direct_email = 'Direct email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.direct_email)) errors.direct_email = 'Enter a valid email address.';
  }

  if (step === 3) {
    if (form.services.length === 0) errors.services = 'Select at least one service.';
    if (form.completed_projects.length === 0 || !form.completed_projects[0].project_name.trim()) {
      errors['project_0_name'] = 'At least one completed project is required.';
    }
  }

  if (step === 4) {
    if (!form.gl_carrier.trim()) errors.gl_carrier = 'GL carrier name is required.';
    if (!form.gl_policy_number.trim()) errors.gl_policy_number = 'GL policy number is required.';
    if (!form.gl_coverage_amount.trim()) errors.gl_coverage_amount = 'GL coverage amount is required.';
    if (!form.gl_expiration) errors.gl_expiration = 'GL expiration date is required.';
    if (!form.w9_file) errors.w9_file = 'W-9 upload is required.';
  }

  if (step === 5) {
    if (!form.references[0].contact_name.trim()) errors['ref_0_contact_name'] = 'Reference 1 contact name is required.';
    if (!form.references[0].phone.trim()) errors['ref_0_phone'] = 'Reference 1 phone is required.';
    if (!form.references[1].contact_name.trim()) errors['ref_1_contact_name'] = 'Reference 2 contact name is required.';
    if (!form.references[1].phone.trim()) errors['ref_1_phone'] = 'Reference 2 phone is required.';
    if (!form.agree_accurate) errors.agree_accurate = 'You must certify accuracy.';
    if (!form.agree_authorize) errors.agree_authorize = 'You must authorize verification.';
    if (!form.agree_false_statements) errors.agree_false_statements = 'You must acknowledge this statement.';
    if (!form.digital_signature.trim()) errors.digital_signature = 'Digital signature is required.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  // Generic field setter
  function setField(field: keyof FormState, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }

  // Project helpers
  function setProject(idx: number, field: keyof CompletedProject, value: string) {
    setForm((prev) => {
      const projects = prev.completed_projects.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      );
      return { ...prev, completed_projects: projects };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`project_${idx}_${field}`];
      return next;
    });
  }

  function addProject() {
    if (form.completed_projects.length < 4) {
      setForm((prev) => ({
        ...prev,
        completed_projects: [...prev.completed_projects, { ...EMPTY_PROJECT }],
      }));
    }
  }

  function removeProject(idx: number) {
    setForm((prev) => ({
      ...prev,
      completed_projects: prev.completed_projects.filter((_, i) => i !== idx),
    }));
  }

  // Reference helpers
  function setReference(idx: number, field: keyof Reference, value: string) {
    setForm((prev) => {
      const refs = prev.references.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      );
      return { ...prev, references: refs };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`ref_${idx}_${field}`];
      return next;
    });
  }

  // Service toggle
  function toggleService(service: string) {
    setForm((prev) => {
      const has = prev.services.includes(service);
      const services = has
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.services;
      return next;
    });
  }

  function handleNext() {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    const errs = validateStep(5, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        company_name: form.legal_business_name,
        dba_name: form.dba_trade_name,
        business_type: form.business_type,
        tax_id: form.federal_ein,
        date_established: form.date_established,
        employees_count: form.full_time_employees ? parseInt(form.full_time_employees, 10) : null,
        sub_count: form.subcontractors_used ? parseInt(form.subcontractors_used, 10) : null,
        annual_revenue: form.annual_revenue_range,
        duns_number: form.duns_number,
        bonded: form.bonded === 'Yes' ? 1 : 0,
        bond_amount: form.bond_amount,
        bonding_company: form.bonding_company,
        bond_expiry: form.bond_expiration,
        address: form.address_street,
        city: form.address_city,
        state: form.address_state,
        zip: form.address_zip,
        mailing_same: form.mailing_same ? 1 : 0,
        mailing_address: form.mailing_street,
        mailing_city: form.mailing_city,
        mailing_state: form.mailing_state,
        mailing_zip: form.mailing_zip,
        business_phone: form.business_phone,
        business_email: form.business_email,
        website: form.website,
        rep_name: form.primary_contact_name,
        contact_title: form.primary_title,
        direct_phone: form.direct_phone,
        direct_email: form.direct_email,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        preferred_communication: form.preferred_comm,
        services: form.services,
        other_service: form.services_other_text,
        service_area: form.service_area,
        project_size: form.typical_project_size,
        largest_project: form.largest_project,
        occupied_properties: form.occupied_properties === 'Yes' ? 1 : 0,
        commercial_properties: form.commercial_properties === 'Yes' ? 1 : 0,
        union_status: form.union_status,
        completed_projects: form.completed_projects,
        gc_license_num: form.gc_license_number,
        gc_license_state: form.gc_license_state,
        gc_license_expiry: form.gc_license_expiration,
        gc_license_path: form.gc_license_file,
        specialty_license_type: form.specialty_license_type,
        specialty_license_num: form.specialty_license_number,
        specialty_license_state: form.specialty_license_state,
        specialty_license_expiry: form.specialty_license_expiration,
        specialty_license_path: form.specialty_license_file,
        business_license_num: form.business_license_number,
        business_license_jurisdiction: form.business_license_jurisdiction,
        business_license_expiry: form.business_license_expiration,
        business_license_path: form.business_license_file,
        gl_carrier: form.gl_carrier,
        gl_policy_num: form.gl_policy_number,
        gl_coverage_amount: form.gl_coverage_amount,
        gl_expiry: form.gl_expiration,
        gl_cert_path: form.gl_certificate_file,
        has_employees: form.has_employees === 'Yes' ? 1 : 0,
        wc_carrier: form.wc_carrier,
        wc_policy_num: form.wc_policy_number,
        wc_expiry: form.wc_expiration,
        wc_cert_path: form.wc_certificate_file,
        wc_exempt_reason: form.wc_exemption_reason,
        auto_carrier: form.auto_carrier,
        auto_policy_num: form.auto_policy_number,
        auto_expiry: form.auto_expiration,
        auto_coverage: form.auto_coverage_amount,
        auto_cert_path: form.auto_file,
        umbrella_carrier: form.umbrella_carrier,
        umbrella_policy_num: form.umbrella_policy_number,
        umbrella_expiry: form.umbrella_expiration,
        umbrella_coverage: form.umbrella_coverage_amount,
        umbrella_cert_path: form.umbrella_file,
        w9_path: form.w9_file,
        osha10: form.osha_10 === 'Yes' ? 1 : 0,
        osha30: form.osha_30 === 'Yes' ? 1 : 0,
        written_safety: form.written_safety_program === 'Yes' ? 1 : 0,
        emr: form.emr,
        osha_citations: form.osha_citations === 'Yes' ? 1 : 0,
        citation_description: form.osha_citations_description,
        wire_bank: form.bank_name,
        wire_routing: form.aba_routing,
        wire_account: form.account_number,
        wire_account_type: form.account_type,
        wire_holder: form.account_holder_name,
        zelle_contact: form.zelle_contact,
        venmo_handle: form.venmo_handle,
        cashapp_tag: form.cashapp_tag,
        check_payable_to: form.check_payable_to,
        ref1_name: form.references[0]?.contact_name,
        ref1_company: form.references[0]?.company_name,
        ref1_relationship: form.references[0]?.relationship,
        ref1_phone: form.references[0]?.phone,
        ref1_email: form.references[0]?.email,
        ref1_years: form.references[0]?.years_known,
        ref2_name: form.references[1]?.contact_name,
        ref2_company: form.references[1]?.company_name,
        ref2_relationship: form.references[1]?.relationship,
        ref2_phone: form.references[1]?.phone,
        ref2_email: form.references[1]?.email,
        ref2_years: form.references[1]?.years_known,
        cert_accurate: form.agree_accurate ? 1 : 0,
        cert_authorize: form.agree_authorize ? 1 : 0,
        cert_understand: form.agree_false_statements ? 1 : 0,
        digital_signature: form.digital_signature,
      };
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setConfirmation({
          company_name: form.legal_business_name,
          email: form.business_email || form.direct_email,
          reference_number: data.reference_number || data.id || 'APP-' + Date.now(),
          submitted_at: new Date().toLocaleString(),
        });
      } else {
        setErrors({ submit: 'Submission failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Confirmation screen
  // ---------------------------------------------------------------------------

  if (confirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#132452] mb-2">Application Received</h1>
          <p className="text-lg text-gray-700 mb-4">Thank you, {confirmation.company_name}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-500 mb-1">Reference Number</p>
            <p className="text-base font-mono font-semibold text-[#132452]">{confirmation.reference_number}</p>
            <p className="text-sm text-gray-500 mt-3 mb-1">Submitted</p>
            <p className="text-sm text-gray-700">{confirmation.submitted_at}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            We review all applications within 3-5 business days. You will receive an email at{' '}
            <span className="font-semibold text-[#132452]">{confirmation.email}</span> with our decision.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-[#132452] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3170] transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#132452] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-[#fa8c41] uppercase tracking-widest mb-1">Vendor Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Subcontractor Prequalification Application</h1>
          <p className="text-gray-300 text-sm max-w-xl">
            Southern Cities Construction LLC reviews all subcontractor applications to ensure quality, compliance, and safety. Please complete all required fields accurately. Incomplete applications may delay the review process.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ProgressBar current={step} />

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-md px-6 py-8 sm:px-8">

          {/* Step 1: Company Information */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#132452] mb-1">Step 1: Company Information</h2>
              <p className="text-sm text-gray-500 mb-6">Provide your company&apos;s legal and operational details.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label required>Legal Business Name</Label>
                  <input className={inputClass(!!errors.legal_business_name)} value={form.legal_business_name} onChange={(e) => setField('legal_business_name', e.target.value)} placeholder="ABC Contractors LLC" />
                  <FieldError message={errors.legal_business_name} />
                </div>
                <div>
                  <Label>DBA / Trade Name</Label>
                  <input className={inputClass()} value={form.dba_trade_name} onChange={(e) => setField('dba_trade_name', e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label required>Business Type</Label>
                  <select className={selectClass(!!errors.business_type)} value={form.business_type} onChange={(e) => setField('business_type', e.target.value)}>
                    <option value="">Select...</option>
                    <option>LLC</option>
                    <option>S-Corp</option>
                    <option>C-Corp</option>
                    <option>Sole Proprietorship</option>
                    <option>Partnership</option>
                  </select>
                  <FieldError message={errors.business_type} />
                </div>
                <div>
                  <Label required>Federal EIN / Tax ID</Label>
                  <input className={inputClass(!!errors.federal_ein)} value={form.federal_ein} onChange={(e) => setField('federal_ein', e.target.value)} placeholder="XX-XXXXXXX" />
                  <FieldError message={errors.federal_ein} />
                </div>
                <div>
                  <Label>Date Business Established</Label>
                  <input type="date" className={inputClass()} value={form.date_established} onChange={(e) => setField('date_established', e.target.value)} />
                </div>
                <div>
                  <Label>Number of Full-Time Employees</Label>
                  <input type="number" min="0" className={inputClass()} value={form.full_time_employees} onChange={(e) => setField('full_time_employees', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Number of Subcontractors Typically Used</Label>
                  <input type="number" min="0" className={inputClass()} value={form.subcontractors_used} onChange={(e) => setField('subcontractors_used', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Annual Revenue Range</Label>
                  <select className={selectClass()} value={form.annual_revenue_range} onChange={(e) => setField('annual_revenue_range', e.target.value)}>
                    <option value="">Select...</option>
                    <option>Under $250K</option>
                    <option>$250K-$1M</option>
                    <option>$1M-$5M</option>
                    <option>$5M+</option>
                  </select>
                </div>
                <div>
                  <Label>DUNS Number</Label>
                  <input className={inputClass()} value={form.duns_number} onChange={(e) => setField('duns_number', e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <SectionTitle>Bond Information</SectionTitle>
              <div className="mb-3">
                <Label>Bonded?</Label>
                <YesNoToggle value={form.bonded} onChange={(v) => setField('bonded', v)} name="bonded" />
              </div>
              {form.bonded === 'Yes' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label>Bond Amount ($)</Label>
                    <input className={inputClass()} value={form.bond_amount} onChange={(e) => setField('bond_amount', e.target.value)} placeholder="500,000" />
                  </div>
                  <div>
                    <Label>Bonding Company</Label>
                    <input className={inputClass()} value={form.bonding_company} onChange={(e) => setField('bonding_company', e.target.value)} />
                  </div>
                  <div>
                    <Label>Bond Expiration</Label>
                    <input type="date" className={inputClass()} value={form.bond_expiration} onChange={(e) => setField('bond_expiration', e.target.value)} />
                  </div>
                </div>
              )}

              <SectionTitle>Primary Business Address</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label required>Street Address</Label>
                  <input className={inputClass(!!errors.address_street)} value={form.address_street} onChange={(e) => setField('address_street', e.target.value)} placeholder="123 Main St" />
                  <FieldError message={errors.address_street} />
                </div>
                <div>
                  <Label required>City</Label>
                  <input className={inputClass(!!errors.address_city)} value={form.address_city} onChange={(e) => setField('address_city', e.target.value)} />
                  <FieldError message={errors.address_city} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>State</Label>
                    <input className={inputClass(!!errors.address_state)} value={form.address_state} onChange={(e) => setField('address_state', e.target.value)} placeholder="NC" maxLength={2} />
                    <FieldError message={errors.address_state} />
                  </div>
                  <div>
                    <Label required>ZIP</Label>
                    <input className={inputClass(!!errors.address_zip)} value={form.address_zip} onChange={(e) => setField('address_zip', e.target.value)} placeholder="28201" maxLength={10} />
                    <FieldError message={errors.address_zip} />
                  </div>
                </div>
              </div>

              <SectionTitle>Mailing Address</SectionTitle>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.mailing_same}
                  onChange={(e) => setField('mailing_same', e.target.checked)}
                  className="accent-[#fa8c41] w-4 h-4"
                />
                <span className="text-sm text-gray-700">Same as primary business address</span>
              </label>
              {!form.mailing_same && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="sm:col-span-2">
                    <Label>Street Address</Label>
                    <input className={inputClass()} value={form.mailing_street} onChange={(e) => setField('mailing_street', e.target.value)} placeholder="PO Box or street" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <input className={inputClass()} value={form.mailing_city} onChange={(e) => setField('mailing_city', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>State</Label>
                      <input className={inputClass()} value={form.mailing_state} onChange={(e) => setField('mailing_state', e.target.value)} placeholder="NC" maxLength={2} />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <input className={inputClass()} value={form.mailing_zip} onChange={(e) => setField('mailing_zip', e.target.value)} maxLength={10} />
                    </div>
                  </div>
                </div>
              )}

              <SectionTitle>Contact Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Business Phone</Label>
                  <input className={inputClass(!!errors.business_phone)} value={form.business_phone} onChange={(e) => setField('business_phone', e.target.value)} placeholder="(704) 555-0100" />
                  <FieldError message={errors.business_phone} />
                </div>
                <div>
                  <Label required>Business Email</Label>
                  <input type="email" className={inputClass(!!errors.business_email)} value={form.business_email} onChange={(e) => setField('business_email', e.target.value)} placeholder="info@company.com" />
                  <FieldError message={errors.business_email} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Website</Label>
                  <input className={inputClass()} value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://www.yourcompany.com (optional)" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Representative */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-[#132452] mb-1">Step 2: Contact &amp; Representative</h2>
              <p className="text-sm text-gray-500 mb-6">Who should we contact regarding this application?</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Primary Contact Name</Label>
                  <input className={inputClass(!!errors.primary_contact_name)} value={form.primary_contact_name} onChange={(e) => setField('primary_contact_name', e.target.value)} />
                  <FieldError message={errors.primary_contact_name} />
                </div>
                <div>
                  <Label>Title / Role</Label>
                  <input className={inputClass()} value={form.primary_title} onChange={(e) => setField('primary_title', e.target.value)} placeholder="Project Manager, Owner, etc." />
                </div>
                <div>
                  <Label required>Direct Phone</Label>
                  <input className={inputClass(!!errors.direct_phone)} value={form.direct_phone} onChange={(e) => setField('direct_phone', e.target.value)} placeholder="(704) 555-0101" />
                  <FieldError message={errors.direct_phone} />
                </div>
                <div>
                  <Label required>Direct Email</Label>
                  <input type="email" className={inputClass(!!errors.direct_email)} value={form.direct_email} onChange={(e) => setField('direct_email', e.target.value)} />
                  <FieldError message={errors.direct_email} />
                </div>
              </div>

              <SectionTitle>Emergency Contact</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  <input className={inputClass()} value={form.emergency_contact_name} onChange={(e) => setField('emergency_contact_name', e.target.value)} />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <input className={inputClass()} value={form.emergency_contact_phone} onChange={(e) => setField('emergency_contact_phone', e.target.value)} />
                </div>
              </div>

              <SectionTitle>Preferred Communication Method</SectionTitle>
              <div className="flex gap-6">
                {['Phone', 'Email', 'Text'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="preferred_comm"
                      value={opt}
                      checked={form.preferred_comm === opt}
                      onChange={() => setField('preferred_comm', opt)}
                      className="accent-[#fa8c41]"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Trade Experience */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-[#132452] mb-1">Step 3: Trade Experience</h2>
              <p className="text-sm text-gray-500 mb-6">Describe your trade capabilities and relevant project history.</p>

              <SectionTitle>Services Offered</SectionTitle>
              {errors.services && <p className="mb-2 text-xs text-red-600">{errors.services}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {SERVICES_LIST.map((svc) => (
                  <label key={svc} className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={form.services.includes(svc)}
                      onChange={() => toggleService(svc)}
                      className="accent-[#fa8c41] w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700 leading-snug">{svc}</span>
                  </label>
                ))}
              </div>
              {form.services.includes('Other') && (
                <div className="mb-4">
                  <Label>Describe Other Service</Label>
                  <input className={inputClass()} value={form.services_other_text} onChange={(e) => setField('services_other_text', e.target.value)} placeholder="Describe the service..." />
                </div>
              )}

              <SectionTitle>Service Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Service Area</Label>
                  <input className={inputClass()} value={form.service_area} onChange={(e) => setField('service_area', e.target.value)} placeholder="Charlotte Metro, 60-mile radius" />
                </div>
                <div>
                  <Label>Typical Project Size</Label>
                  <select className={selectClass()} value={form.typical_project_size} onChange={(e) => setField('typical_project_size', e.target.value)}>
                    <option value="">Select...</option>
                    <option>Under $5K</option>
                    <option>$5K-$25K</option>
                    <option>$25K-$100K</option>
                    <option>$100K+</option>
                  </select>
                </div>
                <div>
                  <Label>Largest Single Project Completed ($)</Label>
                  <input className={inputClass()} value={form.largest_project} onChange={(e) => setField('largest_project', e.target.value)} placeholder="500,000" />
                </div>
                <div>
                  <Label>Can you work on occupied properties?</Label>
                  <YesNoToggle value={form.occupied_properties} onChange={(v) => setField('occupied_properties', v)} name="occupied_properties" />
                </div>
                <div>
                  <Label>Can you work on commercial properties?</Label>
                  <YesNoToggle value={form.commercial_properties} onChange={(v) => setField('commercial_properties', v)} name="commercial_properties" />
                </div>
                <div>
                  <Label>Union or Non-Union?</Label>
                  <div className="flex gap-6">
                    {['Union', 'Non-Union'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="union_status"
                          value={opt}
                          checked={form.union_status === opt}
                          onChange={() => setField('union_status', opt)}
                          className="accent-[#fa8c41]"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <SectionTitle>Completed Projects</SectionTitle>
              <p className="text-xs text-gray-500 mb-4">At least 1 project required. Up to 4 projects.</p>
              {form.completed_projects.map((project, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[#132452]">Project {idx + 1}</h4>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label required={idx === 0}>Project Name</Label>
                      <input className={inputClass(!!errors[`project_${idx}_name`])} value={project.project_name} onChange={(e) => setProject(idx, 'project_name', e.target.value)} />
                      <FieldError message={errors[`project_${idx}_name`]} />
                    </div>
                    <div>
                      <Label>Property Address</Label>
                      <input className={inputClass()} value={project.property_address} onChange={(e) => setProject(idx, 'property_address', e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Scope of Work</Label>
                      <textarea rows={2} className={`${inputClass()} resize-none`} value={project.scope_of_work} onChange={(e) => setProject(idx, 'scope_of_work', e.target.value)} />
                    </div>
                    <div>
                      <Label>Contract Value ($)</Label>
                      <input className={inputClass()} value={project.contract_value} onChange={(e) => setProject(idx, 'contract_value', e.target.value)} placeholder="150,000" />
                    </div>
                    <div>
                      <Label>Project Type</Label>
                      <select className={selectClass()} value={project.project_type} onChange={(e) => setProject(idx, 'project_type', e.target.value)}>
                        <option value="">Select...</option>
                        <option>Residential Rehab</option>
                        <option>New Construction</option>
                        <option>Commercial</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <Label>Project Owner / GC Name</Label>
                      <input className={inputClass()} value={project.owner_gc_name} onChange={(e) => setProject(idx, 'owner_gc_name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Owner / GC Contact Phone</Label>
                      <input className={inputClass()} value={project.owner_gc_phone} onChange={(e) => setProject(idx, 'owner_gc_phone', e.target.value)} />
                    </div>
                    <div>
                      <Label>Completion Date</Label>
                      <input type="date" className={inputClass()} value={project.completion_date} onChange={(e) => setProject(idx, 'completion_date', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              {form.completed_projects.length < 4 && (
                <button
                  type="button"
                  onClick={addProject}
                  className="text-sm font-semibold text-[#fa8c41] hover:text-orange-600 border border-[#fa8c41] rounded-lg px-4 py-2 transition-colors"
                >
                  + Add Another Project
                </button>
              )}
            </div>
          )}

          {/* Step 4: Licenses, Insurance & Compliance */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-[#132452] mb-1">Step 4: Licenses, Insurance &amp; Compliance</h2>
              <p className="text-sm text-gray-500 mb-6">Upload current certificates and license documentation.</p>

              <SectionTitle>Licenses</SectionTitle>
              <div className="space-y-5">
                {/* GC License */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">General Contractor License</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <Label>License Number</Label>
                      <input className={inputClass()} value={form.gc_license_number} onChange={(e) => setField('gc_license_number', e.target.value)} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <input className={inputClass()} value={form.gc_license_state} onChange={(e) => setField('gc_license_state', e.target.value)} placeholder="NC" maxLength={2} />
                    </div>
                    <div>
                      <Label>Expiration Date</Label>
                      <input type="date" className={inputClass()} value={form.gc_license_expiration} onChange={(e) => setField('gc_license_expiration', e.target.value)} />
                    </div>
                  </div>
                  <FileUploadButton label="Upload GC License" docType="gc_license" value={form.gc_license_file} onChange={(path) => setField('gc_license_file', path)} />
                </div>

                {/* Specialty License */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Specialty License</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label>License Type</Label>
                      <input className={inputClass()} value={form.specialty_license_type} onChange={(e) => setField('specialty_license_type', e.target.value)} placeholder="Electrical, Plumbing, HVAC..." />
                    </div>
                    <div>
                      <Label>License Number</Label>
                      <input className={inputClass()} value={form.specialty_license_number} onChange={(e) => setField('specialty_license_number', e.target.value)} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <input className={inputClass()} value={form.specialty_license_state} onChange={(e) => setField('specialty_license_state', e.target.value)} placeholder="NC" maxLength={2} />
                    </div>
                    <div>
                      <Label>Expiration Date</Label>
                      <input type="date" className={inputClass()} value={form.specialty_license_expiration} onChange={(e) => setField('specialty_license_expiration', e.target.value)} />
                    </div>
                  </div>
                  <FileUploadButton label="Upload Specialty License" docType="specialty_license" value={form.specialty_license_file} onChange={(path) => setField('specialty_license_file', path)} />
                </div>

                {/* Business License */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Business License</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <Label>License Number</Label>
                      <input className={inputClass()} value={form.business_license_number} onChange={(e) => setField('business_license_number', e.target.value)} />
                    </div>
                    <div>
                      <Label>Jurisdiction</Label>
                      <input className={inputClass()} value={form.business_license_jurisdiction} onChange={(e) => setField('business_license_jurisdiction', e.target.value)} placeholder="City of Charlotte" />
                    </div>
                    <div>
                      <Label>Expiration Date</Label>
                      <input type="date" className={inputClass()} value={form.business_license_expiration} onChange={(e) => setField('business_license_expiration', e.target.value)} />
                    </div>
                  </div>
                  <FileUploadButton label="Upload Business License" docType="business_license" value={form.business_license_file} onChange={(path) => setField('business_license_file', path)} />
                </div>
              </div>

              <SectionTitle>General Liability Insurance</SectionTitle>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label required>Carrier Name</Label>
                    <input className={inputClass(!!errors.gl_carrier)} value={form.gl_carrier} onChange={(e) => setField('gl_carrier', e.target.value)} />
                    <FieldError message={errors.gl_carrier} />
                  </div>
                  <div>
                    <Label required>Policy Number</Label>
                    <input className={inputClass(!!errors.gl_policy_number)} value={form.gl_policy_number} onChange={(e) => setField('gl_policy_number', e.target.value)} />
                    <FieldError message={errors.gl_policy_number} />
                  </div>
                  <div>
                    <Label required>Coverage Amount ($)</Label>
                    <input className={inputClass(!!errors.gl_coverage_amount)} value={form.gl_coverage_amount} onChange={(e) => setField('gl_coverage_amount', e.target.value)} placeholder="1,000,000" />
                    <FieldError message={errors.gl_coverage_amount} />
                  </div>
                  <div>
                    <Label required>Expiration Date</Label>
                    <input type="date" className={inputClass(!!errors.gl_expiration)} value={form.gl_expiration} onChange={(e) => setField('gl_expiration', e.target.value)} />
                    <FieldError message={errors.gl_expiration} />
                  </div>
                </div>
                <FileUploadButton label="Upload GL Certificate" docType="gl_certificate" value={form.gl_certificate_file} onChange={(path) => setField('gl_certificate_file', path)} />
              </div>

              <SectionTitle>Workers Compensation</SectionTitle>
              <div className="mb-3">
                <Label>Do you have employees?</Label>
                <YesNoToggle value={form.has_employees} onChange={(v) => setField('has_employees', v)} name="has_employees" />
              </div>
              {form.has_employees === 'Yes' ? (
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <Label>Carrier Name</Label>
                      <input className={inputClass()} value={form.wc_carrier} onChange={(e) => setField('wc_carrier', e.target.value)} />
                    </div>
                    <div>
                      <Label>Policy Number</Label>
                      <input className={inputClass()} value={form.wc_policy_number} onChange={(e) => setField('wc_policy_number', e.target.value)} />
                    </div>
                    <div>
                      <Label>Expiration Date</Label>
                      <input type="date" className={inputClass()} value={form.wc_expiration} onChange={(e) => setField('wc_expiration', e.target.value)} />
                    </div>
                  </div>
                  <FileUploadButton label="Upload WC Certificate" docType="wc_certificate" value={form.wc_certificate_file} onChange={(path) => setField('wc_certificate_file', path)} />
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label>Exemption Reason</Label>
                  <input className={inputClass()} value={form.wc_exemption_reason} onChange={(e) => setField('wc_exemption_reason', e.target.value)} placeholder="Sole proprietor — exempt" />
                </div>
              )}

              <SectionTitle>Auto Liability Insurance (Optional)</SectionTitle>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>Carrier</Label>
                    <input className={inputClass()} value={form.auto_carrier} onChange={(e) => setField('auto_carrier', e.target.value)} />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <input className={inputClass()} value={form.auto_policy_number} onChange={(e) => setField('auto_policy_number', e.target.value)} />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <input type="date" className={inputClass()} value={form.auto_expiration} onChange={(e) => setField('auto_expiration', e.target.value)} />
                  </div>
                  <div>
                    <Label>Coverage Amount ($)</Label>
                    <input className={inputClass()} value={form.auto_coverage_amount} onChange={(e) => setField('auto_coverage_amount', e.target.value)} />
                  </div>
                </div>
                <FileUploadButton label="Upload Auto Certificate" docType="auto_insurance" value={form.auto_file} onChange={(path) => setField('auto_file', path)} />
              </div>

              <SectionTitle>Umbrella / Excess Insurance (Optional)</SectionTitle>
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>Carrier</Label>
                    <input className={inputClass()} value={form.umbrella_carrier} onChange={(e) => setField('umbrella_carrier', e.target.value)} />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <input className={inputClass()} value={form.umbrella_policy_number} onChange={(e) => setField('umbrella_policy_number', e.target.value)} />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <input type="date" className={inputClass()} value={form.umbrella_expiration} onChange={(e) => setField('umbrella_expiration', e.target.value)} />
                  </div>
                  <div>
                    <Label>Coverage Amount ($)</Label>
                    <input className={inputClass()} value={form.umbrella_coverage_amount} onChange={(e) => setField('umbrella_coverage_amount', e.target.value)} />
                  </div>
                </div>
                <FileUploadButton label="Upload Umbrella Certificate" docType="umbrella_insurance" value={form.umbrella_file} onChange={(path) => setField('umbrella_file', path)} />
              </div>

              <SectionTitle>W-9 / Taxpayer Identification</SectionTitle>
              <div className={`border rounded-xl p-4 ${errors.w9_file ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  W-9 / Request for Taxpayer Identification Number and Certification <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Your W-9 is required for payment processing. Southern Cities uses this for 1099 reporting.
                </p>
                <FileUploadButton label="Upload W-9" docType="w9" value={form.w9_file} onChange={(path) => setField('w9_file', path)} />
                <FieldError message={errors.w9_file} />
              </div>

              <SectionTitle>Safety &amp; Compliance</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>OSHA 10 Certified?</Label>
                  <YesNoToggle value={form.osha_10} onChange={(v) => setField('osha_10', v)} name="osha_10" />
                </div>
                <div>
                  <Label>OSHA 30 Certified?</Label>
                  <YesNoToggle value={form.osha_30} onChange={(v) => setField('osha_30', v)} name="osha_30" />
                </div>
                <div>
                  <Label>Written Safety Program?</Label>
                  <YesNoToggle value={form.written_safety_program} onChange={(v) => setField('written_safety_program', v)} name="written_safety_program" />
                </div>
                <div>
                  <Label>EMR (Experience Modification Rate)</Label>
                  <input type="number" step="0.01" min="0" className={inputClass()} value={form.emr} onChange={(e) => setField('emr', e.target.value)} placeholder="0.85 (optional)" />
                </div>
                <div className="sm:col-span-2">
                  <Label>OSHA Citations in Past 3 Years?</Label>
                  <YesNoToggle value={form.osha_citations} onChange={(v) => setField('osha_citations', v)} name="osha_citations" />
                </div>
                {form.osha_citations === 'Yes' && (
                  <div className="sm:col-span-2">
                    <Label>Describe Citations</Label>
                    <textarea
                      rows={3}
                      className={`${inputClass()} resize-none`}
                      value={form.osha_citations_description}
                      onChange={(e) => setField('osha_citations_description', e.target.value)}
                      placeholder="Describe the citation(s), corrective actions taken, and current status..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Payment & References */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-[#132452] mb-1">Step 5: Payment &amp; References</h2>
              <p className="text-sm text-gray-500 mb-6">Provide payment preferences and professional references.</p>

              <SectionTitle>Wire Transfer / ACH</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-200 rounded-xl p-4">
                <div>
                  <Label>Bank Name</Label>
                  <input className={inputClass()} value={form.bank_name} onChange={(e) => setField('bank_name', e.target.value)} placeholder="First National Bank" />
                </div>
                <div>
                  <Label>Account Holder Name</Label>
                  <input className={inputClass()} value={form.account_holder_name} onChange={(e) => setField('account_holder_name', e.target.value)} />
                </div>
                <div>
                  <Label>ABA Routing Number (9 digits)</Label>
                  <input className={inputClass()} value={form.aba_routing} onChange={(e) => setField('aba_routing', e.target.value)} placeholder="021000021" maxLength={9} />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <input className={inputClass()} value={form.account_number} onChange={(e) => setField('account_number', e.target.value)} />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <div className="flex gap-6">
                    {['Checking', 'Savings'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="account_type"
                          value={opt}
                          checked={form.account_type === opt}
                          onChange={() => setField('account_type', opt)}
                          className="accent-[#fa8c41]"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <SectionTitle>Alternative Payment Methods</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Zelle (Phone or Email)</Label>
                  <input className={inputClass()} value={form.zelle_contact} onChange={(e) => setField('zelle_contact', e.target.value)} placeholder="(704) 555-0100 or email" />
                </div>
                <div>
                  <Label>Venmo Handle</Label>
                  <input className={inputClass()} value={form.venmo_handle} onChange={(e) => setField('venmo_handle', e.target.value)} placeholder="@handle" />
                </div>
                <div>
                  <Label>CashApp (Optional)</Label>
                  <input className={inputClass()} value={form.cashapp_tag} onChange={(e) => setField('cashapp_tag', e.target.value)} placeholder="$Cashtag" />
                </div>
                <div>
                  <Label>Check Payable To</Label>
                  <input className={inputClass()} value={form.check_payable_to} onChange={(e) => setField('check_payable_to', e.target.value)} placeholder="Legal business name or owner name" />
                </div>
              </div>

              <SectionTitle>Professional References</SectionTitle>
              <p className="text-xs text-gray-500 mb-4">Two references are required. Do not list family members.</p>
              {form.references.map((ref, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-bold text-[#132452] mb-3">Reference {idx + 1}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label required>Contact Name</Label>
                      <input className={inputClass(!!errors[`ref_${idx}_contact_name`])} value={ref.contact_name} onChange={(e) => setReference(idx, 'contact_name', e.target.value)} />
                      <FieldError message={errors[`ref_${idx}_contact_name`]} />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <input className={inputClass()} value={ref.company_name} onChange={(e) => setReference(idx, 'company_name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <select className={selectClass()} value={ref.relationship} onChange={(e) => setReference(idx, 'relationship', e.target.value)}>
                        <option value="">Select...</option>
                        <option>General Contractor</option>
                        <option>Owner</option>
                        <option>Project Manager</option>
                        <option>Supplier</option>
                      </select>
                    </div>
                    <div>
                      <Label required>Phone</Label>
                      <input className={inputClass(!!errors[`ref_${idx}_phone`])} value={ref.phone} onChange={(e) => setReference(idx, 'phone', e.target.value)} />
                      <FieldError message={errors[`ref_${idx}_phone`]} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <input type="email" className={inputClass()} value={ref.email} onChange={(e) => setReference(idx, 'email', e.target.value)} />
                    </div>
                    <div>
                      <Label>Years Known</Label>
                      <input type="number" min="0" className={inputClass()} value={ref.years_known} onChange={(e) => setReference(idx, 'years_known', e.target.value)} placeholder="3" />
                    </div>
                  </div>
                </div>
              ))}

              <SectionTitle>Agreement &amp; Certification</SectionTitle>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-4">
                {[
                  { field: 'agree_accurate' as keyof FormState, text: 'I certify that all information provided is accurate and complete.' },
                  { field: 'agree_authorize' as keyof FormState, text: 'I authorize Southern Cities Construction LLC to verify the information provided.' },
                  { field: 'agree_false_statements' as keyof FormState, text: 'I understand that false statements may result in immediate disqualification.' },
                ].map(({ field, text }) => (
                  <div key={field}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[field] as boolean}
                        onChange={(e) => setField(field, e.target.checked)}
                        className="accent-[#fa8c41] w-4 h-4 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">{text}</span>
                    </label>
                    <FieldError message={errors[field]} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Digital Signature (Type Full Name)</Label>
                  <input
                    className={inputClass(!!errors.digital_signature)}
                    value={form.digital_signature}
                    onChange={(e) => setField('digital_signature', e.target.value)}
                    placeholder="Your full legal name"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  />
                  <FieldError message={errors.digital_signature} />
                </div>
                <div>
                  <Label>Date</Label>
                  <input type="date" className={`${inputClass()} bg-gray-100 cursor-not-allowed`} value={form.signature_date} readOnly />
                </div>
              </div>

              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">Step {step} of 5</span>
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#132452] rounded-lg hover:bg-[#1a3170] transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#fa8c41] rounded-lg hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
