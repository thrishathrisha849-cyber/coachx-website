import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

/**
 * Normalizes a raw Prisma error into the application's standard
 * `AppError` shape, so a controller/service never has to know Prisma's
 * error codes directly. Any error this function doesn't recognize is
 * returned as `AppError.internal()` — callers should always route the
 * result through here rather than inspecting `PrismaClientKnownRequestError`
 * themselves.
 *
 * Reference: https://www.prisma.io/docs/orm/reference/error-reference
 */
export function normalizeDatabaseError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation.
        const target = extractTarget(error.meta);
        return AppError.conflict(
          target ? `A record with this ${target} already exists` : 'A duplicate record already exists',
          { fields: target ? [target] : undefined, prismaCode: error.code },
        );
      }

      case 'P2025':
        // Record not found (e.g. update/delete on a non-existent row).
        return AppError.notFound('The requested record was not found');

      case 'P2003': {
        // Foreign key constraint violation.
        const target = extractTarget(error.meta);
        return AppError.badRequest(
          target
            ? `Invalid reference: related ${target} does not exist`
            : 'Invalid reference to a related record',
          { field: target, prismaCode: error.code },
        );
      }

      case 'P2000':
        // Value too long for a column type.
        return AppError.badRequest('One or more field values are too long', {
          prismaCode: error.code,
        });

      case 'P2011':
        // Null constraint violation.
        return AppError.badRequest('A required field is missing', { prismaCode: error.code });

      default:
        return AppError.internal(`Database request error (${error.code})`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    // A programming error (wrong shape of query) — never a client's fault.
    return AppError.internal('Invalid database query');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return AppError.internal('Database connection is not available');
  }

  if (error instanceof AppError) {
    return error;
  }

  return AppError.internal(error instanceof Error ? error.message : 'Unknown database error');
}

function extractTarget(meta: Record<string, unknown> | undefined): string | undefined {
  const target = meta?.target;
  if (typeof target === 'string') return target;
  if (Array.isArray(target)) return target.join(', ');
  return undefined;
}
