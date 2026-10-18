import { ChevronLeft, ChevronRight } from "lucide-react";
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  startIndex,
  endIndex,
  disabled = false,
}) {
  if (!totalItems) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 border-t border-[var(--line)] pt-5 text-sm text-[var(--text-muted)]">
      <div className="flex flex-wrap items-center gap-5">
        <span>
          <span className="text-[var(--text-primary)]">
            {startIndex + 1}–{endIndex}
          </span>{" "}
          dari {totalItems.toLocaleString("id-ID")} arsip
        </span>
        <label className="flex items-center gap-2">
          <span className="sr-only">Baris per halaman</span>
          <select
            className="field !h-9 !w-auto !py-1"
            value={itemsPerPage}
            disabled={disabled}
            onChange={(event) =>
              onItemsPerPageChange(Number(event.target.value))
            }
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / halaman
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav
        aria-label="Halaman daftar arsip"
        className="flex items-center gap-2"
      >
        <button
          className="icon-button"
          aria-label="Halaman sebelumnya"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <label className="flex items-center gap-2">
          <span className="sr-only">Nomor halaman</span>
          <select
            className="field !h-9 !w-20 !py-1"
            value={currentPage}
            disabled={disabled}
            onChange={(event) => onPageChange(Number(event.target.value))}
          >
            {Array.from(
              { length: Math.min(totalPages, 100) },
              (_, index) => index + 1,
            )
              .concat(currentPage > 100 ? [currentPage] : [])
              .map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
          </select>
          <span>/ {totalPages}</span>
        </label>
        <button
          className="icon-button"
          aria-label="Halaman berikutnya"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </nav>
    </div>
  );
}
