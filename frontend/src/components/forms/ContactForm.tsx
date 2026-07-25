import { useState, type FormEvent } from 'react';
import { submitContactForm } from '@/api/cms.api';
import type { NormalizedApiError } from '@/api/client';

const DEPARTMENTS = [
  { value: 'GENERAL_ENQUIRY', label: 'General Enquiry' },
  { value: 'MEMBERSHIP', label: 'Membership' },
  { value: 'COURSE', label: 'Course' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'CORPORATE_TRAINING', label: 'Corporate Training' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
] as const;

interface FormState {
  name: string;
  email: string;
  phone: string;
  department: (typeof DEPARTMENTS)[number]['value'];
  message: string;
  consent: boolean;
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  department: 'GENERAL_ENQUIRY',
  message: '',
  consent: false,
};

/** 002 FR-053, FR-081, FR-082: contact form with department selection. */
export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.message.trim().length < 10) errors.message = 'Please provide a bit more detail (10+ characters).';
    if (!form.consent) errors.consent = 'Please accept to be contacted about this enquiry.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    if (!validate()) return;

    setStatus('submitting');
    setServerError(null);

    try {
      await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        department: form.department,
        message: form.message.trim(),
        consent: true,
      });
      setStatus('success');
      setForm(initialState);
    } catch (err) {
      setStatus('error');
      setServerError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        Thanks — we received your message and will respond soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Full name <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onBlur={validate}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
        />
        {fieldErrors.name && <p id="contact-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          onBlur={validate}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
        />
        {fieldErrors.email && <p id="contact-email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Phone (optional)
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div>
        <label htmlFor="contact-department" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Department
        </label>
        <select
          id="contact-department"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value as FormState['department'] }))}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          onBlur={validate}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
        />
        {fieldErrors.message && <p id="contact-message-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.message}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          className="mt-0.5"
        />
        I agree to be contacted regarding this enquiry.
      </label>
      {fieldErrors.consent && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.consent}</p>}

      {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
