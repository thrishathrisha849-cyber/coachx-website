import { z } from 'zod';

export const captureLeadSchema = z.object({
  body: z.object({
    leadMagnetSlug: z.string().trim().min(1).max(191),
    email: z.string().trim().min(3).max(255).email(),
    name: z.string().trim().max(200).optional(),
    mobile: z.string().trim().max(20).optional(),
    profession: z.string().trim().max(120).optional(),
    businessStage: z.string().trim().max(60).optional(),
    interest: z.string().trim().max(120).optional(),
    consentMarketingEmail: z.boolean(),
    utmSource: z.string().trim().max(120).optional(),
    utmMedium: z.string().trim().max(120).optional(),
    utmCampaign: z.string().trim().max(120).optional(),
    utmTerm: z.string().trim().max(120).optional(),
    utmContent: z.string().trim().max(120).optional(),
    referralCode: z.string().trim().max(60).optional(),
    affiliateId: z.string().trim().max(60).optional(),
    landingPageVariant: z.string().trim().max(60).optional(),
    website: z.string().max(0).optional(), // honeypot — a real user leaves this empty
  }),
});

export const registerMasterclassSchema = z.object({
  body: z.object({
    slug: z.string().trim().min(1).max(191),
    language: z.enum(['EN', 'TA', 'TANGLISH']).default('EN'),
    name: z.string().trim().min(2).max(200),
    email: z.string().trim().min(3).max(255).email(),
    mobile: z.string().trim().max(20).optional(),
    city: z.string().trim().max(120).optional(),
    profession: z.string().trim().max(120).optional(),
    experienceLevel: z.string().trim().max(60).optional(),
    referralCode: z.string().trim().max(60).optional(),
    website: z.string().max(0).optional(),
  }),
});

export const masterclassStatusQuerySchema = z.object({
  query: z.object({
    slug: z.string().trim().min(1).max(191),
    language: z.enum(['EN', 'TA', 'TANGLISH']).default('EN'),
  }),
});

export const createMasterclassConfigSchema = z.object({
  body: z.object({
    pageSlug: z.string().trim().min(1).max(191),
    language: z.enum(['EN', 'TA', 'TANGLISH']).default('EN'),
    scheduledAt: z.string().datetime(),
    registrationClosesAt: z.string().datetime().optional(),
    seatLimit: z.number().int().positive().optional(),
    speakerName: z.string().trim().max(200).optional(),
  }),
});

export const consentWithdrawalSchema = z.object({
  body: z.object({
    email: z.string().trim().min(3).max(255).email(),
    channel: z.enum([
      'TERMS', 'PRIVACY', 'MARKETING_EMAIL', 'WHATSAPP', 'SMS', 'PARTNER_COMMUNICATION', 'PERSONALIZATION_COOKIES',
    ]),
  }),
});
