import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  X,
  Loader2,
  Link as LinkIcon,
  FileText,
  Hash,
  Calendar,
  Tag,
  Plus,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AutocompleteInput from './AutocompleteInput';
import SearchableSelect from './SearchableSelect';
import { cn } from '../utils/cn';
import LabelBadge from './LabelBadge';

export default function ArsipForm({
  supabase,
  arsipToEdit,
  onFinish,
  showNotification,
  arsipList,
  klasifikasiList,
  labels = [] // New prop
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomorSurat: '',
    perihal: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    kodeKlasifikasi: '',
    pengirim: '',
    googleDriveLink: ''
  });
  const [tujuanList, setTujuanList] = useState([]);
  const [tujuanInput, setTujuanInput] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState([]); // Array of IDs
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');

  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);

  const labelDropdownRef = useRef(null);

  // Initialize form if editing
  useEffect(() => {
    if (arsipToEdit) {
      setFormData({
        nomorSurat: arsipToEdit.nomorSurat || '',
        perihal: arsipToEdit.perihal || '',
        tanggalSurat: arsipToEdit.tanggalSurat ? arsipToEdit.tanggalSurat.split('T')[0] : new Date().toISOString().split('T')[0],
        kodeKlasifikasi: arsipToEdit.kodeKlasifikasi || '',
        pengirim: arsipToEdit.pengirim || '',
        googleDriveLink: arsipToEdit.googleDriveLink || ''
      });
      if (arsipToEdit.tujuan) {
        setTujuanList(arsipToEdit.tujuan.split('; ').filter(Boolean));
      }
      // Initialize labels
      if (arsipToEdit.arsip_labels) {
        const ids = arsipToEdit.arsip_labels.map(al => al.labels?.id).filter(Boolean);
        setSelectedLabelIds(ids);
      }
    }
  }, [arsipToEdit]);

  // Click outside to close label dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(event.target)) {
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.nomorSurat) newErrors.nomorSurat = 'Nomor surat wajib diisi';
    if (!formData.perihal) newErrors.perihal = 'Perihal wajib diisi';
    if (!formData.kodeKlasifikasi) newErrors.kodeKlasifikasi = 'Kode klasifikasi wajib dipilih';
    if (!formData.tanggalSurat) newErrors.tanggalSurat = 'Tanggal surat wajib diisi';
    if (!formData.pengirim) newErrors.pengirim = 'Pengirim wajib diisi';
    if (tujuanList.length === 0) newErrors.tujuan = 'Tujuan surat wajib diisi';

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
        tujuan: tujuanList.join('; '),
        tanggalRetensi: retensiDate.toISOString(),
        updated_at: new Date().toISOString()
      };

      let arsipId;

      if (arsipToEdit) {
        arsipId = arsipToEdit.id;
        const { error } = await supabase
          .from('arsip')
          .update(payload)
          .eq('id', arsipId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('arsip')
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        arsipId = data.id;
      }

      // Handle Labels
      if (arsipId) {
        // First delete existing links (simple strategy)
        if (arsipToEdit) {
          await supabase.from('arsip_labels').delete().eq('arsip_id', arsipId);
        }

        // Insert new links
        if (selectedLabelIds.length > 0) {
          const labelInserts = selectedLabelIds.map(labelId => ({
            arsip_id: arsipId,
            label_id: labelId
          }));
          const { error: labelError } = await supabase.from('arsip_labels').insert(labelInserts);
          if (labelError) throw labelError;
        }
      }

      toast.success(arsipToEdit ? 'Arsip berhasil diperbarui' : 'Arsip baru berhasil ditambahkan');
      onFinish();
    } catch (error) {
      console.error('Error saving arsip:', error);
      toast.error(`Gagal menyimpan arsip: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Tujuan Chips
  const handleAddTujuan = (val) => {
    const trimmed = val.trim();
    if (trimmed && !tujuanList.includes(trimmed)) {
      setTujuanList([...tujuanList, trimmed]);
      setTujuanInput('');
    }
  };

  const handleRemoveTujuan = (index) => {
    setTujuanList(tujuanList.filter((_, i) => i !== index));
  };

  const handleTujuanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTujuan(tujuanInput);
    } else if (e.key === 'Backspace' && !tujuanInput && tujuanList.length > 0) {
      handleRemoveTujuan(tujuanList.length - 1);
    }
  };

  // Label Handlers
  const toggleLabel = (id) => {
    if (selectedLabelIds.includes(id)) {
      setSelectedLabelIds(prev => prev.filter(lId => lId !== id));
    } else {
      setSelectedLabelIds(prev => [...prev, id]);
      setShowLabelDropdown(false);
      setLabelSearch('');
    }
  };

  const filteredLabels = labels.filter(l =>
    l.name.toLowerCase().includes(labelSearch.toLowerCase()) &&
    !selectedLabelIds.includes(l.id)
  );

  // Autocomplete Data Sources
  const nomorSuratSuggestions = [...new Set(arsipList.map(a => a.nomorSurat))];
  const perihalSuggestions = [...new Set(arsipList.map(a => a.perihal))];
  const pengirimSuggestions = [...new Set(arsipList.map(a => a.pengirim).filter(Boolean))];
  const allTujuan = arsipList.flatMap(a => a.tujuan ? a.tujuan.split('; ') : []).filter(Boolean);
  const tujuanSuggestions = [...new Set(allTujuan)];

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-neutral-100 space-y-6 md:space-y-8">
        {/* Section 1: Detail Informasi Surat */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText size={24} className="text-primary-500" />
            Detail Informasi Surat
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Nomor Surat <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3 text-neutral-400" />
                <AutocompleteInput
                  suggestions={nomorSuratSuggestions}
                  value={formData.nomorSurat}
                  onChange={(val) => setFormData({ ...formData, nomorSurat: val })}
                  placeholder="Contoh: 000.1/xxx/310"
                  className={cn(
                    "pl-9 w-full",
                    errors.nomorSurat && "border-danger-500 focus:ring-danger-200"
                  )}
                />
              </div>
              {errors.nomorSurat && <p className="text-xs text-danger-500 mt-1">{errors.nomorSurat}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Tanggal Surat <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="date"
                  value={formData.tanggalSurat}
                  onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                  className={cn(
                    "pl-9 w-full px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none",
                    errors.tanggalSurat && "border-danger-500 focus:ring-danger-200"
                  )}
                />
              </div>
              {errors.tanggalSurat && <p className="text-xs text-danger-500 mt-1">{errors.tanggalSurat}</p>}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Pengirim <span className="text-danger-500">*</span>
                </label>
                <AutocompleteInput
                  suggestions={pengirimSuggestions}
                  value={formData.pengirim}
                  onChange={(val) => setFormData({ ...formData, pengirim: val })}
                  placeholder="Contoh: Dinas Lingkungan Hidup Kota Magelang"
                  className={cn(
                    "w-full",
                    errors.pengirim && "border-danger-500 focus:ring-danger-200"
                  )}
                />
                {errors.pengirim && <p className="text-xs text-danger-500 mt-1">{errors.pengirim}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Tujuan Surat <span className="text-danger-500">*</span>
                </label>
                <div className={cn(
                  "w-full bg-neutral-50 border border-neutral-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 transition-all px-3 py-2 flex flex-wrap gap-2 min-h-[42px]",
                  errors.tujuan && "border-danger-500 focus-within:ring-danger-200"
                )}>
                  <AnimatePresence>
                    {tujuanList.map((tujuan, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white border border-neutral-200 text-neutral-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1 shadow-sm"
                      >
                        {tujuan}
                        <button
                          type="button"
                          onClick={() => handleRemoveTujuan(index)}
                          className="text-neutral-400 hover:text-danger-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <div className="flex-1 min-w-[150px]">
                    <AutocompleteInput
                      suggestions={tujuanSuggestions}
                      value={tujuanInput}
                      onChange={setTujuanInput}
                      onSelect={handleAddTujuan}
                      onKeyDown={handleTujuanKeyDown}
                      placeholder={tujuanList.length === 0 ? "Contoh: Kepala Dinas Perhubungan Kota Magelang" : ""}
                      className="!border-none !ring-0 !outline-none !shadow-none !p-0 !bg-transparent w-full h-full"
                    />
                  </div>
                </div>
                {errors.tujuan && <p className="text-xs text-danger-500 mt-1">{errors.tujuan}</p>}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Kode Klasifikasi <span className="text-danger-500">*</span>
              </label>
              <SearchableSelect
                placeholder="Cari kode atau deskripsi..."
                options={klasifikasiList.map(k => ({
                  value: k.kode,
                  label: `${k.kode} - ${k.deskripsi}`
                }))}
                value={formData.kodeKlasifikasi}
                onChange={(val) => setFormData({ ...formData, kodeKlasifikasi: val })}
                className={errors.kodeKlasifikasi ? "border-danger-500" : ""}
              />
              {errors.kodeKlasifikasi && <p className="text-xs text-danger-500 mt-1">{errors.kodeKlasifikasi}</p>}
            </div>

            {/* Labels Section */}
            <div className="md:col-span-2 relative" ref={labelDropdownRef}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Label (Opsional)
              </label>

              <div className="flex flex-wrap gap-2 items-center min-h-[38px] p-1">
                {selectedLabelIds.map(id => {
                  const label = labels.find(l => l.id === id);
                  if (!label) return null;
                  return (
                    <LabelBadge
                      key={id}
                      label={label}
                      showDelete={true}
                      onDelete={() => toggleLabel(id)}
                    />
                  );
                })}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 border border-neutral-200 border-dashed transition-colors"
                  >
                    <Plus size={12} />
                    Tambah Label
                  </button>

                  <AnimatePresence>
                    {showLabelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-100 rounded-xl shadow-lg z-50 overflow-hidden"
                      >
                        <div className="p-2 border-b border-neutral-50">
                          <input
                            type="text"
                            value={labelSearch}
                            onChange={(e) => setLabelSearch(e.target.value)}
                            placeholder="Cari label..."
                            className="w-full px-2 py-1 text-sm bg-neutral-50 rounded-md outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                          {filteredLabels.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-neutral-400 text-center">
                              {labelSearch ? 'Tidak ada label ditemukan' : 'Semua label sudah dipilih'}
                            </div>
                          ) : (
                            filteredLabels.map(label => (
                              <button
                                key={label.id}
                                type="button"
                                onClick={() => toggleLabel(label.id)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-2 group transition-colors"
                              >
                                <LabelBadge label={label} size="sm" />
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-neutral-100" />

        {/* Section 2: Link Dokumen */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <LinkIcon size={24} className="text-primary-500" />
            Link Dokumen
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Link Google Drive
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="url"
                  value={formData.googleDriveLink}
                  onChange={(e) => setFormData({ ...formData, googleDriveLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-9 px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Pastikan link dapat diakses (Public atau Shared).
              </p>
            </div>

            {formData.googleDriveLink && (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                  <LinkIcon size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-primary-900">Link Terlampir</p>
                  <a
                    href={formData.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline mt-1 block truncate"
                  >
                    {formData.googleDriveLink}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, googleDriveLink: '' })}
                  className="text-primary-400 hover:text-danger-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-100">
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
      </form>
    </div>
  );
}
