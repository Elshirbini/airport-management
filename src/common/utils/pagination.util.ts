export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function resolvePagination(
  page?: number,
  limit?: number,
): PaginationParams {
  const resolvedPage = page && page > 0 ? page : DEFAULT_PAGE;
  const resolvedLimit = limit && limit > 0 ? limit : DEFAULT_LIMIT;

  return {
    page: resolvedPage,
    limit: resolvedLimit,
    skip: (resolvedPage - 1) * resolvedLimit,
  };
}
