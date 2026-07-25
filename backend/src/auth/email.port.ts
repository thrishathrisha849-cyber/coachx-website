import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Email-delivery port (Phase 4 brief §7/§14). Auth flows depend only on
 * this interface, never on a concrete provider — 003/spec.md's own
 * Assumptions explicitly defer real SMS/email delivery infrastructure to
 * "a shared communications platform referenced elsewhere in the PRD"
 * (Volume 14's Communication Platform, not yet built). This port is the
 * seam that platform will plug into later; today only a development
 * (console-log) implementation exists.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body only for Phase 4 — no HTML template engine is wired up yet. */
  text: string;
}

export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development implementation — logs the message (redacted of nothing
 * sensitive; verification/reset links are logged deliberately so a
 * developer can complete the flow without a real inbox) instead of
 * calling any real provider. Clearly non-production: never selected
 * when `NODE_ENV=production`.
 */
class DevEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<void> {
    logger.info('DEV EMAIL (not actually sent — no email provider configured)', {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}

/**
 * Test implementation — captures sent messages in memory for assertions,
 * sends nothing anywhere. Used by the integration test suite.
 */
export class InMemoryEmailAdapter implements EmailPort {
  public readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  clear(): void {
    this.sent.length = 0;
  }
}

/**
 * Fails safely (Phase 4 brief §14: "Fail safely when production provider
 * configuration is missing") rather than silently pretending delivery
 * succeeded — a production deployment with no real email provider wired
 * up is a genuine configuration error the operator must fix, not a
 * condition this code should paper over with a fake "sent" log line.
 */
class UnconfiguredProductionEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<void> {
    logger.error('Email delivery attempted with no production provider configured', {
      to: message.to,
      subject: message.subject,
    });
    throw new Error(
      'No production email provider is configured. Refusing to fake a successful send in production mode.',
    );
  }
}

let activeAdapter: EmailPort | null = null;

export function getEmailAdapter(): EmailPort {
  if (activeAdapter) return activeAdapter;

  activeAdapter = config.isProduction ? new UnconfiguredProductionEmailAdapter() : new DevEmailAdapter();
  return activeAdapter;
}

/** Test-only escape hatch — swaps in an `InMemoryEmailAdapter` (or any other) for assertions. */
export function __setEmailAdapterForTests(adapter: EmailPort | null): void {
  activeAdapter = adapter;
}
