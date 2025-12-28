import React, { useState } from 'react';
import { X, Upload, Download, Check, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { cn } from '../utils/cn';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalTitle,
    ModalDescription,
    ModalFooter
} from './ui';
import { useKlasifikasi } from '../hooks/useKlasifikasi';
import { useLabels } from '../hooks/useLabels';
import {
    generateTemplate,
    parseFile,
    validateAllRows,
    importValidRows
} from '../utils/importHelpers';

export default function BulkImportModal({ isOpen, onClose, onSuccess, mode = 'create', supabase }) { // mode: 'create' | 'update'
    // Use specific hooks for data
    const { data: klasifikasiQuery } = useKlasifikasi();
    const { data: labelsQuery } = useLabels();

    // Fallback if hooks return undefined data initially
    const klasifikasiList = klasifikasiQuery || [];
    const labelsList = labelsQuery || [];

    // Local states
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationResults, setValidationResults] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null); // Ensure ref is created

    const handleFileSelect = async (selectedFile) => {
        if (!selectedFile) return;

        // Check file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv'
        ];

        if (!validTypes.includes(selectedFile.type) &&
            !selectedFile.name.endsWith('.xlsx') &&
            !selectedFile.name.endsWith('.xls') &&
            !selectedFile.name.endsWith('.csv')) {
            // showNotification('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv', 'error');
            // Notification handling might be external or unused here if not passed.
            // Let's use alert or console if showNotification is missing, or rely on passed prop if any.
            alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
            return;
        }

        setFile(selectedFile);
        setValidationResults([]);
        setImportResults(null);

        try {
            const data = await parseFile(selectedFile);

            if (data.length === 0) {
                alert('File kosong. Pastikan ada data untuk diimport');
                setFile(null);
                return;
            }

            setParsedData(data);

            // Auto-validate
            setIsValidating(true);
            const results = await validateAllRows(data, supabase, klasifikasiList, labelsList, mode);
            setValidationResults(results);
            setIsValidating(false);

        } catch (error) {
            console.error(error);
            alert(error.message);
            setFile(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleImport = async () => {
        const validRows = validationResults.filter(r => r.valid);

        if (validRows.length === 0) {
            alert('Tidak ada data valid untuk diimport');
            return;
        }

        setIsImporting(true);
        setImportProgress(0);

        try {
            const results = await importValidRows(
                validationResults,
                supabase,
                (progress) => setImportProgress(progress)
            );

            setImportResults(results);

            if (results.success > 0) {
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error(error);
            alert(`Import gagal: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setValidationResults([]);
        setImportResults(null);
        setImportProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalHeader onClose={onClose}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                        <FileSpreadsheet size={20} className="text-primary-600" />
                    </div>
                    <div>
                        <ModalTitle>
                            {mode === 'update' ? 'Edit Arsip Massal' : 'Import Arsip Massal'}
                        </ModalTitle>
                        <ModalDescription>
                            {mode === 'update'
                                ? 'Upload Excel untuk memperbarui data berdasarkan Nomor Surat'
                                : 'Upload file Excel atau CSV untuk menambahkan banyak arsip sekaligus'}
                        </ModalDescription>
                    </div>
                </div>
            </ModalHeader>

            <ModalContent className="space-y-6">
                {/* Download Template */}
                <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/30 border border-primary-100 rounded-xl">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-primary-900 mb-1 flex items-center gap-1.5">
                                Belum punya template?
                            </h3>
                            <p className="text-xs text-primary-700/80">
                                Download template Excel dengan format yang sudah ditentukan
                            </p>
                        </div>
                        <button
                            onClick={generateTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-semibold shadow-sm hover:shadow whitespace-nowrap"
                        >
                            <Download size={16} />
                            Download Template
                        </button>
                    </div>
                </div>

                {/* Upload Area */}
                {!file && !importResults && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                            isDragging
                                ? "border-primary-500 bg-primary-50"
                                : "border-neutral-200 hover:border-primary-400 hover:bg-neutral-50"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                            <Upload size={24} />
                        </div>
                        <p className="text-sm font-semibold text-neutral-900 mb-1">
                            Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            Excel (.xlsx, .xls) atau CSV (.csv)
                        </p>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            className="hidden"
                            ref={fileInputRef}
                        />
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:border-primary-500 hover:text-primary-600 text-sm font-medium transition-all shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            Pilih File
                        </button>
                    </div>
                )}

                {/* Validation in Progress */}
                {isValidating && (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Loader2 size={32} className="mx-auto mb-3 text-primary-600 animate-spin" />
                        <p className="text-sm font-medium text-neutral-600">
                            Memvalidasi format data...
                        </p>
                    </div>
                )}

                {/* Preview Table */}
                {file && !isValidating && validationResults.length > 0 && !importResults && (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-neutral-700 font-medium">
                                        {validCount} Valid
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-neutral-700 font-medium">
                                        {invalidCount} Error
                                    </span>
                                </div>
                            </div>
                            <div className="text-neutral-500">
                                Total: {validationResults.length} baris
                            </div>
                        </div>

                        {/* Table */}
                        <div className="max-h-[400px] overflow-auto border border-neutral-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-200 z-10">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider w-10">#</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">No. Surat</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Perihal</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Pengirim & Tujuan</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {validationResults.map((item, i) => {
                                        let statusBadge;
                                        if (!item.valid) {
                                            statusBadge = (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                                                    <AlertCircle size={14} />
                                                </span>
                                            );
                                        } else if (item.row.isUpdate) {
                                            statusBadge = (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200">
                                                    UPDATE
                                                </span>
                                            );
                                        } else {
                                            statusBadge = (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                                                    <Check size={14} />
                                                </span>
                                            );
                                        }

                                        return (
                                            <tr
                                                key={i}
                                                className={cn(
                                                    "transition-colors hover:bg-neutral-50/80",
                                                    !item.valid && "bg-red-50/40",
                                                    item.row.isUpdate && item.valid && "bg-blue-50/20"
                                                )}
                                            >
                                                <td className="px-4 py-3 text-neutral-500 w-10">{i + 1}</td>
                                                <td className="px-4 py-3 w-16 text-center">
                                                    {statusBadge}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                                                    {item.row.nomor_surat || '-'}
                                                    <div className="text-xs text-neutral-400 mt-0.5">
                                                        {item.row.tanggal_surat instanceof Date
                                                            ? item.row.tanggal_surat.toISOString().split('T')[0]
                                                            : item.row.tanggal_surat}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-700 max-w-xs truncate" title={item.row.perihal}>
                                                    {item.row.perihal}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                            {item.row.kode_klasifikasi || 'No Kode'}
                                                        </span>
                                                        {item.row.google_drive_link && (
                                                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                                                                <Check size={10} /> Drive
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-700 max-w-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-medium text-neutral-900 truncate" title={item.row.pengirim}>
                                                            {item.row.pengirim || '-'}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-500 truncate flex items-center gap-1" title={item.row.tujuan_surat}>
                                                            <span className="opacity-70">To:</span> {item.row.tujuan_surat || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.errors.length > 0 && (
                                                        <ul className="text-xs text-red-600 space-y-1">
                                                            {item.errors.map((err, j) => (
                                                                <li key={j} className="flex items-start gap-1">
                                                                    <span className="mt-0.5">•</span>
                                                                    <span>{err}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Import Results */}
                {importResults && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                <div className="text-3xl font-bold text-green-600 mb-1">
                                    {importResults.success}
                                </div>
                                <div className="text-xs text-green-700 font-medium uppercase tracking-wide">Berhasil</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                                <div className="text-3xl font-bold text-red-600 mb-1">
                                    {importResults.failed}
                                </div>
                                <div className="text-xs text-red-700 font-medium uppercase tracking-wide">Gagal</div>
                            </div>
                            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                                <div className="text-3xl font-bold text-neutral-600 mb-1">
                                    {importResults.total}
                                </div>
                                <div className="text-xs text-neutral-600 font-medium uppercase tracking-wide">Total</div>
                            </div>
                        </div>

                        {importResults.errors.length > 0 && (
                            <div className="max-h-60 overflow-auto bg-red-50 rounded-xl border border-red-200">
                                <div className="px-4 py-3 border-b border-red-200 bg-red-50 sticky top-0">
                                    <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Detail Error
                                    </h4>
                                </div>
                                <div className="p-4">
                                    <ul className="text-xs text-red-700 space-y-3">
                                        {importResults.errors.map((err, i) => (
                                            <li key={i} className="pb-3 border-b border-red-200/50 last:border-0 last:pb-0">
                                                <div className="font-semibold mb-0.5">Baris {err.row} - {err.perihal}</div>
                                                <div>{err.error}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                {!importResults ? (
                    <>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
                            disabled={isImporting}
                        >
                            {file ? 'Batal / Reset' : 'Tutup'}
                        </button>

                        {file && (
                            <button
                                onClick={handleImport}
                                disabled={validCount === 0 || isImporting}
                                className="px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        {mode === 'update' ? 'Mulai Update' : `Import ${validCount} Data`}
                                    </>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex w-full gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all border border-neutral-200"
                        >
                            Import File Lain
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                        >
                            Selesai
                        </button>
                    </div>
                )}
            </ModalFooter>
        </Modal>
    );
}
