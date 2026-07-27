import { axe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

/**
 * Shared accessibility-assertion helper (Phase 5 Part 2 §"TESTING":
 * "Accessibility tests"). Runs axe-core against a rendered container
 * and fails the test with axe's own violation report if anything is
 * found — not a fake/vacuous check.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
