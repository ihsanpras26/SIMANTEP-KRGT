import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Tag,
    Trash2,
    Eye,
    MoreHorizontal,
    Check,
    X,
    Plus
} from 'lucide-react';
import { cn } from '../utils/cn';
import LabelBadge from './LabelBadge';
import useAppStore from '../store/useAppStore';

export default function ContextMenu({
    position,
    onClose,
    targetItems, // Array of items
    onManageLabels,
    onDelete,
    onViewDetail
}) {
    const menuRef = useRef(null);
    const { labels, bulkUpdateLabelsOptimistic, confirmBulkUpdate, rollbackBulkUpdate, supabase } = useAppStore();
    const [showLabelSubmenu, setShowLabelSubmenu] = useState(false);

    // Close when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Also close on scroll to prevent floating menu staying put while content moves
        const handleScroll = () => onClose();

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    if (!position) return null;

    // Determine top Labels (e.g. first 5) for quick access
    const quickLabels = labels.slice(0, 5);
    const targetIds = targetItems.map(item => item.id);
    const isMultiple = targetItems.length > 1;

    const handleQuickLabel = async (label) => {
        // Check if label is fully assigned to all targets
        const isFullyAssigned = targetItems.every(item =>
            item.arsip_labels?.some(al => al.label_id === label.id)
        );

        const action = isFullyAssigned ? 'remove' : 'add';

        // Optimistic Update directly
        const tempId = bulkUpdateLabelsOptimistic(targetIds, label.id, action);
        onClose(); // Close menu immediately for snappy feel

        // Actual Update
        try {
            if (action === 'add') {
                const inserts = targetIds.map(arsipId => ({
                    arsip_id: arsipId,
                    label_id: label.id
                }));
                await supabase.from('arsip_labels').upsert(inserts, { onConflict: 'arsip_id, label_id', ignoreDuplicates: true });
            } else {
                await supabase.from('arsip_labels').delete().eq('label_id', label.id).in('arsip_id', targetIds);
            }
            confirmBulkUpdate(tempId);
        } catch (error) {
            console.error('Quick label failed', error);
            rollbackBulkUpdate(tempId, targetItems);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed z-50 min-w-[220px] bg-white rounded-xl shadow-2xl border border-neutral-200 p-1.5 overflow-hidden"
                style={{
                    top: Math.min(position.y, window.innerHeight - 300),
                    left: Math.min(position.x, window.innerWidth - 220)
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 mb-1">
                    {isMultiple ? `${targetItems.length} Item Terpilih` : 'Aksi Cepat'}
                </div>

                {!isMultiple && (
                    <button
                        onClick={() => { onViewDetail(); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                    >
                        <Eye size={16} className="text-neutral-500" />
                        Lihat Detail
                    </button>
                )}

                <div className="relative"
                    onMouseEnter={() => setShowLabelSubmenu(true)}
                    onMouseLeave={() => setShowLabelSubmenu(false)}
                >
                    <button
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors text-left",
                            showLabelSubmenu && "bg-neutral-100"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-neutral-500" />
                            Label
                        </div>
                        <MoreHorizontal size={14} className="text-neutral-400" />
                    </button>

                    {/* Submenu for Quick Labels */}
                    <AnimatePresence>
                        {showLabelSubmenu && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-full top-0 ml-1.5 min-w-[200px] bg-white rounded-xl shadow-xl border border-neutral-200 p-1.5"
                            >
                                <div className="px-2 py-1 text-xs text-neutral-400 font-medium mb-1">Label Cepat</div>
                                {quickLabels.length === 0 ? (
                                    <div className="px-2 py-2 text-xs text-neutral-400">Belum ada label</div>
                                ) : (
                                    quickLabels.map(label => {
                                        // Check status
                                        const isAssigned = targetItems.every(item => item.arsip_labels?.some(al => al.label_id === label.id));
                                        const isPartial = !isAssigned && targetItems.some(item => item.arsip_labels?.some(al => al.label_id === label.id));

                                        return (
                                            <button
                                                key={label.id}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // prevent closing parent immediately if we want to toggle multiple? No, close for now.
                                                    handleQuickLabel(label);
                                                }}
                                                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 rounded-lg transition-colors group"
                                            >
                                                <LabelBadge label={label} />
                                                {isAssigned && <Check size={14} className="text-primary-600" />}
                                                {isPartial && <div className="w-2 h-2 rounded-full bg-neutral-300" />}
                                            </button>
                                        );
                                    })
                                )}
                                <div className="h-px bg-neutral-100 my-1" />
                                <button
                                    onClick={() => { onManageLabels(); onClose(); }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                    <Plus size={14} />
                                    Kelola Label...
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-px bg-neutral-100 my-1" />

                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                    <Trash2 size={16} />
                    Hapus
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
