/**
 * 001 FR-020–FR-038 — the 16-module platform registry + 4-surface
 * catalog, and FR-078–FR-082's 4-phase gating map. A fixed, spec-defined
 * catalog (the module list and which phase gates it), hence constants
 * rather than an admin-editable table — the SAME reasoning already
 * applied to the revenue-stream catalog.
 */

export type ProductPhaseCode = 'FOUNDATION_MVP' | 'GROWTH_PLATFORM' | 'BUSINESS_OPERATING_SYSTEM' | 'ENTERPRISE_ECOSYSTEM';

export interface PlatformModuleDefinition {
  code: string;
  name: string;
  phase: ProductPhaseCode;
}

/** FR-024–FR-038: Module 01 Authentication through Module 16 Analytics, each mapped to its FR-078–082 gating phase. */
export const PLATFORM_MODULES: PlatformModuleDefinition[] = [
  { code: 'authentication_identity', name: 'Authentication and Identity', phase: 'FOUNDATION_MVP' },
  { code: 'onboarding', name: 'Onboarding', phase: 'FOUNDATION_MVP' },
  { code: 'member_dashboard', name: 'Member Dashboard', phase: 'FOUNDATION_MVP' },
  { code: 'lms', name: 'Learning Management System', phase: 'FOUNDATION_MVP' },
  { code: 'community', name: 'Community', phase: 'FOUNDATION_MVP' },
  { code: 'challenges_accountability', name: 'Challenges and Accountability', phase: 'GROWTH_PLATFORM' },
  { code: 'events', name: 'Events', phase: 'FOUNDATION_MVP' },
  { code: 'ai_business_workspace', name: 'AI Business Workspace', phase: 'BUSINESS_OPERATING_SYSTEM' },
  { code: 'mentor_marketplace', name: 'Mentor Marketplace', phase: 'GROWTH_PLATFORM' },
  { code: 'digital_marketplace', name: 'Digital Marketplace', phase: 'GROWTH_PLATFORM' },
  { code: 'membership_access', name: 'Membership and Access', phase: 'FOUNDATION_MVP' },
  { code: 'wallet_rewards', name: 'Wallet and Rewards', phase: 'GROWTH_PLATFORM' },
  { code: 'crm_business_workspace', name: 'CRM and Business Workspace', phase: 'BUSINESS_OPERATING_SYSTEM' },
  { code: 'search_discovery', name: 'Search and Discovery', phase: 'GROWTH_PLATFORM' },
  { code: 'notification_system', name: 'Notification System', phase: 'FOUNDATION_MVP' },
  { code: 'analytics', name: 'Analytics', phase: 'FOUNDATION_MVP' },
];

export const PRODUCT_PHASE_ORDER: ProductPhaseCode[] = [
  'FOUNDATION_MVP',
  'GROWTH_PLATFORM',
  'BUSINESS_OPERATING_SYSTEM',
  'ENTERPRISE_ECOSYSTEM',
];

export interface PlatformSurfaceDefinition {
  code: string;
  name: string;
  audience: string;
  pages: string[];
}

/** FR-020–FR-023: the 4 access surfaces and their minimum page/section sets. */
export const PLATFORM_SURFACES: PlatformSurfaceDefinition[] = [
  {
    code: 'public_website',
    name: 'Public Website',
    audience: 'Unauthenticated visitors',
    pages: ['Home', 'About', 'How It Works', 'Membership', 'Programs', 'Courses', 'Mentors', 'Events', 'Success Stories', 'Blog', 'Guides', 'Podcast', 'Free Resources', 'Masterclass Registration', 'Contact', 'FAQ', 'Login', 'Sign Up', 'Legal Pages'],
  },
  {
    code: 'member_web_app',
    name: 'Member Web Application',
    audience: 'Authenticated members',
    pages: ['Dashboard', 'Learning', 'Community', 'Challenges', 'Events', 'Mentors', 'AI Tools', 'Marketplace', 'Business Workspace', 'Notifications', 'Profile', 'Membership', 'Wallet', 'Support', 'Settings'],
  },
  {
    code: 'mobile_app',
    name: 'Mobile Application',
    audience: 'Authenticated members (mobile)',
    pages: ['Core member-app capability set (FR-022)'],
  },
  {
    code: 'admin_app',
    name: 'Admin Application',
    audience: 'Internal staff (role-gated)',
    pages: ['Business Dashboard', 'User Management', 'Membership Management', 'Course CMS', 'Community Moderation', 'Event Management', 'Mentor Management', 'AI Configuration', 'Payment Management', 'Marketing CMS', 'Notification Centre', 'Support Management', 'Analytics', 'Reports', 'Settings', 'Security', 'Audit Logs'],
  },
];

/** FR-082: capabilities explicitly excluded from MVP release scope. */
export const MVP_EXCLUDED_CAPABILITIES: string[] = [
  'full_website_builder',
  'native_video_conferencing',
  'public_cryptocurrency',
  'complex_accounting_software',
  'full_payroll_system',
  'physical_product_logistics',
  'banking_services',
  'instant_global_multilingual_ai_translation',
  'unlimited_file_storage',
  'custom_white_label_mobile_apps',
];
