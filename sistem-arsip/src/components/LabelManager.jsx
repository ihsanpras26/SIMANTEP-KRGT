import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Check, Palette, Pencil, Star, Heart, Bookmark, Flag, Zap, Clock, AlertCircle, CheckCircle, Info, TrendingUp, FileText, Users, Briefcase, Archive, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import useAppStore from '../store/useAppStore';

const COLORS = [
    { name: 'rose', hex: '#fda4af' },
    { name: 'pink', hex: '#f9a8d4' },
    { name: 'purple', hex: '#d8b4fe' },
    { name: 'indigo', hex: '#a5b4fc' },
    { name: 'blue', hex: '#93c5fd' },
    { name: 'sky', hex: '#7dd3fc' },
    { name: 'cyan', hex: '#67e8f9' },
    { name: 'teal', hex: '#5eead4' },
    { name: 'emerald', hex: '#6ee7b7' },
    { name: 'green', hex: '#86efac' },
    { name: 'lime', hex: '#bef264' },
    { name: 'yellow', hex: '#fde047' },
    { name: 'amber', hex: '#fcd34d' },
    { name: 'orange', hex: '#fdba74' },
    { name: 'red', hex: '#fca5a5' },
    { name: 'stone', hex: '#d6d3d1' },
    { name: 'neutral', hex: '#d4d4d4' }
];

const ICONS = [
    { name: 'Tag', component: Tag },
    { name: 'Star', component: Star },
    { name: 'Heart', component: Heart },
    { name: 'Bookmark', component: Bookmark },
    { name: 'Flag', component: Flag },
    { name: 'Zap', component: Zap },
    { name: 'Clock', component: Clock },
    { name: 'AlertCircle', component: AlertCircle },
    { name: 'CheckCircle', component: CheckCircle },
    { name: 'Info', component: Info },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'FileText', component: FileText },
    { name: 'Users', component: Users },
    { name: 'Briefcase', component: Briefcase },
    { name: 'Archive', component: Archive }
];

export default function LabelManager({ supabase, onClose, showNotification }) {
    const {
        labels,
        addLabelOptimistic,
        confirmLabelOptimistic,
        rollbackLabelOptimistic,
        deleteLabelOptimistic,
        confirmLabelDelete,
        rollbackLabelDelete,
        updateLabelOptimistic,
        confirmLabelUpdate,
        rollbackLabelUpdate
    } = useAppStore();

    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState('blue');
    const [selectedIcon, setSelectedIcon] = useState('Tag');
    const [isAdding, setIsAdding] = useState(false);
    const [editingLabel, setEditingLabel] = useState(null);
    const [loading, setLoading] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (editingLabel) {
            setNewLabelName(editingLabel.name);
            setSelectedColor(editingLabel.color);
            setSelectedIcon(editingLabel.icon || 'Tag');
            setIsAdding(true);
        }
    }, [editingLabel]);

    // Reset when closing form
    useEffect(() => {
        if (!isAdding) {
            setEditingLabel(null);
            setNewLabelName('');
            setSelectedColor('blue');
            setSelectedIcon('Tag');
        }
    }, [isAdding]);

    const handleSubmitLabel = async (e) => {
        e.preventDefault();
        if (!newLabelName.trim()) return;

        // Check duplicate (exclude current if editing)
        const isDuplicate = labels.some(l =>
            l.name.toLowerCase() === newLabelName.trim().toLowerCase() &&
            l.id !== editingLabel?.id
        );

        if (isDuplicate) {
            showNotification('Nama label sudah ada', 'error');
            return;
        }

        setLoading(true);
        const payload = {
            name: newLabelName.trim(),
            color: selectedColor,
            icon: selectedIcon
        };

        try {
            if (editingLabel) {
                // UPDATE
                updateLabelOptimistic(editingLabel.id, payload);

                const { error } = await supabase
                    .from('labels')
                    .update(payload)
                    .eq('id', editingLabel.id);

                if (error) throw error;
                confirmLabelUpdate(editingLabel.id, { ...editingLabel, ...payload });
                showNotification('Label berhasil diperbarui');
            } else {
                // INSERT
                const newLabel = {
                    ...payload,
                    created_at: new Date().toISOString()
                };
                const tempId = addLabelOptimistic(newLabel);

                const { data, error } = await supabase
                    .from('labels')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                confirmLabelOptimistic(tempId, data);
                showNotification('Label berhasil dibuat');
            }

            setIsAdding(false);
            setNewLabelName('');
            setEditingLabel(null);
        } catch (error) {
            console.error('Error saving label:', error);
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (label) => {
        setEditingLabel(label);
    };

    const handleDeleteLabel = async (id) => {
        if (!window.confirm('Hapus label ini? Label akan dihapus dari semua arsip terkait.')) return;

        const originalData = deleteLabelOptimistic(id);

        try {
            const { error } = await supabase
                .from('labels')
                .delete()
                .eq('id', id);

            if (error) throw error;
            confirmLabelDelete(id);
            showNotification('Label berhasil dihapus');
        } catch (error) {
            console.error('Error deleting label:', error);
            showNotification(error.message, 'error');
            rollbackLabelDelete(originalData);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Modern Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Kelola Label</h2>
                        <p className="text-sm text-neutral-500 mt-1">Buat dan atur label untuk mengorganisir arsip Anda</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6"
                    >
                        <form
                            className="bg-gradient-to-br from-neutral-50 to-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
                            onSubmit={handleSubmitLabel}
                        >
                            <h3 className="text-sm font-semibold text-neutral-700 mb-4">
                                {editingLabel ? 'Edit Label' : 'Label Baru'}
                            </h3>

                            <div className="space-y-5">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 mb-2">
                                        Nama Label
                                    </label>
                                    <input
                                        type="text"
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="Contoh: Magang 2025"
                                        className="block w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all placeholder-neutral-400"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 mb-3 flex items-center gap-1.5">
                                        <Palette size={14} />
                                        Pilih Warna
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => setSelectedColor(c.name)}
                                                style={{ backgroundColor: c.hex }}
                                                className={cn(
                                                    "w-9 h-9 rounded-xl transition-all relative flex items-center justify-center shadow-sm border-2",
                                                    selectedColor === c.name
                                                        ? "border-neutral-900 scale-110 shadow-md"
                                                        : "border-white/50 hover:scale-105 hover:shadow"
                                                )}
                                                title={c.name}
                                            >
                                                {selectedColor === c.name && (
                                                    <Check size={16} className="text-neutral-900 drop-shadow" strokeWidth={3} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-xs font-medium text-neutral-600 mb-3 flex items-center gap-1.5">
                                        <Tag size={14} />
                                        Pilih Icon
                                    </label>
                                    <div className="grid grid-cols-8 gap-2">
                                        {ICONS.map((icon) => {
                                            const IconComponent = icon.component;
                                            return (
                                                <button
                                                    key={icon.name}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(icon.name)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 transition-all flex items-center justify-center",
                                                        selectedIcon === icon.name
                                                            ? "bg-primary-50 border-primary-400 text-primary-700 shadow-sm"
                                                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
                                                    )}
                                                    title={icon.name}
                                                >
                                                    <IconComponent size={18} strokeWidth={2} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-neutral-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading || !newLabelName.trim()}
                                >
                                    {loading ? 'Menyimpan...' : editingLabel ? 'Update Label' : 'Buat Label'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Button (when not editing) */}
            {!isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-neutral-300 text-neutral-600 rounded-xl hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all font-medium"
                >
                    <Plus size={20} />
                    <span>Tambah Label Baru</span>
                </button>
            )}

            {/* Label Cards List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {labels.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex p-4 rounded-full bg-neutral-100 mb-3">
                            <Tag size={32} className="text-neutral-400" />
                        </div>
                        <p className="text-sm text-neutral-500">Belum ada label</p>
                        <p className="text-xs text-neutral-400 mt-1">Klik tombol di atas untuk membuat label pertama</p>
                    </div>
                ) : (
                    labels.map(label => {
                        const colorHex = COLORS.find(c => c.name === label.color)?.hex || '#d4d4d4';
                        const IconComponent = ICONS.find(i => i.name === label.icon)?.component || Tag;

                        return (
                            <motion.div
                                layout
                                key={label.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative flex items-center gap-4 p-4 bg-white border-2 border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all"
                            >
                                {/* Label Preview */}
                                <div
                                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border-2"
                                    style={{
                                        backgroundColor: `${colorHex}40`,
                                        borderColor: `${colorHex}`,
                                        color: '#000'
                                    }}
                                >
                                    <IconComponent size={20} strokeWidth={2.5} />
                                </div>

                                {/* Label Info */}
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-semibold text-neutral-900 text-sm truncate">{label.name}</h4>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditClick(label)}
                                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                        title="Edit"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLabel(label.id)}
                                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
