import { PrismaClient } from '@prisma/client';

/**
 * Seeds the 6 named Membership Tiers (001 FR-048–FR-053): Free, Starter,
 * Growth, Pro, Elite, Organization — the catalog/access-boundary layer
 * 001 owns (per spec.md Assumptions: "this feature defines the tier/
 * stream catalog and access boundaries only"; actual billing/invoicing
 * mechanics are 009's). Each tier is a Product + MembershipPlan + one
 * PUBLISHED PlanVersion + its PlanEntitlement grants, using the exact
 * schema 009's billing module already built (Product/MembershipPlan/
 * PlanVersion/PlanEntitlement) — not a parallel catalog.
 *
 * Idempotent via upsert-by-unique-code, same convention as rbac.seed.ts/
 * cms.seed.ts. Raw Prisma calls, not backend/src/billing's service
 * functions — `database/` and `backend/` are separate npm workspaces
 * (same documented reason rbac.seed.ts gives for its own duplication).
 */

interface TierDefinition {
  code: string;
  name: string;
  slug: string;
  targetCustomer: string;
  publicDescription: string;
  productType: 'MEMBERSHIP_INDIVIDUAL' | 'MEMBERSHIP_ORGANIZATION';
  unitAmountMinor: number;
  displayOrder: number;
  features: string[];
  entitlements: Array<{ key: string; type: string; value: unknown; description: string }>;
}

const TIERS: TierDefinition[] = [
  {
    code: 'free',
    name: 'Free',
    slug: 'free',
    targetCustomer: 'Anyone exploring the platform',
    publicDescription: 'Limited public courses, selected community groups, free events, basic AI usage.',
    productType: 'MEMBERSHIP_INDIVIDUAL',
    unitAmountMinor: 0,
    displayOrder: 1,
    features: ['Limited public courses', 'Selected community groups', 'Free events', 'Basic AI usage', 'Profile', 'Limited downloads'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'free' }, description: 'FR-048: limited public courses only' },
      { key: 'ai.credits.monthly', type: 'CURRENCY_CREDIT', value: { amount: 10 }, description: 'FR-048: basic AI usage' },
      { key: 'mentor.session.access', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-048: mentor sessions restricted' },
      { key: 'marketplace.selling', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-048: marketplace selling restricted' },
      { key: 'certificate.access', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-048: certificates restricted' },
    ],
  },
  {
    code: 'starter',
    name: 'Starter',
    slug: 'starter',
    targetCustomer: 'Beginners and students',
    publicDescription: 'Foundation courses, community access, monthly webinar, basic challenges, limited AI credits, starter certificates.',
    productType: 'MEMBERSHIP_INDIVIDUAL',
    unitAmountMinor: 49900,
    displayOrder: 2,
    features: ['Foundation courses', 'Community access', 'Monthly webinar', 'Basic challenges', 'Limited AI credits', 'Starter certificates'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'starter' }, description: 'FR-049: foundation courses' },
      { key: 'ai.credits.monthly', type: 'CURRENCY_CREDIT', value: { amount: 50 }, description: 'FR-049: limited AI credits' },
      { key: 'certificate.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-049: starter certificates' },
      { key: 'mentor.session.access', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-049: no mentor sessions' },
      { key: 'marketplace.selling', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-049: marketplace selling restricted' },
    ],
  },
  {
    code: 'growth',
    name: 'Growth',
    slug: 'growth',
    targetCustomer: 'Freelancers, creators, and new business owners',
    publicDescription: 'Full learning paths, weekly live sessions, business templates, advanced challenges, more AI credits, mentor group sessions, CRM basics.',
    productType: 'MEMBERSHIP_INDIVIDUAL',
    unitAmountMinor: 99900,
    displayOrder: 3,
    features: ['Full learning paths', 'Weekly live sessions', 'Business templates', 'Advanced challenges', 'More AI credits', 'Mentor group sessions', 'CRM basics'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'growth' }, description: 'FR-050: full learning paths' },
      { key: 'ai.credits.monthly', type: 'CURRENCY_CREDIT', value: { amount: 200 }, description: 'FR-050: more AI credits' },
      { key: 'mentor.session.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-050: mentor GROUP sessions only' },
      { key: 'mentor.session.type', type: 'CONTENT_SCOPE', value: { type: 'group_only' }, description: 'FR-050: group, not 1:1' },
      { key: 'crm.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-050: CRM basics' },
      { key: 'marketplace.selling', type: 'BOOLEAN_ACCESS', value: false, description: 'FR-050: marketplace selling is a Pro+ feature' },
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    slug: 'pro',
    targetCustomer: 'Coaches and established entrepreneurs',
    publicDescription: 'Advanced curriculum, course-creation tools, funnel tools, CRM, mentor-booking benefits, business analytics, priority support, marketplace seller access.',
    productType: 'MEMBERSHIP_INDIVIDUAL',
    unitAmountMinor: 249900,
    displayOrder: 4,
    features: ['Advanced curriculum', 'Course-creation tools', 'Funnel tools', 'CRM', 'Mentor-booking benefits', 'Business analytics', 'Priority support', 'Marketplace seller access'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'pro' }, description: 'FR-051: advanced curriculum' },
      { key: 'course.creation.tools', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-051: course-creation tools' },
      { key: 'mentor.session.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-051: mentor-booking benefits (1:1)' },
      { key: 'crm.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-051: full CRM' },
      { key: 'marketplace.selling', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-051: marketplace seller access' },
      { key: 'support.priority', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-051: priority support' },
    ],
  },
  {
    code: 'elite',
    name: 'Elite',
    slug: 'elite',
    targetCustomer: 'High-growth entrepreneurs',
    publicDescription: 'Private mastermind, advanced mentorship, business audits, premium events, team accounts, priority AI limits, private community, dedicated success manager.',
    productType: 'MEMBERSHIP_INDIVIDUAL',
    unitAmountMinor: 499900,
    displayOrder: 5,
    features: ['Private mastermind', 'Advanced mentorship', 'Business audits', 'Premium events', 'Team accounts', 'Priority AI limits', 'Private community', 'Dedicated success manager'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'elite' }, description: 'FR-052: full catalog + mastermind' },
      { key: 'ai.credits.monthly', type: 'CURRENCY_CREDIT', value: { amount: 1000, priority: true }, description: 'FR-052: priority AI limits' },
      { key: 'mentor.session.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-052: advanced mentorship' },
      { key: 'marketplace.selling', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-052: marketplace seller access' },
      { key: 'success_manager.dedicated', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-052: dedicated success manager' },
      { key: 'team.seats', type: 'SEAT_BASED_ACCESS', value: { seats: 3 }, description: 'FR-052: team accounts' },
    ],
  },
  {
    code: 'organization',
    name: 'Organization',
    slug: 'organization',
    targetCustomer: 'Corporate partners and organizations',
    publicDescription: 'Bulk users, private groups, organization dashboard, custom learning paths, team analytics, bulk certificates, invoice-based payment, organization admin controls.',
    productType: 'MEMBERSHIP_ORGANIZATION',
    unitAmountMinor: 0,
    displayOrder: 6,
    features: ['Bulk users', 'Private groups', 'Organization dashboard', 'Custom learning paths', 'Team analytics', 'Bulk certificates', 'Invoice-based payment', 'Organization admin controls'],
    entitlements: [
      { key: 'course.access.tier', type: 'CONTENT_SCOPE', value: { tier: 'organization' }, description: 'FR-053: custom learning paths' },
      { key: 'team.seats', type: 'SEAT_BASED_ACCESS', value: { seats: 'bulk' }, description: 'FR-053: bulk users' },
      { key: 'certificate.access', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-053: bulk certificates' },
      { key: 'billing.invoice_based', type: 'BOOLEAN_ACCESS', value: true, description: 'FR-053: invoice-based payment' },
      { key: 'organization.admin_controls', type: 'ROLE_GRANT', value: { role: 'organization_admin' }, description: 'FR-053: organization admin controls' },
    ],
  },
];

export async function seedMembershipTiers(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding membership tier catalog (001 FR-048–FR-053)...');

  for (const tier of TIERS) {
    const product = await prisma.product.upsert({
      where: { code: `membership-${tier.code}` },
      create: {
        code: `membership-${tier.code}`,
        name: `${tier.name} Membership`,
        slug: `membership-${tier.slug}`,
        type: tier.productType,
        description: tier.publicDescription,
        pricingModel: tier.unitAmountMinor === 0 ? 'FREE' : 'RECURRING_FIXED',
        status: 'ACTIVE',
      },
      update: {},
    });

    const plan = await prisma.membershipPlan.upsert({
      where: { code: tier.code },
      create: {
        code: tier.code,
        productId: product.id,
        status: 'ACTIVE',
        displayOrder: tier.displayOrder,
      },
      update: {},
    });

    const existingVersion = await prisma.planVersion.findFirst({ where: { planId: plan.id } });
    if (existingVersion) continue; // already seeded — idempotent no-op past this point

    const version = await prisma.planVersion.create({
      data: {
        planId: plan.id,
        versionNumber: 1,
        name: tier.name,
        publicDescription: tier.publicDescription,
        targetCustomer: tier.targetCustomer,
        features: tier.features,
        supportedBillingIntervals: tier.unitAmountMinor === 0 ? [] : ['MONTHLY', 'ANNUAL'],
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    if (tier.unitAmountMinor > 0) {
      await prisma.productPrice.create({
        data: {
          productId: product.id,
          currency: 'INR',
          unitAmountMinor: tier.unitAmountMinor,
          billingInterval: 'MONTHLY',
          status: 'ACTIVE',
        },
      });
    }

    for (const [index, entitlement] of tier.entitlements.entries()) {
      await prisma.planEntitlement.create({
        data: {
          planVersionId: version.id,
          key: entitlement.key,
          type: entitlement.type as never,
          value: entitlement.value as never,
          description: entitlement.description,
          displayOrder: index,
        },
      });
    }
  }

  console.log(`  Membership tier catalog seed complete: ${TIERS.length} tiers.`);
}
