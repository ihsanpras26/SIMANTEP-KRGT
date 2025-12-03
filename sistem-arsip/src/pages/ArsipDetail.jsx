import React from 'react';
import { 
    ArrowLeft, 
    FileText, 
    Calendar, 
    Download, 
    Eye, 
    CheckCircle, 
    AlertCircle, 
    User, 
    Send, 
    Hash,
    Clock,
    File
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../utils/cn';

export default function ArsipDetail({ arsip, onBack, klasifikasiList = [] }) {
    if (!arsip) return null;

    const klasifikasi = klasifikasiList.find(k => k.kode === arsip.kodeKlasifikasi);
    
    // Check if classification has 0/0 retention (Permanent/Indefinite)
    const isPermanent = klasifikasi && 
        Number(klasifikasi.retensiAktif) === 0 && 
        Number(klasifikasi.retensiInaktif) === 0;

    // Active if: Permanent OR No retention date OR Retention date is in future
    const isActive = isPermanent || !arsip.tanggalRetensi || new Date(arsip.tanggalRetensi) > new Date();
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
    };

    const getEmbedUrl = () => {
        if (arsip.googleDriveLink) {
            const fileIdMatch = arsip.googleDriveLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
            return arsip.googleDriveLink;
        } else if (arsip.filePath) {
            return `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`;
        }
        return null;
    };

    const embedUrl = getEmbedUrl();

    const handleDownload = async () => {
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
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in max-w-screen-2xl mx-auto">
            {/* Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="group p-2 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-0.5">
                            <span>Daftar Arsip</span>
                            <span className="text-neutral-300">/</span>
                            <span>Detail</span>
                        </div>
                        <h1 className="text-xl font-display font-bold text-neutral-900">Detail Arsip</h1>
                    </div>
                </div>

                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/20 transition-all font-medium text-sm group"
                >
                    <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span>Download Dokumen</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left Column: Document Preview */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden h-[500px] lg:h-[600px] flex flex-col group">
                        <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                <div className="p-1 bg-primary-50 text-primary-600 rounded-md">
                                    <FileText size={14} />
                                </div>
                                Pratinjau Dokumen
                            </h3>
                            {embedUrl && (
                                <a
                                    href={embedUrl.replace('/preview', '/view')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                                >
                                    <Eye size={12} />
                                    Buka Penuh
                                </a>
                            )}
                        </div>
                        <div className="flex-1 bg-neutral-100/50 relative">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                    allow="autoplay"
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                        <File size={32} className="text-neutral-300" />
                                    </div>
                                    <p className="font-bold text-neutral-600 text-lg">Pratinjau tidak tersedia</p>
                                    <p className="text-sm mt-1 max-w-xs mx-auto">Dokumen ini mungkin tidak memiliki file digital atau link yang valid.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Information */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                    
                    {/* Primary Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <FileText size={80} className="text-neutral-900" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shadow-sm",
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                )}>
                                    {isActive ? <CheckCircle size={10} strokeWidth={3} /> : <AlertCircle size={10} strokeWidth={3} />}
                                    {isActive ? 'Aktif' : 'Inaktif'}
                                </span>
                                <span className="text-neutral-500 text-[10px] font-mono px-2 py-0.5 bg-neutral-100 rounded-full border border-neutral-200 font-medium">
                                    #{arsip.nomorArsip}
                                </span>
                            </div>

                            <h2 className="text-lg font-display font-bold text-neutral-900 leading-snug mb-1.5">
                                {arsip.perihal}
                            </h2>
                            <p className="text-neutral-500 text-xs leading-relaxed line-clamp-3">
                                {arsip.deskripsi || 'Tidak ada keterangan tambahan.'}
                            </p>
                        </div>
                    </div>

                    {/* Details Grid Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="p-4 space-y-4">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <Hash size={12} className="text-primary-500" />
                                Detail Surat
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="group">
                                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block group-hover:text-primary-600 transition-colors">Nomor Surat</label>
                                    <div className="text-neutral-900 font-medium font-mono text-xs bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
                                        {arsip.nomorSurat || '-'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block group-hover:text-primary-600 transition-colors">Tanggal Surat</label>
                                        <div className="flex items-center gap-1.5 text-neutral-900 font-medium text-xs">
                                            <Calendar size={12} className="text-neutral-400" />
                                            {formatDate(arsip.tanggalSurat)}
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block group-hover:text-primary-600 transition-colors">Klasifikasi</label>
                                        <div className="flex items-center gap-1.5 text-neutral-900 font-medium text-xs">
                                            <Hash size={12} className="text-neutral-400" />
                                            {arsip.kodeKlasifikasi}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 gap-3">
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block group-hover:text-primary-600 transition-colors">Pengirim</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                                                <User size={10} />
                                            </div>
                                            <span className="text-neutral-900 font-medium text-xs">{arsip.pengirim || '-'}</span>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block group-hover:text-primary-600 transition-colors">Tujuan</label>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                                                <Send size={10} />
                                            </div>
                                            <span className="text-neutral-900 font-medium text-xs">{arsip.tujuanSurat || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Classification Context */}
                        {klasifikasi && (
                            <div className="bg-neutral-50 px-4 py-2.5 border-t border-neutral-200">
                                <p className="text-[10px] text-neutral-500 leading-relaxed">
                                    <span className="font-bold text-neutral-700">Konteks Klasifikasi:</span> {klasifikasi.deskripsi}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Retention & Action */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                <Clock size={12} className="text-primary-500" />
                                Masa Retensi
                            </h3>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {isActive ? 'Aktif' : 'Inaktif'}
                            </span>
                        </div>
                        
                        <div className="relative pl-4 border-l-2 border-neutral-100 space-y-6">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-neutral-300 border-2 border-white shadow-sm" />
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block">Mulai</label>
                                <p className="text-sm font-medium text-neutral-900">{formatDate(arsip.tanggalSurat)}</p>
                            </div>
                            <div className="relative">
                                <div className={cn(
                                    "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                                    isActive ? "bg-emerald-500" : "bg-amber-500"
                                )} />
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 block">Berakhir</label>
                                <p className="text-sm font-medium text-neutral-900">{formatDate(arsip.tanggalRetensi)}</p>
                            </div>
                        </div>


                    </div>

                </div>
            </div>
        </div>
    );
}
