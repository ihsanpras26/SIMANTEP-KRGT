
import React, { useState, useMemo } from 'react';
import { Search, Tag, Check, X, Plus, Trash2, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import useAppStore from '../store/useAppStore';
import LabelBadge from './LabelBadge';

const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500'
];

import { supabase } from '../utils/supabaseClient';

export default function LabelAssignmentModal({ targetArsips, onClose, showNotification }) {
    const {
        labels,
        bulkUpdateLabelsOptimistic,
        confirmBulkUpdate,
        rollbackBulkUpdate,
        addLabelOptimistic,
        confirmLabelOptimistic,
        rollbackLabelOptimistic,
        deleteLabelOptimistic,
        confirmDeleteLabelOptimistic,
        rollbackDeleteLabelOptimistic
    } = useAppStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[6]); // default emerald

    // Determine target IDs
    const targetIds = useMemo(() => {
        if (!targetArsips) return [];
        return Array.isArray(targetArsips) ? targetArsips.map(a => a.id) : [targetArsips.id];
    }, [targetArsips]);

    // Calculate label states (some, all, none) for the selection
    const labelStates = useMemo(() => {
        const stateMap = {}; // labelId -> 'all' | 'some' | 'none'
        labels.forEach(label => {
            let presentCount = 0;
            const targets = Array.isArray(targetArsips) ? targetArsips : [targetArsips];
            targets.forEach(arsip => {
                if (arsip.arsip_labels?.some(al => al.label_id === label.id)) {
                    presentCount++;
                }
            });
            if (presentCount === 0) stateMap[label.id] = 'none';
            else if (presentCount === targets.length) stateMap[label.id] = 'all';
            else stateMap[label.id] = 'some';
        });
        return stateMap;
    }, [labels, targetArsips]);

    const filteredLabels = useMemo(() => {
        return labels.filter(l =>
            l.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [labels, searchTerm]);

    const [selectedLabelIdForApply, setSelectedLabelIdForApply] = useState(null);

    const handleSelectLabel = (label) => {
        // Single select toggle
        if (selectedLabelIdForApply === label.id) {
            setSelectedLabelIdForApply(null);
        } else {
            setSelectedLabelIdForApply(label.id);
        }
    };

    const handleApplyLabel = async () => {
        if (!selectedLabelIdForApply) return;

        const label = labels.find(l => l.id === selectedLabelIdForApply);
        if (!label) return;

        const count = targetIds.length;
        const confirmMsg = `Yakin ingin menambahkan label "${label.name}" ke ${count} arsip terpilih?`;

        if (!window.confirm(confirmMsg)) return;

        // Optimistic UI
        const tempId = bulkUpdateLabelsOptimistic(targetIds, label.id, 'add');
        showNotification(`Label "${label.name}" ditambahkan`);
        onClose(); // Close modal immediately

        try {
            // Check existing links first
            const { data: existingLinks, error: fetchError } = await supabase
                .from('arsip_labels')
                .select('arsip_id')
                .eq('label_id', label.id)
                .in('arsip_id', targetIds);

            if (fetchError) throw fetchError;

            const existingArsipIds = new Set(existingLinks?.map(link => link.arsip_id) || []);
            const labelsToInsert = targetIds
                .filter(id => !existingArsipIds.has(id))
                .map(arsipId => ({ arsip_id: arsipId, label_id: label.id }));

            if (labelsToInsert.length > 0) {
                const { error } = await supabase.from('arsip_labels').insert(labelsToInsert);
                if (error) throw error;
            }
            confirmBulkUpdate(tempId);
        } catch (error) {
            console.error('Label assignment failed:', error);
            rollbackBulkUpdate(tempId, Array.isArray(targetArsips) ? targetArsips : [targetArsips]);
            showNotification(`Gagal mengupdate label: ${error.message}`, 'error');
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;
        const name = newLabelName.trim();
        const color = selectedColor;

        // Pre-check for duplicate name (Case insensitive check on client side first)
        const isDuplicate = labels.some(l => l.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            showNotification('Label dengan nama tersebut sudah ada', 'error');
            return;
        }

        const tempId = addLabelOptimistic({ name, color });
        setNewLabelName('');
        setIsCreating(false);
        showNotification('Label dibuat');

        try {
            const { data, error } = await supabase.from('labels').insert([{ name, color }]).select().single();
            if (error) throw error;
            confirmLabelOptimistic(tempId, data);
        } catch (error) {
            console.error('Create label failed:', error);
            rollbackLabelOptimistic(tempId);
            showNotification(`Gagal membuat label: ${error.message}`, 'error');
        }
    };

    const handleDeleteLabel = async (labelId, e) => {
        e.stopPropagation();
        if (!window.confirm('Hapus label ini? Semua arsip yang menggunakan label ini akan terlepas.')) return;

        const tempId = deleteLabelOptimistic(labelId);
        showNotification('Label dihapus');

        try {
            const { error } = await supabase.from('labels').delete().eq('id', labelId);
            if (error) throw error;
            confirmDeleteLabelOptimistic(tempId);
        } catch (error) {
            console.error('Delete label failed:', error);
            rollbackDeleteLabelOptimistic(tempId);
            showNotification('Gagal menghapus label', 'error');
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            {/* Search Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Cari label..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Label List */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                {filteredLabels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <Tag size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Label tidak ditemukan</p>
                    </div>
                ) : (
                    filteredLabels.map(label => {
                        const isSelected = selectedLabelIdForApply === label.id;

                        return (
                            <motion.div
                                key={label.id}
                                layout
                                onClick={() => handleSelectLabel(label)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl transition-all group relative pr-10 cursor-pointer",
                                    isSelected ? "bg-primary-50 border border-primary-500 ring-1 ring-primary-500" : "hover:bg-neutral-50 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                        isSelected
                                            ? "bg-primary-500 border-primary-500"
                                            : "border-neutral-300 bg-white group-hover:border-primary-400"
                                    )}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <LabelBadge label={label} />
                                </div>

                                <button
                                    onClick={(e) => handleDeleteLabel(label.id, e)}
                                    className="absolute right-2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Hapus Label"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer / Create New */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                {!isCreating ? (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleApplyLabel}
                            disabled={!selectedLabelIdForApply}
                            className={cn(
                                "w-full py-2.5 rounded-xl font-bold transition-all shadow-sm",
                                selectedLabelIdForApply
                                    ? "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20"
                                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                            )}
                        >
                            Terapkan Label
                        </button>

                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-neutral-500 hover:text-primary-600 transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            Buat Label Baru
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
                        <input
                            type="text"
                            placeholder="Nama label baru..."
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                            autoFocus
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />

                        <div className="flex flex-wrap gap-1.5">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                        color,
                                        selectedColor === color && "ring-2 ring-neutral-400 ring-offset-2"
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleCreateLabel}
                                disabled={!newLabelName.trim()}
                                className="flex-1 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simpan
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-200"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
