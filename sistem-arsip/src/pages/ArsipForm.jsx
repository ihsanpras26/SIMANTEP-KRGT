import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    CheckCircle, AlertCircle, Upload, X, FileText, Link, Calendar, User, Hash, AlignLeft,
    Save, ArrowRight, ArrowLeft, Paperclip, ChevronRight, Download, Eye
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import InputField from '../InputField';
import AutocompleteInput from '../components/AutocompleteInput';
import GoogleDriveUpload from '../components/GoogleDriveUpload';
import { parseGoogleDriveLink, isValidGoogleDriveLink } from '../utils/googleDriveUtils';
import { useAutoSave } from '../hooks/useAutoSave';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const ArsipForm = ({ supabase, arsipToEdit, onFinish }) => {
    const {
        arsipList,
        klasifikasiList,
        addArsipOptimistic,
        confirmArsipOptimistic,
        rollbackArsipOptimistic,
        updateArsipOptimistic,
        confirmArsipUpdate,
        rollbackArsipUpdate
    } = useAppStore();

    const [formData, setFormData] = useState({
        nomorSurat: '',
        tanggalSurat: '',
        pengirim: '',
        tujuanSurat: '',
        perihal: '',
        kodeKlasifikasi: '',
        googleDriveLink: '',
    });
    const [googleDriveInfo, setGoogleDriveInfo] = useState({
        fileId: '',
        viewLink: '',
        downloadLink: ''
    });
    const [manualKodeInput, setManualKodeInput] = useState('');
    const [useManualKode, setUseManualKode] = useState(false);
    const [existingFile, setExistingFile] = useState({ fileName: '', filePath: '' });
    const [googleDriveFile, setGoogleDriveFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState({});

    // Ref for debouncing classification detection toast
    const klasifikasiToastTimeoutRef = useRef(null);
    const pendingKlasifikasiRef = useRef(null);

    // Auto-save hook for draft persistence
    const { clearDraft } = useAutoSave(
        'arsip_form',
        formData,
        setFormData,
        !!arsipToEdit,
        3000
    );

    // Autocomplete function for this form
    const getAutocompleteSuggestions = useCallback((fieldName, query) => {
        if (!query || query.length < 2 || !arsipList) return [];

        const uniqueValues = new Set();
        arsipList.forEach(arsip => {
            const value = arsip[fieldName];
            if (value && value.toLowerCase().includes(query.toLowerCase())) {
                uniqueValues.add(value);
            }
        });

        return Array.from(uniqueValues)
            .sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const queryLower = query.toLowerCase();

                if (aLower === queryLower) return -1;
                if (bLower === queryLower) return 1;
                if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
                if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
                return a.localeCompare(b);
            })
            .slice(0, 8);
    }, [arsipList]);

    useEffect(() => {
        if (arsipToEdit) {
            setFormData({
                nomorSurat: arsipToEdit.nomorSurat || '',
                tanggalSurat: arsipToEdit.tanggalSurat ? new Date(arsipToEdit.tanggalSurat).toISOString().split('T')[0] : '',
                pengirim: arsipToEdit.pengirim || '',
                tujuanSurat: arsipToEdit.tujuanSurat || '',
                perihal: arsipToEdit.perihal || '',
                kodeKlasifikasi: arsipToEdit.kodeKlasifikasi || '',
                googleDriveLink: arsipToEdit.googleDriveLink || '',
            });
            setExistingFile({ fileName: arsipToEdit.fileName, filePath: arsipToEdit.filePath });

            // Set Google Drive file if exists
            if (arsipToEdit.googleDriveFileId) {
                setGoogleDriveFile({
                    id: arsipToEdit.googleDriveFileId,
                    name: arsipToEdit.fileName,
                    webViewLink: arsipToEdit.googleDriveViewLink,
                    downloadLink: arsipToEdit.googleDriveLink
                });
            }

            // Process existing Google Drive link to extract info
            if (arsipToEdit.googleDriveLink && isValidGoogleDriveLink(arsipToEdit.googleDriveLink)) {
                const driveInfo = parseGoogleDriveLink(arsipToEdit.googleDriveLink);
                if (driveInfo && driveInfo.success) {
                    setGoogleDriveInfo({
                        fileId: driveInfo.fileId || '',
                        viewLink: driveInfo.links?.viewLink || '',
                        downloadLink: driveInfo.links?.downloadLink || ''
                    });
                }
            }

            // Cek apakah kode klasifikasi ada di daftar atau manual
            if (arsipToEdit.kodeKlasifikasi) {
                const existsInList = klasifikasiList.find(k => k.kode === arsipToEdit.kodeKlasifikasi);
                if (!existsInList) {
                    setUseManualKode(true);
                    setManualKodeInput(arsipToEdit.kodeKlasifikasi);
                }
            }
        }
    }, [arsipToEdit, klasifikasiList]);

    // Fungsi untuk mengidentifikasi kode klasifikasi dari nomor surat
    const identifyKlasifikasiFromNomor = (nomorSurat) => {
        if (!nomorSurat || !klasifikasiList || klasifikasiList.length === 0) return null;

        // Format nomor: (kode klasifikasi)/(nomor agenda)/(nomor instansi)
        // Hanya ambil segmen pertama sebelum '/'
        const firstSegment = String(nomorSurat).split('/')[0] || '';

        // Cari pola kode klasifikasi pada segmen pertama saja (contoh: 001.1, 002.3.1, dst)
        const kodePattern = /\b(\d{3}(?:\.\d+)*)\b/g;
        const matches = firstSegment.match(kodePattern);

        if (matches && matches.length > 0) {
            // Cari kode yang paling cocok dengan klasifikasi yang ada
            for (const match of matches) {
                const foundKlasifikasi = klasifikasiList.find(k => k && k.kode === match);
                if (foundKlasifikasi) {
                    return match;
                }

                // Coba cari kode parent jika kode lengkap tidak ditemukan
                const parts = match.split('.');
                for (let i = parts.length - 1; i > 0; i--) {
                    const parentKode = parts.slice(0, i).join('.');
                    const parentKlasifikasi = klasifikasiList.find(k => k && k.kode === parentKode);
                    if (parentKlasifikasi) {
                        return parentKode;
                    }
                }
            }
        }
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-identifikasi kode klasifikasi dari nomor surat (silent)
        if (name === 'nomorSurat' && !useManualKode) {
            const identifiedKode = identifyKlasifikasiFromNomor(value);
            if (identifiedKode && identifiedKode !== formData.kodeKlasifikasi) {
                setFormData(prev => ({ ...prev, kodeKlasifikasi: identifiedKode }));
            }
        }

        // Auto-ekstrak Google Drive file ID dan view link
        if (name === 'googleDriveLink') {
            const trimmedValue = (value || '').trim();
            if (trimmedValue) {
                const driveInfo = parseGoogleDriveLink(trimmedValue);
                if (driveInfo && driveInfo.success) {
                    setGoogleDriveInfo({
                        fileId: driveInfo.fileId || '',
                        viewLink: driveInfo.links?.viewLink || '',
                        downloadLink: driveInfo.links?.downloadLink || ''
                    });

                    // Normalisasi link ke format view yang konsisten
                    if (driveInfo.links?.viewLink && trimmedValue !== driveInfo.links.viewLink) {
                        setFormData(prev => ({ ...prev, googleDriveLink: driveInfo.links.viewLink }));
                        toast('Link Google Drive dinormalisasi ke format standar', { icon: 'ℹ️' });
                    }
                } else {
                    setGoogleDriveInfo({ fileId: '', viewLink: '', downloadLink: '' });
                }
            } else {
                // Reset Google Drive info jika link dikosongkan
                setGoogleDriveInfo({ fileId: '', viewLink: '', downloadLink: '' });
                // Clear validation errors for Google Drive link
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.googleDriveLink;
                    return newErrors;
                });
            }
        }
    };

    const handleGoogleDriveFileUploaded = (fileData) => {
        if (fileData && typeof fileData === 'object') {
            setGoogleDriveFile(fileData);
        }
    };

    const handleGoogleDriveFileRemoved = () => {
        setGoogleDriveFile(null);
    };

    const validateForm = () => {
        const errors = {};

        // Hanya tanggal surat dan perihal yang wajib diisi
        if (!formData?.tanggalSurat) errors.tanggalSurat = 'Tanggal surat wajib diisi';
        if (!formData?.perihal || !(formData.perihal || '').trim()) errors.perihal = 'Perihal / isi surat wajib diisi';

        // Validasi kode klasifikasi jika diisi (baik manual maupun dropdown)
        const kodeToValidate = useManualKode ? (manualKodeInput || '') : (formData?.kodeKlasifikasi || '');
        if (kodeToValidate && useManualKode) {
            // Validasi format kode manual (harus berupa angka dengan titik)
            const kodePattern = /^\d{3}(\.\d+)*$/;
            if (!kodePattern.test(kodeToValidate.trim())) {
                errors.kodeKlasifikasi = 'Format kode klasifikasi tidak valid (contoh: 001.1 atau 002.3.1)';
            }
        }

        // Validasi Google Drive link jika diisi
        const googleDriveLink = formData?.googleDriveLink || '';
        if (googleDriveLink.trim()) {
            const trimmedLink = googleDriveLink.trim();
            if (!isValidGoogleDriveLink(trimmedLink)) {
                errors.googleDriveLink = 'Link Google Drive tidak valid. Pastikan menggunakan link sharing yang benar.';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (validateForm()) {
            setCurrentStep(2);
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Mohon lengkapi semua field yang diperlukan");
            return;
        }

        setIsLoading(true);

        let fileData = {
            filePath: arsipToEdit?.filePath || null,
            fileName: arsipToEdit?.fileName || null,
        };

        // Handle Google Drive file upload only
        if (googleDriveFile) {
            // Use Google Drive file data
            fileData = {
                filePath: null, // No Supabase storage path for Google Drive files
                fileName: googleDriveFile.name,
                googleDriveFileId: googleDriveFile.id,
                googleDriveViewLink: googleDriveFile.webViewLink,
                googleDriveLink: googleDriveFile.downloadLink || googleDriveFile.webContentLink,
            };
        }

        // Tentukan kode klasifikasi yang akan digunakan
        const finalKodeKlasifikasi = useManualKode ? manualKodeInput : formData.kodeKlasifikasi;

        let selectedKlasifikasi = null;
        let retensiAktif = 5; // Default retensi 5 tahun jika tidak ada klasifikasi

        if (finalKodeKlasifikasi) {
            selectedKlasifikasi = klasifikasiList.find(k => k.kode === finalKodeKlasifikasi);
            if (selectedKlasifikasi) {
                retensiAktif = selectedKlasifikasi.retensiAktif;
            } else if (useManualKode) {
                // Jika menggunakan kode manual yang tidak ada di database, gunakan retensi default
                toast('Kode klasifikasi manual akan menggunakan retensi default 5 tahun', { icon: 'ℹ️' });
            }
        }
        const tglSurat = new Date(formData.tanggalSurat);
        if (isNaN(tglSurat.getTime())) {
            toast.error('Tanggal surat tidak valid.');
            setIsLoading(false);
            return;
        }
        const retensiDate = new Date(new Date(tglSurat).setFullYear(tglSurat.getFullYear() + Number(retensiAktif)));

        // Ensure all data is properly sanitized and validated
        const dataToSave = {
            nomorSurat: formData.nomorSurat?.trim() || null,
            tanggalSurat: tglSurat.toISOString(),
            pengirim: formData.pengirim?.trim() || null,
            tujuanSurat: formData.tujuanSurat?.trim() || null,
            perihal: formData.perihal?.trim() || '',
            kodeKlasifikasi: finalKodeKlasifikasi || null,
            tanggalRetensi: retensiDate.toISOString(),
            filePath: fileData.filePath,
            fileName: fileData.fileName,
            googleDriveFileId: (googleDriveInfo?.fileId || fileData.googleDriveFileId) || null,
            googleDriveViewLink: (googleDriveInfo?.viewLink || fileData.googleDriveViewLink) || null,
            googleDriveLink: formData.googleDriveLink?.trim() || null,
        };

        try {
            let tempId;
            const originalData = arsipToEdit ? { ...arsipToEdit } : null;

            if (arsipToEdit) {
                // Optimistic update for existing arsip
                updateArsipOptimistic(arsipToEdit.id, dataToSave);

                const { data, error } = await supabase.from('arsip').update(dataToSave).eq('id', arsipToEdit.id).select().single();
                if (error) {
                    rollbackArsipUpdate(arsipToEdit.id, originalData);
                    throw error;
                }
                confirmArsipUpdate(arsipToEdit.id, data);
                toast.success('Data arsip berhasil diperbarui!');
            } else {
                // Duplicate validation (server-side check) by nomorSurat OR perihal+tanggal
                try {
                    let dupQuery = supabase.from('arsip').select('id, perihal, tanggalSurat, nomorSurat');
                    if (dataToSave.nomorSurat) {
                        dupQuery = dupQuery.eq('nomorSurat', dataToSave.nomorSurat);
                    } else {
                        dupQuery = dupQuery.eq('perihal', dataToSave.perihal).eq('tanggalSurat', dataToSave.tanggalSurat);
                    }
                    const { data: dupData } = await dupQuery.limit(1);
                    if (dupData && dupData.length > 0) {
                        toast.error('Arsip duplikat terdeteksi (nomor surat atau perihal + tanggal).');
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    // abaikan, akan di-handle oleh unique constraint jika ada
                }

                // Optimistic insert for new arsip
                tempId = addArsipOptimistic(dataToSave);
                const { data, error } = await supabase.from('arsip').insert([dataToSave]).select().single();
                if (error) {
                    rollbackArsipOptimistic(tempId);
                    if (error.code === '23505') {
                        toast.error('Arsip duplikat terdeteksi (kombinasi data unik).');
                        return;
                    }
                    throw error;
                }
                confirmArsipOptimistic(tempId, data);
                toast.success('Data arsip berhasil disimpan!');
                clearDraft(); // Clear saved draft after successful save
            }
            onFinish();
        } catch (error) {
            console.error("Error saving document:", error);
            const errorMessage = error?.message || 'Terjadi kesalahan yang tidak diketahui';
            toast.error(`Gagal menyimpan data: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const groupedKlasifikasi = useMemo(() => {
        const sortedList = [...klasifikasiList].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
        // Ambil semua main code (3 digit pertama) dari seluruh item, termasuk yang tidak memiliki entri main 3 digit
        const mainCodes = Array.from(new Set(sortedList.map(k => k.kode.split('.')[0])))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        // Bentuk grup untuk setiap main code. Jika entri main 3 digit tidak ada, buat grup sintetis agar tetap muncul sebagai kategori
        const grouped = mainCodes.map(code => {
            const main = sortedList.find(k => k.kode === code) || null;
            const subItems = sortedList
                .filter(sub => sub.kode.startsWith(code + '.') && sub.kode.length > 3)
                .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
            if (main) {
                return { ...main, subItems };
            }
            return {
                id: `synthetic-${code}`,
                kode: code,
                deskripsi: '(Kategori utama belum terdaftar)',
                retensiAktif: '',
                retensiInaktif: '',
                subItems
            };
        });
        return grouped;
    }, [klasifikasiList]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-7xl mx-auto overflow-hidden">
            {/* Header dengan Progress */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6 text-white">
                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-6">
                    <div className={`flex items-center ${currentStep >= 1 ? 'text-white' : 'text-primary-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-white text-primary-600' : 'bg-primary-400'
                            }`}>
                            1
                        </div>
                        <span className="ml-2 text-sm font-medium">Informasi Dasar</span>
                    </div>
                    <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-white' : 'bg-primary-400'}`}></div>
                    <div className={`flex items-center ${currentStep >= 2 ? 'text-white' : 'text-primary-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-white text-primary-600' : 'bg-primary-400'
                            }`}>
                            2
                        </div>
                        <span className="ml-2 text-sm font-medium">Lampiran & Review</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6">
                {/* Step 1: Informasi Dasar */}
                {currentStep === 1 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                <FileText size={28} className="text-primary-600" />
                                Informasi Dasar Arsip
                            </h2>
                            <p className="text-gray-600 text-sm">Lengkapi informasi dasar dokumen arsip dengan teliti</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <InputField
                                    name="nomorSurat"
                                    label="Nomor Surat"
                                    value={formData.nomorSurat}
                                    onChange={handleChange}
                                    placeholder="Opsional - sistem akan mencoba mengidentifikasi kode klasifikasi"
                                />
                                {validationErrors.nomorSurat && (
                                    <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.nomorSurat}</p>
                                )}
                            </div>
                            <div>
                                <InputField
                                    name="tanggalSurat"
                                    label="Tanggal Surat"
                                    type="date"
                                    value={formData.tanggalSurat}
                                    onChange={handleChange}
                                    required
                                />
                                {validationErrors.tanggalSurat && (
                                    <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.tanggalSurat}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <AutocompleteInput
                                name="pengirim"
                                label="Pengirim / Asal Surat"
                                value={formData.pengirim}
                                onChange={handleChange}
                                getSuggestions={getAutocompleteSuggestions}
                                placeholder="Masukkan nama pengirim..."
                            />
                            {validationErrors.pengirim && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.pengirim}</p>
                            )}
                        </div>

                        <div>
                            <AutocompleteInput
                                name="tujuanSurat"
                                label="Tujuan Surat"
                                value={formData.tujuanSurat}
                                onChange={handleChange}
                                getSuggestions={getAutocompleteSuggestions}
                                placeholder="Opsional - masukkan tujuan surat"
                            />
                            {validationErrors.tujuanSurat && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.tujuanSurat}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <AutocompleteInput
                                name="perihal"
                                label="Perihal / Isi Surat"
                                value={formData.perihal}
                                onChange={handleChange}
                                getSuggestions={getAutocompleteSuggestions}
                                placeholder="Wajib diisi - ringkasan isi surat"
                                required
                            />
                            {validationErrors.perihal && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.perihal}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1">
                                Kode Klasifikasi
                                <span className="text-gray-500 text-xs">(Opsional)</span>
                            </label>

                            {/* Toggle Switch untuk memilih mode input */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 mb-6">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <span className="text-sm font-semibold text-gray-700">Mode Input:</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm transition-all duration-200 ${!useManualKode ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                                            📋 Pilih dari Daftar
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setUseManualKode(!useManualKode)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:shadow-md ${useManualKode ? 'bg-primary-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${useManualKode ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                        <span className={`text-sm transition-all duration-200 ${useManualKode ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                                            ✏️ Input Manual
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border">
                                    {useManualKode ? '💡 Ketik kode klasifikasi secara manual' : '💡 Pilih dari daftar yang tersedia'}
                                </div>
                            </div>

                            {/* Input berdasarkan mode yang dipilih */}
                            {useManualKode ? (
                                <InputField
                                    name="manualKodeInput"
                                    value={manualKodeInput}
                                    onChange={(e) => setManualKodeInput(e.target.value)}
                                    placeholder="Contoh: 001.1 atau 002.3.1"
                                    className="w-full"
                                />
                            ) : (
                                <div className="relative">
                                    <select
                                        id="kodeKlasifikasi"
                                        name="kodeKlasifikasi"
                                        value={formData.kodeKlasifikasi}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-sm"
                                        style={{
                                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <option value="" className="text-gray-500">Pilih Kode Klasifikasi (Opsional)</option>
                                        {groupedKlasifikasi.map(group => {
                                            if (group.subItems && group.subItems.length > 0) {
                                                return (
                                                    <optgroup
                                                        key={group.id}
                                                        label={`${group.kode.toUpperCase()} - ${group.deskripsi.toUpperCase()}`}
                                                        style={{ fontWeight: 'bold', color: '#1f2937' }}
                                                    >
                                                        <option
                                                            key={`main-${group.id}`}
                                                            value={group.kode}
                                                            style={{
                                                                fontWeight: 'bold',
                                                                backgroundColor: '#f3f4f6',
                                                                color: '#1f2937',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            📁 {group.kode.toUpperCase()} - {group.deskripsi.length > 40 ? group.deskripsi.substring(0, 40) + '...' : group.deskripsi}
                                                        </option>
                                                        {group.subItems.map(item => {
                                                            const indentationLevel = item.kode.split('.').length - 1;
                                                            const isSubCategory = indentationLevel === 1;
                                                            const isSubSubCategory = indentationLevel >= 2;

                                                            let prefix = '';
                                                            let indentString = '';
                                                            let bgColor = '#ffffff';
                                                            let textColor = '#374151';

                                                            if (isSubCategory) {
                                                                prefix = '├─ 📂 ';
                                                                indentString = '  ';
                                                                bgColor = '#f9fafb';
                                                                textColor = '#4b5563';
                                                            } else if (isSubSubCategory) {
                                                                prefix = '└── 📄 ';
                                                                indentString = '    ';
                                                                bgColor = '#ffffff';
                                                                textColor = '#6b7280';
                                                            }

                                                            return (
                                                                <option
                                                                    key={item.id}
                                                                    value={item.kode}
                                                                    style={{
                                                                        backgroundColor: bgColor,
                                                                        color: textColor,
                                                                        fontSize: '13px',
                                                                        paddingLeft: `${8 + indentationLevel * 16}px`
                                                                    }}
                                                                >
                                                                    {indentString}{prefix}{item.kode} - {item.deskripsi.length > 35 ? item.deskripsi.substring(0, 35) + '...' : item.deskripsi}
                                                                </option>
                                                            )
                                                        })}
                                                    </optgroup>
                                                );
                                            } else {
                                                return (
                                                    <option
                                                        key={group.id}
                                                        value={group.kode}
                                                        style={{
                                                            fontWeight: 'bold',
                                                            backgroundColor: '#f3f4f6',
                                                            color: '#1f2937',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        📁 {group.kode.toUpperCase()} - {group.deskripsi.length > 40 ? group.deskripsi.substring(0, 40) + '...' : group.deskripsi}
                                                    </option>
                                                );
                                            }
                                        })}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <span className="text-primary-500 text-xs font-medium bg-primary-50 px-2 py-1 rounded-full">Opsional</span>
                                    </div>
                                </div>
                            )}

                            {validationErrors.kodeKlasifikasi && (
                                <p className="text-red-500 text-sm mt-1 animate-shake">{validationErrors.kodeKlasifikasi}</p>
                            )}

                            {/* Info tentang auto-identifikasi */}
                            {!useManualKode && (
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Tip: Sistem akan mencoba mengidentifikasi kode klasifikasi dari nomor surat secara otomatis
                                </p>
                            )}
                        </div>

                        {/* Navigation Buttons Step 1 */}
                        <div className="flex justify-end pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Selanjutnya
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: File Upload & Review */}
                {currentStep === 2 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                <Paperclip size={28} className="text-primary-600" />
                                Upload & Review Dokumen
                            </h2>
                            <p className="text-gray-600 text-sm">Upload dokumen arsip dan review informasi sebelum menyimpan</p>
                        </div>

                        {/* Google Drive Link Input */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                <span className="flex items-center gap-2">
                                    📁 Link Dokumen Google Drive
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Opsional</span>
                                </span>
                            </label>
                            <div className="space-y-3">
                                <InputField
                                    name="googleDriveLink"
                                    value={formData.googleDriveLink || ''}
                                    onChange={handleChange}
                                    placeholder="https://drive.google.com/file/d/your-file-id/view"
                                    className="w-full"
                                />
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="text-blue-600 mt-0.5">💡</div>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Cara mendapatkan link Google Drive:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                                <li>Upload dokumen scan ke Google Drive Anda</li>
                                                <li>Klik kanan pada file → "Dapatkan link"</li>
                                                <li>Pastikan akses diatur ke "Siapa saja yang memiliki link"</li>
                                                <li>Salin dan tempel link di sini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                {validationErrors.googleDriveLink && (
                                    <p className="text-red-500 text-sm animate-shake">{validationErrors.googleDriveLink}</p>
                                )}

                                {/* Google Drive Info Display */}
                                {googleDriveInfo.fileId && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-green-800">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="font-medium text-sm">Link Google Drive berhasil diproses</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div className="bg-white rounded p-3 border border-green-100">
                                                <label className="block font-medium text-gray-700 mb-1">File ID:</label>
                                                <code className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs break-all">
                                                    {googleDriveInfo.fileId}
                                                </code>
                                            </div>
                                            <div className="bg-white rounded p-3 border border-green-100">
                                                <label className="block font-medium text-gray-700 mb-1">View Link:</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs flex-1 truncate">
                                                        {googleDriveInfo.viewLink}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(googleDriveInfo.viewLink, '_blank')}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title="Buka di Google Drive"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-green-700 bg-green-100 rounded p-2">
                                            💡 <strong>Otomatis:</strong> File ID dan view link telah diekstrak dari link yang Anda masukkan.
                                            Data ini akan disimpan secara otomatis ke database.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Existing File Display for Legacy Files */}
                        {!googleDriveFile && existingFile.fileName && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900">File saat ini:</p>
                                        <a
                                            href={`${supabaseUrl}/storage/v1/object/public/arsip-files/${existingFile.filePath}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            {existingFile.fileName}
                                        </a>
                                    </div>
                                    <Download className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                        )}

                        {/* Step 2 Navigation Buttons */}
                        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handlePrevStep}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 hover:shadow-md"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                                Kembali
                            </button>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onFinish}
                                    className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all duration-200 hover:shadow-md"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            {arsipToEdit ? 'Simpan Perubahan' : 'Simpan Arsip'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ArsipForm;
