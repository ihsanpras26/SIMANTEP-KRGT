import React, { useState } from 'react';
import { Plus, Search, FolderKanban, Edit, Trash2, ChevronRight, ChevronDown, FolderOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useKlasifikasi } from '../hooks/useKlasifikasi';

const KlasifikasiManager = ({ supabase, editingKlasifikasi, setEditingKlasifikasi, showNotification, setDeleteConfirmModal, openModal }) => {
    const { data: klasifikasiData } = useKlasifikasi();
    const klasifikasiList = klasifikasiData || [];
    const [searchKode, setSearchKode] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    const handleEdit = (klasifikasi) => {
        setEditingKlasifikasi(klasifikasi);
        openModal && openModal();
    };

    const handleDelete = (id, kode) => {
        setDeleteConfirmModal({
            show: true,
            id,
            message: `Anda yakin ingin menghapus kode klasifikasi "${kode}"? Tindakan ini tidak dapat diurungkan.`
        });
    };

    const toggleCategory = (code) => {
        setExpandedCategories(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    // Filter & Group Logic
    const filteredKlasifikasi = klasifikasiList.filter(k =>
        k.kode.toLowerCase().includes(searchKode.toLowerCase()) ||
        k.deskripsi.toLowerCase().includes(searchKode.toLowerCase())
    );

    const groupedKlasifikasi = filteredKlasifikasi.reduce((acc, k) => {
        const mainCode = k.kode.split('.')[0];
        if (!acc[mainCode]) acc[mainCode] = [];
        acc[mainCode].push(k);
        return acc;
    }, {});

    // Ensure all main codes exist even if empty (for structure)
    const allMainCodes = Array.from(new Set(filteredKlasifikasi.map(k => k.kode.split('.')[0])));
    allMainCodes.forEach(code => {
        if (!groupedKlasifikasi[code]) groupedKlasifikasi[code] = [];
    });

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative group flex-1 w-full sm:w-auto max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari kode atau deskripsi..."
                        value={searchKode}
                        onChange={(e) => setSearchKode(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm placeholder-neutral-400
                        focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                    {searchKode && (
                        <button
                            onClick={() => setSearchKode('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                        >
                            <Search size={16} className="opacity-0" /> {/* Spacer */}
                            <span className="sr-only">Clear</span>
                            <svg className="h-5 w-5 absolute right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <button
                    onClick={() => {
                        setEditingKlasifikasi(null);
                        openModal && openModal();
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                    <Plus size={20} />
                    <span>Tambah Kode</span>
                </button>
            </div>

            {/* Classification List */}
            <div className="space-y-4">
                {Object.entries(groupedKlasifikasi)
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                    .map(([mainCode, items]) => {
                        const mainItem = items.find(i => i.kode === mainCode);
                        const subItems = items.filter(i => i.kode !== mainCode).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
                        const isExpanded = expandedCategories[mainCode];

                        return (
                            <div key={mainCode} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                {/* Main Category Header */}
                                <div
                                    className={cn(
                                        "p-5 cursor-pointer transition-colors flex items-center justify-between group",
                                        isExpanded ? "bg-neutral-50" : "bg-white hover:bg-neutral-50"
                                    )}
                                    onClick={() => toggleCategory(mainCode)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                                            mainCode.length === 3 ? "bg-neutral-800" : "bg-primary-500"
                                        )}>
                                            <FolderKanban size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-display font-bold text-lg text-neutral-900">{mainCode}</span>

                                            </div>
                                            <div className="text-neutral-600 text-sm mt-0.5">
                                                {mainItem ? mainItem.deskripsi : (subItems.length > 0 ? 'Kategori Induk' : 'Tidak ada deskripsi')}
                                            </div>

                                            {/* Metadata Badges */}
                                            {mainItem && mainCode.length > 3 && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Aktif: {mainItem.retensiAktif} thn
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Inaktif: {mainItem.retensiInaktif} thn
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {mainItem && mainCode.length > 3 && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(mainItem); }}
                                                    className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(mainItem.id, mainItem.kode); }}
                                                    className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-white rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {subItems.length > 0 && (
                                            <div className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300",
                                                isExpanded ? "bg-neutral-200 text-neutral-700 rotate-180" : "bg-neutral-100 text-neutral-400 group-hover:bg-white group-hover:shadow-sm"
                                            )}>
                                                <ChevronDown size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sub Categories */}
                                <AnimatePresence>
                                    {isExpanded && subItems.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-neutral-100 bg-neutral-50/50"
                                        >
                                            <div className="p-2 space-y-1">
                                                {subItems.map(item => {
                                                    const level = item.kode.split('.').length;
                                                    const isSubCategory = level === 2;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleEdit(item)}
                                                            className={cn(
                                                                "group flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-100 transition-all cursor-pointer",
                                                                !isSubCategory && "ml-8"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                                                    isSubCategory ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                                                                )}>
                                                                    {isSubCategory ? <FolderOpen size={16} /> : <FileText size={16} />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-bold text-neutral-900 text-sm">{item.kode}</span>
                                                                        <span className="text-neutral-600 text-sm line-clamp-1">{item.deskripsi}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                                                            Aktif: {item.retensiAktif} thn
                                                                        </span>
                                                                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                                                            Inaktif: {item.retensiInaktif} thn
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id, item.kode)}
                                                                    className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
            </div>

            {filteredKlasifikasi.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-neutral-200 border-dashed">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900">Tidak ada kode klasifikasi</h3>
                    <p className="text-neutral-500 max-w-sm mt-1">
                        Coba ubah kata kunci pencarian Anda atau tambahkan kode klasifikasi baru.
                    </p>
                </div>
            )}
        </div>
    );
};

export default KlasifikasiManager;
