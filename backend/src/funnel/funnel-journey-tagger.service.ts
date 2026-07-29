import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';

/**
 * 002 FR-059, Phase 6b: the 7 documented funnel architectures (A–G) as
 * distinct, trackable journeys. Rather than adding a redundant
 * `funnelType` column, each funnel type is DERIVED from data that
 * already exists and already uniquely identifies it:
 *   A (Free Resource)  → every `Lead` row (leads only come from a lead-magnet capture)
 *   B (Webinar)         → every `MasterclassRegistration` row
 *   D (Membership)       → `CheckoutSession` whose Product.type starts with MEMBERSHIP_
 *   E (Course)           → `CheckoutSession` whose Product.type is COURSE/COURSE_BUNDLE/COHORT_PROGRAM
 *   F (Event) / G (Mentor) → classifiable the same way (EVENT_TICKET /
 *     MENTOR_SESSION/MENTOR_PACKAGE) once those product types are sold
 *     through checkout — the classification exists now, real traffic
 *     depends on the Mentor/Event public pages (005/007/010, not yet built).
 *   C (Assessment)        → depends on 003's onboarding assessment, which
 *     doesn't exist yet — reported as zero, not fabricated.
 */
export type FunnelType = 'A_FREE_RESOURCE' | 'B_WEBINAR' | 'C_ASSESSMENT' | 'D_MEMBERSHIP' | 'E_COURSE' | 'F_EVENT' | 'G_MENTOR';

const MEMBERSHIP_PRODUCT_TYPES = ['MEMBERSHIP_INDIVIDUAL', 'MEMBERSHIP_TEAM', 'MEMBERSHIP_ORGANIZATION'];
const COURSE_PRODUCT_TYPES = ['COURSE', 'COURSE_BUNDLE', 'COHORT_PROGRAM'];
const EVENT_PRODUCT_TYPES = ['EVENT_TICKET', 'WORKSHOP'];
const MENTOR_PRODUCT_TYPES = ['MENTOR_SESSION', 'MENTOR_PACKAGE'];

export function classifyCheckoutFunnel(productType: string): FunnelType | null {
  if (MEMBERSHIP_PRODUCT_TYPES.includes(productType)) return 'D_MEMBERSHIP';
  if (COURSE_PRODUCT_TYPES.includes(productType)) return 'E_COURSE';
  if (EVENT_PRODUCT_TYPES.includes(productType)) return 'F_EVENT';
  if (MENTOR_PRODUCT_TYPES.includes(productType)) return 'G_MENTOR';
  return null;
}

export interface FunnelCoverageReport {
  funnel: FunnelType;
  visitorToConversionCount: number;
  note?: string;
}

/** SC-003: each of the 7 funnels is measurable end-to-end with a reportable count — the actual per-campaign conversion RATE additionally needs the visitor-count denominator, which requires the page-view analytics pipeline (`analytics-events`, not built this pass — see docs). */
export async function getFunnelCoverageReport(): Promise<FunnelCoverageReport[]> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const [leadCount, webinarCount, checkoutSessions] = await Promise.all([
    prisma.lead.count(),
    prisma.masterclassRegistration.count(),
    prisma.checkoutSession.findMany({ where: { status: 'SUCCESS' }, include: { product: { select: { type: true } } } }),
  ]);

  const checkoutCounts: Record<string, number> = {};
  for (const session of checkoutSessions) {
    const funnel = classifyCheckoutFunnel(session.product.type);
    if (funnel) checkoutCounts[funnel] = (checkoutCounts[funnel] ?? 0) + 1;
  }

  return [
    { funnel: 'A_FREE_RESOURCE', visitorToConversionCount: leadCount },
    { funnel: 'B_WEBINAR', visitorToConversionCount: webinarCount },
    { funnel: 'C_ASSESSMENT', visitorToConversionCount: 0, note: 'Depends on 003\'s onboarding assessment, not yet built.' },
    { funnel: 'D_MEMBERSHIP', visitorToConversionCount: checkoutCounts.D_MEMBERSHIP ?? 0 },
    { funnel: 'E_COURSE', visitorToConversionCount: checkoutCounts.E_COURSE ?? 0 },
    { funnel: 'F_EVENT', visitorToConversionCount: checkoutCounts.F_EVENT ?? 0, note: 'Real traffic depends on the public Events pages (005/007/010, not yet built).' },
    { funnel: 'G_MENTOR', visitorToConversionCount: checkoutCounts.G_MENTOR ?? 0, note: 'Real traffic depends on the public Mentor pages (007, not yet built).' },
  ];
}
