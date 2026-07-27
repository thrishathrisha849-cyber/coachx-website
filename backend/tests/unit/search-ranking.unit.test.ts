import { scoreMatch, highlight } from '../../src/cms/search.service';

describe('search.service — scoreMatch() (safe ranking)', () => {
  it('scores an exact match highest (3)', () => {
    expect(scoreMatch('pricing', ['pricing'])).toBe(3);
  });

  it('scores a starts-with match as 2', () => {
    expect(scoreMatch('pricing', ['pricing plans'])).toBe(2);
  });

  it('scores a contains-only match as 1', () => {
    expect(scoreMatch('plan', ['our pricing plans'])).toBe(1);
  });

  it('scores no match as 0', () => {
    expect(scoreMatch('zzz-not-present', ['pricing plans'])).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(scoreMatch('PRICING', ['pricing'])).toBe(3);
  });

  it('returns the BEST score across multiple fields', () => {
    expect(scoreMatch('pricing', ['about us', 'pricing'])).toBe(3);
  });
});

describe('search.service — highlight()', () => {
  it('returns a single non-highlighted segment when there is no match', () => {
    const result = highlight('some text', 'zzz');
    expect(result).toEqual([{ text: 'some text', highlight: false }]);
  });

  it('splits text into before/match/after segments', () => {
    const result = highlight('the pricing page', 'pricing');
    expect(result).toEqual([
      { text: 'the ', highlight: false },
      { text: 'pricing', highlight: true },
      { text: ' page', highlight: false },
    ]);
  });

  it('handles a match at the very start of the text (no leading segment)', () => {
    const result = highlight('pricing page', 'pricing');
    expect(result).toEqual([
      { text: 'pricing', highlight: true },
      { text: ' page', highlight: false },
    ]);
  });

  it('handles a match at the very end of the text (no trailing segment)', () => {
    const result = highlight('our pricing', 'pricing');
    expect(result).toEqual([
      { text: 'our ', highlight: false },
      { text: 'pricing', highlight: true },
    ]);
  });

  it('is case-insensitive but preserves the original casing in the returned segment', () => {
    const result = highlight('Our Pricing Page', 'pricing');
    expect(result).toEqual([
      { text: 'Our ', highlight: false },
      { text: 'Pricing', highlight: true },
      { text: ' Page', highlight: false },
    ]);
  });

  it('never returns raw HTML — only plain-text segments (no injection surface)', () => {
    const result = highlight('<script>alert(1)</script> pricing', 'pricing');
    const joined = result.map((s) => s.text).join('');
    expect(joined).toContain('<script>'); // preserved as literal text, not executed — caller renders as plain text, never dangerouslySetInnerHTML
    expect(result.every((s) => typeof s.text === 'string')).toBe(true);
  });
});
