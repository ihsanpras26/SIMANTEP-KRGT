import React from 'react';
import { ArrowLeft, FileText, Calendar, Tag, Download, Eye, Clock, CheckCircle, AlertCircle, Folder, User, Send, File } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ArsipDetail({ arsip, onBack, klasifikasiList = [] }) {
    if (!arsip) return null;

    const klasifikasi = klasifikasiList.find(k => k.kode === arsip.kodeKlasifikasi);
    const isActive = new Date(arsip.tanggalRetensi) > new Date();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
    };

    const getEmbedUrl = () => {
        if (arsip.googleDriveLink) {
            // Convert view/edit link to preview link
            // Pattern: https://drive.google.com/file/d/[FILE_ID]/view?usp=sharing
            // Target: https://drive.google.com/file/d/[FILE_ID]/preview
            const fileIdMatch = arsip.googleDriveLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
            return arsip.googleDriveLink;
        } else if (arsip.filePath) {
            // For Supabase storage, we might need to check if it's embeddable (PDF, images)
            // If it's a PDF, we can use the direct link in an iframe
            return `${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`;
        }
        return null;
    };

    const embedUrl = getEmbedUrl();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-display font-bold text-neutral-900">Detail Arsip</h1>
                    <p className="text-sm text-neutral-500">Informasi lengkap dan pratinjau dokumen</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Document Preview */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden h-[800px] flex flex-col">
                        <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                                <FileText size={18} className="text-primary-600" />
                                Pratinjau Dokumen
                            </h3>
                            {embedUrl && (
                                <a
                                    href={embedUrl.replace('/preview', '/view')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <Eye size={14} />
                                    Buka di Tab Baru
                                </a>
                            )}
                        </div>
                        <div className="flex-1 bg-neutral-100 relative">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                    allow="autoplay"
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                                    <FileText size={64} className="mb-4 opacity-20" />
                                    <p className="font-medium">Pratinjau tidak tersedia</p>
                                    <p className="text-sm mt-2">Dokumen mungkin tidak memiliki link atau file yang valid.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Meta Info */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-6">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                {isActive ? <CheckCircle size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                {isActive ? 'Aktif' : 'Inaktif'}
                            </span>
                            <span className="text-neutral-500 text-xs font-mono px-2.5 py-1 bg-neutral-100 rounded-full border border-neutral-200">
                                {arsip.nomorArsip}
                            </span>
                        </div>

                        <h2 className="text-xl font-display font-bold text-neutral-900 leading-tight mb-6">
                            {arsip.perihal}
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Nomor Surat</label>
                                    <p className="text-neutral-900 font-medium">{arsip.nomorSurat || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Tanggal Surat</label>
                                    <div className="flex items-center gap-2 text-neutral-900">
                                        <Calendar size={16} className="text-neutral-400" />
                                        <span className="font-medium">{formatDate(arsip.tanggalSurat)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Klasifikasi</label>
                                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-start gap-3">
                                    <div className="bg-white text-primary-700 font-mono font-bold px-2 py-1 rounded border border-neutral-200 text-sm shadow-sm">
                                        {arsip.kodeKlasifikasi}
                                    </div>
                                    {klasifikasi && (
                                        <p className="text-sm text-neutral-700 leading-relaxed pt-0.5">
                                            {klasifikasi.deskripsi}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Pengirim</label>
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-neutral-400" />
                                        <p className="text-neutral-900 font-medium text-sm">{arsip.pengirim || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Tujuan</label>
                                    <div className="flex items-center gap-2">
                                        <Send size={16} className="text-neutral-400" />
                                        <p className="text-neutral-900 font-medium text-sm">{arsip.tujuanSurat || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Card */}
                    {arsip.deskripsi && (
                        <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-6">
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 block">Keterangan</label>
                            <p className="text-neutral-700 text-sm leading-relaxed">
                                {arsip.deskripsi}
                            </p>
                        </div>
                    )}

                    {/* Retention Card */}
                    <div className="bg-white rounded-2xl shadow-card border border-neutral-100 p-6">
                        <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            Masa Retensi
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1.5 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <div>
                                    <p className="text-sm font-medium text-neutral-900">
                                        {isActive ? 'Masih Berlaku' : 'Sudah Berakhir'}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {isActive
                                            ? 'Dokumen ini masih dalam masa penyimpanan aktif.'
                                            : 'Dokumen ini telah melewati masa retensi.'}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-neutral-100">
                                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Tanggal Berakhir</label>
                                <p className="text-neutral-900 font-medium">{formatDate(arsip.tanggalRetensi)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-xl shadow-neutral-200/50">
                        <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            Download File
                        </h3>
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
                                } catch (error) {
                                    console.error('Download failed', error);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white text-neutral-900 rounded-xl hover:bg-neutral-100 transition-all font-bold"
                        >
                            <Download size={18} />
                            Download Dokumen
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
