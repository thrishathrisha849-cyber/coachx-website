import { z } from 'zod';

/**
 * Per-block-type content validation (002 FR-085). One schema per block
 * type rather than one giant nullable-everything shape — see the
 * `PageBlock.data` comment in `schema.prisma` for the rationale.
 *
 * PROGRAMS/COURSES/EVENTS/MENTORS/CUSTOM_HTML are intentionally minimal
 * placeholders — their real data comes from features not built yet
 * (004/005/007/010), and Custom HTML is policy-restricted pending a
 * sanitization decision (see docs/public-site/DECISION_GATES.md).
 */

const ctaSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().min(1).max(500),
});

const sourceNoteSchema = z.string().min(1).max(300);

export const blockSchemas = {
  HERO: z.object({
    eyebrow: z.string().max(80).optional(),
    headline: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    primaryCta: ctaSchema.optional(),
    secondaryCta: ctaSchema.optional(),
    mediaUrl: z.string().max(500).optional(),
    mediaType: z.enum(['image', 'video']).optional(),
  }),

  TEXT: z.object({
    heading: z.string().max(200).optional(),
    body: z.string().min(1),
  }),

  IMAGE: z.object({
    url: z.string().min(1).max(500),
    alt: z.string().min(1).max(300),
    caption: z.string().max(300).optional(),
  }),

  /// Phase 5 Part 2 addition — a grid of images, each independently
  /// alt-texted (FR-108 accessibility requirement carried into the new
  /// block type, not just the single-image one).
  GALLERY: z.object({
    heading: z.string().max(200).optional(),
    images: z
      .array(
        z.object({
          url: z.string().min(1).max(500),
          alt: z.string().min(1).max(300),
          caption: z.string().max(300).optional(),
        }),
      )
      .min(1)
      .max(24),
  }),

  VIDEO: z.object({
    url: z.string().min(1).max(500),
    posterUrl: z.string().max(500).optional(),
    captionsUrl: z.string().max(500).optional(),
    title: z.string().max(200).optional(),
  }),

  CTA: z.object({
    headline: z.string().min(1).max(200),
    description: z.string().max(400).optional(),
    primaryCta: ctaSchema,
    trustNote: z.string().max(200).optional(),
  }),

  FEATURES: z.object({
    heading: z.string().max(200).optional(),
    items: z
      .array(
        z.object({
          icon: z.string().max(50).optional(),
          title: z.string().min(1).max(120),
          description: z.string().max(300).optional(),
        }),
      )
      .min(1),
  }),

  STATS: z.object({
    heading: z.string().max(200).optional(),
    items: z
      .array(
        z.object({
          label: z.string().min(1).max(80),
          value: z.string().min(1).max(40),
          // FR-014/FR-111: no fabricated metrics — every stat requires a
          // documented source; enforced at the schema level, not just by policy.
          sourceNote: sourceNoteSchema,
          isSystemCalculated: z.boolean().default(false),
        }),
      )
      .min(1),
  }),

  TESTIMONIALS: z.object({
    heading: z.string().max(200).optional(),
    items: z
      .array(
        z.object({
          name: z.string().min(1).max(120),
          role: z.string().max(120).optional(),
          photoUrl: z.string().max(500).optional(),
          format: z.enum(['text', 'audio', 'video', 'screenshot']),
          quote: z.string().max(1000).optional(),
          mediaUrl: z.string().max(500).optional(),
          consentGiven: z.literal(true),
        }),
      )
      .min(1),
  }),

  PRICING: z.object({
    heading: z.string().max(200).optional(),
    // Static, admin-entered plan display only — no live entitlement
    // resolution (001/009 not built). See TRACEABILITY.md FR-060.
    plans: z
      .array(
        z.object({
          name: z.string().min(1).max(80),
          bestFor: z.string().max(120).optional(),
          monthlyPrice: z.number().nonnegative(),
          annualPrice: z.number().nonnegative(),
          features: z.array(z.string().max(200)).default([]),
          popular: z.boolean().default(false),
          cta: ctaSchema,
        }),
      )
      .min(1),
  }),

  FAQ: z.object({
    heading: z.string().max(200).optional(),
    // References FaqEntry categories rather than embedding Q&A directly,
    // so FAQ content stays centrally editable (FR-028 admin sort order).
    categories: z.array(z.string().max(100)).default([]),
  }),

  TIMELINE: z.object({
    heading: z.string().max(200).optional(),
    items: z
      .array(
        z.object({
          date: z.string().max(40),
          title: z.string().min(1).max(150),
          description: z.string().max(400).optional(),
          imageUrl: z.string().max(500).optional(),
        }),
      )
      .min(1),
  }),

  TEAM: z.object({
    heading: z.string().max(200).optional(),
    members: z
      .array(
        z.object({
          name: z.string().min(1).max(120),
          role: z.string().max(120).optional(),
          photoUrl: z.string().max(500).optional(),
          bio: z.string().max(500).optional(),
          socialLinks: z.array(z.object({ platform: z.string().max(40), url: z.string().max(500) })).default([]),
          order: z.number().int().default(0),
        }),
      )
      .min(1),
  }),

  LOGO_STRIP: z.object({
    heading: z.string().max(200).optional(),
    logos: z.array(z.object({ name: z.string().min(1).max(120), url: z.string().max(500) })).min(1),
  }),

  FORM: z.object({
    formType: z.enum(['contact', 'newsletter']),
    heading: z.string().max(200).optional(),
  }),

  /// Phase 5 Part 2 addition — a list of downloadable files. `fileUrl`
  /// must point at admin-controlled storage (Supabase Storage per the
  /// existing Phase 1/2 env scaffold), never an arbitrary user-supplied
  /// URL rendered as a direct download link without review.
  DOWNLOAD: z.object({
    heading: z.string().max(200).optional(),
    description: z.string().max(400).optional(),
    files: z
      .array(
        z.object({
          label: z.string().min(1).max(150),
          fileUrl: z.string().min(1).max(500),
          fileType: z.string().max(20).optional(),
          fileSizeLabel: z.string().max(20).optional(),
        }),
      )
      .min(1)
      .max(20),
  }),

  SPACER: z.object({
    height: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  }),

  DIVIDER: z.object({}),

  // Placeholders — data owned by features not yet built.
  PROGRAMS: z.object({ heading: z.string().max(200).optional() }).passthrough(),
  COURSES: z.object({ heading: z.string().max(200).optional() }).passthrough(),
  EVENTS: z.object({ heading: z.string().max(200).optional() }).passthrough(),
  MENTORS: z.object({ heading: z.string().max(200).optional() }).passthrough(),
  CUSTOM_HTML: z.object({ html: z.string().max(1) }).passthrough(), // deliberately restrictive — see DECISION_GATES.md
} as const;

export type PageBlockTypeKey = keyof typeof blockSchemas;

export function validateBlockData(type: string, data: unknown): { valid: boolean; errors?: string[] } {
  const schema = blockSchemas[type as PageBlockTypeKey];
  if (!schema) return { valid: false, errors: [`Unknown block type: ${type}`] };

  const result = schema.safeParse(data);
  if (result.success) return { valid: true };
  return { valid: false, errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
}
