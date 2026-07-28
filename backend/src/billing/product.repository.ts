import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findProductBySlug(slug: string, tx?: TransactionClient) {
  return db(tx).product.findUnique({ where: { slug } });
}

export function findProductByCode(code: string, tx?: TransactionClient) {
  return db(tx).product.findUnique({ where: { code } });
}

export function findProductById(id: string, tx?: TransactionClient) {
  return db(tx).product.findUnique({ where: { id } });
}

export interface AdminProductFilter {
  status?: string;
  type?: string;
  q?: string;
}

export function findProductsAdmin(
  filter: AdminProductFilter,
  pagination: { skip: number; take: number },
  tx?: TransactionClient,
) {
  const where: Prisma.ProductWhereInput = {
    ...(filter.status ? { status: filter.status as never } : {}),
    ...(filter.type ? { type: filter.type as never } : {}),
    ...(filter.q ? { name: { contains: filter.q, mode: 'insensitive' } } : {}),
  };

  return Promise.all([
    db(tx).product.findMany({ where, orderBy: { createdAt: 'desc' }, skip: pagination.skip, take: pagination.take }),
    db(tx).product.count({ where }),
  ]);
}

export function createProduct(data: Prisma.ProductCreateInput, tx?: TransactionClient) {
  return db(tx).product.create({ data });
}

export function updateProduct(id: string, data: Prisma.ProductUpdateInput, tx?: TransactionClient) {
  return db(tx).product.update({ where: { id }, data });
}

// --- Product Prices ---------------------------------------------------------

export function findPriceById(id: string, tx?: TransactionClient) {
  return db(tx).productPrice.findUnique({ where: { id } });
}

export function findPricesForProduct(productId: string, tx?: TransactionClient) {
  return db(tx).productPrice.findMany({
    where: { productId },
    orderBy: [{ priceLineageId: 'asc' }, { version: 'desc' }],
  });
}

/** Public/live prices only — the ones a plan-comparison page may show. */
export function findActivePricesForProduct(productId: string, tx?: TransactionClient) {
  return db(tx).productPrice.findMany({
    where: { productId, status: 'ACTIVE' },
    orderBy: { billingInterval: 'asc' },
  });
}

export function findLatestPriceInLineage(priceLineageId: string, tx?: TransactionClient) {
  return db(tx).productPrice.findFirst({
    where: { priceLineageId },
    orderBy: { version: 'desc' },
  });
}

export function createProductPrice(data: Prisma.ProductPriceCreateInput, tx?: TransactionClient) {
  return db(tx).productPrice.create({ data });
}

export function updateProductPrice(id: string, data: Prisma.ProductPriceUpdateInput, tx?: TransactionClient) {
  return db(tx).productPrice.update({ where: { id }, data });
}
