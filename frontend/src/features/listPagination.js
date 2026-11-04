export const DEFAULT_PAGE_SIZE = 10;

export function getPageSlice(items, page, pageSize = DEFAULT_PAGE_SIZE) {
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const start = (currentPage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: currentPage,
    pageCount,
    firstItem: items.length ? start + 1 : 0,
    lastItem: Math.min(start + safePageSize, items.length),
    total: items.length,
  };
}
