import { assertValidEnrollmentTransition, isEnrollmentAccessWindowOpen } from '../../src/lms/enrollment.policy';
import { AppError } from '../../src/utils/app-error';

describe('enrollment.policy — assertValidEnrollmentTransition()', () => {
  it('allows the documented happy-path chain: PENDING -> ACTIVE -> COMPLETED', () => {
    expect(() => assertValidEnrollmentTransition('PENDING', 'ACTIVE')).not.toThrow();
    expect(() => assertValidEnrollmentTransition('ACTIVE', 'COMPLETED')).not.toThrow();
  });

  it('allows ACTIVE -> SUSPENDED -> ACTIVE (temporary suspension and reinstatement)', () => {
    expect(() => assertValidEnrollmentTransition('ACTIVE', 'SUSPENDED')).not.toThrow();
    expect(() => assertValidEnrollmentTransition('SUSPENDED', 'ACTIVE')).not.toThrow();
  });

  it('allows an admin to reopen a COMPLETED enrollment back to ACTIVE (reset-progress override path)', () => {
    expect(() => assertValidEnrollmentTransition('COMPLETED', 'ACTIVE')).not.toThrow();
  });

  it('rejects CANCELLED as a terminal state — no transition out', () => {
    expect(() => assertValidEnrollmentTransition('CANCELLED', 'ACTIVE')).toThrow(AppError);
  });

  it('rejects REVOKED as a terminal state — no transition out', () => {
    expect(() => assertValidEnrollmentTransition('REVOKED', 'ACTIVE')).toThrow(AppError);
  });

  it('rejects skipping straight from PENDING to COMPLETED', () => {
    expect(() => assertValidEnrollmentTransition('PENDING', 'COMPLETED')).toThrow(AppError);
  });

  it('rejects an unknown "from" state entirely (defensive default)', () => {
    expect(() => assertValidEnrollmentTransition('NOT_A_REAL_STATE', 'ACTIVE')).toThrow(AppError);
  });
});

describe('enrollment.policy — isEnrollmentAccessWindowOpen() (fail-closed via timestamps, no scheduler required)', () => {
  it('is open with no start/end window configured (lifetime access)', () => {
    expect(isEnrollmentAccessWindowOpen({ accessStartAt: null, accessEndAt: null })).toBe(true);
  });

  it('is NOT open before accessStartAt', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isEnrollmentAccessWindowOpen({ accessStartAt: future, accessEndAt: null })).toBe(false);
  });

  it('is open once accessStartAt has passed', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isEnrollmentAccessWindowOpen({ accessStartAt: past, accessEndAt: null })).toBe(true);
  });

  it('is NOT open once accessEndAt has passed — even though no background job has updated the stored status', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isEnrollmentAccessWindowOpen({ accessStartAt: null, accessEndAt: past })).toBe(false);
  });

  it('is open exactly up until accessEndAt (boundary: not-yet-expired)', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isEnrollmentAccessWindowOpen({ accessStartAt: null, accessEndAt: future })).toBe(true);
  });
});
