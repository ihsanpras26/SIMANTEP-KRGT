import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import InputField from '../InputField';
import toast from 'react-hot-toast';

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
                // Optimistic update for existing klasifikasi
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
                // The database's unique constraint will handle duplicate checks.
                // Optimistic insert for new klasifikasi
                tempId = addKlasifikasiOptimistic(dataToSave);
                
                const { data, error } = await supabase.from('klasifikasi').insert([dataToSave]).select().single();
                if (error) {
                    rollbackKlasifikasiOptimistic(tempId);
                    if (error.code === '23505') { // PostgreSQL unique constraint violation
                        toast.error(`Kode klasifikasi "${dataToSave.kode}" sudah ada. Gunakan kode yang berbeda.`);
                    } else {
                        throw error;
                    }
                    setIsLoading(false);
                    return;
                }
                confirmKlasifikasiOptimistic(tempId, data);
                toast.success('Kode klasifikasi berhasil ditambahkan!');
                // Reset form for new input without closing form
                setFormData({ kode: '', deskripsi: '', retensiAktif: '', retensiInaktif: '' });
            }
        } catch (error) {
            console.error("Error saving klasifikasi: ", error);
            toast.error(`Gagal menyimpan data klasifikasi: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 sticky top-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{klasifikasiToEdit ? 'Edit Kode Klasifikasi' : 'Tambah Kode Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField name="kode" label="Kode Klasifikasi" value={formData.kode} onChange={handleChange} required disabled={!!klasifikasiToEdit} />
                <InputField name="deskripsi" label="Deskripsi" value={formData.deskripsi} onChange={handleChange} required />
                <InputField name="retensiAktif" label="Retensi Aktif (Tahun)" type="number" value={formData.retensiAktif} onChange={handleChange} />
                <InputField name="retensiInaktif" label="Retensi Inaktif (Tahun)" type="number" value={formData.retensiInaktif} onChange={handleChange} />
                <div className="flex justify-end gap-4 pt-2">
                    {klasifikasiToEdit && <button type="button" onClick={onFinish} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Batal</button>}
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 flex items-center justify-center">{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
        </div>
    );
};

export default KlasifikasiForm;
