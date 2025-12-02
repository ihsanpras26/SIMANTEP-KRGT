import React from 'react';
import { XCircle, FileText, CheckCircle, AlertCircle, FolderKanban, Clock, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const ArsipDetailModal = ({ arsip, klasifikasiList, onClose }) => {
    if (!arsip) return null;

    const klasifikasi = klasifikasiList?.find(k => k.kode === arsip.kodeKlasifikasi);
    const isActive = new Date(arsip.tanggalRetensi) > new Date();
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100 animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-white/10"
                    >
                        <XCircle size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Detail Arsip</h2>
                            <p className="text-blue-100">Informasi lengkap dokumen</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
                    {/* Document Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{arsip.perihal}</h3>
                                <p className="text-gray-600 mb-4">Nomor: {arsip.nomorSurat || 'Tidak ada nomor'}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal Surat</label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{formatDate(arsip.tanggalSurat)}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengirim</label>
                                        <p className="text-gray-900 font-bold mt-1">{arsip.pengirim || 'Tidak disebutkan'}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tujuan</label>
                                        <p className="text-gray-900 font-bold mt-1">{arsip.tujuanSurat || 'Tidak disebutkan'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="ml-6">
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg ${
                                    isActive 
                                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300' 
                                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                                }`}>
                                    {isActive ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    {isActive ? 'Aktif' : 'Inaktif'}
                                </div>
                                <p className="text-sm text-gray-600 mt-2 text-center">
                                    Retensi: {formatDate(arsip.tanggalRetensi)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Classification */}
                            {arsip.kodeKlasifikasi && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                        <FolderKanban size={24} className="text-indigo-600" />
                                        Klasifikasi
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-xl border border-indigo-200">
                                            <span className="font-mono font-bold text-indigo-700 text-lg">{arsip.kodeKlasifikasi}</span>
                                        </div>
                                        {klasifikasi && (
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">{klasifikasi.deskripsi}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                                                        Aktif: {klasifikasi.retensiAktif} tahun
                                                    </span>
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">
                                                        Inaktif: {klasifikasi.retensiInaktif} tahun
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Clock size={24} className="text-gray-600" />
                                    Riwayat
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dibuat</label>
                                        <p className="text-gray-900 font-bold mt-1">{formatDateTime(arsip.createdAt)}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Terakhir Diperbarui</label>
                                        <p className="text-gray-900 font-bold mt-1">{formatDateTime(arsip.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* File Access */}
                            {(arsip.googleDriveLink || arsip.filePath) && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                        <FileText size={24} className="text-blue-600" />
                                        Dokumen Digital
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        {/* File Type Info */}
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                                    {arsip.googleDriveLink ? (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12.01 2C6.5 2 2.01 6.5 2.01 12s4.49 10 9.99 10c5.51 0 10-4.5 10-10S17.52 2 12.01 2z"/>
                                                        </svg>
                                                    ) : (
                                                        <FileText size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg">
                                                        {arsip.googleDriveLink ? 'Google Drive' : 'File Server'}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        {arsip.googleDriveLink ? 'Dokumen cloud' : 'File lokal'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    if (arsip.googleDriveLink) {
                                                        window.open(arsip.googleDriveLink, '_blank');
                                                    } else if (arsip.filePath) {
                                                        window.open(`${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`, '_blank');
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-lg"
                                            >
                                                <Eye size={20} />
                                                Lihat
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        let downloadUrl;
                                                        let fileName = `${arsip.nomorSurat || 'arsip'}.pdf`;
                                                        
                                                        if (arsip.googleDriveLink) {
                                                            const fileId = arsip.googleDriveLink.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
                                                            if (fileId) {
                                                                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                                            } else {
                                                                downloadUrl = arsip.googleDriveLink;
                                                            }
                                                        } else if (arsip.filePath) {
                                                            downloadUrl = `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`;
                                                            fileName = arsip.filePath.split('/').pop() || fileName;
                                                        }
                                                        
                                                        const link = document.createElement('a');
                                                        link.href = downloadUrl;
                                                        link.download = fileName;
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        
                                                        toast.success('Download dimulai!');
                                                    } catch (error) {
                                                        toast.error('Gagal mendownload file');
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 font-semibold shadow-lg"
                                            >
                                                <Download size={20} />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            ID: <span className="font-mono font-medium">{arsip.id}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArsipDetailModal;
