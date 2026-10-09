import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useArsipDetail } from '../hooks/useArsip';
import { useKlasifikasi } from '../../klasifikasi/hooks/useKlasifikasi';
import { getArsipReturnPath } from '../utils/listState';
import ArsipDetail from './ArsipDetail';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Button } from '../../../components/ui';

export default function ArsipDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const detail = useArsipDetail(id);
  const klasifikasi = useKlasifikasi();
  const onBack = () => navigate(getArsipReturnPath(searchParams.get('from')));

  if (detail.isPending || klasifikasi.isPending) {
    return <div role="status" className="flex items-center justify-center gap-3 p-12"><LoadingSpinner size={24} />Memuat detail arsip...</div>;
  }
  if (detail.isError || klasifikasi.isError) {
    return (
      <div role="alert" className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Detail arsip gagal dimuat</h2>
        <p className="text-neutral-600">{detail.error?.message || klasifikasi.error?.message || 'Periksa koneksi lalu coba kembali.'}</p>
        <div className="flex gap-3"><Button onClick={() => { detail.refetch(); klasifikasi.refetch(); }}>Coba lagi</Button><Button variant="outline" onClick={onBack}>Kembali ke daftar</Button></div>
      </div>
    );
  }
  if (!detail.data) {
    return (
      <div role="status" className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Arsip tidak ditemukan</h2>
        <p className="text-neutral-600">Arsip mungkin telah dihapus atau akun Anda tidak memiliki akses.</p>
        <Button onClick={onBack}>Kembali ke daftar</Button>
      </div>
    );
  }
  return <ArsipDetail arsip={detail.data} onBack={onBack} klasifikasiList={klasifikasi.data || []} />;
}
