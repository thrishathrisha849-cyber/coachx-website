import {
  createCourseSchema,
  updateCourseSchema,
  createCategorySchema,
  updateCategorySchema,
  publicCourseQuerySchema,
} from '../../src/lms/lms.validation';

const baseCourseBody = {
  title: 'A Valid Course Title',
  slug: 'a-valid-course-title',
};

describe('lms.validation — createCourseSchema', () => {
  it('accepts a minimal valid course body', () => {
    const result = createCourseSchema.safeParse({ body: baseCourseBody, params: {}, query: {} });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid slug format', () => {
    const result = createCourseSchema.safeParse({
      body: { ...baseCourseBody, slug: 'Not A Valid Slug!' },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a FREE course with a non-zero price', () => {
    const result = createCourseSchema.safeParse({
      body: { ...baseCourseBody, priceType: 'FREE', priceAmountMinor: 5000 },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('accepts a PAID course with a non-zero price', () => {
    const result = createCourseSchema.safeParse({
      body: { ...baseCourseBody, priceType: 'PAID', priceAmountMinor: 5000 },
      params: {},
      query: {},
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative price', () => {
    const result = createCourseSchema.safeParse({
      body: { ...baseCourseBody, priceType: 'PAID', priceAmountMinor: -100 },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects publishAt at/after expireAt', () => {
    const result = createCourseSchema.safeParse({
      body: {
        ...baseCourseBody,
        publishAt: '2030-01-05T00:00:00.000Z',
        expireAt: '2030-01-01T00:00:00.000Z',
      },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects enrollmentStartAt at/after enrollmentEndAt', () => {
    const result = createCourseSchema.safeParse({
      body: {
        ...baseCourseBody,
        enrollmentStartAt: '2030-01-05T00:00:00.000Z',
        enrollmentEndAt: '2030-01-01T00:00:00.000Z',
      },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a metadata object larger than the size bound', () => {
    const bigString = 'x'.repeat(9000);
    const result = createCourseSchema.safeParse({
      body: { ...baseCourseBody, metadata: { blob: bigString } },
      params: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('lms.validation — updateCourseSchema', () => {
  it('rejects an empty update body', () => {
    const result = updateCourseSchema.safeParse({ body: {}, params: { id: '11111111-1111-1111-1111-111111111111' }, query: {} });
    expect(result.success).toBe(false);
  });

  it('accepts a single-field update', () => {
    const result = updateCourseSchema.safeParse({
      body: { title: 'New Title' },
      params: { id: '11111111-1111-1111-1111-111111111111' },
      query: {},
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid course id param', () => {
    const result = updateCourseSchema.safeParse({
      body: { title: 'New Title' },
      params: { id: 'not-a-uuid' },
      query: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('lms.validation — createCategorySchema / updateCategorySchema', () => {
  it('accepts a minimal valid category', () => {
    const result = createCategorySchema.safeParse({
      body: { name: 'Business', slug: 'business' },
      params: {},
      query: {},
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty category update body', () => {
    const result = updateCategorySchema.safeParse({
      body: {},
      params: { id: '11111111-1111-1111-1111-111111111111' },
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it('accepts an explicit null parentId on update (clearing to root)', () => {
    const result = updateCategorySchema.safeParse({
      body: { parentId: null },
      params: { id: '11111111-1111-1111-1111-111111111111' },
      query: {},
    });
    expect(result.success).toBe(true);
  });
});

describe('lms.validation — publicCourseQuerySchema (sort whitelist, search)', () => {
  it('defaults sort to "newest" when not supplied', () => {
    const result = publicCourseQuerySchema.safeParse({ body: {}, params: {}, query: {} });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.query.sort).toBe('newest');
  });

  it('rejects an arbitrary, non-whitelisted sort value', () => {
    const result = publicCourseQuerySchema.safeParse({
      body: {},
      params: {},
      query: { sort: 'slug; DROP TABLE courses;' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts each whitelisted sort value', () => {
    for (const sort of ['newest', 'title', 'featured']) {
      const result = publicCourseQuerySchema.safeParse({ body: {}, params: {}, query: { sort } });
      expect(result.success).toBe(true);
    }
  });
});
