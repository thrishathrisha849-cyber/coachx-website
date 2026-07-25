import { findActiveAnnouncements } from './cms.repository';

/**
 * 002 FR-005/FR-006: an announcement is active purely by date-range
 * comparison at read time — there is no manual "is this live" status
 * flag to forget to flip, closing the edge case named in spec.md's own
 * Edge Cases section ("must stop displaying it automatically based on
 * the date range, not rely on manual status changes").
 */
export async function getActiveAnnouncements() {
  return findActiveAnnouncements(new Date());
}
