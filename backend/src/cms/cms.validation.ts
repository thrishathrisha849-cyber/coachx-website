import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const getPageBySlugSchema = z.object({
  params: z.object({
    slug: z.string().regex(slugPattern, 'Invalid slug format'),
  }),
  query: z.object({
    language: z.enum(['EN', 'TA', 'TANGLISH']).optional(),
    preview: z.string().optional(),
  }),
});

const pageBlockInputSchema = z.object({
  type: z.enum([
    'HERO', 'TEXT', 'IMAGE', 'GALLERY', 'VIDEO', 'CTA', 'FEATURES', 'STATS', 'TESTIMONIALS',
    'PRICING', 'FAQ', 'TIMELINE', 'TEAM', 'LOGO_STRIP', 'PROGRAMS', 'COURSES',
    'EVENTS', 'MENTORS', 'FORM', 'DOWNLOAD', 'CUSTOM_HTML', 'SPACER', 'DIVIDER',
  ]),
  order: z.number().int().nonnegative(),
  visible: z.boolean().default(true),
  data: z.unknown(),
});

export const createPageSchema = z.object({
  body: z.object({
    slug: z.string().regex(slugPattern, 'Invalid slug format'),
    language: z.enum(['EN', 'TA', 'TANGLISH']).default('EN'),
    template: z.enum(['STANDARD', 'HOME', 'BLOG_POST']).default('STANDARD'),
    title: z.string().min(1).max(255),
    seoTitle: z.string().max(255).optional(),
    seoDescription: z.string().max(500).optional(),
    canonicalUrl: z.string().max(500).optional(),
    ogImageUrl: z.string().max(500).optional(),
    noIndex: z.boolean().default(false),
    tags: z.array(z.string().max(50)).default([]),
    audienceRoles: z.array(z.string().max(50)).default([]),
    headerVisible: z.boolean().default(true),
    footerVisible: z.boolean().default(true),
    publishAt: z.string().datetime().optional(),
    expireAt: z.string().datetime().optional(),
    blocks: z.array(pageBlockInputSchema).default([]),
  }),
});

export const updatePageSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createPageSchema.shape.body.partial(),
});

export const updatePageStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED']),
  }),
});

export const contactSubmitSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    phone: z.string().max(30).optional(),
    department: z.enum([
      'GENERAL_ENQUIRY', 'MEMBERSHIP', 'COURSE', 'PAYMENT', 'PARTNERSHIP',
      'CORPORATE_TRAINING', 'MEDIA', 'TECHNICAL_SUPPORT',
    ]),
    message: z.string().trim().min(10).max(5000),
    consent: z.literal(true),
    // Honeypot spam-protection foundation (Phase 5 Part 2 §"CONTACT"):
    // a field real users never see/fill (hidden via CSS in the form),
    // but naive bots that auto-fill every input will populate. Optional
    // at the schema level (a legitimate client never sends it at all,
    // or sends it empty) — checked at the service layer, not rejected
    // here, so a filled honeypot fails the SAME way as any other
    // request rather than returning a distinguishable validation error
    // a bot could learn from.
    website: z.string().max(200).optional(),
  }),
});

export const newsletterSubscribeSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    consent: z.literal(true),
    website: z.string().max(200).optional(),
  }),
});

export const newsletterUnsubscribeSchema = z.object({
  query: z.object({
    token: z.string().min(1),
  }),
});

export const checkRedirectSchema = z.object({
  query: z.object({
    // Root-relative only — never a full URL, closing the same open-
    // redirect class of risk `frontend/src/utils/url.ts`'s
    // `isExternalUrl` guards against on the frontend.
    path: z.string().regex(/^\/[^\s]*$/, 'path must be a root-relative path').max(500),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(2).max(100),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});

export const blogListSchema = z.object({
  query: z.object({
    language: z.enum(['EN', 'TA', 'TANGLISH']).optional(),
    tag: z.string().max(50).optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
  }),
});
