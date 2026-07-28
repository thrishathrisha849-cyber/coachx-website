import {
  createProductSchema,
  updateProductSchema,
  changeProductStatusSchema,
  createProductPriceSchema,
  createMembershipPlanSchema,
  createPlanVersionSchema,
  createPlanEntitlementSchema,
} from '../../src/billing/billing.validation';

const productId = '11111111-1111-1111-1111-111111111111';
const planId = '22222222-2222-2222-2222-222222222222';
const versionId = '33333333-3333-3333-3333-333333333333';

describe('billing.validation — createProductSchema', () => {
  const baseBody = {
    code: 'premium',
    name: 'Premium Membership',
    slug: 'premium-membership',
    type: 'MEMBERSHIP_INDIVIDUAL',
    pricingModel: 'RECURRING_FIXED',
  };

  it('accepts a minimal valid product, applying documented defaults', () => {
    const result = createProductSchema.parse({ body: baseBody });
    expect(result.body.currency).toBe('INR');
    expect(result.body.fulfilmentMethod).toBe('INSTANT');
    expect(result.body.mediaUrls).toEqual([]);
  });

  it('rejects an invalid slug format', () => {
    expect(() => createProductSchema.parse({ body: { ...baseBody, slug: 'Not A Slug!' } })).toThrow();
  });

  it('rejects an invalid code format (uppercase/spaces)', () => {
    expect(() => createProductSchema.parse({ body: { ...baseBody, code: 'Not A Code' } })).toThrow();
  });

  it('rejects an unknown product type (no silently-invented values accepted)', () => {
    expect(() => createProductSchema.parse({ body: { ...baseBody, type: 'SUBSCRIPTION_BOX' } })).toThrow();
  });

  it('accepts every documented product type', () => {
    const types = [
      'MEMBERSHIP_INDIVIDUAL',
      'MEMBERSHIP_TEAM',
      'MEMBERSHIP_ORGANIZATION',
      'COURSE',
      'COURSE_BUNDLE',
      'COHORT_PROGRAM',
      'WORKSHOP',
      'EVENT_TICKET',
      'MENTOR_SESSION',
      'MENTOR_PACKAGE',
      'EBOOK',
      'TEMPLATE',
      'DIGITAL_TOOLKIT',
      'PODCAST_PREMIUM',
      'AI_CREDITS',
      'AI_SUBSCRIPTION_ADDON',
      'CERTIFICATION_FEE',
      'CHALLENGE_ENTRY',
      'MERCHANDISE',
      'GIFT_MEMBERSHIP',
      'CUSTOM',
    ];
    for (const type of types) {
      expect(() => createProductSchema.parse({ body: { ...baseBody, type } })).not.toThrow();
    }
  });

  it('rejects a name shorter than the minimum length', () => {
    expect(() => createProductSchema.parse({ body: { ...baseBody, name: 'A' } })).toThrow();
  });
});

describe('billing.validation — updateProductSchema', () => {
  it('rejects an empty request body', () => {
    expect(() => updateProductSchema.parse({ params: { id: productId }, body: {} })).toThrow();
  });

  it('accepts a partial update', () => {
    expect(() =>
      updateProductSchema.parse({ params: { id: productId }, body: { name: 'Renamed Product' } }),
    ).not.toThrow();
  });

  it('rejects a non-UUID id param', () => {
    expect(() => updateProductSchema.parse({ params: { id: 'not-a-uuid' }, body: { name: 'X' } })).toThrow();
  });
});

describe('billing.validation — changeProductStatusSchema', () => {
  it('accepts every documented product status', () => {
    const statuses = [
      'DRAFT',
      'REVIEW_PENDING',
      'APPROVED',
      'SCHEDULED',
      'ACTIVE',
      'PAUSED',
      'SOLD_OUT',
      'EXPIRED',
      'ARCHIVED',
      'REJECTED',
    ];
    for (const status of statuses) {
      expect(() => changeProductStatusSchema.parse({ params: { id: productId }, body: { status } })).not.toThrow();
    }
  });

  it('rejects an unknown status', () => {
    expect(() => changeProductStatusSchema.parse({ params: { id: productId }, body: { status: 'LIVE' } })).toThrow();
  });
});

describe('billing.validation — createProductPriceSchema', () => {
  const base = { params: { productId }, body: { unitAmountMinor: 99900, billingInterval: 'MONTHLY' } };

  it('accepts a minimal valid price, applying documented defaults', () => {
    const result = createProductPriceSchema.parse(base);
    expect(result.body.currency).toBe('INR');
    expect(result.body.taxInclusion).toBe('EXCLUSIVE');
    expect(result.body.intervalCount).toBe(1);
  });

  it('rejects a negative unit amount', () => {
    expect(() =>
      createProductPriceSchema.parse({ ...base, body: { ...base.body, unitAmountMinor: -1 } }),
    ).toThrow();
  });

  it('rejects an unknown billing interval', () => {
    expect(() =>
      createProductPriceSchema.parse({ ...base, body: { ...base.body, billingInterval: 'FORTNIGHTLY' } }),
    ).toThrow();
  });

  it('accepts every documented billing interval', () => {
    for (const billingInterval of ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'MULTI_YEAR', 'CUSTOM_CONTRACT']) {
      expect(() =>
        createProductPriceSchema.parse({ ...base, body: { ...base.body, billingInterval } }),
      ).not.toThrow();
    }
  });
});

describe('billing.validation — createMembershipPlanSchema', () => {
  it('accepts a minimal valid plan, applying documented defaults', () => {
    const result = createMembershipPlanSchema.parse({ body: { code: 'premium', productId } });
    expect(result.body.displayOrder).toBe(0);
  });

  it('rejects an invalid code format', () => {
    expect(() => createMembershipPlanSchema.parse({ body: { code: 'Not Valid', productId } })).toThrow();
  });
});

describe('billing.validation — createPlanVersionSchema', () => {
  const base = { params: { planId }, body: { name: 'Premium v1' } };

  it('accepts a minimal valid plan version, applying documented defaults', () => {
    const result = createPlanVersionSchema.parse(base);
    expect(result.body.features).toEqual([]);
    expect(result.body.trialEligible).toBe(false);
    expect(result.body.supportedBillingIntervals).toEqual([]);
  });

  it('rejects an unknown recommendedReason', () => {
    expect(() =>
      createPlanVersionSchema.parse({ ...base, body: { ...base.body, recommendedReason: 'STAFF_PICK' } }),
    ).toThrow();
  });

  it('accepts every documented recommendedReason', () => {
    for (const recommendedReason of ['BEST_VALUE', 'MOST_POPULAR', 'EDITOR_CHOICE']) {
      expect(() =>
        createPlanVersionSchema.parse({ ...base, body: { ...base.body, recommendedReason } }),
      ).not.toThrow();
    }
  });
});

describe('billing.validation — createPlanEntitlementSchema', () => {
  const base = { params: { versionId }, body: { key: 'community.access', type: 'BOOLEAN_ACCESS', value: true } };

  it('accepts a minimal valid entitlement, applying documented defaults', () => {
    const result = createPlanEntitlementSchema.parse(base);
    expect(result.body.displayOrder).toBe(0);
  });

  it('rejects an unknown entitlement type', () => {
    expect(() =>
      createPlanEntitlementSchema.parse({ ...base, body: { ...base.body, type: 'MAGIC_ACCESS' } }),
    ).toThrow();
  });

  it('accepts every documented entitlement type', () => {
    const types = [
      'BOOLEAN_ACCESS',
      'NUMERIC_QUOTA',
      'CURRENCY_CREDIT',
      'PERCENTAGE_DISCOUNT',
      'CONTENT_SCOPE',
      'ROLE_GRANT',
      'TIME_LIMITED_ACCESS',
      'USAGE_RESET',
      'SEAT_BASED_ACCESS',
      'REGION_RESTRICTED_ACCESS',
    ];
    for (const type of types) {
      expect(() => createPlanEntitlementSchema.parse({ ...base, body: { ...base.body, type } })).not.toThrow();
    }
  });

  it('rejects an empty key', () => {
    expect(() => createPlanEntitlementSchema.parse({ ...base, body: { ...base.body, key: '' } })).toThrow();
  });
});
