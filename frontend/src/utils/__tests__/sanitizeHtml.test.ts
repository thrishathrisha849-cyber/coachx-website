import { describe, it, expect } from 'vitest';
import { sanitizeRichText } from '../sanitizeHtml';

describe('sanitizeRichText (Phase 5 Part 2 security review)', () => {
  it('preserves allowed structural/text formatting tags', () => {
    const input = '<p>Hello <strong>world</strong> and <em>friends</em></p>';
    expect(sanitizeRichText(input)).toBe(input);
  });

  it('strips <script> tags entirely', () => {
    const result = sanitizeRichText('<p>Hi</p><script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('strips inline event-handler attributes (onerror, onclick)', () => {
    const result = sanitizeRichText('<img src="x" onerror="alert(1)"><button onclick="evil()">Click</button>');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onclick');
  });

  it('strips disallowed tags like <iframe> and <object>', () => {
    const result = sanitizeRichText('<iframe src="https://evil.example.com"></iframe><object data="x"></object>');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<object');
  });

  it('strips the style attribute (CSS-injection vector)', () => {
    const result = sanitizeRichText('<p style="background:url(javascript:alert(1))">text</p>');
    expect(result).not.toContain('style=');
  });

  it('rejects a javascript: URL in an href', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('adds target=_blank and rel=noopener noreferrer to external links', () => {
    const result = sanitizeRichText('<a href="https://example.com">external</a>');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('does not add target/rel to internal (relative) links', () => {
    const result = sanitizeRichText('<a href="/about">internal</a>');
    expect(result).not.toContain('target="_blank"');
  });
});
