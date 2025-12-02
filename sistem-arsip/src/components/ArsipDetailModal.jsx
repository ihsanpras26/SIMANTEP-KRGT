import React from 'react';
import { X, FileText, Calendar, Tag, Download, Eye, Clock, CheckCircle, AlertCircle, Folder, User, Send, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ArsipDetailModal({ arsip, onClose, klasifikasiList = [] }) {
  if (!arsip) return null;

  const klasifikasi = klasifikasiList.find(k => k.kode === arsip.kodeKlasifikasi);
  const isActive = new Date(arsip.tanggalRetensi) > new Date();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 md:px-10 py-6 border-b border-neutral-100 flex justify-between items-start bg-white sticky top-0 z-10">
            <div className="flex-1 pr-8">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {isActive ? <CheckCircle size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                  {isActive ? 'Aktif' : 'Inaktif'}
                </span>
                <span className="text-neutral-500 text-xs font-mono px-2.5 py-1 bg-neutral-100 rounded-full">
                  {arsip.nomorArsip}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-neutral-900 leading-tight">
                {arsip.perihal}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              
              {/* Left Column: Main Info */}
              <div className="md:col-span-7 space-y-8">
                {/* File Preview Placeholder */}
                <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{arsip.nomorSurat || 'Tanpa Nomor'}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Dokumen Arsip Digital</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    Informasi Detail
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Nomor Surat</label>
                        <p className="text-neutral-900 font-medium text-base">{arsip.nomorSurat || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Tanggal Surat</label>
                        <div className="flex items-center gap-2 text-neutral-900">
                          <Calendar size={16} className="text-neutral-400" />
                          <span className="font-medium text-base">{formatDate(arsip.tanggalSurat)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Klasifikasi</label>
                      <div className="bg-white border border-neutral-200 rounded-xl p-3 flex items-start gap-3">
                        <div className="bg-primary-50 text-primary-700 font-mono font-bold px-2 py-1 rounded text-sm">
                          {arsip.kodeKlasifikasi}
                        </div>
                        {klasifikasi && (
                          <p className="text-sm text-neutral-700 leading-relaxed pt-0.5">
                            {klasifikasi.deskripsi}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Pengirim</label>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-neutral-400" />
                          <p className="text-neutral-900 font-medium">{arsip.pengirim || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5 block">Tujuan</label>
                        <div className="flex items-center gap-2">
                          <Send size={16} className="text-neutral-400" />
                          <p className="text-neutral-900 font-medium">{arsip.tujuanSurat || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {arsip.deskripsi && (
                  <div className="pt-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Keterangan</label>
                    <p className="text-neutral-700 text-sm leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                      {arsip.deskripsi}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Actions & Meta */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-xl shadow-neutral-200/50">
                  <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    Aksi Dokumen
                  </h3>
                  <div className="space-y-3">
                    {(arsip.googleDriveLink || arsip.filePath) ? (
                      <>
                        <button
                          onClick={() => {
                            if (arsip.googleDriveLink) {
                              window.open(arsip.googleDriveLink, '_blank');
                            } else if (arsip.filePath) {
                              window.open(`${supabaseUrl}/storage/v1/object/public/arsip-files/${arsip.filePath}`, '_blank');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white text-neutral-900 rounded-xl hover:bg-neutral-100 transition-all font-bold"
                        >
                          <Eye size={18} />
                          Preview File
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
                            } catch (error) {
                              console.error('Download failed', error);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl hover:bg-neutral-700 transition-all font-medium"
                        >
                          <Download size={18} />
                          Download
                        </button>
                      </>
                    ) : (
                      <div className="p-4 bg-neutral-800 rounded-xl text-center text-neutral-400 text-sm">
                        File tidak tersedia
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    Masa Retensi
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {isActive ? 'Masih Berlaku' : 'Sudah Berakhir'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {isActive 
                            ? 'Dokumen ini masih dalam masa penyimpanan aktif.' 
                            : 'Dokumen ini telah melewati masa retensi dan dapat dipindahkan ke inaktif.'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-neutral-100">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">Tanggal Berakhir</label>
                      <p className="text-neutral-900 font-medium">{formatDate(arsip.tanggalRetensi)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
