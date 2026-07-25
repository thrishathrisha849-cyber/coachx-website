import { validateBlockData } from '../../src/cms/block-schemas';

describe('block-schemas — validateBlockData()', () => {
  it('accepts a valid HERO block', () => {
    const result = validateBlockData('HERO', {
      headline: 'Build your business',
      primaryCta: { label: 'Start Free', url: '/signup' },
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a HERO block missing the required headline', () => {
    const result = validateBlockData('HERO', {});
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('rejects a STATS block item with no sourceNote (FR-014/FR-111: no fabricated metrics)', () => {
    const result = validateBlockData('STATS', {
      items: [{ label: 'Members', value: '10,000+' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.includes('sourceNote'))).toBe(true);
  });

  it('accepts a STATS block item with a sourceNote', () => {
    const result = validateBlockData('STATS', {
      items: [{ label: 'Members', value: '10,000+', sourceNote: 'Admin dashboard user count, 2026-07-01' }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a TESTIMONIALS item without explicit consent', () => {
    const result = validateBlockData('TESTIMONIALS', {
      items: [{ name: 'Priya', format: 'text', quote: 'Great platform', consentGiven: false }],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts a TESTIMONIALS item with consent given', () => {
    const result = validateBlockData('TESTIMONIALS', {
      items: [{ name: 'Priya', format: 'text', quote: 'Great platform', consentGiven: true }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects an unknown block type', () => {
    const result = validateBlockData('NOT_A_REAL_TYPE', {});
    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toContain('Unknown block type');
  });

  it('accepts a minimal SPACER block with defaults', () => {
    const result = validateBlockData('SPACER', {});
    expect(result.valid).toBe(true);
  });

  it('accepts an empty DIVIDER block', () => {
    const result = validateBlockData('DIVIDER', {});
    expect(result.valid).toBe(true);
  });

  it('accepts a PRICING block with static plan data (no live entitlement)', () => {
    const result = validateBlockData('PRICING', {
      plans: [
        {
          name: 'Pro',
          monthlyPrice: 999,
          annualPrice: 9999,
          cta: { label: 'Choose Pro', url: '/signup?plan=pro' },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a FEATURES block with an empty items array', () => {
    const result = validateBlockData('FEATURES', { items: [] });
    expect(result.valid).toBe(false);
  });
});
