import { ONBOARDING_STEPS, TOTAL_ANSWERED_STEPS, TOTAL_ONBOARDING_STEPS } from '../../src/onboarding/onboarding.types';

describe('onboarding.types — ONBOARDING_STEPS well-formedness', () => {
  it('has exactly 11 answerable steps, numbered 1..11 with no gaps or duplicates', () => {
    const numbers = ONBOARDING_STEPS.map((s) => s.stepNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('every step has a unique, non-empty stepKey', () => {
    const keys = ONBOARDING_STEPS.map((s) => s.stepKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key.length).toBeGreaterThan(0);
  });

  it('TOTAL_ANSWERED_STEPS matches the array length, and TOTAL_ONBOARDING_STEPS accounts for the 2 system-generated steps', () => {
    expect(TOTAL_ANSWERED_STEPS).toBe(ONBOARDING_STEPS.length);
    expect(TOTAL_ONBOARDING_STEPS).toBe(TOTAL_ANSWERED_STEPS + 2);
  });
});
