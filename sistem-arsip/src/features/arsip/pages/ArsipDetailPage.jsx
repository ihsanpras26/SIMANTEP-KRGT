import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion, Loader2 } from 'lucide-react';
import { useArsipDetail } from '../hooks/useArsip';
import { useKlasifikasi } from '../../klasifikasi/hooks/useKlasifikasi';
import { getArsipReturnPath } from '../utils/listState';
import ArsipDetail from './ArsipDetail';
export default function ArsipDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const detail = useArsipDetail(id);
  const classification = useKlasifikasi();
  const returnPath = getArsipReturnPath(params.get('from'));
  const backLabel =
    returnPath === '/' || returnPath.startsWith('/?')
      ? 'Kembali ke laporan'
      : 'Kembali ke daftar';
  const back = () => navigate(returnPath);
  if (detail.isPending || classification.isPending)
    return (
      <div className="empty-state" role="status">
        <Loader2 size={28} className="animate-spin text-[#8052ff]" />
        <p>Memuat detail arsip…</p>
      </div>
    );
  if (detail.error || classification.error)
    return (
      <div className="empty-state" role="alert">
        <FileQuestion size={32} />
        <h1 className="section-heading">Arsip belum dapat dimuat.</h1>
        <p>{detail.error?.message || classification.error?.message}</p>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-secondary"
            onClick={() => {
              detail.refetch();
              classification.refetch();
            }}
          >
            Coba lagi
          </button>
          <button className="btn-ghost" onClick={back}>
            {backLabel}
          </button>
        </div>
      </div>
    );
  if (!detail.data)
    return (
      <div className="empty-state">
        <FileQuestion size={32} />
        <h1 className="section-heading">Arsip tidak ditemukan.</h1>
        <p>Arsip mungkin telah dihapus atau akun Anda tidak memiliki akses.</p>
        <button className="btn-secondary" onClick={back}>
          <ArrowLeft size={16} /> {backLabel}
        </button>
      </div>
    );
  return (
    <ArsipDetail
      key={id}
      arsip={detail.data}
      klasifikasiList={classification.data || []}
      onBack={back}
      backLabel={backLabel}
    />
  );
}
