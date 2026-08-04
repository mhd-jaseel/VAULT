import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPageChange, loading }) {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const range = [];
    const maxVisible = 5;
    if (pages <= maxVisible) {
      for (let i = 1; i <= pages; i++) range.push(i);
    } else {
      if (page <= 3) {
        range.push(1, 2, 3, 4, '...', pages);
      } else if (page >= pages - 2) {
        range.push(1, '...', pages - 3, pages - 2, pages - 1, pages);
      } else {
        range.push(1, '...', page - 1, page, page + 1, '...', pages);
      }
    }
    return range;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 py-4 select-none">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || loading}
        className={`p-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 transition-all flex items-center justify-center cursor-pointer ${
          page === 1 
            ? 'opacity-40 cursor-not-allowed bg-neutral-50' 
            : 'hover:bg-neutral-900 hover:text-white hover:border-neutral-900'
        }`}
        title="Previous Page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages list */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((p, index) => {
          if (p === '...') {
            return (
              <span 
                key={`ellipsis-${index}`}
                className="w-9.5 h-9.5 flex items-center justify-center text-xs font-mono text-neutral-400 font-bold"
              >
                ...
              </span>
            );
          }

          const isCurrent = p === page;
          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`w-9.5 h-9.5 rounded-xl border text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                isCurrent
                  ? 'bg-neutral-950 text-white border-neutral-950 ring-2 ring-neutral-950/20'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900'
              } ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages || loading}
        className={`p-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 transition-all flex items-center justify-center cursor-pointer ${
          page === pages 
            ? 'opacity-40 cursor-not-allowed bg-neutral-50' 
            : 'hover:bg-neutral-900 hover:text-white hover:border-neutral-900'
        }`}
        title="Next Page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
