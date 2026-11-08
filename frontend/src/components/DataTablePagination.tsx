import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DATA_TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

export function useDataTablePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DATA_TABLE_PAGE_SIZES[0]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const start = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, items.length);

  return {
    page,
    setPage,
    pageSize,
    changePageSize,
    pageCount,
    pageItems,
    start,
    end,
    total: items.length,
  };
}

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function DataTablePagination({
  page,
  pageSize,
  pageCount,
  start,
  end,
  total,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  return (
    <div className="pb-12">
      <div className="sticky bottom-12 z-10 flex flex-col gap-3 border-t border-white/10 bg-[#111a33] py-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-white outline-none focus:border-violet-400/50"
              aria-label="Rows per page"
            >
              {DATA_TABLE_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <span aria-live="polite">
            Showing {start}–{end} of {total}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-1 sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="min-w-0 px-1 text-center text-xs sm:min-w-20 sm:text-sm">Page {page} of {pageCount}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
