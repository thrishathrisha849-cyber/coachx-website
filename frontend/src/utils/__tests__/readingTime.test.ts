import { describe, it, expect } from 'vitest';
import { estimateReadingMinutes } from '../readingTime';
import type { CmsBlock } from '@/types/cms.types';

function textBlock(body: string): CmsBlock {
  return { id: '1', type: 'TEXT', order: 0, data: { body } };
}

describe('estimateReadingMinutes', () => {
  it('returns at least 1 minute for very short content', () => {
    expect(estimateReadingMinutes([textBlock('A short sentence.')])).toBe(1);
  });

  it('estimates roughly word-count / 200', () => {
    const words = Array.from({ length: 600 }, () => 'word').join(' ');
    expect(estimateReadingMinutes([textBlock(`<p>${words}</p>`)])).toBe(3);
  });

  it('strips HTML tags before counting words', () => {
    const result = estimateReadingMinutes([textBlock('<p><strong>Hello</strong> <em>world</em></p>')]);
    expect(result).toBe(1);
  });

  it('ignores non-TEXT blocks', () => {
    const blocks: CmsBlock[] = [{ id: '1', type: 'HERO', order: 0, data: { headline: 'x'.repeat(1000) } }];
    expect(estimateReadingMinutes(blocks)).toBe(1); // no TEXT blocks contribute words, still floors at 1
  });

  it('returns 0-word floor of 1 for an empty block list', () => {
    expect(estimateReadingMinutes([])).toBe(1);
  });
});
