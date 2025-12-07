import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems,
    startIndex,
    endIndex
}) {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 3; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200">
            {/* Left Side: Info & Size Selector */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-neutral-500 w-full md:w-auto justify-between md:justify-start">
                <span className="text-center sm:text-left">
                    Menampilkan <span className="font-medium text-neutral-900">{startIndex + 1}</span> sampai{' '}
                    <span className="font-medium text-neutral-900">{Math.min(endIndex, totalItems)}</span> dari{' '}
                    <span className="font-medium text-neutral-900">{totalItems}</span> data
                </span>

                <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Baris per halaman:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                            onPageChange(1); // Reset to page 1
                        }}
                        className="bg-white border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-1.5 cursor-pointer outline-none hover:bg-neutral-50 transition-colors"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Right Side: Navigation Buttons */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Halaman Pertama"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Sebelumnya"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-2 text-neutral-400">...</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={cn(
                                        "min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors",
                                        currentPage === page
                                            ? "bg-primary-600 text-white shadow-sm"
                                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                                    )}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Selanjutnya"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Halaman Terakhir"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
}
