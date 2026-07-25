import DOMPurify from 'dompurify';

/**
 * Sanitizes admin-authored rich-text HTML before rendering (Phase 5
 * Part 2 security review closes the gap Part 1 documented in
 * `docs/public-site/DECISION_GATES.md` #7 — "no sanitizer wired in
 * yet"). Applied to every block that renders HTML content
 * (`TextBlock`), not just ones that will eventually accept untrusted
 * input from an admin editor — defense in depth, since "trusted today"
 * is not a permanent guarantee.
 *
 * Allowlist is deliberately narrow: structural/text formatting only —
 * no `<script>`, no inline event handlers (`onclick` etc.), no
 * `<iframe>`/`<object>`/`<embed>`, no `style` attribute (a common CSS-
 * injection vector), no `javascript:`/`data:` URLs in `href`/`src`
 * (DOMPurify's default URL-scheme allowlist already excludes these).
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre', 'hr', 'span',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

export function sanitizeRichText(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  // Belt-and-suspenders on top of DOMPurify's own safety: force every
  // anchor to a safe target/rel combination (FR-security: "safe
  // external links" — prevents reverse-tabnabbing via target=_blank
  // without rel=noopener).
  const container = document.createElement('div');
  container.innerHTML = clean;
  container.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return container.innerHTML;
}
