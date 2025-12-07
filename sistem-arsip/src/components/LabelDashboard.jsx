import React, { useState } from 'react';
import {
    Search,
    Plus,
    Tag,
    ArrowUpRight,
    Archive,
    Layers,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import LabelManager from './LabelManager';
import { Modal, ModalHeader, ModalTitle, ModalContent } from './ui';
import useAppStore from '../store/useAppStore';

export default function LabelDashboard({
    supabase,
    navigate,
    showNotification
}) {
    const { labels, arsipList } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showLabelManager, setShowLabelManager] = useState(false);

    // Filter labels based on search
    const filteredLabels = labels.filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats per label
    const getLabelStats = (labelId) => {
        return arsipList.filter(arsip =>
            arsip.arsip_labels?.some(al => al.label_id === labelId)
        ).length;
    };

    // Color mapping for style consistency with Dashboard
    const getLabelColorClasses = (colorName) => {
        // Format: [bg, text, border]
        const map = {
            rose: ['bg-rose-50', 'text-rose-600', 'border-rose-500'],
            pink: ['bg-pink-50', 'text-pink-600', 'border-pink-500'],
            purple: ['bg-purple-50', 'text-purple-600', 'border-purple-500'],
            indigo: ['bg-indigo-50', 'text-indigo-600', 'border-indigo-500'],
            blue: ['bg-blue-50', 'text-blue-600', 'border-blue-500'],
            sky: ['bg-sky-50', 'text-sky-600', 'border-sky-500'],
            cyan: ['bg-cyan-50', 'text-cyan-600', 'border-cyan-500'],
            teal: ['bg-teal-50', 'text-teal-600', 'border-teal-500'],
            emerald: ['bg-emerald-50', 'text-emerald-600', 'border-emerald-500'],
            green: ['bg-green-50', 'text-green-600', 'border-green-500'],
            lime: ['bg-lime-50', 'text-lime-600', 'border-lime-500'],
            yellow: ['bg-yellow-50', 'text-yellow-600', 'border-yellow-500'],
            amber: ['bg-amber-50', 'text-amber-600', 'border-amber-500'],
            orange: ['bg-orange-50', 'text-orange-600', 'border-orange-500'],
            red: ['bg-red-50', 'text-red-600', 'border-red-500'],
            stone: ['bg-stone-50', 'text-stone-600', 'border-stone-500'],
            neutral: ['bg-neutral-50', 'text-neutral-600', 'border-neutral-500'],
        };
        return map[colorName] || ['bg-neutral-50', 'text-neutral-600', 'border-neutral-500'];
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-end gap-6">

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari label..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm placeholder-neutral-400
                    focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowLabelManager(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                        <Plus size={18} />
                        <span>Kelola Label</span>
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* 'All Archives' Card - Matches Dashboard Stat Card with a twist */}
                {/* 'All Archives' Card */}
                <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('arsip', { filterLabel: 'all' })}
                    className="group relative flex flex-col h-full bg-white rounded-2xl p-6 text-left shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900" />

                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3.5 rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/10 group-hover:scale-105 transition-transform duration-300">
                            <Layers size={24} />
                        </div>
                        <div className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold font-mono tracking-tight">
                            TOTAL
                        </div>
                    </div>

                    <div className="mt-auto space-y-1">
                        <h3 className="text-3xl font-display font-bold text-neutral-900 tracking-tight">
                            {arsipList.length}
                        </h3>
                        <p className="text-sm font-medium text-neutral-500">Semua Arsip</p>
                    </div>

                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <ArrowUpRight size={20} className="text-neutral-400" />
                    </div>
                </motion.button>

                {/* Label Cards */}
                <AnimatePresence>
                    {filteredLabels.map((label, index) => {
                        const count = getLabelStats(label.id);
                        const [bgClass, textClass, borderClass] = getLabelColorClasses(label.color);

                        return (
                            <motion.button
                                key={label.id}
                                layoutId={label.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('arsip', { filterLabel: label.id })}
                                className="group relative flex flex-col h-full bg-white rounded-2xl p-6 text-left shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-300 overflow-hidden"
                            >
                                <div className={cn("absolute top-0 left-0 w-full h-1", borderClass.replace('border-', 'bg-'))} />

                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn(
                                        "p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-105",
                                        bgClass,
                                        textClass
                                    )}>
                                        <Tag size={24} />
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold font-mono tracking-tight",
                                        bgClass,
                                        textClass
                                    )}>
                                        {count} File
                                    </div>
                                </div>

                                <div className="mt-auto space-y-1">
                                    <h3
                                        className="text-lg font-bold text-neutral-900 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors"
                                        title={label.name}
                                    >
                                        {label.name}
                                    </h3>
                                    {/* ID Removed as requested */}
                                </div>

                                {/* Subtle decorative background blob */}
                                <div className={cn(
                                    "absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-[0.08] blur-3xl transition-transform duration-500 group-hover:scale-125",
                                    bgClass.replace('bg-', '') === 'bg-white' ? 'bg-neutral-200' : bgClass.replace('bg-', 'bg-') // Simplified color derivation
                                )} />
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State */}
                {filteredLabels.length === 0 && searchTerm && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-400 bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200">
                        <Search size={32} className="mb-2 opacity-40" />
                        <p className="text-sm font-medium">Tidak ada label "{searchTerm}"</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 text-primary-600 text-sm hover:underline"
                        >
                            Reset Pencarian
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={showLabelManager} onClose={() => setShowLabelManager(false)} size="lg">
                <ModalHeader onClose={() => setShowLabelManager(false)}>
                    <ModalTitle>Kelola Label</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <LabelManager
                        supabase={supabase}
                        onClose={() => setShowLabelManager(false)}
                        showNotification={showNotification}
                    />
                </ModalContent>
            </Modal>
        </div>
    );
}
