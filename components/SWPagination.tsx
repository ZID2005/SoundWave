"use client";

interface SWPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SWPagination({ currentPage, totalPages, onPageChange }: SWPaginationProps) {
  // Only render when there are genuinely multiple pages
  if (totalPages <= 1) return null;

  /* ── Build visible page numbers ── */
  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  return (
    <>
      <style>{`
        /* "Page X of Y" label */
        .swp-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: #6b6b6b;
          letter-spacing: 0.06em;
          text-align: center;
          margin-bottom: 12px;
        }

        /* Page number buttons — plain text */
        .swp-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #86868b;
          padding: 4px 2px;
          position: relative;
          line-height: 1;
          transition: color 0.18s ease;
          user-select: none;
        }
        .swp-num:hover { color: #ffffff; }

        /* Active — gold, thin underline */
        .swp-num--active {
          color: #C9A84C !important;
          font-weight: 500;
        }
        .swp-num--active::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 1.5px;
          background: #C9A84C;
          border-radius: 1px;
        }

        /* PREV / NEXT — plain uppercase text */
        .swp-nav {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #86868b;
          padding: 4px 0;
          transition: color 0.18s ease;
          user-select: none;
        }
        .swp-nav:hover { color: #C9A84C; }
        .swp-nav:disabled {
          opacity: 0.22;
          cursor: default;
          pointer-events: none;
        }

        /* Ellipsis */
        .swp-ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(255,255,255,0.18);
          padding: 0 2px;
          user-select: none;
        }
      `}</style>

      {/* "Page X of Y" label — above, centered */}
      <p className="swp-label">Page {currentPage} of {totalPages}</p>

      {/* Pagination row */}
      <nav
        aria-label="Product page navigation"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        {/* PREV */}
        <button
          className="swp-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="swp-ellipsis">⋯</span>
          ) : (
            <button
              key={p}
              className={`swp-num${currentPage === p ? " swp-num--active" : ""}`}
              onClick={() => onPageChange(p as number)}
              aria-label={`Go to page ${p}`}
              aria-current={currentPage === p ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* NEXT */}
        <button
          className="swp-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </nav>
    </>
  );
}
