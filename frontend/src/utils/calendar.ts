/** 002 FR-047: "Add to Calendar" for a masterclass/event registration confirmation. */
export function buildGoogleCalendarUrl(title: string, description: string, startAt: Date, durationMinutes = 60): string {
  const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    dates: `${format(startAt)}/${format(endAt)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
