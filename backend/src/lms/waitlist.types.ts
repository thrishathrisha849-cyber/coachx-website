/** 004 Waitlist batch (FR-028/029) — DTO shapes. */

export interface MyWaitlistEntry {
  id: string;
  courseId: string;
  status: string;
  priority: number;
  joinedAt: Date;
  offeredAt: Date | null;
  offerExpiresAt: Date | null;
  claimedAt: Date | null;
}

export interface AdminWaitlistEntry extends MyWaitlistEntry {
  userId: string;
  userDisplayName: string | null;
  referralSource: string | null;
  offerEmailSentAt: Date | null;
}
