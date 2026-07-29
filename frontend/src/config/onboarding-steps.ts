/** Mirrors `backend/src/onboarding/onboarding.types.ts`'s `ONBOARDING_STEPS` — step numbers/keys must stay in sync with the backend sequence. */
export type OnboardingFieldType = 'info' | 'single-select' | 'multi-select' | 'text';

export interface OnboardingStepConfig {
  stepNumber: number;
  stepKey: string;
  title: string;
  description: string;
  type: OnboardingFieldType;
  options?: { value: string; label: string }[];
}

export const ONBOARDING_STEP_CONFIG: OnboardingStepConfig[] = [
  {
    stepNumber: 1,
    stepKey: 'welcome',
    title: 'Welcome to CoachX',
    description: "A few quick questions will help us personalize your learning roadmap. It takes about 2 minutes.",
    type: 'info',
  },
  {
    stepNumber: 2,
    stepKey: 'language',
    title: 'Preferred language',
    description: 'Which language would you like to learn in?',
    type: 'single-select',
    options: [
      { value: 'en', label: 'English' },
      { value: 'ta', label: 'Tamil' },
      { value: 'tanglish', label: 'Tanglish' },
    ],
  },
  {
    stepNumber: 3,
    stepKey: 'goal',
    title: "What's your main goal?",
    description: 'Pick the one that matters most to you right now.',
    type: 'single-select',
    options: [
      { value: 'start_business', label: 'Start a business' },
      { value: 'grow_business', label: 'Grow my existing business' },
      { value: 'learn_skill', label: 'Learn a new skill' },
      { value: 'career_change', label: 'Change my career' },
    ],
  },
  {
    stepNumber: 4,
    stepKey: 'user_type',
    title: 'Which best describes you?',
    description: '',
    type: 'single-select',
    options: [
      { value: 'student', label: 'Student' },
      { value: 'entrepreneur', label: 'Entrepreneur' },
      { value: 'freelancer', label: 'Freelancer' },
      { value: 'business_owner', label: 'Business owner' },
      { value: 'coach', label: 'Coach / Mentor' },
    ],
  },
  {
    stepNumber: 5,
    stepKey: 'experience',
    title: 'Your experience level',
    description: '',
    type: 'single-select',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
  {
    stepNumber: 6,
    stepKey: 'business_stage',
    title: "Where's your business today?",
    description: '',
    type: 'single-select',
    options: [
      { value: 'idea_stage', label: 'Just an idea' },
      { value: 'just_started', label: 'Just started' },
      { value: 'growing', label: 'Growing' },
      { value: 'established', label: 'Established' },
    ],
  },
  {
    stepNumber: 7,
    stepKey: 'interests',
    title: "What are you most interested in?",
    description: 'Select all that apply.',
    type: 'multi-select',
    options: [
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
      { value: 'content', label: 'Content creation' },
      { value: 'ai_tools', label: 'AI tools' },
      { value: 'community', label: 'Community building' },
      { value: 'finance', label: 'Finance' },
    ],
  },
  {
    stepNumber: 8,
    stepKey: 'time_availability',
    title: 'How much time can you commit weekly?',
    description: '',
    type: 'single-select',
    options: [
      { value: 'under_1hr', label: 'Under 1 hour' },
      { value: '1_3hrs', label: '1–3 hours' },
      { value: '3_6hrs', label: '3–6 hours' },
      { value: '6plus_hrs', label: '6+ hours' },
    ],
  },
  {
    stepNumber: 9,
    stepKey: 'format',
    title: 'Preferred learning format',
    description: '',
    type: 'single-select',
    options: [
      { value: 'video', label: 'Video lessons' },
      { value: 'text', label: 'Text / articles' },
      { value: 'live', label: 'Live sessions' },
      { value: 'community', label: 'Community discussions' },
    ],
  },
  {
    stepNumber: 10,
    stepKey: 'challenge',
    title: "What's your biggest challenge right now?",
    description: 'Tell us in a few words.',
    type: 'text',
  },
  {
    stepNumber: 11,
    stepKey: 'assessment',
    title: 'How confident do you feel about reaching your goal?',
    description: '',
    type: 'single-select',
    options: [
      { value: 'not_confident', label: 'Not confident yet' },
      { value: 'somewhat_confident', label: 'Somewhat confident' },
      { value: 'very_confident', label: 'Very confident' },
    ],
  },
];
