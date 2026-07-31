import { findOrCreateLmsSettings } from './lms-settings.repository';
import { findStreakByUserId, findOrCreateStreak, updateStreak } from './learning-streak.repository';
import type { TransactionClient } from '../database/transaction';

/**
 * 004 Learning Streak batch (T042, FR-057). See `schema.prisma`'s own
 * `LearningStreak` doc comment for the full "never trust a client-sent
 * streak value" rationale — every write here is triggered exclusively
 * from an already-server-verified genuine learner action (never an admin
 * override), and is idempotent per calendar day (re-triggering the same
 * qualifying action twice in one day never inflates the streak beyond
 * +1/day).
 */

/** Returns the calendar date (YYYY-MM-DD) `date` falls on on the WALL CLOCK of `timezone` — an IANA name. */
function calendarDateInTimezone(date: Date, timezone: string): string {
  // en-CA formats as YYYY-MM-DD, exactly the sortable/comparable shape this module needs.
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** A calendar-date string (YYYY-MM-DD) as a UTC-midnight `Date`, matching how `@db.Date` columns round-trip through Prisma. */
function dateOnly(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

/** Whole days between two calendar-date strings (b - a). A stored `@db.Date` value is already UTC-midnight-anchored, so reading it back via the 'UTC' timezone always recovers the exact original date string regardless of what `streakTimezone` is configured to at read time. */
function daysBetween(aDateString: string, bDateString: string): number {
  return Math.round((dateOnly(bDateString).getTime() - dateOnly(aDateString).getTime()) / 86_400_000);
}

/**
 * The one function that actually mutates streak state — every qualifying
 * action funnels through here. Idempotent per calendar day: a second call
 * on the same streak-day is a silent no-op.
 */
export async function markStreakDayQualified(userId: string, now: Date = new Date(), tx?: TransactionClient): Promise<void> {
  const settings = await findOrCreateLmsSettings(tx);
  const today = calendarDateInTimezone(now, settings.streakTimezone);
  const streak = await findOrCreateStreak(userId, tx);

  if (!streak.lastQualifyingDate) {
    await updateStreak(userId, { currentStreakDays: 1, longestStreakDays: Math.max(streak.longestStreakDays, 1), lastQualifyingDate: dateOnly(today) }, tx);
    return;
  }

  const lastDateString = calendarDateInTimezone(streak.lastQualifyingDate, 'UTC');
  const gap = daysBetween(lastDateString, today);
  if (gap <= 0) return; // already counted today (or a clock/timezone anomaly moving backward — never regress)

  const missedDays = gap - 1;
  const nextStreak = missedDays <= settings.streakGraceDays ? streak.currentStreakDays + 1 : 1;
  await updateStreak(
    userId,
    { currentStreakDays: nextStreak, longestStreakDays: Math.max(streak.longestStreakDays, nextStreak), lastQualifyingDate: dateOnly(today) },
    tx,
  );
}

/** Lesson complete — call ONLY for `source: 'MANUAL_LEARNER' | 'SIGNAL_DERIVED'`, never an override. */
export async function recordLessonCompletionForStreak(userId: string, tx?: TransactionClient): Promise<void> {
  const settings = await findOrCreateLmsSettings(tx);
  if (!settings.streakQualifyLessonComplete) return;
  await markStreakDayQualified(userId, new Date(), tx);
}

/** Quiz complete — call ONLY when the attempt actually PASSED. */
export async function recordQuizCompletionForStreak(userId: string, tx?: TransactionClient): Promise<void> {
  const settings = await findOrCreateLmsSettings(tx);
  if (!settings.streakQualifyQuizComplete) return;
  await markStreakDayQualified(userId, new Date(), tx);
}

/** Assignment activity — call on a genuine learner-initiated submission. */
export async function recordAssignmentActivityForStreak(userId: string, tx?: TransactionClient): Promise<void> {
  const settings = await findOrCreateLmsSettings(tx);
  if (!settings.streakQualifyAssignmentActivity) return;
  await markStreakDayQualified(userId, new Date(), tx);
}

/**
 * Minimum learning time — accumulates the SAME server-bounded
 * `timeSpentDeltaSeconds` `progress.service.ts` already clamps via
 * `MAX_TIME_SPENT_DELTA_SECONDS` before it ever reaches here, so this
 * reuses an already-trusted input rather than introducing a new
 * gameable surface. `deltaSeconds` <= 0 is a no-op.
 */
export async function recordLearningTimeForStreak(userId: string, deltaSeconds: number, tx?: TransactionClient): Promise<void> {
  if (deltaSeconds <= 0) return;
  const settings = await findOrCreateLmsSettings(tx);
  if (!settings.streakQualifyMinLearningTime) return;

  const now = new Date();
  const today = calendarDateInTimezone(now, settings.streakTimezone);
  const streak = await findOrCreateStreak(userId, tx);
  const storedDate = streak.todaysLearningDate ? calendarDateInTimezone(streak.todaysLearningDate, 'UTC') : null;
  const newTotal = (storedDate === today ? streak.todaysLearningSeconds : 0) + deltaSeconds;

  await updateStreak(userId, { todaysLearningSeconds: newTotal, todaysLearningDate: dateOnly(today) }, tx);

  if (newTotal >= settings.streakMinLearningTimeMinutes * 60) {
    await markStreakDayQualified(userId, now, tx);
  }
}

export interface PublicLearningStreak {
  currentStreakDays: number;
  longestStreakDays: number;
  lastQualifyingDate: string | null;
}

/** Read-only — never creates a row for a learner with zero activity, just reports zeros. */
export async function getMyStreak(userId: string): Promise<PublicLearningStreak> {
  const streak = await findStreakByUserId(userId);
  if (!streak) return { currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null };
  return {
    currentStreakDays: streak.currentStreakDays,
    longestStreakDays: streak.longestStreakDays,
    lastQualifyingDate: streak.lastQualifyingDate ? streak.lastQualifyingDate.toISOString().slice(0, 10) : null,
  };
}
