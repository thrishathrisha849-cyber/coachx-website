/**
 * Minimal class-name combiner (no external dependency). Joins truthy
 * class values with a single space — the same job `clsx`/`cn` helpers do,
 * kept dependency-free for the foundation phase.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
