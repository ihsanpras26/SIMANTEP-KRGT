import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  FolderTree,
  Info,
  Loader2,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import ArchiveChart from '../components/ArchiveChart';
import { StatCard } from '../../../components/ui';
import { formatArchiveDate } from '../../arsip/utils/archiveFields';

const number = (value) => value.toLocaleString('id-ID');
const months = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const percent = (value) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value);

function Ranking({
  title,
  subtitle,
  items,
  total,
  kind,
  missing,
  onSelect,
  selected,
}) {
  const id =
    kind === 'classification' ? 'report-classifications' : 'report-senders';
  return (
    <section className="report-panel report-ranking" aria-labelledby={id}>
      <div className="report-panel-heading">
        <div>
          <h2 id={id}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="report-count-badge">Top 5</span>
      </div>
      {items.length ? (
        <ol className="report-ranking-list">
          {items.slice(0, 5).map((item, index) => (
            <li key={item.key}>
              <button
                type="button"
                aria-pressed={selected === item.key}
                onClick={() =>
                  onSelect({
                    kind,
                    key: item.key,
                    label: item.code
                      ? `${item.code} · ${item.label}`
                      : item.label,
                  })
                }
                aria-label={
                  kind === 'classification'
                    ? `Lihat ${item.count} arsip klasifikasi ${item.code || 'belum diisi'}`
                    : `Lihat ${item.count} arsip dari ${item.label}`
                }
              >
                <span className="report-rank-number">{index + 1}</span>
                <span className="report-rank-content">
                  <span className="report-rank-title">
                    {item.code && (
                      <span className="report-code">{item.code}</span>
                    )}
                    {item.label}
                  </span>
                  <span className="report-rank-track">
                    <span
                      style={{
                        width: `${total ? (item.count / total) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </span>
                <span className="report-rank-count">
                  {number(item.count)}
                  <small>
                    {total ? percent((item.count / total) * 100) : 0}%
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="report-panel-empty">
          {total
            ? 'Pengirim belum dicatat pada periode ini.'
            : 'Belum ada data pada periode ini.'}
        </p>
      )}
      <div className="report-panel-foot">
        {kind === 'sender' && missing
          ? `${number(missing)} arsip belum mencantumkan pengirim.`
          : `Dari ${number(total)} arsip pada periode terpilih.`}
      </div>
    </section>
  );
}

export default function Dashboard({
  report,
  facet,
  onFacetChange,
  onPeriodChange,
  onRefresh,
  refreshing,
  refreshError,
  updatedAt,
  setSelectedArsipDetail,
}) {
  const { metrics, comparison, quality, period } = report;
  const scope = `${period.year}:${period.month}:${facet?.kind || ''}:${facet?.key || ''}`;
  const [pageState, setPageState] = useState({ scope, page: 1 });
  const page = pageState.scope === scope ? pageState.page : 1;
  const setPage = (page) => setPageState({ scope, page });
  const detail = useRef(null);
  const filteredRows = useMemo(
    () =>
      report.rows.filter(
        (item) =>
          !facet ||
          (facet.kind === 'missingDigital'
            ? !item.hasDigital
            : facet.kind === 'classification'
              ? item.classificationKey === facet.key
              : item.senderKey === facet.key),
      ),
    [report.rows, facet],
  );
  const pageSize = 6;
  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const showDetail = (value) => {
    onFacetChange(value);
    setPage(1);
    requestAnimationFrame(() => {
      detail.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
      detail.current?.focus({ preventScroll: true });
    });
  };
  const unit =
    period.year === 'all'
      ? 'tahun'
      : period.month === 'all'
        ? 'bulan'
        : 'tanggal';
  const strongest = report.series.reduce(
    (best, item) => (!best || item.count > best.count ? item : best),
    null,
  );
  const comparisonCaption = !comparison ? (
    period.year === 'all' ? (
      'Seluruh arsip tersimpan'
    ) : (
      'Periode belum dimulai'
    )
  ) : comparison.percent === null ? (
    'Belum ada data pembanding'
  ) : comparison.percent === 0 ? (
    <>Sama dengan {comparison.label}</>
  ) : (
    <>
      <span className="report-comparison">
        <span>
          {comparison.percent > 0 ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )}
          {percent(Math.abs(comparison.percent))}%
        </span>{' '}
        dibanding {comparison.label}
      </span>
    </>
  );
  const changePeriod = (patch) => {
    onPeriodChange(patch);
  };
  return (
    <div className="management-dashboard" aria-busy={refreshing}>
      <header className="report-page-heading">
        <div>
          <p className="report-overline">RINGKASAN MANAJEMEN</p>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-description">
            Laporan surat, klasifikasi, dan kelengkapan dokumen.
          </p>
        </div>
        <Link to="/arsip" className="btn-secondary">
          Daftar arsip <ArrowUpRight size={15} />
        </Link>
      </header>
      <section className="report-controls" aria-label="Filter laporan">
        <div className="report-period-icon">
          <CalendarDays size={19} />
        </div>
        <label>
          <span>Tahun laporan</span>
          <select
            aria-label="Tahun laporan"
            value={period.year}
            onChange={(event) =>
              changePeriod({ year: event.target.value, month: 'all' })
            }
          >
            <option value="all">Semua tahun</option>
            {report.availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Bulan laporan</span>
          <select
            aria-label="Bulan laporan"
            value={period.month}
            disabled={period.year === 'all'}
            onChange={(event) => changePeriod({ month: event.target.value })}
          >
            <option value="all">Semua bulan</option>
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </label>
        {period.year !== 'all' && (
          <button
            type="button"
            className="btn-ghost report-reset"
            onClick={() => changePeriod({ year: 'all', month: 'all' })}
            aria-label="Reset periode"
          >
            <X size={14} />
            <span>Reset</span>
          </button>
        )}
        <div className="report-sync">
          <span role="status" aria-live="polite">
            {refreshing
              ? 'Memperbarui laporan…'
              : updatedAt
                ? `Diperbarui ${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(updatedAt))}`
                : 'Laporan siap'}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Perbarui laporan"
            title="Perbarui laporan"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
          </button>
        </div>
      </section>
      {refreshError && (
        <div className="dialog-error report-refresh-error" role="alert">
          <span>
            Laporan belum diperbarui sepenuhnya. Data yang tersedia tetap
            ditampilkan.
          </span>
          <button type="button" className="btn-ghost" onClick={onRefresh}>
            Coba lagi
          </button>
        </div>
      )}
      <div className="report-scope">
        <span>
          <span className="report-live-dot" />
          {report.label}
          {report.end && comparison?.partial
            ? ` · s.d. ${formatArchiveDate(report.end)}`
            : ''}
        </span>
        <span>Berdasarkan tanggal surat</span>
      </div>
      <div className="report-metrics">
        <StatCard
          title="Total arsip"
          value={metrics.total}
          icon={Archive}
          caption={comparisonCaption}
        />
        <StatCard
          title="Dokumen digital"
          value={metrics.digital}
          icon={FileCheck2}
          caption={
            metrics.digitalPercent === null
              ? 'Belum ada arsip pada periode ini'
              : `${metrics.digitalPercent}% memiliki tautan atau file`
          }
        >
          <div className="report-coverage-track" aria-hidden="true">
            <span style={{ width: `${metrics.digitalPercent || 0}%` }} />
          </div>
          {metrics.missingDigital > 0 && (
            <button
              type="button"
              className="report-metric-action"
              aria-label={`Lihat ${metrics.missingDigital} arsip tanpa dokumen`}
              onClick={() =>
                showDetail({
                  kind: 'missingDigital',
                  label: 'Tanpa dokumen digital',
                })
              }
            >
              {number(metrics.missingDigital)} belum dilampirkan{' '}
              <ArrowRight size={12} />
            </button>
          )}
        </StatCard>
        <StatCard
          title="Klasifikasi digunakan"
          value={metrics.classifications}
          icon={FolderTree}
          caption={
            quality.unknownClassification
              ? `${number(quality.unknownClassification)} arsip belum memiliki kode terdaftar`
              : 'Kode terdaftar pada periode ini'
          }
        />
        <StatCard
          title="Pengirim tercatat"
          value={metrics.senders}
          icon={Users}
          caption={
            quality.missingSender
              ? `${number(quality.missingSender)} arsip tanpa nama pengirim`
              : 'Instansi atau nama pengirim berbeda'
          }
        />
      </div>
      {(quality.undated > 0 || comparison?.partial) && (
        <div className="report-data-note">
          <Info size={14} />
          <p>
            {quality.undated > 0 && (
              <span>
                {number(quality.undated)} arsip tanpa tanggal valid{' '}
                {period.year === 'all'
                  ? 'tetap dihitung dalam total, tetapi tidak masuk grafik.'
                  : 'tidak masuk periode terpilih.'}{' '}
              </span>
            )}
            {comparison?.partial && (
              <span>
                Pembanding {comparison.label} dihitung sampai{' '}
                {formatArchiveDate(comparison.end)} agar durasinya setara.
              </span>
            )}
          </p>
        </div>
      )}
      <div className="report-grid">
        <section
          className="report-panel report-volume"
          aria-labelledby="report-volume-title"
        >
          <div className="report-panel-heading">
            <div>
              <h2 id="report-volume-title">Volume surat</h2>
              <p>
                Jumlah arsip per {unit} · {report.label.toLowerCase()}
              </p>
            </div>
            <span className="report-chart-legend">
              <i />
              Jumlah surat
            </span>
          </div>
          <ArchiveChart data={report.series} unit={unit} />
          <div className="report-panel-foot">
            {strongest?.count > 0 ? (
              <>
                Terbanyak:{' '}
                <strong>
                  {strongest.label}
                  {period.month !== 'all'
                    ? ` ${months[Number(period.month) - 1]}`
                    : ''}
                </strong>{' '}
                · {number(strongest.count)} surat
              </>
            ) : (
              'Pilih periode lain untuk melihat volume surat.'
            )}
          </div>
        </section>
        <Ranking
          title="Klasifikasi terbanyak"
          subtitle="Kelompok surat pada periode ini"
          kind="classification"
          selected={facet?.kind === 'classification' ? facet.key : null}
          items={report.classifications}
          total={metrics.total}
          onSelect={showDetail}
        />
        <section
          ref={detail}
          className="report-panel report-detail"
          aria-labelledby="report-detail-title"
          tabIndex={-1}
        >
          <div className="report-panel-heading">
            <div>
              <h2 id="report-detail-title">Rincian arsip</h2>
              <p>
                {number(filteredRows.length)} arsip
                {facet
                  ? ` · ${facet.label}`
                  : ` · ${report.label.toLowerCase()}`}
              </p>
            </div>
            {facet && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  onFacetChange(null);
                  setPage(1);
                }}
                aria-label="Reset rincian"
              >
                <X size={14} />
                Reset
              </button>
            )}
          </div>
          {rows.length ? (
            <>
              <div className="report-table-scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Surat</th>
                      <th>Tanggal</th>
                      <th>Klasifikasi</th>
                      <th>Dokumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            className="report-document-link"
                            onClick={() => setSelectedArsipDetail(item)}
                          >
                            {item.perihal || 'Tanpa perihal'}
                            <ArrowUpRight size={13} />
                          </button>
                          <span className="report-row-meta">
                            {item.nomorSurat || 'Tanpa nomor'} ·{' '}
                            {item.senderLabel || 'Tanpa pengirim'}
                          </span>
                        </td>
                        <td className="report-date">
                          {formatArchiveDate(item.tanggalSurat)}
                        </td>
                        <td>
                          <span className="report-code">
                            {item.classificationCode || '—'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`report-document-status ${item.hasDigital ? 'is-attached' : 'is-missing'}`}
                          >
                            {item.hasDigital ? (
                              <Check size={12} />
                            ) : (
                              <FileText size={12} />
                            )}
                            {item.hasDigital ? 'Tertaut' : 'Belum ada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="report-table-footer">
                <span>
                  {number((currentPage - 1) * pageSize + 1)}–
                  {number(
                    Math.min(currentPage * pageSize, filteredRows.length),
                  )}{' '}
                  dari {number(filteredRows.length)} arsip
                </span>
                <div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Halaman rincian sebelumnya"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>
                    {currentPage} / {pages}
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Halaman rincian berikutnya"
                    disabled={currentPage === pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="report-detail-empty">
              <Archive size={27} />
              <h3>
                {facet
                  ? 'Tidak ada arsip untuk rincian ini'
                  : report.sourceTotal
                    ? 'Belum ada arsip pada periode ini'
                    : 'Belum ada arsip tersimpan'}
              </h3>
              <p>
                {report.sourceTotal
                  ? 'Coba periode lain untuk melihat laporan.'
                  : 'Tambahkan arsip untuk mulai melihat laporan.'}
              </p>
              {!report.sourceTotal && (
                <Link className="btn-secondary" to="/arsip/tambah">
                  Tambah arsip <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </section>
        <Ranking
          title="Pengirim terbanyak"
          subtitle="Instansi dan nama pengirim"
          kind="sender"
          selected={facet?.kind === 'sender' ? facet.key : null}
          items={report.senders}
          total={metrics.total}
          missing={quality.missingSender}
          onSelect={showDetail}
        />
      </div>
      <p className="report-method-note">
        Dokumen digital dihitung dari tautan atau file yang tercatat. Izin akses
        dokumen belum diperiksa.
      </p>
    </div>
  );
}
