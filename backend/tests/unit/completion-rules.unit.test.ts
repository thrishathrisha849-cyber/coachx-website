import { getEffectiveCompletionRules } from '../../src/lms/completion.service';

describe('completion.service — getEffectiveCompletionRules() (Correction 4: multi-condition support, FR-052)', () => {
  it('falls back to the singular completionRuleType when completionRuleTypes is empty (backward compatibility)', () => {
    const rules = getEffectiveCompletionRules({ completionRuleType: 'MINIMUM_WATCH_PERCENT', completionRuleTypes: [] });
    expect(rules).toEqual(['MINIMUM_WATCH_PERCENT']);
  });

  it('uses the array field as authoritative when non-empty, ignoring the singular field', () => {
    const rules = getEffectiveCompletionRules({
      completionRuleType: 'MANUAL',
      completionRuleTypes: ['MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED'],
    });
    expect(rules).toEqual(['MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED']);
  });

  it('supports a single-element array identically to the singular fallback', () => {
    const rules = getEffectiveCompletionRules({ completionRuleType: 'MANUAL', completionRuleTypes: ['INSTRUCTOR_APPROVAL'] });
    expect(rules).toEqual(['INSTRUCTOR_APPROVAL']);
  });

  it('preserves a genuine multi-condition combination exactly as configured (FR-052: "combine multiple required conditions")', () => {
    const rules = getEffectiveCompletionRules({
      completionRuleType: 'MANUAL',
      completionRuleTypes: ['MANUAL', 'MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED'],
    });
    expect(rules).toHaveLength(3);
    expect(rules).toContain('MANUAL');
    expect(rules).toContain('MINIMUM_WATCH_PERCENT');
    expect(rules).toContain('ALL_ACTIVITIES_VIEWED');
  });
});
