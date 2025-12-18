import React, { useState } from 'react';
import {
    Search,
    Plus,
    Tag,
    ArrowUpRight,
    Archive,
    Layers,
    Filter,
    Star,
    Heart,
    Bookmark,
    Flag,
    Zap,
    Clock,
    AlertCircle,
    CheckCircle,
    Info,
    TrendingUp,
    FileText,
    Users,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import LabelManager from './LabelManager';
import { Modal, ModalHeader, ModalTitle, ModalContent } from './ui';
import useAppStore from '../store/useAppStore';
import { useArsip } from '../hooks/useArsip';

export default function LabelDashboard({
    supabase,
    navigate,
    showNotification
}) {
    const { labels } = useAppStore();
    // Fetch ALL archives to get accurate stats
    const { data: arsipData } = useArsip({ page: 'all', pageSize: 10000 });
    const arsipList = arsipData?.data || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [showLabelManager, setShowLabelManager] = useState(false);

    // Filter labels based on search
    const filteredLabels = labels.filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats per label
    const getLabelStats = (labelId) => {
        return arsipList.filter(arsip =>
            arsip.arsip_labels?.some(al => (al.label_id === labelId) || (al.labels?.id === labelId))
        ).length;
    };

    // Icon mapping - convert icon name to component
    const ICON_MAP = {
        Tag, Star, Heart, Bookmark, Flag, Zap,
        Clock, AlertCircle, CheckCircle, Info,
        TrendingUp, FileText, Users, Briefcase, Archive
    };

    const getIconComponent = (iconName) => {
        return ICON_MAP[iconName] || Tag;
    };

    // Color mapping for modern UI with gradients
    const getLabelStyles = (colorName) => {
        // Soft Pastel Color Palette
        const colorMap = {
            rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-600', gradient: 'from-rose-50 to-rose-100', badgeBg: 'bg-rose-200', badgeText: 'text-rose-800' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', icon: 'text-pink-600', gradient: 'from-pink-50 to-pink-100', badgeBg: 'bg-pink-200', badgeText: 'text-pink-800' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600', gradient: 'from-purple-50 to-purple-100', badgeBg: 'bg-purple-200', badgeText: 'text-purple-800' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-600', gradient: 'from-indigo-50 to-indigo-100', badgeBg: 'bg-indigo-200', badgeText: 'text-indigo-800' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600', gradient: 'from-blue-50 to-blue-100', badgeBg: 'bg-blue-200', badgeText: 'text-blue-800' },
            sky: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', icon: 'text-sky-600', gradient: 'from-sky-50 to-sky-100', badgeBg: 'bg-sky-200', badgeText: 'text-sky-800' },
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-600', gradient: 'from-cyan-50 to-cyan-100', badgeBg: 'bg-cyan-200', badgeText: 'text-cyan-800' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', icon: 'text-teal-600', gradient: 'from-teal-50 to-teal-100', badgeBg: 'bg-teal-200', badgeText: 'text-teal-800' },
            emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-600', gradient: 'from-emerald-50 to-emerald-100', badgeBg: 'bg-emerald-200', badgeText: 'text-emerald-800' },
            green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600', gradient: 'from-green-50 to-green-100', badgeBg: 'bg-green-200', badgeText: 'text-green-800' },
            lime: { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', icon: 'text-lime-600', gradient: 'from-lime-50 to-lime-100', badgeBg: 'bg-lime-200', badgeText: 'text-lime-800' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-600', gradient: 'from-yellow-50 to-yellow-100', badgeBg: 'bg-yellow-200', badgeText: 'text-yellow-800' },
            amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-600', gradient: 'from-amber-50 to-amber-100', badgeBg: 'bg-amber-200', badgeText: 'text-amber-800' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-600', gradient: 'from-orange-50 to-orange-100', badgeBg: 'bg-orange-200', badgeText: 'text-orange-800' },
            red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600', gradient: 'from-red-50 to-red-100', badgeBg: 'bg-red-200', badgeText: 'text-red-800' },
            stone: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', icon: 'text-stone-600', gradient: 'from-stone-50 to-stone-100', badgeBg: 'bg-stone-200', badgeText: 'text-stone-800' },
            neutral: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', icon: 'text-neutral-600', gradient: 'from-neutral-50 to-neutral-100', badgeBg: 'bg-neutral-200', badgeText: 'text-neutral-800' },
        };
        return colorMap[colorName] || colorMap.neutral;
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
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-primary-300 text-primary-700 rounded-xl hover:bg-primary-50 hover:border-primary-400 transition-all shadow-sm hover:shadow font-semibold"
                    >
                        <Tag size={18} />
                        <span>Kelola Label</span>
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* 'All Archives' Card - Light Purple Theme */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1]
                    }}
                    whileHover={{
                        y: -4,
                        transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/arsip')}
                    className="group relative flex flex-col h-[160px] rounded-2xl p-6 text-left bg-primary-50 border border-primary-200 hover:border-primary-300 transition-all duration-200 hover:shadow-md"
                >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Icon */}
                    <div className="relative z-10 mb-auto">
                        <div className="inline-flex p-2.5 rounded-xl bg-white border border-primary-200 transition-all duration-200 group-hover:border-primary-300 text-primary-600">
                            <Layers size={22} strokeWidth={2} />
                        </div>

                        {/* Count badge */}
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-primary-500 text-white text-xs font-bold shadow-sm">
                            {arsipList.length}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 space-y-1">
                        <h4 className="text-base font-semibold text-primary-900 leading-snug">
                            Semua Berkas
                        </h4>
                        <p className="text-xs text-primary-600">
                            {arsipList.length} Total
                        </p>
                    </div>
                </motion.button>

                {/* Label Cards - Minimalist Design */}
                <AnimatePresence>
                    {filteredLabels.map((label, index) => {
                        const count = getLabelStats(label.id);
                        const styles = getLabelStyles(label.color);
                        const Icon = getIconComponent(label.icon);

                        return (
                            <motion.button
                                key={label.id}
                                layoutId={label.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.03,
                                    duration: 0.3,
                                    ease: [0.25, 0.1, 0.25, 1]
                                }}
                                whileHover={{
                                    y: -4,
                                    transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/arsip?label=${label.id}`)}
                                className={cn(
                                    "group relative flex flex-col h-[160px] rounded-2xl p-6 text-left",
                                    "bg-white border transition-all duration-200",
                                    "hover:shadow-md",
                                    styles.border
                                )}
                            >
                                {/* Subtle gradient on hover */}
                                <div className={cn(
                                    "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                    styles.bg
                                )}
                                    style={{ opacity: 0.03 }}
                                />

                                {/* Icon */}
                                <div className="relative z-10 mb-auto">
                                    <div className={cn(
                                        "inline-flex p-2.5 rounded-xl transition-all duration-200",
                                        "bg-white border",
                                        "group-hover:border-current",
                                        styles.border,
                                        styles.icon
                                    )}>
                                        <Icon size={22} strokeWidth={2} />
                                    </div>

                                    {/* Badge with light background matching label color */}
                                    {count > 0 && (
                                        <div className={cn(
                                            "absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                                            styles.badgeBg,
                                            styles.badgeText
                                        )}>
                                            {count}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="relative z-10 space-y-1">
                                    <h4 className={cn(
                                        "text-base font-semibold line-clamp-2 leading-snug",
                                        styles.text
                                    )}
                                        title={label.name}>
                                        {label.name}
                                    </h4>

                                    <p className="text-xs text-neutral-500">
                                        {count} Berkas
                                    </p>
                                </div>
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
