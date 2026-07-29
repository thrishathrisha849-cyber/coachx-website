import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOnboardingProgress, submitOnboardingStep, completeOnboarding } from '@/api/onboarding.api';
import type { NormalizedApiError } from '@/api/client';
import { ONBOARDING_STEP_CONFIG } from '@/config/onboarding-steps';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * 003 US2: 11-step onboarding sequencer. FR-090 — on load, fetches
 * `/onboarding/progress` and resumes from the exact next incomplete step;
 * an already-answered step is never re-presented. The last step's submit
 * triggers `/onboarding/complete` (roadmap generation) and redirects to
 * `/onboarding/roadmap`.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [value, setValue] = useState<unknown>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentHead({ title: 'Get started | CoachX', description: 'Personalize your CoachX learning roadmap.' });

  useEffect(() => {
    getOnboardingProgress()
      .then((progress) => {
        if (progress.isComplete) {
          navigate('/onboarding/roadmap', { replace: true });
          return;
        }
        setCurrentStep(progress.currentStep);
        setCompletedSteps(progress.completedStepNumbers);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [navigate]);

  const step = ONBOARDING_STEP_CONFIG.find((s) => s.stepNumber === currentStep);
  const totalSteps = ONBOARDING_STEP_CONFIG.length;

  const handleNext = async () => {
    if (!step) return;
    setSubmitting(true);
    setError(null);

    try {
      const answerValue = step.type === 'info' ? true : value;
      await submitOnboardingStep(step.stepNumber, answerValue);
      setCompletedSteps((prev) => [...prev, step.stepNumber]);

      if (step.stepNumber >= totalSteps) {
        await completeOnboarding();
        navigate('/onboarding/roadmap');
        return;
      }

      setCurrentStep(step.stepNumber + 1);
      setValue(undefined);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = (() => {
    if (!step) return false;
    if (step.type === 'info') return true;
    if (step.type === 'text') return typeof value === 'string' && value.trim().length > 0;
    if (step.type === 'multi-select') return Array.isArray(value) && value.length > 0;
    return typeof value === 'string' && value.length > 0;
  })();

  if (loadState === 'loading') {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  if (loadState === 'error' || !step) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load onboarding. Please refresh the page.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Step {step.stepNumber} of {totalSteps}</span>
          <span>{completedSteps.length} completed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all"
            style={{ width: `${((step.stepNumber - 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{step.title}</h1>
      {step.description && <p className="mt-2 text-slate-600 dark:text-slate-300">{step.description}</p>}

      <div className="mt-6">
        {step.type === 'single-select' && step.options && (
          <div className="flex flex-col gap-2">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue(opt.value)}
                aria-pressed={value === opt.value}
                className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  value === opt.value
                    ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-slate-300 text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {step.type === 'multi-select' && step.options && (
          <div className="flex flex-col gap-2">
            {step.options.map((opt) => {
              const selected = Array.isArray(value) && (value as string[]).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? (value as string[]) : [];
                    setValue(selected ? current.filter((v) => v !== opt.value) : [...current, opt.value]);
                  }}
                  aria-pressed={selected}
                  className={`rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'border-slate-300 text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {step.type === 'text' && (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          disabled={step.stepNumber <= 1 || submitting}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40 dark:text-slate-400"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canProceed || submitting}
          onClick={handleNext}
          className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : step.stepNumber >= totalSteps ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
