import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { Save, Loader2, Hash, FileText, Clock } from 'lucide-react';

const KlasifikasiForm = ({ supabase, klasifikasiToEdit, onFinish }) => {
    const {
        addKlasifikasiOptimistic,
        confirmKlasifikasiOptimistic,
        rollbackKlasifikasiOptimistic,
        updateKlasifikasiOptimistic,
        confirmKlasifikasiUpdate,
        rollbackKlasifikasiUpdate
    } = useAppStore();
    
    const [formData, setFormData] = useState({
        kode: '',
        deskripsi: '',
        retensiAktif: '',
        retensiInaktif: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (klasifikasiToEdit) {
            setFormData({
                kode: klasifikasiToEdit.kode || '',
                deskripsi: klasifikasiToEdit.deskripsi || '',
                retensiAktif: klasifikasiToEdit.retensiAktif || '',
                retensiInaktif: klasifikasiToEdit.retensiInaktif || ''
            });
        } else {
            setFormData({ kode: '', deskripsi: '', retensiAktif: '', retensiInaktif: '' });
        }
    }, [klasifikasiToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const val = (name === 'retensiAktif' || name === 'retensiInaktif') ? (value === '' ? '' : Number(value)) : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSave = {
            kode: formData.kode,
            deskripsi: formData.deskripsi,
            retensiAktif: formData.retensiAktif === '' ? null : formData.retensiAktif,
            retensiInaktif: formData.retensiInaktif === '' ? null : formData.retensiInaktif
        };
        
        try {
            let tempId;
            const originalData = klasifikasiToEdit ? { ...klasifikasiToEdit } : null;
            
            if (klasifikasiToEdit) {
                // Optimistic update
                updateKlasifikasiOptimistic(klasifikasiToEdit.id, dataToSave);
                
                const { data, error } = await supabase.from('klasifikasi').update(dataToSave).eq('id', klasifikasiToEdit.id).select().single();
                if (error) {
                    rollbackKlasifikasiUpdate(klasifikasiToEdit.id, originalData);
                    throw error;
                }
                confirmKlasifikasiUpdate(klasifikasiToEdit.id, data);
                toast.success('Kode klasifikasi berhasil diperbarui!');
                onFinish();
            } else {
                // Optimistic insert
                tempId = addKlasifikasiOptimistic(dataToSave);
                
                const { data, error } = await supabase.from('klasifikasi').insert([dataToSave]).select().single();
                if (error) {
                    rollbackKlasifikasiOptimistic(tempId);
                    if (error.code === '23505') {
                        toast.error(`Kode klasifikasi "${dataToSave.kode}" sudah ada.`);
                    } else {
                        throw error;
                    }
                    setIsLoading(false);
                    return;
                }
                confirmKlasifikasiOptimistic(tempId, data);
                toast.success('Kode klasifikasi berhasil ditambahkan!');
                setFormData({ kode: '', deskripsi: '', retensiAktif: '', retensiInaktif: '' });
            }
        } catch (error) {
            console.error("Error saving klasifikasi: ", error);
            toast.error(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-neutral-100">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-neutral-900">
                    {klasifikasiToEdit ? 'Edit Kode Klasifikasi' : 'Tambah Kode Baru'}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                    Lengkapi informasi kode klasifikasi di bawah ini.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Kode Klasifikasi <span className="text-danger-500">*</span>
                        </label>
                        <div className="relative">
                            <Hash size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <input
                                name="kode"
                                type="text"
                                value={formData.kode}
                                onChange={handleChange}
                                required
                                disabled={!!klasifikasiToEdit}
                                placeholder="Contoh: 800.1.11"
                                className={cn(
                                    "w-full pl-9 px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none",
                                    klasifikasiToEdit && "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                            Deskripsi <span className="text-danger-500">*</span>
                        </label>
                        <div className="relative">
                            <FileText size={16} className="absolute left-3 top-3 text-neutral-400" />
                            <input
                                name="deskripsi"
                                type="text"
                                value={formData.deskripsi}
                                onChange={handleChange}
                                required
                                placeholder="Contoh: Administrasi Pegawai"
                                className="w-full pl-9 px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                Retensi Aktif (Tahun)
                            </label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-3 text-neutral-400" />
                                <input
                                    name="retensiAktif"
                                    type="number"
                                    min="0"
                                    value={formData.retensiAktif}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-9 px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                Retensi Inaktif (Tahun)
                            </label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-3 text-neutral-400" />
                                <input
                                    name="retensiInaktif"
                                    type="number"
                                    min="0"
                                    value={formData.retensiInaktif}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-9 px-4 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                    {klasifikasiToEdit && (
                        <button
                            type="button"
                            onClick={onFinish}
                            className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 font-medium rounded-xl hover:bg-neutral-50 transition-colors"
                        >
                            Batal
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2",
                            klasifikasiToEdit ? "flex-1" : "w-full"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Simpan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default KlasifikasiForm;
