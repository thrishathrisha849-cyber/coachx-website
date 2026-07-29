import { recordAuditEvent } from '../database/audit-event.repository';
import { recordConsent } from '../cms/cms.repository';
import { getEmailAdapter } from '../auth/email.port';
import { findLead, createLead, hasActiveConsent, withdrawConsent } from './funnel.repository';

const CONSENT_POLICY_VERSION = '1.0';

export interface LeadCaptureInput {
  leadMagnetSlug: string;
  email: string;
  name?: string;
  mobile?: string;
  profession?: string;
  businessStage?: string;
  interest?: string;
  consentMarketingEmail: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referralCode?: string;
  affiliateId?: string;
  landingPageVariant?: string;
  ipAddress: string | null;
  honeypotValue?: string;
}

export interface LeadCaptureResult {
  leadId: string;
  alreadyCaptured: boolean;
}

/**
 * 002 FR-055/FR-056, US2. Duplicate-submission handling (edge case: a
 * double-click or resubmit) is the `(leadMagnetSlug, email)` unique
 * constraint — a second submission for the same magnet+email replays
 * the existing lead (no second row, no second resource email) rather
 * than erroring or silently duplicating a send.
 *
 * FR-099 acceptance scenario 3: the transactional resource-delivery
 * email is ALWAYS sent (the visitor asked for the resource); the
 * marketing follow-on sequence (program recommendation, webinar upsell)
 * is gated strictly on `consentMarketingEmail` — Constitution Article VI.
 */
export async function captureLeadMagnetSubmission(input: LeadCaptureInput): Promise<LeadCaptureResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (input.honeypotValue) {
    // Spam-protection: identical success response, no record created —
    // same pattern as newsletter/contact-form honeypot handling.
    return { leadId: 'noop', alreadyCaptured: false };
  }

  const existing = await findLead(input.leadMagnetSlug, normalizedEmail);
  if (existing) {
    return { leadId: existing.id, alreadyCaptured: true };
  }

  const lead = await createLead({
    email: normalizedEmail,
    leadMagnetSlug: input.leadMagnetSlug,
    name: input.name,
    mobile: input.mobile,
    profession: input.profession,
    businessStage: input.businessStage,
    interest: input.interest,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmTerm: input.utmTerm,
    utmContent: input.utmContent,
    referralCode: input.referralCode,
    affiliateId: input.affiliateId,
    landingPageVariant: input.landingPageVariant,
  });

  await recordConsent({
    email: normalizedEmail,
    channel: 'MARKETING_EMAIL',
    policyVersion: CONSENT_POLICY_VERSION,
    source: `lead_magnet:${input.leadMagnetSlug}`,
    ipAddress: input.ipAddress,
  });
  if (!input.consentMarketingEmail) {
    // Explicit withdrawal-equivalent: the visitor did NOT check the box,
    // so the just-created grant record is immediately marked withdrawn
    // rather than left as a false "granted" row — the ONLY state that
    // should ever read as "consented" is an explicit, checked opt-in.
    await withdrawConsent(normalizedEmail, 'MARKETING_EMAIL');
  }

  await recordAuditEvent({
    actorType: 'USER',
    actorId: lead.id,
    action: 'funnel.lead_captured',
    resourceType: 'lead',
    resourceId: lead.id,
    afterState: { leadMagnetSlug: input.leadMagnetSlug, utmCampaign: input.utmCampaign },
  });

  // FR-056: resource-delivery email is transactional, always sent.
  await getEmailAdapter().send({
    to: normalizedEmail,
    subject: 'Your resource is ready',
    text: `Thanks for requesting this resource! Here is your download link: /resources/${input.leadMagnetSlug}/download`,
  });

  // FR-099 acceptance scenario 3: marketing follow-on ONLY if consented.
  const consented = await hasActiveConsent(normalizedEmail, 'MARKETING_EMAIL');
  if (consented) {
    await getEmailAdapter().send({
      to: normalizedEmail,
      subject: 'Recommended for you',
      text: 'Based on the resource you downloaded, here is a program we think you\'ll love.',
    });
  }

  return { leadId: lead.id, alreadyCaptured: false };
}
