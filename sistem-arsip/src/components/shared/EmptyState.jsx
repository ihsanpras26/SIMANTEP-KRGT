import React from 'react';
import { FileX, Search as SearchIcon, Filter, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ type = 'noData', onAction, searchTerm, activeFilters }) {
    const states = {
        noData: {
            icon: FileX,
            title: 'Belum Ada Arsip',
            description: 'Gunakan tombol "Tambah Arsip" di kanan atas untuk membuat arsip baru',
            actionLabel: null, // No button needed, we have main CTA
            actionIcon: null
        },
        noResults: {
            icon: SearchIcon,
            title: 'Tidak Ada Hasil',
            description: searchTerm
                ? `Tidak ditemukan arsip dengan kata kunci "${searchTerm}"`
                : 'Tidak ditemukan arsip yang sesuai dengan filter',
            actionLabel: 'Reset Filter',
            actionIcon: Filter
        },
        error: {
            icon: FileX,
            title: 'Terjadi Kesalahan',
            description: 'Gagal memuat data arsip. Silakan coba lagi.',
            actionLabel: 'Muat Ulang',
            actionIcon: null
        }
    };

    const state = states[type] || states.noData;
    const Icon = state.icon;
    const ActionIcon = state.actionIcon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            <div className="bg-neutral-100 rounded-full p-6 mb-6">
                <Icon size={48} className="text-neutral-400" strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-neutral-900 mb-2">
                {state.title}
            </h3>

            <p className="text-neutral-600 text-center max-w-md mb-6">
                {state.description}
            </p>

            {onAction && state.actionLabel && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    {ActionIcon && <ActionIcon size={20} />}
                    <span>{state.actionLabel}</span>
                </button>
            )}

            {activeFilters > 0 && type === 'noResults' && (
                <p className="text-sm text-neutral-500 mt-4">
                    {activeFilters} filter aktif
                </p>
            )}
        </motion.div>
    );
}
