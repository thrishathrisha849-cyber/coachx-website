import { getEmailAdapter } from '../auth/email.port';
import { createContactSubmission, recordConsent } from './cms.repository';

const CONSENT_POLICY_VERSION = '1.0';

export interface ContactSubmitInput {
  name: string;
  email: string;
  phone?: string;
  department: string;
  message: string;
  ipAddress: string | null;
  /** Honeypot spam-protection field — see newsletter.service.ts's identical pattern. */
  honeypotValue?: string;
}

/**
 * 002 FR-053: Contact page submission — creates a minimal submission
 * record (not a full CRM ticket, see docs/public-site/DECISION_GATES.md),
 * sends a confirmation email (reusing Phase 4's `EmailPort` abstraction
 * rather than inventing a second email mechanism), and records
 * per-channel consent (Constitution Article VI, FR-101/102).
 *
 * Spam-protection foundation (Phase 5 Part 2): a filled honeypot field
 * silently no-ops — the caller still sees a normal success response
 * (enumeration/bot-detection-safe: nothing distinguishes a honeypot
 * rejection from a real submission).
 */
export async function submitContactForm(input: ContactSubmitInput): Promise<void> {
  if (input.honeypotValue) {
    return;
  }

  await createContactSubmission({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    department: input.department,
    message: input.message,
    ipAddress: input.ipAddress,
  });

  await recordConsent({
    email: input.email.toLowerCase(),
    channel: 'TERMS',
    policyVersion: CONSENT_POLICY_VERSION,
    source: 'contact_form',
    ipAddress: input.ipAddress,
  });

  await getEmailAdapter().send({
    to: input.email,
    subject: 'We received your message',
    text: `Hi ${input.name},\n\nThanks for contacting us. Our ${input.department.toLowerCase().replace(/_/g, ' ')} team will respond soon.\n\nYour message:\n${input.message}`,
  });
}
