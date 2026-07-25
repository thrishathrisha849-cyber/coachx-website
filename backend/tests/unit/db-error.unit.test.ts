import { Prisma } from '@prisma/client';
import { normalizeDatabaseError } from '../../src/database/db-error';
import { AppError } from '../../src/utils/app-error';
import { HttpStatus } from '@coachx/shared';

function knownError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('simulated prisma error', {
    code,
    clientVersion: '5.22.0',
    meta,
  });
}

describe('normalizeDatabaseError()', () => {
  it('maps P2002 (unique constraint) to a 409 conflict AppError', () => {
    const result = normalizeDatabaseError(knownError('P2002', { target: ['email'] }));

    expect(result).toBeInstanceOf(AppError);
    expect(result.statusCode).toBe(HttpStatus.CONFLICT);
    expect(result.message).toContain('email');
  });

  it('maps P2025 (record not found) to a 404 not-found AppError', () => {
    const result = normalizeDatabaseError(knownError('P2025'));
    expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps P2003 (foreign key violation) to a 400 bad-request AppError', () => {
    const result = normalizeDatabaseError(knownError('P2003', { target: 'organizationId' }));
    expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(result.message).toContain('organizationId');
  });

  it('maps P2011 (null constraint violation) to a 400 bad-request AppError', () => {
    const result = normalizeDatabaseError(knownError('P2011'));
    expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('maps an unrecognized known-request-error code to a 500 internal AppError', () => {
    const result = normalizeDatabaseError(knownError('P9999'));
    expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('passes an existing AppError through unchanged', () => {
    const original = AppError.forbidden('nope');
    const result = normalizeDatabaseError(original);
    expect(result).toBe(original);
  });

  it('falls back to a 500 internal AppError for a plain Error', () => {
    const result = normalizeDatabaseError(new Error('boom'));
    expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(result.message).toBe('boom');
  });

  it('never leaks the raw Prisma error object as the AppError message for unknown codes', () => {
    const result = normalizeDatabaseError(knownError('P1017'));
    expect(result.message).not.toContain('simulated prisma error');
  });
});
