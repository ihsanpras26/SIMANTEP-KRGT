import React, { useState } from 'react';
import { X, Upload, Download, Check, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Modal, ModalContent } from './ui';
import { useKlasifikasi } from '../hooks/useKlasifikasi';
import { useLabels } from '../hooks/useLabels';
import {
    generateTemplate,
    parseFile,
    validateAllRows,
    importValidRows
} from '../utils/importHelpers';

export default function BulkImportModal({ supabase, isOpen, onClose, showNotification, onSuccess }) {
    const { data: klasifikasiData } = useKlasifikasi();
    const { data: labelsData } = useLabels();

    const klasifikasiList = klasifikasiData || [];
    const labelsList = labelsData || [];

    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [validationResults, setValidationResults] = useState([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

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
            showNotification('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv', 'error');
            return;
        }

        setFile(selectedFile);
        setValidationResults([]);
        setImportResults(null);

        try {
            const data = await parseFile(selectedFile);

            if (data.length === 0) {
                showNotification('File kosong. Pastikan ada data untuk diimport', 'error');
                setFile(null);
                return;
            }

            setParsedData(data);

            // Auto-validate
            setIsValidating(true);
            const results = await validateAllRows(data, supabase, klasifikasiList, labelsList);
            setValidationResults(results);
            setIsValidating(false);

            const validCount = results.filter(r => r.valid).length;
            const invalidCount = results.length - validCount;

            if (invalidCount > 0) {
                showNotification(
                    `${validCount} baris valid, ${invalidCount} baris ada error. Periksa detail di preview.`,
                    'warning'
                );
            } else {
                showNotification(`Semua ${validCount} baris valid dan siap diimport!`, 'success');
            }
        } catch (error) {
            showNotification(error.message, 'error');
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
            showNotification('Tidak ada data valid untuk diimport', 'error');
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
                showNotification(
                    `Import selesai! ${results.success} berhasil, ${results.failed} gagal`,
                    results.failed === 0 ? 'success' : 'warning'
                );
                if (onSuccess) onSuccess();
            } else {
                showNotification('Semua data gagal diimport', 'error');
            }
        } catch (error) {
            showNotification(`Import gagal: ${error.message}`, 'error');
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
    };

    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
            <ModalContent>
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                                    <FileSpreadsheet size={28} className="text-primary-600" />
                                    Import Arsip Massal
                                </h2>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Upload file Excel atau CSV untuk menambahkan banyak arsip sekaligus
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Download Template */}
                    <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-primary-900 mb-1">
                                    Belum punya template?
                                </h3>
                                <p className="text-xs text-primary-700">
                                    Download template Excel dengan format yang sudah ditentukan
                                </p>
                            </div>
                            <button
                                onClick={generateTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm font-medium shadow-sm"
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
                                "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
                                isDragging
                                    ? "border-primary-500 bg-primary-50"
                                    : "border-neutral-300 hover:border-primary-400 hover:bg-neutral-50"
                            )}
                        >
                            <Upload size={48} className="mx-auto mb-4 text-neutral-400" />
                            <p className="text-sm font-medium text-neutral-700 mb-2">
                                Drag & drop file Excel atau CSV
                            </p>
                            <p className="text-xs text-neutral-500 mb-4">
                                atau klik untuk memilih file
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => handleFileSelect(e.target.files[0])}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-neutral-300 text-neutral-700 rounded-xl hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer font-medium"
                            >
                                <FileSpreadsheet size={18} />
                                Pilih File
                            </label>
                        </div>
                    )}

                    {/* Validation in Progress */}
                    {isValidating && (
                        <div className="text-center py-12">
                            <Loader2 size={48} className="mx-auto mb-4 text-primary-600 animate-spin" />
                            <p className="text-sm font-medium text-neutral-700">
                                Memvalidasi data...
                            </p>
                        </div>
                    )}

                    {/* Preview Table */}
                    {file && !isValidating && validationResults.length > 0 && !importResults && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-neutral-700">
                                        <span className="font-semibold">{validCount}</span> Valid
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-neutral-700">
                                        <span className="font-semibold">{invalidCount}</span> Error
                                    </span>
                                </div>
                                <div className="ml-auto text-neutral-500">
                                    Total: {validationResults.length} baris
                                </div>
                            </div>

                            {/* Table */}
                            <div className="max-h-96 overflow-auto border border-neutral-200 rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">#</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Status</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Nomor Surat</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Tanggal</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Perihal</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Klasifikasi</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {validationResults.map((item, i) => (
                                            <tr
                                                key={i}
                                                className={cn(
                                                    "transition-colors",
                                                    item.valid ? "bg-green-50/30" : "bg-red-50/30"
                                                )}
                                            >
                                                <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
                                                <td className="px-3 py-2">
                                                    {item.valid ? (
                                                        <Check size={16} className="text-green-600" />
                                                    ) : (
                                                        <AlertCircle size={16} className="text-red-600" />
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-neutral-700">{item.row.nomor_surat || '-'}</td>
                                                <td className="px-3 py-2 text-neutral-700">{item.row.tanggal_surat}</td>
                                                <td className="px-3 py-2 text-neutral-700 max-w-xs truncate">
                                                    {item.row.perihal}
                                                </td>
                                                <td className="px-3 py-2 text-neutral-700">{item.row.kode_klasifikasi}</td>
                                                <td className="px-3 py-2">
                                                    {item.errors.length > 0 && (
                                                        <ul className="text-xs text-red-600 space-y-0.5">
                                                            {item.errors.map((err, j) => (
                                                                <li key={j}>• {err}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
                                    disabled={isImporting}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={validCount === 0 || isImporting}
                                    className="px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Mengimport... {Math.round(importProgress)}%
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Import {validCount} Data Valid
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Import Results */}
                    {importResults && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-6 border border-neutral-200">
                                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Import Selesai</h3>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="text-3xl font-bold text-green-600 mb-1">
                                            {importResults.success}
                                        </div>
                                        <div className="text-xs text-green-700 font-medium">Berhasil</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                                        <div className="text-3xl font-bold text-red-600 mb-1">
                                            {importResults.failed}
                                        </div>
                                        <div className="text-xs text-red-700 font-medium">Gagal</div>
                                    </div>
                                    <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                                        <div className="text-3xl font-bold text-neutral-600 mb-1">
                                            {importResults.total}
                                        </div>
                                        <div className="text-xs text-neutral-600 font-medium">Total</div>
                                    </div>
                                </div>

                                {importResults.errors.length > 0 && (
                                    <div className="max-h-48 overflow-auto bg-red-50 rounded-xl p-4 border border-red-200">
                                        <h4 className="text-sm font-semibold text-red-900 mb-2">Error Details:</h4>
                                        <ul className="text-xs text-red-700 space-y-1">
                                            {importResults.errors.map((err, i) => (
                                                <li key={i}>
                                                    Row {err.row} ({err.perihal}): {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
                                >
                                    Import Lagi
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm"
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </ModalContent>
        </Modal>
    );
}
