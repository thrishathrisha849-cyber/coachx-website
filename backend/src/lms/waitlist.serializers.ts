import type { AdminWaitlistEntry, MyWaitlistEntry } from './waitlist.types';

interface EntryRow {
  id: string;
  courseId: string;
  status: string;
  priority: number;
  joinedAt: Date;
  offeredAt: Date | null;
  offerExpiresAt: Date | null;
  claimedAt: Date | null;
}

export function toMyWaitlistEntry(row: EntryRow): MyWaitlistEntry {
  return {
    id: row.id,
    courseId: row.courseId,
    status: row.status,
    priority: row.priority,
    joinedAt: row.joinedAt,
    offeredAt: row.offeredAt,
    offerExpiresAt: row.offerExpiresAt,
    claimedAt: row.claimedAt,
  };
}

export function toAdminWaitlistEntry(
  row: EntryRow & { userId: string; referralSource: string | null; offerEmailSentAt: Date | null; user: { profile: { displayName: string | null } | null } },
): AdminWaitlistEntry {
  return {
    ...toMyWaitlistEntry(row),
    userId: row.userId,
    userDisplayName: row.user.profile?.displayName ?? null,
    referralSource: row.referralSource,
    offerEmailSentAt: row.offerEmailSentAt,
  };
}
