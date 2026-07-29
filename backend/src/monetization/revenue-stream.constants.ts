/**
 * 001 FR-054–FR-063 — the 10 named revenue streams. A fixed, spec-defined
 * taxonomy (not admin-editable, unlike the Membership Tier catalog), so a
 * constants file is the right shape — not a database table nobody edits.
 * Each stream's actual money-movement mechanics belong to the owning
 * feature (009 billing/subscriptions, 004 LMS course sales, 007 mentor
 * marketplace, etc.) — this is the platform-wide reference list FR-054–
 * FR-063 requires to exist, plus the disclosure/immutability rules that
 * cut across all of them (Constitution Article III/IV).
 */

export interface RevenueStreamDefinition {
  code: string;
  name: string;
  description: string;
  requiresDisclosure: boolean;
}

export const REVENUE_STREAMS: RevenueStreamDefinition[] = [
  { code: 'membership_subscription', name: 'Membership Subscription', description: 'Monthly/quarterly/annual/lifetime-campaign billing (FR-054)', requiresDisclosure: false },
  { code: 'course_sales', name: 'Course Sales', description: 'Individual courses, bundles, cohort courses, certification (FR-055)', requiresDisclosure: false },
  { code: 'event_revenue', name: 'Event Revenue', description: 'Webinars, workshops, conferences, retreats, masterminds (FR-056)', requiresDisclosure: false },
  { code: 'mentor_commission', name: 'Mentor Commission', description: 'Configurable commission from mentor-session bookings (FR-057)', requiresDisclosure: false },
  { code: 'marketplace_commission', name: 'Marketplace Commission', description: 'Commission from digital-product/service marketplace sales (FR-058)', requiresDisclosure: false },
  { code: 'corporate_training', name: 'Corporate Training', description: 'Custom corporate-training plans for organizations (FR-059)', requiresDisclosure: false },
  { code: 'certification_fees', name: 'Certification Fees', description: 'Assessment and certification fee charges (FR-060)', requiresDisclosure: false },
  { code: 'ai_credits', name: 'AI Credit Packs', description: 'Additional AI-credit packs beyond tier limits (FR-061)', requiresDisclosure: false },
  { code: 'sponsored_content', name: 'Sponsored Content', description: 'Sponsored events, resources, partner offers, community campaigns — MUST carry a visible "Sponsored" label (FR-062)', requiresDisclosure: true },
  { code: 'affiliate_revenue', name: 'Affiliate Revenue', description: 'Third-party affiliate product recommendations — MUST carry a transparent disclosure notice (FR-063)', requiresDisclosure: true },
];
