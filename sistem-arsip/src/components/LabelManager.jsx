import React, { useState } from 'react';
import { Plus, Trash2, Tag, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import useAppStore from '../store/useAppStore';

const COLORS = [
    { name: 'rose', hex: '#e11d48' },
    { name: 'pink', hex: '#db2777' },
    { name: 'purple', hex: '#9333ea' },
    { name: 'indigo', hex: '#4f46e5' },
    { name: 'blue', hex: '#2563eb' },
    { name: 'sky', hex: '#0284c7' },
    { name: 'cyan', hex: '#0891b2' },
    { name: 'teal', hex: '#0d9488' },
    { name: 'emerald', hex: '#059669' },
    { name: 'green', hex: '#16a34a' },
    { name: 'lime', hex: '#65a30d' },
    { name: 'yellow', hex: '#ca8a04' },
    { name: 'amber', hex: '#d97706' },
    { name: 'orange', hex: '#ea580c' },
    { name: 'red', hex: '#dc2626' },
    { name: 'stone', hex: '#57534e' },
    { name: 'neutral', hex: '#525252' }
];

export default function LabelManager({ supabase, onClose, showNotification }) {
    const {
        labels,
        addLabelOptimistic,
        confirmLabelOptimistic,
        rollbackLabelOptimistic,
        deleteLabelOptimistic,
        confirmLabelDelete,
        rollbackLabelDelete
    } = useAppStore();

    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState('blue');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAddLabel = async (e) => {
        e.preventDefault();
        if (!newLabelName.trim()) return;

        // Check duplicate
        if (labels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
            showNotification('Nama label sudah ada', 'error');
            return;
        }

        setLoading(true);
        const newLabel = {
            name: newLabelName.trim(),
            color: selectedColor,
            created_at: new Date().toISOString()
        };

        const tempId = addLabelOptimistic(newLabel); // Optimistic Update

        try {
            const { data, error } = await supabase
                .from('labels')
                .insert([{ name: newLabel.name, color: newLabel.color }])
                .select()
                .single();

            if (error) throw error;
            confirmLabelOptimistic(tempId, data);
            showNotification('Label berhasil dibuat');
            setNewLabelName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding label:', error);
            showNotification(error.message, 'error');
            rollbackLabelOptimistic(tempId);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLabel = async (id) => {
        if (!window.confirm('Hapus label ini? Label akan dihapus dari semua arsip terkait.')) return;

        const originalData = deleteLabelOptimistic(id); // Optimistic Delete

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
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                {/* Simplified Header - removed generic text */}
                <h3 className="text-lg font-bold text-neutral-900">Daftar Label</h3>

                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 text-sm font-medium bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                    >
                        <Plus size={16} />
                        Tambah
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <form
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200"
                            onSubmit={handleAddLabel}
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                        Nama Label
                                    </label>
                                    <input
                                        type="text"
                                        value={newLabelName}
                                        onChange={(e) => setNewLabelName(e.target.value)}
                                        placeholder="Nama Label..."
                                        className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-neutral-400"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Palette size={12} />
                                        Warna
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => setSelectedColor(c.name)}
                                                style={{ backgroundColor: c.hex }}
                                                className={cn(
                                                    "w-6 h-6 rounded-full transition-all relative flex items-center justify-center shadow-sm border border-black/5",
                                                    selectedColor === c.name
                                                        ? "ring-2 ring-offset-2 ring-neutral-900 scale-110"
                                                        : "hover:scale-110"
                                                )}
                                                title={c.name}
                                            >
                                                {selectedColor === c.name && (
                                                    <Check size={12} className="text-white drop-shadow-sm" strokeWidth={3} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-neutral-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-70"
                                    disabled={loading || !newLabelName.trim()}
                                >
                                    {loading ? 'Simpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {labels.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400">
                        <Tag size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Belum ada label.</p>
                    </div>
                ) : (
                    labels.map(label => {
                        const styleColor = COLORS.find(c => c.name === label.color)?.hex || label.color;
                        return (
                            <motion.div
                                layout
                                key={label.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl hover:border-neutral-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border"
                                        style={{
                                            backgroundColor: `${styleColor}20`,
                                            color: styleColor,
                                            borderColor: `${styleColor}40`
                                        }}
                                    >
                                        <Tag size={14} />
                                    </div>
                                    <span className="font-medium text-neutral-700 text-sm">{label.name}</span>
                                </div>

                                <button
                                    onClick={() => handleDeleteLabel(label.id)}
                                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Hapus Label"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
