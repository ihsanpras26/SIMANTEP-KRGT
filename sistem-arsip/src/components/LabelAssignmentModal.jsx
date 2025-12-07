
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
        rollbackDeleteLabelOptimistic,
        supabase
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

    const handleToggleLabel = async (label) => {
        const currentState = labelStates[label.id];
        const action = currentState === 'all' ? 'remove' : 'add';
        const tempId = bulkUpdateLabelsOptimistic(targetIds, label.id, action);

        if (action === 'add') showNotification(`Label "${label.name}" ditambahkan`);
        else showNotification(`Label "${label.name}" dihapus`);

        try {
            if (action === 'add') {
                const inserts = targetIds.map(arsipId => ({ arsip_id: arsipId, label_id: label.id }));
                const { error } = await supabase.from('arsip_labels').upsert(inserts, { onConflict: 'arsip_id, label_id', ignoreDuplicates: true });
                if (error) throw error;
            } else {
                const { error } = await supabase.from('arsip_labels').delete().eq('label_id', label.id).in('arsip_id', targetIds);
                if (error) throw error;
            }
            confirmBulkUpdate(tempId);
        } catch (error) {
            console.error('Label assignment failed:', error);
            rollbackBulkUpdate(tempId, Array.isArray(targetArsips) ? targetArsips : [targetArsips]);
            showNotification('Gagal mengupdate label', 'error');
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;
        const name = newLabelName.trim();
        const color = selectedColor;

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
            showNotification('Gagal membuat label', 'error');
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
                        const state = labelStates[label.id];
                        const isSelected = state === 'all';
                        const isPartial = state === 'some';

                        return (
                            <motion.button
                                key={label.id}
                                layout
                                onClick={() => handleToggleLabel(label)}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl transition-all group relative pr-10", // extra padding for delete btn
                                    isSelected ? "bg-primary-50 border border-primary-100" : "hover:bg-neutral-50 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        isSelected || isPartial
                                            ? "bg-primary-500 border-primary-500"
                                            : "border-neutral-300 bg-white group-hover:border-primary-400"
                                    )}>
                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                        {isPartial && <div className="w-2 h-0.5 bg-white rounded-full" />}
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
                            </motion.button>
                        );
                    })
                )}
            </div>

            {/* Footer / Create New */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                {!isCreating ? (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-dashed border-neutral-300 text-neutral-500 rounded-xl hover:bg-white hover:border-primary-400 hover:text-primary-600 transition-all text-sm font-medium"
                    >
                        <Plus size={16} />
                        Buat Label Baru
                    </button>
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
