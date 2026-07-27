# Accessibility

Status: **Implemented** for the components this phase builds, targeting
WCAG AA where practical. Verified two ways: automated (`jest-axe`
against every major component, Phase 5 Part 2's test suite) and manual
review (documented below) — automated axe checks catch a meaningful
subset of WCAG issues but not all (e.g. logical reading order, quality
of alt text, color-contrast edge cases in dynamic states) — this is
stated honestly, not claimed as exhaustive.

## Keyboard navigation & focus order

- Every interactive element (links, buttons, form fields) is a native
  HTML element (`<a>`, `<button>`, `<input>`) — no `<div onClick>`
  patterns anywhere, so native tab order and keyboard activation work
  without extra ARIA.
- `MobileNav` (the one true dialog in this phase) implements a real
  focus trap (`useFocusTrap.ts`): Tab/Shift+Tab cycles within the
  dialog, initial focus moves to the close button on open, and focus
  returns to the triggering hamburger button on close.
- Skip-navigation link (`MainLayout.tsx`) — visually hidden until
  focused, jumps to `#main-content`.

## Headings & landmarks

- One `<h1>` per page (block components use `<h2>`/`<h3>` for internal
  structure).
- `<header>` (implicit `banner`), `<footer>` (implicit `contentinfo`),
  `<main id="main-content">`, `<nav aria-label="Primary">` /
  `aria-label="Mobile"` / `aria-label="Pagination"` /
  `aria-label="Breadcrumb"` — every landmark is named where more than
  one of the same type exists on a page.

## ARIA usage — only where semantic HTML isn't enough

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on
  `MobileNav` and `CookieConsentBanner`.
- `aria-pressed` on the Blog tag-filter toggle buttons (a11y-correct
  "selected" state for a button group, not a native input type).
- `aria-invalid` + `aria-describedby` linking each form field to its
  error message (`ContactForm`).
- `aria-live="polite"` on the Pagination page indicator, so screen
  reader users are told when the page changes without a full
  re-announcement of the page.
- `aria-hidden="true"` on decorative icons/emoji throughout.

## Forms

- Every input has a `<label>` (visible or `sr-only`), never a bare
  `placeholder` as the only label.
- Inline, field-adjacent error messages, linked via `aria-describedby`
  (not just color — text content, per WCAG's "don't rely on color
  alone").
- The honeypot field (`HoneypotField.tsx`) is excluded from the
  accessibility tree (`aria-hidden="true"`, `tabIndex={-1}`) so it is
  invisible to assistive technology, not just visually hidden — a
  screen-reader user is never presented with a field they'd need to
  understand is a trap.

## Color contrast

Tailwind's `slate-600`/`slate-700` on white (and `slate-300`/`slate-200`
on `slate-950` in dark mode) are used for body text — both combinations
meet WCAG AA's 4.5:1 threshold for normal text. Brand accent
(`brand-600`) is used for links/CTAs against white/slate-50 backgrounds
at a contrast ratio that passes AA for the font sizes used. No
automated contrast-ratio test is included in this phase's suite (axe
does check contrast but jsdom's rendering doesn't compute real pixel
colors reliably) — documented as a manual-review item, not a false
"tested" claim.

## Reduced motion

`prefers-reduced-motion: reduce` is honored platform-wide via a global
CSS rule (`styles/index.css`, Phase 5 Part 2) that collapses animation/
transition durations to near-zero and disables smooth scrolling — not
implemented per-component, so no future component can forget it.

## Video captions/transcripts (FR-108)

The `VIDEO` block supports a `captionsUrl` field rendering a `<track
kind="captions">` element. No transcript UI is built (would need a
transcript-authoring/storage mechanism not modeled in this phase) —
recorded as a gap, not silently omitted.

## Automated test coverage (Phase 5 Part 2)

`jest-axe` violations are asserted against: `EmptyState`,
`BlockRenderer` (HERO block), `Header`, `MobileNav`, `ContactForm`,
`NewsletterForm`, `CookieConsentBanner`. See
`docs/public-site/TESTING.md` for the full list and how to run them.

## Manual checks still required (Part 3 consolidation)

Consolidating the manual-verification items already noted above, plus
what automated tooling in this phase structurally cannot cover:

- **Real-browser color-contrast measurement** — `jest-axe` under jsdom
  does not compute actual rendered pixel colors; the Tailwind palette
  choices above are believed AA-compliant by design-token inspection,
  not machine-verified. Owner: a Playwright + axe-core browser-mode
  pass (Decision Gate #9/#15).
- **Screen-reader smoke test** (NVDA/VoiceOver) of the primary flows —
  home page, blog list/detail, contact form submission, mobile nav
  open/close — has not been performed; `jest-axe` verifies markup
  correctness, not actual assistive-technology behavior.
- **Reading-order verification on multi-column CMS blocks** (e.g.
  `FEATURES`, `TESTIMONIALS` grids) — DOM order matches visual order by
  construction (no CSS `order`/grid-placement reordering is used), but
  this has not been walked with a screen reader.
- **Alt-text quality** — `IMAGE`/`GALLERY` blocks require an `alt`
  field at the schema level (never omitted), but content *quality* is
  an authoring-time concern no automated check can verify; this becomes
  relevant once a real admin editor exists to author it.
- **Video captions** — `captionsUrl` is wired at the block-data level;
  no actual caption file has been authored/tested since no video asset
  pipeline exists yet in this phase.

None of the above are known failures — they are unverified-by-tooling
areas, stated honestly per this document's stated discipline.
