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
  Check,
  ChevronDown,
  Sparkles,
  Users,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AutocompleteInput from './AutocompleteInput';
import SearchableSelect from './SearchableSelect';
import { cn } from '../utils/cn';
import LabelBadge from './LabelBadge';

import { useArsip } from '../hooks/useArsip';
import { useKlasifikasi } from '../hooks/useKlasifikasi';
import { useLabels } from '../hooks/useLabels';

export default function ArsipForm({
  supabase,
  arsipToEdit,
  onFinish,
  showNotification
}) {
  // Fetch ALL data for autocomplete suggestions
  const { data: arsipData } = useArsip({ page: 'all', pageSize: 10000 });
  const { data: klasifikasiData } = useKlasifikasi();
  const { data: labelsData } = useLabels();

  const arsipList = arsipData?.data || [];
  const klasifikasiList = klasifikasiData || [];
  const labels = labelsData || [];

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
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState(null);

  const [errors, setErrors] = useState({});
  const labelDropdownRef = useRef(null);

  // Auto-detection helper functions
  const parseNomorSurat = (nomorSurat) => {
    if (!nomorSurat || !nomorSurat.trim()) return null;

    // Split by / and get parts
    const parts = nomorSurat.split('/').map(p => p.trim());

    if (parts.length === 0) return null;

    // Extract kode klasifikasi (first part)
    const kodeKlasifikasi = parts[0].toUpperCase();

    return {
      kodeKlasifikasi,
      nomorAgenda: parts[1] || null,
      nomorInstansi: parts[2] || null
    };
  };

  const findMatchingKlasifikasi = (kode) => {
    if (!kode || klasifikasiList.length === 0) return null;

    // 1. Exact match (case-insensitive)
    const exactMatch = klasifikasiList.find(
      k => k.kode.toUpperCase() === kode
    );
    if (exactMatch) return exactMatch;

    // 2. Prefix match
    const prefixMatch = klasifikasiList.find(
      k => k.kode.toUpperCase().startsWith(kode)
    );
    if (prefixMatch) return prefixMatch;

    // 3. Contains match
    const containsMatch = klasifikasiList.find(
      k => k.kode.toUpperCase().includes(kode)
    );

    return containsMatch || null;
  };

  const handleNomorSuratChange = (value) => {
    setFormData(prev => ({ ...prev, nomorSurat: value }));

    // Parse nomor surat
    const parsed = parseNomorSurat(value);

    if (parsed && parsed.kodeKlasifikasi) {
      // Find matching klasifikasi
      const match = findMatchingKlasifikasi(parsed.kodeKlasifikasi);

      if (match) {
        // Auto-fill kode klasifikasi (silent - no toast)
        setFormData(prev => ({
          ...prev,
          kodeKlasifikasi: match.kode
        }));

        setAutoDetected(true);
        setDetectedInfo({
          kode: match.kode,
          deskripsi: match.deskripsi
        });
      } else {
        setAutoDetected(false);
        setDetectedInfo(null);
      }
    } else {
      setAutoDetected(false);
      setDetectedInfo(null);
    }
  };

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

      if (arsipToEdit.tujuanSurat) {
        setTujuanList(arsipToEdit.tujuanSurat.split('; ').filter(Boolean));
      }

      // Initialize labels
      if (arsipToEdit.arsip_labels) {
        const ids = arsipToEdit.arsip_labels.map(al => al.labels?.id).filter(Boolean);
        setSelectedLabelIds(ids);
      }

      // Show additional details if any optional field has data
      if (arsipToEdit.pengirim || arsipToEdit.tujuanSurat || arsipToEdit.googleDriveLink) {
        setShowAdditionalDetails(true);
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

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-add pending tujuan input if list is empty
    let finalTujuanList = [...tujuanList];
    if (finalTujuanList.length === 0 && tujuanInput.trim()) {
      finalTujuanList.push(tujuanInput.trim());
    }

    // Validation
    const newErrors = {};
    if (!formData.perihal) newErrors.perihal = 'Perihal wajib diisi';
    if (!formData.kodeKlasifikasi) newErrors.kodeKlasifikasi = 'Kode klasifikasi wajib dipilih';
    if (!formData.tanggalSurat) newErrors.tanggalSurat = 'Tanggal surat wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    // Check for duplicate nomorSurat if provided
    if (formData.nomorSurat) {
      let query = supabase
        .from('arsip')
        .select('id')
        .eq('nomorSurat', formData.nomorSurat);

      if (arsipToEdit) {
        query = query.neq('id', arsipToEdit.id);
      }

      const { data: duplicate } = await query.maybeSingle();

      if (duplicate) {
        toast.error(`Nomor Surat "${formData.nomorSurat}" sudah terdaftar!`);
        return;
      }
    }

    setLoading(true);
    try {
      // Calculate retention date
      const suratDate = new Date(formData.tanggalSurat);
      const retensiDate = new Date(suratDate);
      retensiDate.setFullYear(retensiDate.getFullYear() + 5);

      const payload = {
        ...formData,
        tujuanSurat: finalTujuanList.join('; '),
        tanggalRetensi: retensiDate.toISOString()
      };

      // Remove invalid columns if they exist in formData (defensive)
      delete payload.keterangan;

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
        if (arsipToEdit) {
          await supabase.from('arsip_labels').delete().eq('arsip_id', arsipId);
        }

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
      e.stopPropagation();
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
  const allTujuan = arsipList.flatMap(a => {
    const val = a.tujuanSurat || a.tujuan;
    return val ? val.split('; ') : [];
  }).filter(Boolean);
  const tujuanSuggestions = [...new Set(allTujuan)];

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Primary Information */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Informasi Utama</h3>
              <p className="text-xs text-neutral-500">Data pokok arsip yang wajib diisi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nomor Surat - Full width with auto-detect */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Nomor Surat
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-3 text-neutral-400 z-10" />
                <AutocompleteInput
                  suggestions={nomorSuratSuggestions}
                  value={formData.nomorSurat}
                  onChange={handleNomorSuratChange}
                  placeholder="800.1.11.1/1221/310"
                  className={cn(
                    "pl-9 w-full",
                    errors.nomorSurat && "border-danger-500 focus:ring-danger-200"
                  )}
                />
              </div>
              {detectedInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200"
                >
                  <Sparkles size={14} />
                  <span className="font-medium">
                    Kode klasifikasi terdeteksi: {detectedInfo.kode} - {detectedInfo.deskripsi}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Tanggal Surat */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
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

            {/* Kode Klasifikasi */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Kode Klasifikasi <span className="text-danger-500">*</span>
              </label>
              <SearchableSelect
                placeholder="Cari kode atau deskripsi..."
                options={klasifikasiList.map(k => ({
                  value: k.kode,
                  label: `${k.kode} - ${k.deskripsi}`
                }))}
                value={formData.kodeKlasifikasi}
                onChange={(val) => {
                  setFormData({ ...formData, kodeKlasifikasi: val });
                  setAutoDetected(false);
                }}
                className={errors.kodeKlasifikasi ? "border-danger-500" : ""}
              />
              {autoDetected && (
                <p className="text-xs text-neutral-500 mt-1.5 flex items-center gap-1">
                  <Sparkles size={12} />
                  Terdeteksi otomatis dari nomor surat
                </p>
              )}
              {errors.kodeKlasifikasi && <p className="text-xs text-danger-500 mt-1">{errors.kodeKlasifikasi}</p>}
            </div>

            {/* Perihal - Full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
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
          </div>
        </div>

        {/* Section 2: Label & Kategori */}
        <div className="bg-gradient-to-br from-neutral-50 to-white rounded-2xl border border-neutral-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Tag size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Label & Kategori</h3>
              <p className="text-xs text-neutral-500">Tambahkan label untuk memudahkan pencarian (opsional)</p>
            </div>
          </div>

          <div className="relative" ref={labelDropdownRef}>
            <div className="flex flex-wrap gap-2 items-center min-h-[38px]">
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 border border-neutral-200 border-dashed transition-colors"
                >
                  <Plus size={14} />
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

        {/* Section 3: Additional Details (Collapsible) */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
            className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-bold text-neutral-900">Detail Tambahan</h3>
                <p className="text-xs text-neutral-500">Informasi opsional (pengirim, tujuan, dll)</p>
              </div>
            </div>
            <ChevronDown
              size={20}
              className={cn(
                "text-neutral-400 transition-transform",
                showAdditionalDetails && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showAdditionalDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 space-y-6 border-t border-neutral-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pengirim */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Pengirim
                      </label>
                      <AutocompleteInput
                        suggestions={pengirimSuggestions}
                        value={formData.pengirim}
                        onChange={(val) => setFormData({ ...formData, pengirim: val })}
                        placeholder="Contoh: Dinas Lingkungan Hidup"
                        className="w-full"
                      />
                    </div>

                    {/* Tujuan Surat */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Tujuan Surat
                      </label>
                      <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 transition-all px-3 py-2 flex flex-wrap gap-2 min-h-[42px]">
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
                            placeholder={tujuanList.length === 0 ? "Contoh: Kepala Dinas Perhubungan" : ""}
                            className="!border-none !ring-0 !outline-none !shadow-none !p-0 !bg-transparent w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Drive Link - Full width */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
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
                    <p className="text-xs text-neutral-500 mt-1.5">
                      Pastikan link dapat diakses (Public atau Shared)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons - Sticky */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-6 -mx-6 flex gap-3 shadow-lg rounded-t-2xl">
          <button
            type="button"
            onClick={onFinish}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-white border-2 border-neutral-200 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
      </form >
    </div >
  );
}
