import { scopedIdempotencyKey } from '../../src/lms/lms-idempotency.util';

describe('lms-idempotency.util — scopedIdempotencyKey() (Correction 1: actor-scope isolation)', () => {
  it('prefixes the caller-supplied key with the actor id', () => {
    expect(scopedIdempotencyKey('actor-1', 'client-key-abc', 'fallback')).toBe('actor-1:client-key-abc');
  });

  it('falls back to a deterministic no-client-key value when no header is supplied', () => {
    expect(scopedIdempotencyKey('actor-1', undefined, 'lesson-42')).toBe('actor-1:no-client-key:lesson-42');
  });

  it('two different actors supplying the IDENTICAL literal key resolve to two DISTINCT scoped keys — no cross-actor collision', () => {
    const keyA = scopedIdempotencyKey('actor-1', 'same-literal-key', 'x');
    const keyB = scopedIdempotencyKey('actor-2', 'same-literal-key', 'x');
    expect(keyA).not.toBe(keyB);
  });

  it('the SAME actor supplying the SAME key twice resolves to the SAME scoped key (replay-eligible)', () => {
    const first = scopedIdempotencyKey('actor-1', 'retry-key', 'x');
    const second = scopedIdempotencyKey('actor-1', 'retry-key', 'x');
    expect(first).toBe(second);
  });

  it('two different fallback suffixes (e.g. two different lessons) never collide when no client key is supplied', () => {
    const lessonA = scopedIdempotencyKey('actor-1', undefined, 'lesson-A');
    const lessonB = scopedIdempotencyKey('actor-1', undefined, 'lesson-B');
    expect(lessonA).not.toBe(lessonB);
  });
});
