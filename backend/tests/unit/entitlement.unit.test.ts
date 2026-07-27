import { evaluateEntitlement } from '../../src/lms/entitlement.service';

describe('entitlement.service — evaluateEntitlement() (fail-closed entitlement boundary)', () => {
  it('ALLOWs FREE source on a FREE-priced course', () => {
    const decision = evaluateEntitlement('FREE', { priceType: 'FREE' });
    expect(decision.status).toBe('ALLOWED');
  });

  it('DENIES FREE source on a PAID-priced course', () => {
    const decision = evaluateEntitlement('FREE', { priceType: 'PAID' });
    expect(decision.status).toBe('DENIED');
  });

  it('ALLOWs ADMIN_GRANT regardless of course price type', () => {
    expect(evaluateEntitlement('ADMIN_GRANT', { priceType: 'PAID' }).status).toBe('ALLOWED');
    expect(evaluateEntitlement('ADMIN_GRANT', { priceType: 'FREE' }).status).toBe('ALLOWED');
  });

  // The core Part 2B requirement: every source that would require Feature
  // 009 (or a future Program/Organization feature) MUST be UNAVAILABLE,
  // never fabricated as ALLOWED — this is what "fail-closed" and "do not
  // fake paid entitlement approval" mean operationally.
  it.each(['MEMBERSHIP', 'PURCHASE', 'PROGRAM', 'ORGANIZATION', 'COUPON', 'SCHOLARSHIP', 'TRIAL', 'INVITE'])(
    'fails CLOSED (UNAVAILABLE, never ALLOWED) for source %s — no owning system exists in this phase',
    (source) => {
      const decision = evaluateEntitlement(source, { priceType: 'PAID' });
      expect(decision.status).toBe('UNAVAILABLE');
      expect(decision.status).not.toBe('ALLOWED');
    },
  );

  it('never returns ALLOWED for an unrecognized/unknown source string', () => {
    const decision = evaluateEntitlement('SOME_MADE_UP_SOURCE', { priceType: 'FREE' });
    expect(decision.status).not.toBe('ALLOWED');
  });

  it('every decision carries an evaluatedAt timestamp and echoes the source for audit purposes', () => {
    const decision = evaluateEntitlement('PURCHASE', { priceType: 'PAID' });
    expect(decision.evaluatedAt).toBeInstanceOf(Date);
    expect(decision.source).toBe('PURCHASE');
    expect(typeof decision.reason).toBe('string');
    expect(decision.reason.length).toBeGreaterThan(0);
  });
});
