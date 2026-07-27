import { describe, it, expect } from 'vitest';
import { isExternalUrl } from '../url';

describe('isExternalUrl (open-redirect prevention)', () => {
  it('treats a root-relative path as internal', () => {
    expect(isExternalUrl('/about')).toBe(false);
    expect(isExternalUrl('/blog/my-post')).toBe(false);
  });

  it('treats a full https URL as external', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
  });

  it('treats a full http URL as external', () => {
    expect(isExternalUrl('http://example.com')).toBe(true);
  });

  it('treats a protocol-relative URL ("//evil.com") as external — the classic open-redirect gap', () => {
    expect(isExternalUrl('//evil.com/phishing')).toBe(true);
  });

  it('treats an empty string as internal (no navigation)', () => {
    expect(isExternalUrl('')).toBe(false);
  });

  it('treats a bare domain without a leading slash as external', () => {
    expect(isExternalUrl('example.com')).toBe(true);
  });
});
