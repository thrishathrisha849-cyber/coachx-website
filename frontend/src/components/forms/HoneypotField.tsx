interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Spam-protection foundation (Phase 5 Part 2 §"CONTACT"/"NEWSLETTER").
 * A field real users never see or fill — positioned off-screen (not
 * `display:none`/`visibility:hidden`, which some bots specifically
 * check for and skip) and excluded from tab order / screen readers.
 * A non-empty value on submit silently no-ops server-side (see
 * `contact.service.ts`/`newsletter.service.ts`) rather than surfacing
 * an error a bot could learn from.
 */
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
      <label htmlFor="website">Leave this field empty</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
