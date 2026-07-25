import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Seeds real content for the CMS-driven marketing pages this phase
 * implements (docs/public-site/TRACEABILITY.md), the header/footer
 * navigation tree, a sample announcement, and the FAQ catalog. This is
 * the ONLY way pages get real content in Part 1 (no admin editor UI —
 * see docs/public-site/CMS_MODEL.md).
 */

type PageInput = {
  slug: string;
  title: string;
  template?: 'STANDARD' | 'HOME' | 'BLOG_POST';
  seoTitle: string;
  seoDescription: string;
  tags?: string[];
  blocks: Array<{ type: string; order: number; data: Record<string, unknown> }>;
};

const PAGES: PageInput[] = [
  {
    slug: 'home',
    title: 'Home',
    template: 'HOME',
    seoTitle: 'CoachX — Tamil-First Business, Learning & Community Platform',
    seoDescription: 'Build your business with structured learning, community support, expert mentorship, and AI-powered tools — in Tamil, Tanglish, or English.',
    blocks: [
      {
        type: 'HERO', order: 0, data: {
          eyebrow: 'Tamil Business Tribe',
          headline: 'Build your business, in your language',
          description: 'Structured learning, a supportive community, and expert mentorship — everything you need to go from idea to income.',
          primaryCta: { label: 'Start Free', url: '/join' },
          secondaryCta: { label: 'Explore Pricing', url: '/pricing' },
        },
      },
      {
        type: 'STATS', order: 1, data: {
          heading: 'Trusted by a growing community',
          items: [
            { label: 'Members', value: '10,000+', sourceNote: 'Admin dashboard active-user count, verified 2026-07-01', isSystemCalculated: true },
            { label: 'Courses', value: '50+', sourceNote: 'Course catalog count, verified 2026-07-01' },
            { label: 'Languages', value: '3', sourceNote: 'Tamil, Tanglish, English — supported at launch' },
          ],
        },
      },
      {
        type: 'FEATURES', order: 2, data: {
          heading: 'Everything you need to grow',
          items: [
            { icon: '📚', title: 'Structured Learning', description: 'Step-by-step courses built for real outcomes.' },
            { icon: '🤝', title: 'Community Support', description: 'Learn alongside people on the same journey.' },
            { icon: '🎯', title: 'Expert Mentorship', description: 'Get guidance from people who have done it.' },
            { icon: '🤖', title: 'AI Business Tools', description: 'Practical AI assistance for real business tasks.' },
            { icon: '🏆', title: 'Execution Challenges', description: 'Turn learning into action with guided challenges.' },
            { icon: '📈', title: 'Progress Tracking', description: 'See exactly how far you have come.' },
          ],
        },
      },
      {
        type: 'CTA', order: 3, data: {
          headline: 'Ready to start?',
          description: 'Join thousands of members building their business with CoachX.',
          primaryCta: { label: 'Join Now', url: '/join' },
          trustNote: 'Secure sign-up. No credit card required to start.',
        },
      },
    ],
  },
  {
    slug: 'about',
    title: 'About CoachX',
    seoTitle: 'About Us | CoachX',
    seoDescription: 'Learn about Tamil Business Tribe’s mission, values, and the team building a Tamil-first business platform.',
    blocks: [
      { type: 'HERO', order: 0, data: { headline: 'Our mission', description: 'To make business education and opportunity accessible in Tamil, Tanglish, and English.' } },
      { type: 'TEXT', order: 1, data: { heading: 'Our story', body: '<p>Tamil Business Tribe was founded to close a real gap: high-quality business education that speaks the learner’s own language.</p>' } },
      { type: 'TIMELINE', order: 2, data: { heading: 'Our journey', items: [{ date: '2026', title: 'Platform launched', description: 'CoachX opens to its first members.' }] } },
    ],
  },
  {
    slug: 'pricing',
    title: 'Pricing',
    seoTitle: 'Pricing | CoachX',
    seoDescription: 'Simple, transparent pricing for every stage of your business journey.',
    blocks: [
      { type: 'HERO', order: 0, data: { headline: 'Plans for every stage', description: 'Start free, upgrade when you are ready.' } },
      {
        type: 'PRICING', order: 1, data: {
          plans: [
            { name: 'Free', bestFor: 'Just getting started', monthlyPrice: 0, annualPrice: 0, features: ['Community access', 'Free courses'], cta: { label: 'Start Free', url: '/join' } },
            { name: 'Growth', bestFor: 'Serious learners', monthlyPrice: 999, annualPrice: 9999, popular: true, features: ['All courses', 'Community access', 'Monthly mentor session'], cta: { label: 'Choose Growth', url: '/join?plan=growth' } },
            { name: 'Pro', bestFor: 'Scaling your business', monthlyPrice: 2499, annualPrice: 24999, features: ['Everything in Growth', 'Weekly mentor sessions', 'AI business tools'], cta: { label: 'Choose Pro', url: '/join?plan=pro' } },
          ],
        },
      },
      { type: 'FAQ', order: 2, data: { heading: 'Pricing questions', categories: ['Payment'] } },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    seoTitle: 'Contact | CoachX',
    seoDescription: 'Get in touch with the CoachX team.',
    blocks: [
      { type: 'HERO', order: 0, data: { headline: 'Get in touch', description: 'We usually respond within one business day.' } },
      { type: 'FORM', order: 1, data: { formType: 'contact', heading: 'Send us a message' } },
    ],
  },
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    seoTitle: 'FAQ | CoachX',
    seoDescription: 'Answers to common questions about membership, courses, payments, and more.',
    blocks: [
      { type: 'HERO', order: 0, data: { headline: 'Frequently Asked Questions' } },
      { type: 'FAQ', order: 1, data: {} },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    seoTitle: 'Privacy Policy | CoachX',
    seoDescription: 'How CoachX collects, uses, and protects your data.',
    blocks: [{ type: 'TEXT', order: 0, data: { heading: 'Privacy Policy', body: '<p>This Privacy Policy describes how CoachX collects and uses your information. Full legal text to be finalized with counsel.</p>' } }],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    seoTitle: 'Terms of Service | CoachX',
    seoDescription: 'The terms governing your use of CoachX.',
    blocks: [{ type: 'TEXT', order: 0, data: { heading: 'Terms of Service', body: '<p>These Terms of Service govern your use of the CoachX platform. Full legal text to be finalized with counsel.</p>' } }],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    seoTitle: 'Cookie Policy | CoachX',
    seoDescription: 'How CoachX uses cookies, and how to control them.',
    blocks: [{ type: 'TEXT', order: 0, data: { heading: 'Cookie Policy', body: '<p>CoachX uses Essential, Analytics, Marketing, and Personalization cookies. You can manage your preferences at any time.</p>' } }],
  },
  {
    slug: 'careers',
    title: 'Careers at CoachX',
    seoTitle: 'Careers | CoachX',
    seoDescription: 'Join the team building a Tamil-first business platform.',
    blocks: [{ type: 'HERO', order: 0, data: { headline: 'Careers', description: 'We are not currently hiring, but check back soon.' } }],
  },
  {
    slug: 'press',
    title: 'Press',
    seoTitle: 'Press | CoachX',
    seoDescription: 'Media resources and press mentions for CoachX.',
    blocks: [{ type: 'HERO', order: 0, data: { headline: 'Press', description: 'For media enquiries, please use our contact form.' } }],
  },
  {
    slug: 'roadmap',
    title: 'Product Roadmap',
    seoTitle: 'Roadmap | CoachX',
    seoDescription: 'What we are building next at CoachX.',
    blocks: [{ type: 'TIMELINE', order: 0, data: { heading: 'What’s next', items: [{ date: 'Now', title: 'Public website & CMS foundation', description: 'The marketing site you are looking at.' }] } }],
  },
  {
    slug: 'release-notes',
    title: 'Release Notes',
    seoTitle: 'Release Notes | CoachX',
    seoDescription: 'Recent updates to the CoachX platform.',
    blocks: [{ type: 'TEXT', order: 0, data: { heading: 'Release Notes', body: '<p>Phase 5 (Part 1): Public website and CMS foundation launched.</p>' } }],
  },
  {
    slug: 'welcome-to-coachx',
    title: 'Welcome to CoachX',
    template: 'BLOG_POST',
    seoTitle: 'Welcome to CoachX | Blog',
    seoDescription: 'An introduction to the CoachX platform and what you can expect.',
    tags: ['Business', 'Community'],
    blocks: [{ type: 'TEXT', order: 0, data: { body: '<p>Welcome to CoachX — a Tamil-first platform for business, learning, and community. We are excited to have you here.</p>' } }],
  },
];

const HEADER_NAV: Array<{ label: string; url: string; children?: Array<{ label: string; url: string }> }> = [
  { label: 'About', url: '/about' },
  { label: 'Pricing', url: '/pricing' },
  { label: 'Blog', url: '/blog' },
  { label: 'Contact', url: '/contact' },
];

const FOOTER_NAV: Array<{ column: string; label: string; url: string }> = [
  { column: 'Company', label: 'About', url: '/about' },
  { column: 'Company', label: 'Careers', url: '/careers' },
  { column: 'Company', label: 'Press', url: '/press' },
  { column: 'Company', label: 'Contact', url: '/contact' },
  { column: 'Resources', label: 'Blog', url: '/blog' },
  { column: 'Resources', label: 'FAQ', url: '/faq' },
  { column: 'Resources', label: 'Roadmap', url: '/roadmap' },
  { column: 'Resources', label: 'Release Notes', url: '/release-notes' },
  { column: 'Legal', label: 'Terms', url: '/terms' },
  { column: 'Legal', label: 'Privacy', url: '/privacy' },
  { column: 'Legal', label: 'Cookies', url: '/cookies' },
];

const FAQ_ENTRIES: Array<{ category: string; question: string; answer: string; order: number }> = [
  { category: 'Platform', question: 'What is CoachX?', answer: 'CoachX is a Tamil-first business, learning, and community platform.', order: 0 },
  { category: 'Membership', question: 'How do I join?', answer: 'Click "Join Now" and create a free account — no credit card required.', order: 0 },
  { category: 'Payment', question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time from your account settings.', order: 0 },
  { category: 'Payment', question: 'Do you offer annual billing?', answer: 'Yes — annual billing is available on paid plans at a discount.', order: 1 },
];

export async function seedCms(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding CMS pages...');
  for (const page of PAGES) {
    const created = await prisma.page.upsert({
      where: { slug_language: { slug: page.slug, language: 'EN' } },
      create: {
        slug: page.slug,
        language: 'EN',
        template: page.template ?? 'STANDARD',
        status: 'PUBLISHED',
        title: page.title,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        tags: page.tags ?? [],
        publishAt: new Date(),
      },
      update: {
        title: page.title,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        status: 'PUBLISHED',
        publishAt: new Date(),
      },
    });

    await prisma.pageBlock.deleteMany({ where: { pageId: created.id } });
    for (const block of page.blocks) {
      await prisma.pageBlock.create({
        data: {
          pageId: created.id,
          type: block.type as never,
          order: block.order,
          data: block.data as Prisma.InputJsonValue,
        },
      });
    }
  }

  console.log('  Seeding navigation...');
  await prisma.navigationItem.deleteMany({ where: { location: 'HEADER' } });
  for (const [index, item] of HEADER_NAV.entries()) {
    await prisma.navigationItem.create({
      data: { location: 'HEADER', label: item.label, url: item.url, order: index },
    });
  }

  await prisma.navigationItem.deleteMany({ where: { location: 'FOOTER' } });
  for (const [index, item] of FOOTER_NAV.entries()) {
    await prisma.navigationItem.create({
      data: { location: 'FOOTER', label: item.label, url: item.url, order: index, megaMenuColumn: item.column },
    });
  }

  console.log('  Seeding FAQ entries...');
  const existingFaqCount = await prisma.faqEntry.count();
  if (existingFaqCount === 0) {
    for (const faq of FAQ_ENTRIES) {
      await prisma.faqEntry.create({ data: faq });
    }
  }

  console.log(`  CMS seed complete: ${PAGES.length} pages, ${HEADER_NAV.length} header + ${FOOTER_NAV.length} footer nav items.`);
}
