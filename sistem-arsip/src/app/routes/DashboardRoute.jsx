import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useArsip } from "../../features/arsip/hooks/useArsip";
import { useKlasifikasi } from "../../features/klasifikasi/hooks/useKlasifikasi";
import Dashboard from "../../features/dashboard/pages/Dashboard";
import { deriveDashboardData } from "../dashboardData";
import RouteLoading from "../RouteLoading";

export default function DashboardRoute({ setSelectedArsipDetail }) {
  const navigate = useNavigate();
  const archives = useArsip({ page: "all" });
  const classifications = useKlasifikasi();
  const today = new Date().toDateString();
  const data = useMemo(
    () =>
      deriveDashboardData(
        archives.data?.data,
        classifications.data,
        new Date(today),
      ),
    [archives.data, classifications.data, today],
  );

  if (archives.isError || classifications.isError) {
    return (
      <section role="alert" className="empty-state space-y-4 p-6">
        <h1 className="section-heading">Ringkasan arsip gagal dimuat</h1>
        <p className="page-description">
          {archives.error?.message ||
            classifications.error?.message ||
            "Periksa koneksi lalu coba kembali."}
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            archives.refetch();
            classifications.refetch();
          }}
        >
          Coba lagi
        </button>
      </section>
    );
  }
  if (archives.isPending || classifications.isPending)
    return <RouteLoading message="Menyiapkan ringkasan arsip…" />;

  return (
    <Dashboard
      {...data}
      navigate={navigate}
      setSelectedArsipDetail={setSelectedArsipDetail}
    />
  );
}
