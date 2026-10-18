import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  ArrowUpRight,
  Plus,
  FileText,
  CheckCheck,
  Clock3,
  ChevronDown,
} from "lucide-react";
import ArchiveChart from "../components/ArchiveChart";
import { StatCard } from "../../../components/ui";

const number = new Intl.NumberFormat("id-ID");
const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

export default function Dashboard({
  stats = {},
  trends = {},
  activeArchives = [],
  inactiveArchives = [],
  archivesByYear = [],
  navigate,
  setSelectedArsipDetail,
}) {
  const [chartFilter, setChartFilter] = useState("years");
  const currentYear = new Date().getFullYear();
  const chartData = useMemo(() => {
    if (chartFilter === "months") {
      const result = months.map((name) => ({ name, Aktif: 0, Inaktif: 0 }));
      [
        [activeArchives, "Aktif"],
        [inactiveArchives, "Inaktif"],
      ].forEach(([list, key]) =>
        list.forEach((archive) => {
          const date = new Date(archive.tanggalSurat);
          if (
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() === currentYear
          )
            result[date.getMonth()][key] += 1;
        }),
      );
      return result;
    }
    return Array.from({ length: 5 }, (_, index) => {
      const year = currentYear - 4 + index;
      const found = archivesByYear.find((point) => Number(point.name) === year);
      return {
        name: year,
        Aktif: found?.Aktif || 0,
        Inaktif: found?.Inaktif || 0,
      };
    });
  }, [
    chartFilter,
    currentYear,
    activeArchives,
    inactiveArchives,
    archivesByYear,
  ]);
  const recentArchives = useMemo(
    () =>
      [
        ...activeArchives.map((archive) => ({
          ...archive,
          dashboardStatus: "active",
        })),
        ...inactiveArchives.map((archive) => ({
          ...archive,
          dashboardStatus: "inactive",
        })),
      ]
        .sort(
          (a, b) =>
            (Date.parse(b.tanggalSurat) || 0) -
            (Date.parse(a.tanggalSurat) || 0),
        )
        .slice(0, 5),
    [activeArchives, inactiveArchives],
  );
  const total = stats.total || 0;
  const active = stats.active || 0;
  const inactive = stats.inactive || 0;
  const activePercent = total ? Math.round((active / total) * 100) : 0;
  const circumference = 2 * Math.PI * 70;
  const activeLength = total ? (active / total) * circumference : 0;
  const inactiveLength = total ? (inactive / total) * circumference : 0;
  const cards = [
    {
      title: "Total arsip",
      value: total,
      icon: Archive,
      trend: trends.total,
      path: "/arsip",
    },
    {
      title: "Arsip aktif",
      value: active,
      icon: CheckCheck,
      trend: trends.active,
      path: "/arsip?status=active",
    },
    {
      title: "Arsip inaktif",
      value: inactive,
      icon: Clock3,
      trend: trends.inactive,
      path: "/arsip?status=inactive",
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-description">Ringkasan arsip dan surat terbaru.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate("/arsip/tambah")}
        >
          <Plus size={16} />
          Tambah arsip
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="dashboard-stats">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend < 0 ? "down" : "up"}
            trendValue={
              Number.isFinite(card.trend)
                ? `${card.trend > 0 ? "+" : ""}${card.trend}`
                : undefined
            }
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>

      <div className="dashboard-insights">
        <section className="dashboard-volume" aria-labelledby="volume-heading">
          <div className="dashboard-section-header">
            <div>
              <p className="section-kicker">AKTIVITAS DOKUMEN</p>
              <h2 id="volume-heading" className="section-heading">
                Volume arsip
              </h2>
            </div>
            <div className="chart-select">
              <select
                value={chartFilter}
                onChange={(event) => setChartFilter(event.target.value)}
                aria-label="Periode grafik arsip"
              >
                <option value="years">5 tahun terakhir</option>
                <option value="months">Tahun {currentYear}</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Aktif
            </span>
            <span>
              <i />
              Inaktif
            </span>
          </div>
          <ArchiveChart data={chartData} />
          <p className="chart-note">Dikelompokkan berdasarkan tanggal surat.</p>
        </section>
        <section
          className="dashboard-distribution"
          aria-labelledby="distribution-heading"
        >
          <div>
            <p className="section-kicker">STATUS KOLEKSI</p>
            <h2 id="distribution-heading" className="section-heading">
              Komposisi arsip
            </h2>
          </div>
          <div className="distribution-ring">
            <svg
              viewBox="0 0 180 180"
              role="img"
              aria-label={`${number.format(active)} arsip aktif, ${number.format(inactive)} arsip inaktif`}
            >
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="var(--line)"
                strokeWidth="9"
              />
              {total > 0 && (
                <g transform="rotate(-90 90 90)">
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#8052ff"
                    strokeWidth="9"
                    strokeDasharray={`${activeLength} ${circumference}`}
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#ffb829"
                    strokeWidth="9"
                    strokeDasharray={`${inactiveLength} ${circumference}`}
                    strokeDashoffset={-activeLength}
                  />
                </g>
              )}
            </svg>
            <div className="distribution-center">
              <span>
                {activePercent}
                <small>%</small>
              </span>
              <p>arsip aktif</p>
            </div>
          </div>
          <div className="distribution-legend">
            <button
              type="button"
              onClick={() => navigate("/arsip?status=active")}
            >
              <span>
                <i />
                Aktif
              </span>
              <strong>{number.format(active)}</strong>
              <ArrowUpRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/arsip?status=inactive")}
            >
              <span>
                <i />
                Inaktif
              </span>
              <strong>{number.format(inactive)}</strong>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </section>
      </div>

      <section className="dashboard-recent" aria-labelledby="recent-heading">
        <div className="dashboard-section-header">
          <div>
            <p className="section-kicker">KOLEKSI TERKINI</p>
            <h2 id="recent-heading" className="section-heading">
              Arsip terbaru
            </h2>
            <p className="section-description">
              Lima dokumen dengan tanggal surat terbaru.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost dashboard-view-all"
            onClick={() => navigate("/arsip")}
          >
            Lihat semua
            <ArrowRight size={15} />
          </button>
        </div>
        {recentArchives.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label="Arsip terbaru, geser untuk kolom lainnya"
            tabIndex={0}
          >
            <table className="data-table recent-archives-table">
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Nomor surat</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Buka arsip</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentArchives.map((archive) => (
                  <tr key={archive.id}>
                    <td>
                      <button
                        type="button"
                        className="recent-document"
                        onClick={() =>
                          setSelectedArsipDetail
                            ? setSelectedArsipDetail(archive)
                            : navigate(
                                `/arsip/${encodeURIComponent(archive.id)}`,
                              )
                        }
                      >
                        <span className="document-icon">
                          <FileText size={17} />
                        </span>
                        <span>{archive.perihal || "Tanpa perihal"}</span>
                      </button>
                    </td>
                    <td className="recent-number">
                      {archive.nomorSurat || "—"}
                    </td>
                    <td className="recent-date">
                      {formatDate(archive.tanggalSurat)}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${archive.dashboardStatus === "active" ? "status-active" : "status-inactive"}`}
                      >
                        {archive.dashboardStatus === "active"
                          ? "Aktif"
                          : "Inaktif"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Buka ${archive.perihal || "arsip"}`}
                        onClick={() =>
                          setSelectedArsipDetail
                            ? setSelectedArsipDetail(archive)
                            : navigate(
                                `/arsip/${encodeURIComponent(archive.id)}`,
                              )
                        }
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Archive size={28} />
            <p>Koleksi Anda dimulai di sini.</p>
            <span>Tambahkan arsip pertama untuk mulai menata dokumen.</span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate("/arsip/tambah")}
            >
              Tambah arsip
              <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
