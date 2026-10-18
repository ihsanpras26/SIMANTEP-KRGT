import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useArsip } from '../../features/arsip/hooks/useArsip';
import { useKlasifikasi } from '../../features/klasifikasi/hooks/useKlasifikasi';
import Dashboard from '../../features/dashboard/pages/Dashboard';
import { deriveDashboardData } from '../dashboardData';
import RouteLoading from '../RouteLoading';

export default function DashboardRoute({ setSelectedArsipDetail }) {
  const [params, setParams] = useSearchParams();
  const archives = useArsip({ page: 'all' });
  const classifications = useKlasifikasi();
  const year = params.get('year') || 'all';
  const month = params.get('month') || 'all';
  const today = new Date().toDateString();
  const report = useMemo(
    () =>
      deriveDashboardData(
        archives.data?.data,
        classifications.data,
        new Date(today),
        { year, month },
      ),
    [archives.data, classifications.data, today, year, month],
  );
  const error = archives.error || classifications.error;
  const refresh = () => {
    archives.refetch();
    classifications.refetch();
  };
  if (
    (archives.isError && !archives.data) ||
    (classifications.isError && !classifications.data)
  )
    return (
      <section role="alert" className="empty-state space-y-4 p-6">
        <h1 className="section-heading">Laporan arsip gagal dimuat</h1>
        <p className="page-description">
          {error?.message || 'Periksa koneksi lalu coba kembali.'}
        </p>
        <button type="button" className="btn-primary" onClick={refresh}>
          Coba lagi
        </button>
      </section>
    );
  if (archives.isPending || classifications.isPending)
    return <RouteLoading message="Menyiapkan laporan arsip…" />;
  const onPeriodChange = (patch) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('group');
      next.delete('value');
      Object.entries({ ...report.period, ...patch }).forEach(([key, value]) =>
        value === 'all' ? next.delete(key) : next.set(key, value),
      );
      return next;
    });
  const group = params.get('group');
  const value = params.get('value') || '';
  const ranked =
    group === 'sender'
      ? report.senders.find((item) => item.key === value)
      : group === 'classification'
        ? report.classifications.find((item) => item.key === value)
        : null;
  const facet =
    group === 'missingDigital'
      ? { kind: group, label: 'Tanpa dokumen digital' }
      : ranked
        ? {
            kind: group,
            key: ranked.key,
            label: ranked.code
              ? `${ranked.code} · ${ranked.label}`
              : ranked.label,
          }
        : null;
  const onFacetChange = (facet) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('group');
      next.delete('value');
      if (facet) {
        next.set('group', facet.kind);
        if (facet.kind !== 'missingDigital') next.set('value', facet.key);
      }
      return next;
    });
  return (
    <Dashboard
      facet={facet}
      onFacetChange={onFacetChange}
      report={report}
      onPeriodChange={onPeriodChange}
      onRefresh={refresh}
      refreshing={archives.isFetching || classifications.isFetching}
      refreshError={error}
      updatedAt={archives.dataUpdatedAt}
      setSelectedArsipDetail={setSelectedArsipDetail}
    />
  );
}
