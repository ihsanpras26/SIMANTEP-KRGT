import React from 'react';
import { FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportExcelButton = ({ data, filename, klasifikasiList }) => {
    const handleExport = () => {
        try {
            if (!data || data.length === 0) {
                toast.error('Tidak ada data untuk diekspor');
                return;
            }

            // Prepare headers
            const headers = [
                'Nomor Surat',
                'Tanggal Surat',
                'Pengirim',
                'Tujuan',
                'Perihal',
                'Kode Klasifikasi',
                'Deskripsi Klasifikasi',
                'Status',
                'Tanggal Retensi',
                'Link File'
            ];

            // Prepare rows
            const rows = data.map(item => {
                const klasifikasi = klasifikasiList?.find(k => k.kode === item.kodeKlasifikasi);
                const isActive = new Date(item.tanggalRetensi) > new Date();
                
                return [
                    `"${item.nomorSurat || ''}"`,
                    `"${item.tanggalSurat ? new Date(item.tanggalSurat).toLocaleDateString('id-ID') : ''}"`,
                    `"${item.pengirim || ''}"`,
                    `"${item.tujuanSurat || ''}"`,
                    `"${item.perihal || ''}"`,
                    `"${item.kodeKlasifikasi || ''}"`,
                    `"${klasifikasi?.deskripsi || ''}"`,
                    `"${isActive ? 'Aktif' : 'Inaktif'}"`,
                    `"${item.tanggalRetensi ? new Date(item.tanggalRetensi).toLocaleDateString('id-ID') : ''}"`,
                    `"${item.googleDriveLink || (item.filePath ? `File Server: ${item.filePath}` : '')}"`
                ];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create blob and download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename || 'export'}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Data berhasil diekspor ke CSV');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal mengekspor data');
        }
    };

    return (
        <button 
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
            <FileDown size={16} />
            Ekspor CSV
        </button>
    );
};

export default ExportExcelButton;
