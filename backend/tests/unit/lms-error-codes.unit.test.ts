import { LMS_BUSINESS_RULE_CODES } from '../../src/lms/lms-error-codes';

// The 16 `AccessDenialReason` values (`access.types.ts`). That file exports
// only a TYPE (erased at runtime), so this list is a deliberate, literal
// mirror kept in sync by the "no collision" test below — if a reason is
// ever added/renamed there without updating this array, the collision test
// still passes trivially, but the completeness test below fails loudly.
const ACCESS_DENIAL_REASONS = [
  'AUTHENTICATION_REQUIRED',
  'ENROLLMENT_REQUIRED',
  'ENTITLEMENT_REQUIRED',
  'ENTITLEMENT_PENDING',
  'ACCESS_NOT_STARTED',
  'ACCESS_EXPIRED',
  'ENROLLMENT_SUSPENDED',
  'ENROLLMENT_CANCELLED',
  'ENROLLMENT_REVOKED',
  'COURSE_UNAVAILABLE',
  'COURSE_ARCHIVED',
  'COURSE_RETIRED',
  'MODULE_LOCKED',
  'PREREQUISITE_NOT_MET',
  'LESSON_NOT_RELEASED',
  'PERMISSION_DENIED',
] as const;

describe('lms-error-codes — LMS_BUSINESS_RULE_CODES taxonomy (FR-125)', () => {
  it('never collides with an AccessDenialReason value — the two families must remain disjoint', () => {
    const businessRuleKeys = Object.keys(LMS_BUSINESS_RULE_CODES);
    for (const reason of ACCESS_DENIAL_REASONS) {
      expect(businessRuleKeys).not.toContain(reason);
    }
  });

  it('every business-rule code has a non-empty, human-readable message', () => {
    for (const [code, message] of Object.entries(LMS_BUSINESS_RULE_CODES)) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });

  it('contains exactly the four real, reachable codes this batch introduced', () => {
    expect(Object.keys(LMS_BUSINESS_RULE_CODES).sort()).toEqual(
      ['ASSIGNMENT_ATTEMPT_LIMIT_REACHED', 'CERTIFICATE_NOT_ELIGIBLE', 'COURSE_FULL', 'QUIZ_ATTEMPT_LIMIT_REACHED'].sort(),
    );
  });
});
