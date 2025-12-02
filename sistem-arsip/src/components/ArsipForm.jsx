import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  X, 
  Upload, 
  FileText, 
  Calendar, 
  Tag, 
  Hash, 
  AlignLeft, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AutocompleteInput from './AutocompleteInput';
import GoogleDriveUpload from './GoogleDriveUpload';
import { cn } from '../utils/cn';

export default function ArsipForm({ 
  supabase, 
  arsipToEdit, 
  onFinish, 
  showNotification,
  arsipList,
  klasifikasiList
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomorSurat: '',
    perihal: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    kodeKlasifikasi: '',
    deskripsi: '',
    fileUrl: '',
    fileType: '',
    fileName: ''
  });
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize form if editing
  useEffect(() => {
    if (arsipToEdit) {
      setFormData({
        nomorSurat: arsipToEdit.nomorSurat || '',
        perihal: arsipToEdit.perihal || '',
        tanggalSurat: arsipToEdit.tanggalSurat ? arsipToEdit.tanggalSurat.split('T')[0] : new Date().toISOString().split('T')[0],
        kodeKlasifikasi: arsipToEdit.kodeKlasifikasi || '',
        deskripsi: arsipToEdit.deskripsi || '',
        fileUrl: arsipToEdit.fileUrl || '',
        fileType: arsipToEdit.fileType || '',
        fileName: arsipToEdit.fileName || ''
      });
    }
  }, [arsipToEdit]);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.nomorSurat) newErrors.nomorSurat = 'Nomor surat wajib diisi';
    if (!formData.perihal) newErrors.perihal = 'Perihal wajib diisi';
    if (!formData.kodeKlasifikasi) newErrors.kodeKlasifikasi = 'Kode klasifikasi wajib dipilih';
    if (!formData.tanggalSurat) newErrors.tanggalSurat = 'Tanggal surat wajib diisi';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    setLoading(true);
    try {
      // Calculate retention date (e.g., 5 years from letter date)
      const suratDate = new Date(formData.tanggalSurat);
      const retensiDate = new Date(suratDate);
      retensiDate.setFullYear(retensiDate.getFullYear() + 5); // Default 5 years

      const payload = {
        ...formData,
        tanggalRetensi: retensiDate.toISOString(),
        updated_at: new Date().toISOString()
      };

      if (arsipToEdit) {
        const { error } = await supabase
          .from('arsip')
          .update(payload)
          .eq('id', arsipToEdit.id);
        if (error) throw error;
        toast.success('Arsip berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('arsip')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (error) throw error;
        toast.success('Arsip baru berhasil ditambahkan');
      }
      onFinish();
    } catch (error) {
      console.error('Error saving arsip:', error);
      toast.error(`Gagal menyimpan arsip: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete Data Sources
  const nomorSuratSuggestions = [...new Set(arsipList.map(a => a.nomorSurat))];
  const perihalSuggestions = [...new Set(arsipList.map(a => a.perihal))];
  const klasifikasiSuggestions = klasifikasiList.map(k => `${k.kode} - ${k.nama}`);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-neutral-900">
            {arsipToEdit ? 'Edit Arsip' : 'Tambah Arsip Baru'}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            Lengkapi formulir di bawah ini untuk menyimpan arsip digital.
          </p>
        </div>
        <button
          onClick={onFinish}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Identitas Surat */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-500" />
              Identitas Surat
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nomor Surat <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-3 text-neutral-400" />
                    <AutocompleteInput
                      suggestions={nomorSuratSuggestions}
                      value={formData.nomorSurat}
                      onChange={(val) => setFormData({ ...formData, nomorSurat: val })}
                      placeholder="Contoh: 005/KRGT/2024"
                      className={cn(
                        "pl-10 w-full",
                        errors.nomorSurat && "border-danger-500 focus:ring-danger-200"
                      )}
                    />
                  </div>
                  {errors.nomorSurat && <p className="text-xs text-danger-500 mt-1">{errors.nomorSurat}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tanggal Surat <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="date"
                      value={formData.tanggalSurat}
                      onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                      className={cn(
                        "pl-10 w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none",
                        errors.tanggalSurat && "border-danger-500 focus:ring-danger-200"
                      )}
                    />
                  </div>
                  {errors.tanggalSurat && <p className="text-xs text-danger-500 mt-1">{errors.tanggalSurat}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Perihal <span className="text-danger-500">*</span>
                </label>
                <AutocompleteInput
                  suggestions={perihalSuggestions}
                  value={formData.perihal}
                  onChange={(val) => setFormData({ ...formData, perihal: val })}
                  placeholder="Contoh: Undangan Rapat Koordinasi"
                  className={cn(
                    "w-full",
                    errors.perihal && "border-danger-500 focus:ring-danger-200"
                  )}
                />
                {errors.perihal && <p className="text-xs text-danger-500 mt-1">{errors.perihal}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Kode Klasifikasi <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-3 text-neutral-400" />
                  <select
                    value={formData.kodeKlasifikasi}
                    onChange={(e) => setFormData({ ...formData, kodeKlasifikasi: e.target.value })}
                    className={cn(
                      "pl-10 w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none appearance-none",
                      errors.kodeKlasifikasi && "border-danger-500 focus:ring-danger-200"
                    )}
                  >
                    <option value="">Pilih Klasifikasi...</option>
                    {klasifikasiList.map(k => (
                      <option key={k.id} value={k.kode}>{k.kode} - {k.nama}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <AlignLeft size={16} className="text-neutral-400" />
                  </div>
                </div>
                {errors.kodeKlasifikasi && <p className="text-xs text-danger-500 mt-1">{errors.kodeKlasifikasi}</p>}
              </div>
            </div>
          </div>

          {/* Card 2: Deskripsi */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <AlignLeft size={20} className="text-secondary-500" />
              Detail Tambahan
            </h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Deskripsi / Ringkasan
              </label>
              <textarea
                rows={4}
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Tambahkan catatan atau ringkasan isi surat..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: File Upload */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Upload size={20} className="text-primary-500" />
              Upload Dokumen
            </h3>
            
            <div className="flex-1">
              <GoogleDriveUpload 
                onFileUploaded={(fileData) => {
                  setFormData({ 
                    ...formData, 
                    fileUrl: fileData.webViewLink, 
                    fileType: fileData.type, 
                    fileName: fileData.name 
                  });
                  toast.success('File berhasil diupload!');
                }}
                existingFile={formData.fileUrl ? { name: formData.fileName, webViewLink: formData.fileUrl } : null}
              />
            </div>

            {formData.fileUrl && (
              <div className="mt-4 p-4 bg-success-50 rounded-xl border border-success-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-success-600">
                  {formData.fileType?.includes('image') ? <ImageIcon size={20} /> : <File size={20} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-success-900 truncate">{formData.fileName || 'Dokumen Terlampir'}</p>
                  <a 
                    href={formData.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-success-600 hover:underline mt-1 inline-block"
                  >
                    Lihat File
                  </a>
                </div>
                <button 
                  onClick={() => setFormData({ ...formData, fileUrl: '', fileType: '', fileName: '' })}
                  className="text-success-400 hover:text-danger-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onFinish}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-white border border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Simpan Arsip
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
