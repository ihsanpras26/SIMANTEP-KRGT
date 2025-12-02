import React, { useState } from 'react';
import { Plus, Search, FolderKanban, Edit, Trash2, ChevronRight } from 'lucide-react';

const KlasifikasiManager = ({ supabase, klasifikasiList, editingKlasifikasi, setEditingKlasifikasi, showNotification, setDeleteConfirmModal, openModal }) => {
    const handleEdit = (klasifikasi) => {
        setEditingKlasifikasi(klasifikasi);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id, kode) => {
        setDeleteConfirmModal({ 
            show: true, 
            id, 
            message: `Anda yakin ingin menghapus kode klasifikasi "${kode}"? Tindakan ini tidak dapat diurungkan dan dapat mempengaruhi arsip yang ada.` 
        });
    };
    const [searchKode, setSearchKode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    // Filter klasifikasi berdasarkan pencarian
    const filteredKlasifikasi = klasifikasiList.filter(k => 
        k.kode.toLowerCase().includes(searchKode.toLowerCase()) ||
        k.deskripsi.toLowerCase().includes(searchKode.toLowerCase())
    );
    
    // Group by main category
    const groupedKlasifikasi = filteredKlasifikasi.reduce((acc, k) => {
        const mainCode = k.kode.split('.')[0];
        if (!acc[mainCode]) {
            acc[mainCode] = [];
        }
        acc[mainCode].push(k);
        return acc;
    }, {});
    // Pastikan setiap main code muncul sebagai grup walaupun entri 3 digit tidak ada
    const allMainCodes = Array.from(new Set(filteredKlasifikasi.map(k => k.kode.split('.')[0])));
    allMainCodes.forEach(code => {
        if (!groupedKlasifikasi[code]) {
            groupedKlasifikasi[code] = [];
        }
    });

    return (
        <div className="space-y-6">
            {/* Header dengan Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Kode Klasifikasi</h2>
                        <p className="text-sm text-gray-600 mt-1">Kelola sistem klasifikasi arsip dengan hierarki yang terstruktur</p>
                </div>
                    <button 
                        onClick={() => { 
                            setEditingKlasifikasi(null); 
                            openModal && openModal(); 
                        }} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Tambah Kode
                    </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari kode atau deskripsi klasifikasi..."
                        value={searchKode}
                        onChange={(e) => setSearchKode(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
            
            {/* Cards Layout */}
            <div className="space-y-4">
                {Object.entries(groupedKlasifikasi)
                    .sort(([a], [b]) => {
                        // Prioritaskan kode "000" di atas
                        if (a === '000') return -1;
                        if (b === '000') return 1;
                        // Sorting normal untuk yang lain
                        return a.localeCompare(b, undefined, { numeric: true });
                    })
                    .map(([mainCode, items]) => {
                    const mainItem = items.find(i => i.kode === mainCode);
                    const subItems = items.filter(i => i.kode !== mainCode).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
                    const isExpanded = selectedCategory === mainCode;
                                
                                return (
                        <div key={mainCode} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Main Category Header */}
                            <div 
                                className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                                onClick={() => setSelectedCategory(isExpanded ? null : mainCode)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                            <FolderKanban size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-gray-900">{mainCode}</div>
                                            {mainItem ? (
                                                <div className="text-gray-600">{mainItem.deskripsi}</div>
                                            ) : mainCode.length === 3 && subItems.length > 0 ? (
                                                <div className="text-gray-500">Kategori Utama</div>
                                            ) : null}
                                            <div className="flex items-center gap-4 mt-2">
                                                {/* Untuk kode 3 digit: hanya tampilkan jumlah sub-kode tanpa retensi */}
                                                {mainCode.length === 3 ? (
                                                    <span className="text-sm bg-white px-3 py-1 rounded-full text-blue-600 font-medium border border-blue-200">
                                                        📁 {subItems.length} sub-kode
                                                    </span>
                                                ) : mainItem && mainCode.length > 3 ? (
                                                    /* Untuk kode 4+ digit yang ada datanya: tampilkan retensi */
                                                    <>
                                                        <span className="text-sm bg-white px-2 py-1 rounded text-emerald-700 font-medium border border-emerald-200">
                                                            Aktif: {mainItem.retensiAktif} tahun
                                                        </span>
                                                        <span className="text-sm bg-white px-2 py-1 rounded text-amber-700 font-medium border border-amber-200">
                                                            Inaktif: {mainItem.retensiInaktif} tahun
                                                        </span>
                                                        {subItems.length > 0 && (
                                                            <span className="text-sm bg-white px-3 py-1 rounded-full text-blue-600 font-medium border border-blue-200">
                                                                📁 {subItems.length} sub-kode
                                                            </span>
                                                        )}
                                                    </>
                                                ) : subItems.length > 0 ? (
                                                    <span className="text-sm bg-white px-3 py-1 rounded-full text-blue-600 font-medium border border-blue-200">
                                                        📁 {subItems.length} sub-kode
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Actions hanya untuk kode yang memiliki data (bukan pembatas 3 digit) */}
                                        {mainItem && mainCode.length > 3 && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        handleEdit(mainItem); 
                                                        openModal && openModal(); 
                                                    }} 
                                                    className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(mainItem.id, mainItem.kode);
                                                    }} 
                                                    className="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Hapus Kategori"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {subItems.length > 0 && (
                                            <ChevronRight 
                                                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                                                size={20} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sub Categories - Expandable */}
                            {isExpanded && subItems.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                    <div className="p-4 space-y-3">
                                        {subItems.map(item => {
                                            const level = item.kode.split('.').length;
                                            const isSubCategory = level === 2;
                                            
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className={`bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${
                                                        isSubCategory ? '' : 'ml-6'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                isSubCategory 
                                                                    ? 'bg-green-100 text-green-600' 
                                                                    : 'bg-orange-100 text-orange-600'
                                                            }`}>
                                                                {isSubCategory ? '📂' : '📄'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono font-bold text-gray-900">{item.kode}</span>
                                                                    <span className="text-gray-600">{item.deskripsi}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                                                                        Aktif: {item.retensiAktif} tahun
                                                                    </span>
                                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">
                                                                        Inaktif: {item.retensiInaktif} tahun
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => { 
                                                                    handleEdit(item); 
                                                                    openModal && openModal(); 
                                                                }} 
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(item.id, item.kode)} 
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                );
                            })}
                </div>
            </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {filteredKlasifikasi.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
                    <FolderKanban size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Tidak ada kode klasifikasi yang sesuai dengan pencarian</p>
                </div>
            )}
        </div>
    );
};

export default KlasifikasiManager;
