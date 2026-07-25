/**
 * URL classification for external-link safety and open-redirect
 * prevention (Phase 5 Part 2 security review).
 *
 * `isExternalUrl` treats anything that is NOT an unambiguous root-
 * relative internal path (`/foo`, `/foo/bar`) as external — including
 * protocol-relative URLs (`//evil.com`), which a naive `^https?://`
 * check would miss and which react-router's `<Link>` would otherwise
 * render as a same-origin-looking link that actually navigates
 * off-site (the classic open-redirect pattern via CMS-authored CTA
 * URLs).
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  // Root-relative path, no scheme, no protocol-relative "//" prefix.
  return !/^\/(?!\/)/.test(url);
}

/**
 * Returns a safe `rel` value for an external anchor — always includes
 * `noopener` (reverse-tabnabbing prevention) and `noreferrer`.
 */
export const SAFE_EXTERNAL_REL = 'noopener noreferrer';
