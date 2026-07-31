import { useEffect, useState } from 'react';
import { getMyStreak } from '@/api/lms.api';

/**
 * 004 Learning Streak batch (FR-057, T042) — a small, self-fetching badge
 * showing the learner's real, server-computed cross-course streak.
 * Renders nothing while loading or for a learner with no streak yet (0
 * days) — no reason to show a discouraging "🔥 0-day streak" on a brand
 * new account.
 */
export function LearningStreakBadge() {
  const [streak, setStreak] = useState<{ currentStreakDays: number; longestStreakDays: number } | null>(null);

  useEffect(() => {
    getMyStreak()
      .then(setStreak)
      .catch(() => setStreak(null));
  }, []);

  if (!streak || streak.currentStreakDays === 0) return null;

  return (
    <span
      title={`Longest streak: ${streak.longestStreakDays} day${streak.longestStreakDays === 1 ? '' : 's'}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
    >
      🔥 {streak.currentStreakDays}-day streak
    </span>
  );
}
