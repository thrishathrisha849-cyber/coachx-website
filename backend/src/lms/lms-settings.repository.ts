import type { Prisma, LmsSettings } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

const SETTINGS_ID = 'global';

function db(tx?: TransactionClient) {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/**
 * Application-level singleton: always reads/creates the one row keyed by
 * the fixed literal id `"global"` (see `schema.prisma`'s `LmsSettings` doc
 * comment). Creating it lazily on first read means every field's Prisma
 * `@default(...)` becomes the seeded value — identical to the hardcoded
 * constants this batch replaces, so nothing changes until an admin
 * explicitly edits a value.
 */
export async function findOrCreateLmsSettings(tx?: TransactionClient): Promise<LmsSettings> {
  const client = db(tx);
  const existing = await client.lmsSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return client.lmsSettings.create({ data: { id: SETTINGS_ID } });
}

export async function updateLmsSettingsRow(data: Prisma.LmsSettingsUpdateInput, tx?: TransactionClient): Promise<LmsSettings> {
  const client = db(tx);
  await findOrCreateLmsSettings(tx);
  return client.lmsSettings.update({ where: { id: SETTINGS_ID }, data });
}
