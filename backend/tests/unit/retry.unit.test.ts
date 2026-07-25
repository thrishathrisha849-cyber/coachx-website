import { Prisma } from '@prisma/client';
import { isRetryableDatabaseError, withRetry } from '../../src/database/retry';

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('simulated', { code, clientVersion: '5.22.0' });
}

describe('isRetryableDatabaseError()', () => {
  it('classifies P2034 (write conflict/deadlock) as retryable', () => {
    expect(isRetryableDatabaseError(knownError('P2034'))).toBe(true);
  });

  it('classifies P2024 (connection pool timeout) as retryable', () => {
    expect(isRetryableDatabaseError(knownError('P2024'))).toBe(true);
  });

  it('classifies P2002 (unique constraint) as NOT retryable', () => {
    expect(isRetryableDatabaseError(knownError('P2002'))).toBe(false);
  });

  it('classifies a plain Error as NOT retryable', () => {
    expect(isRetryableDatabaseError(new Error('boom'))).toBe(false);
  });
});

describe('withRetry()', () => {
  it('returns the result immediately on first success without retrying', async () => {
    const operation = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(operation, { baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable error and eventually succeeds', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(knownError('P2034'))
      .mockRejectedValueOnce(knownError('P2034'))
      .mockResolvedValueOnce('ok');

    const result = await withRetry(operation, { baseDelayMs: 1, maxAttempts: 5 });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable error — fails on first attempt', async () => {
    const operation = jest.fn().mockRejectedValue(knownError('P2002'));

    await expect(withRetry(operation, { baseDelayMs: 1 })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts and throws the last error', async () => {
    const operation = jest.fn().mockRejectedValue(knownError('P2034'));

    await expect(withRetry(operation, { baseDelayMs: 1, maxAttempts: 3 })).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
