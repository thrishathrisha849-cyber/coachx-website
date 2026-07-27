import type { CmsBlock } from '@/types/cms.types';

const WORDS_PER_MINUTE = 200;

/** 002 FR-050: reading time, estimated from TEXT block word count (200 wpm, a standard estimate). */
export function estimateReadingMinutes(blocks: CmsBlock[]): number {
  const wordCount = blocks
    .filter((b) => b.type === 'TEXT')
    .map((b) => String((b.data as { body?: string }).body ?? ''))
    .join(' ')
    .replace(/<[^>]+>/g, ' ') // strip HTML tags before counting words
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
