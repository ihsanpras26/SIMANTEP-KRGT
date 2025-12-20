import React, { useMemo } from 'react';
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
    File,
    Tag,
    Building2,
    Info,
    Timer
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../utils/cn';
import { getArsipStatus } from '../utils/statusUtils';

export default function ArsipDetail({ arsip, onBack, klasifikasiList = [] }) {
    if (!arsip) return null;

    const klasifikasi = klasifikasiList.find(k => k.kode === arsip.kodeKlasifikasi);

    const status = getArsipStatus(arsip, klasifikasiList);
    const isActive = status === 'Aktif';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // Calculate retention duration and remaining days
    const retentionInfo = useMemo(() => {
        if (!arsip.tanggalSurat || !arsip.tanggalRetensi) return null;

        const startDate = new Date(arsip.tanggalSurat);
        const endDate = new Date(arsip.tanggalRetensi);
        const today = new Date();

        const totalDays = differenceInDays(endDate, startDate);
        const remainingDays = differenceInDays(endDate, today);
        const elapsedDays = differenceInDays(today, startDate);

        const totalYears = Math.floor(totalDays / 365);
        const totalMonths = Math.floor((totalDays % 365) / 30);

        return {
            totalDays,
            totalYears,
            totalMonths,
            remainingDays,
            elapsedDays,
            percentage: totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0,
            isExpired: isAfter(today, endDate),
            isActive: isBefore(today, endDate)
        };
    }, [arsip.tanggalSurat, arsip.tanggalRetensi]);

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

    // Parse labels if they exist
    const labels = useMemo(() => {
        if (!arsip.labels || !Array.isArray(arsip.labels)) return [];
        return arsip.labels;
    }, [arsip.labels]);

    return (
        <div className="space-y-5 animate-fade-in max-w-screen-2xl mx-auto">
            {/* Enhanced Header with Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={onBack}
                            className="group p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-white hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm hover:shadow"
                            aria-label="Kembali ke daftar arsip"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex-1">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                                <FileText size={12} />
                                <span>Daftar Arsip</span>
                                <span className="text-neutral-300">/</span>
                                <span className="font-medium text-neutral-700">Detail</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-display font-bold text-neutral-900">Detail Arsip</h1>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/25 transition-all font-semibold text-sm group whitespace-nowrap"
                        aria-label="Download dokumen"
                    >
                        <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                        <span>Download Dokumen</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                {/* Left Column: Document Preview */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden lg:sticky lg:top-5 flex flex-col h-[850px]">
                        <div className="px-5 py-3.5 border-b border-neutral-200 flex justify-between items-center bg-gradient-to-r from-neutral-50/50 to-white">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-2.5 text-sm">
                                <div className="p-1.5 bg-primary-100 text-primary-600 rounded-lg">
                                    <FileText size={16} strokeWidth={2.5} />
                                </div>
                                <span>Pratinjau Dokumen</span>
                            </h3>
                            {embedUrl && (
                                <a
                                    href={embedUrl.replace('/preview', '/view')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all border border-primary-200 hover:border-primary-300"
                                    aria-label="Buka dokumen di tab baru"
                                >
                                    <Eye size={14} />
                                    <span>Tampilan Penuh</span>
                                </a>
                            )}
                        </div>
                        <div className="flex-1 bg-neutral-50 relative overflow-hidden">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="absolute inset-0 w-full h-full border-none"
                                    title="Document Preview"
                                    allow="autoplay"
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                        <File size={40} className="text-neutral-400" strokeWidth={1.5} />
                                    </div>
                                    <p className="font-bold text-neutral-700 text-lg mb-1">Pratinjau tidak tersedia</p>
                                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Dokumen ini mungkin tidak memiliki file digital atau link yang valid.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Information Sidebar */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4 scroll-smooth">

                    {/* 1. Primary Info Card - Perihal & Deskripsi */}
                    <div className="bg-gradient-to-br from-white to-neutral-50/30 rounded-2xl shadow-sm border border-neutral-200 p-5 relative overflow-hidden scroll-mt-4">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                            <FileText size={120} className="text-neutral-900" strokeWidth={1.5} />
                        </div>

                        <div className="relative z-10 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Info size={11} />
                                    Perihal Surat
                                </h3>
                            </div>

                            <h2 className="text-base font-display font-bold text-neutral-900 leading-snug">
                                {arsip.perihal}
                            </h2>

                            {arsip.deskripsi && (
                                <div className="pt-3 border-t border-neutral-200">
                                    <p className="text-xs text-neutral-600 leading-relaxed">
                                        {arsip.deskripsi}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Document Metadata Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden scroll-mt-4">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                <div className="p-1 bg-violet-100 text-violet-600 rounded-lg">
                                    <Hash size={13} strokeWidth={2.5} />
                                </div>
                                <span>Informasi Dokumen</span>
                            </h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Nomor Surat */}
                            <div className="group">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                                    <Hash size={10} />
                                    Nomor Surat
                                </label>
                                <div className="text-neutral-900 font-semibold font-mono text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200 group-hover:border-neutral-300 transition-colors">
                                    {arsip.nomorSurat || '-'}
                                </div>
                            </div>

                            {/* Tanggal & Klasifikasi */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="group">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                        <Calendar size={10} />
                                        Tanggal
                                    </label>
                                    <div className="text-neutral-900 font-medium text-[14px] bg-neutral-50 px-2.5 py-2 rounded-lg border border-neutral-200">
                                        {formatDate(arsip.tanggalSurat)}
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                        <Building2 size={10} />
                                        Kode
                                    </label>
                                    <div className="text-neutral-900 font-semibold text-xs bg-blue-50 px-2.5 py-2 rounded-lg border border-blue-200 font-mono">
                                        {arsip.kodeKlasifikasi}
                                    </div>
                                </div>
                            </div>

                            {/* Classification Description */}
                            {klasifikasi && (
                                <div className="pt-3 border-t border-neutral-200">
                                    <div className="flex items-start gap-2 text-xs text-neutral-600 bg-blue-50/50 px-3 py-2.5 rounded-lg border border-blue-100">
                                        <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-blue-900 mb-0.5">Klasifikasi:</p>
                                            <p className="leading-relaxed">{klasifikasi.deskripsi}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Parties Involved Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden scroll-mt-4">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
                            <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <User size={13} strokeWidth={2.5} />
                                </div>
                                <span>Pihak Terkait</span>
                            </h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Pengirim */}
                            <div className="group">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <User size={10} />
                                    Pengirim
                                </label>
                                <div className="flex items-center gap-3 bg-neutral-50 px-3 py-2.5 rounded-lg border border-neutral-200 group-hover:border-neutral-300 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 shadow-sm flex-shrink-0">
                                        <User size={14} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-neutral-900 font-medium text-sm">{arsip.pengirim || '-'}</span>
                                </div>
                            </div>

                            {/* Tujuan */}
                            <div className="group">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                    <Send size={10} />
                                    Tujuan
                                </label>
                                <div className="flex items-center gap-3 bg-neutral-50 px-3 py-2.5 rounded-lg border border-neutral-200 group-hover:border-neutral-300 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-violet-700 shadow-sm flex-shrink-0">
                                        <Send size={14} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-neutral-900 font-medium text-sm">{arsip.tujuanSurat || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Labels/Tags (if available) */}
                    {labels.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden scroll-mt-4">
                            <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
                                <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-pink-100 text-pink-600 rounded-lg">
                                        <Tag size={13} strokeWidth={2.5} />
                                    </div>
                                    <span>Label</span>
                                </h3>
                            </div>
                            <div className="p-5">
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200 shadow-sm"
                                        >
                                            <Tag size={11} />
                                            {label.name || label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Enhanced Retention Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden scroll-mt-4">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-200">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-amber-100 text-amber-600 rounded-lg">
                                        <Clock size={13} strokeWidth={2.5} />
                                    </div>
                                    <span>Masa Retensi</span>
                                </h3>
                                <span className={cn(
                                    "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide",
                                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                )}>
                                    {isActive ? 'Aktif' : 'Inaktif'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Duration Info */}
                            {retentionInfo && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 rounded-xl border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                            <Timer size={12} />
                                            {retentionInfo.isActive ? 'Sisa Waktu' : 'Sudah Berakhir'}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                            {Math.round(retentionInfo.percentage)}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-amber-200 rounded-full h-2 mb-2 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                retentionInfo.isActive
                                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                                    : "bg-gradient-to-r from-amber-500 to-red-500"
                                            )}
                                            style={{ width: `${retentionInfo.percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-amber-900">
                                            {retentionInfo.totalYears > 0 && `${retentionInfo.totalYears} tahun `}
                                            {retentionInfo.totalMonths > 0 && `${retentionInfo.totalMonths} bulan`}
                                        </span>
                                        {retentionInfo.isActive && (
                                            <span className="text-emerald-700 font-bold">
                                                {retentionInfo.remainingDays} hari lagi
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="relative pl-6 space-y-6">
                                <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-300" />

                                {/* Start Date */}
                                <div className="relative">
                                    <div className="absolute -left-[19px] top-1 w-4 h-4 rounded-full bg-neutral-400 border-2 border-white shadow-md" />
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                                        <Calendar size={10} />
                                        Mulai
                                    </label>
                                    <p className="text-[14px] font-semibold text-neutral-900">{formatDate(arsip.tanggalSurat)}</p>
                                </div>

                                {/* End Date */}
                                <div className="relative">
                                    <div className={cn(
                                        "absolute -left-[19px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-md",
                                        isActive ? "bg-emerald-500" : "bg-amber-500"
                                    )} />
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
                                        <Calendar size={10} />
                                        Berakhir
                                    </label>
                                    <p className="text-[14px] font-semibold text-neutral-900">{formatDate(arsip.tanggalRetensi)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
