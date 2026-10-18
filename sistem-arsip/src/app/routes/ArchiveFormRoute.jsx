import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useArsipDetail } from "../../features/arsip/hooks/useArsip";
import { getArsipReturnPath } from "../../features/arsip/utils/listState";
import ArsipForm from "../../features/arsip/components/ArsipForm";
import { supabase } from "../../lib/supabaseClient";
import RouteLoading from "../RouteLoading";

export default function ArchiveFormRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const detail = useArsipDetail(id);
  const returnTo = getArsipReturnPath(
    searchParams.get("from") || location.state?.returnTo,
  );
  const onFinish = () => navigate(returnTo);

  if (id && detail.isPending)
    return <RouteLoading message="Memuat arsip yang akan diedit…" />;
  if (id && detail.isError)
    return (
      <section role="alert" className="empty-state space-y-4 p-6">
        <h1 className="section-heading">Arsip gagal dimuat</h1>
        <p className="page-description">
          {detail.error?.message || "Periksa koneksi lalu coba kembali."}
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => detail.refetch()}>
            Coba lagi
          </button>
          <button className="btn-secondary" onClick={onFinish}>
            Kembali ke daftar
          </button>
        </div>
      </section>
    );
  if (id && !detail.data)
    return (
      <section role="status" className="empty-state space-y-4 p-6">
        <h1 className="section-heading">Arsip tidak ditemukan</h1>
        <p className="page-description">
          Arsip mungkin sudah dihapus atau tidak dapat diakses.
        </p>
        <button className="btn-secondary" onClick={onFinish}>
          Kembali ke daftar
        </button>
      </section>
    );

  return (
    <ArsipForm
      key={id || "new"}
      supabase={supabase}
      arsipToEdit={id ? detail.data : null}
      onFinish={onFinish}
    />
  );
}
