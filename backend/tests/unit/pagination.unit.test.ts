import { buildPaginationMeta, paginate, parsePaginationParams } from '../../src/database/pagination';

describe('parsePaginationParams()', () => {
  it('applies documented defaults when nothing is supplied', () => {
    const result = parsePaginationParams();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(20);
  });

  it('parses string query values (as Express req.query would supply)', () => {
    const result = parsePaginationParams({ page: '3', pageSize: '10' });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.skip).toBe(20);
  });

  it('clamps pageSize to MAX_PAGE_SIZE (100) rather than trusting the caller', () => {
    const result = parsePaginationParams({ pageSize: '99999' });
    expect(result.pageSize).toBe(100);
  });

  it('clamps page below 1 up to 1', () => {
    const result = parsePaginationParams({ page: '-5' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('falls back to defaults for garbage input rather than producing NaN', () => {
    const result = parsePaginationParams({ page: 'not-a-number', pageSize: 'also-not' });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});

describe('buildPaginationMeta()', () => {
  it('computes totalPages correctly', () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 45,
      totalPages: 3,
    });
  });

  it('reports 0 totalPages for 0 totalItems', () => {
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(0);
  });
});

describe('paginate()', () => {
  it('calls findMany with the correct skip/take and returns data + meta together', async () => {
    const items = ['a', 'b', 'c'];
    const findMany = jest.fn().mockResolvedValue(items);
    const count = jest.fn().mockResolvedValue(53);

    const result = await paginate({ page: '2', pageSize: '25' }, findMany, count);

    expect(findMany).toHaveBeenCalledWith({ skip: 25, take: 25 });
    expect(result.data).toBe(items);
    expect(result.meta).toEqual({ page: 2, pageSize: 25, totalItems: 53, totalPages: 3 });
  });

  it('runs findMany and count concurrently, not sequentially', async () => {
    const order: string[] = [];
    const findMany = jest.fn().mockImplementation(async () => {
      order.push('findMany-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('findMany-end');
      return [];
    });
    const count = jest.fn().mockImplementation(async () => {
      order.push('count-start');
      return 0;
    });

    await paginate({}, findMany, count);

    // If they ran concurrently, count-start happens before findMany-end.
    expect(order.indexOf('count-start')).toBeLessThan(order.indexOf('findMany-end'));
  });
});
