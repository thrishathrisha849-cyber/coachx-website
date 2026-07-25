import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getEmailAdapter } from '../auth/email.port';
import { generateSecureToken, hashToken } from '../auth/secure-token.util';
import {
  upsertNewsletterSubscriber,
  findSubscriberByUnsubscribeTokenHash,
  markSubscriberUnsubscribed,
  recordConsent,
} from './cms.repository';

const CONSENT_POLICY_VERSION = '1.0';

/**
 * Footer/blog newsletter capture (page list's "Newsletter" item; FR-008).
 * Duplicate-safe (upsert by normalized email), consent timestamped and
 * source-tracked, and — Phase 5 Part 2 — issues a safe, per-subscriber
 * unsubscribe token (see `schema.prisma`'s `NewsletterSubscriber`
 * comment for why this is not email-based).
 *
 * `honeypotValue` is the hidden form field a real user never fills; a
 * non-empty value silently no-ops (returns success to the caller
 * without actually subscribing) rather than returning a distinguishing
 * error a bot could learn from — the same "identical response" pattern
 * already established for enumeration-safety elsewhere (auth
 * password-reset, this module's own consent-safe design).
 */
export async function subscribeToNewsletter(
  email: string,
  ipAddress: string | null,
  honeypotValue?: string,
): Promise<void> {
  if (honeypotValue) {
    return; // Spam-protection foundation: silent no-op, not an error.
  }

  const normalizedEmail = email.trim().toLowerCase();
  const rawUnsubscribeToken = generateSecureToken();
  const unsubscribeTokenHash = hashToken(rawUnsubscribeToken);

  await upsertNewsletterSubscriber(normalizedEmail, unsubscribeTokenHash);

  await recordConsent({
    email: normalizedEmail,
    channel: 'MARKETING_EMAIL',
    policyVersion: CONSENT_POLICY_VERSION,
    source: 'newsletter_signup',
    ipAddress,
  });

  await getEmailAdapter().send({
    to: normalizedEmail,
    subject: "You're subscribed",
    text: `You're now subscribed to the CoachX newsletter. To unsubscribe at any time, use this link: /newsletter/unsubscribe?token=${rawUnsubscribeToken}`,
  });
}

/**
 * Safe unsubscribe (Phase 5 Part 2 §"NEWSLETTER"). Token-based, not
 * email-based — verified by hash lookup, same pattern as Phase 4's
 * password-reset/email-verification tokens. Idempotent: unsubscribing
 * an already-unsubscribed token succeeds silently rather than erroring,
 * since the end state the caller wants ("I am unsubscribed") is already
 * true.
 */
export async function unsubscribeFromNewsletter(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const subscriber = await findSubscriberByUnsubscribeTokenHash(tokenHash);

  if (!subscriber) {
    throw AppError.notFound('Invalid or expired unsubscribe link');
  }

  if (!subscriber.unsubscribedAt) {
    await markSubscriberUnsubscribed(subscriber.id);
    await recordAuditEvent({
      actorType: 'UNKNOWN',
      action: 'cms.newsletter.unsubscribed',
      resourceType: 'newsletter_subscriber',
      resourceId: subscriber.id,
    });
  }
}
