import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Download,
  FileText,
  Link2,
  Pencil,
  Tag,
} from "lucide-react";
import { documentLinks, formatArchiveDate } from "../utils/archiveFields";
import { getArsipStatus } from "../utils/statusUtils";
import { getArsipReturnPath } from "../utils/listState";
import LabelBadge from "../../labels/components/LabelBadge";
import StatusBadge from "../components/StatusBadge";

export default function ArsipDetail({ arsip, onBack, klasifikasiList = [] }) {
  const [searchParams] = useSearchParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const links = documentLinks(arsip, import.meta.env.VITE_SUPABASE_URL);
  const classification = klasifikasiList.find(
    (item) => item.kode === arsip.kodeKlasifikasi,
  );
  const permanent =
    classification &&
    Number(classification.retensiAktif) === 0 &&
    Number(classification.retensiInaktif) === 0;
  const status = getArsipStatus(arsip, klasifikasiList);
  const fields = [
    ["Nomor surat", arsip.nomorSurat || "Tanpa nomor"],
    ["Tanggal surat", formatArchiveDate(arsip.tanggalSurat)],
    [
      "Klasifikasi",
      `${arsip.kodeKlasifikasi || "—"}${classification?.deskripsi ? ` · ${classification.deskripsi}` : ""}`,
    ],
    ["Pengirim", arsip.pengirim || "Tidak dicantumkan"],
    ["Tujuan surat", arsip.tujuanSurat || "Tidak dicantumkan"],
  ];
  return (
    <div className="archive-detail-page space-y-9">
      <button className="btn-ghost" onClick={onBack}>
        <ArrowLeft size={16} /> Kembali ke daftar
      </button>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl min-w-0">
          <p className="page-eyebrow">DETAIL ARSIP</p>
          <h1 className="page-heading break-words">{arsip.perihal}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-[var(--text-muted)]">
            <StatusBadge status={status === "Aktif" ? "active" : "inactive"} />
            <span className="flex items-center gap-2">
              <Calendar size={15} />
              {formatArchiveDate(arsip.tanggalSurat)}
            </span>
          </div>
        </div>
        <Link
          to={`/arsip/${encodeURIComponent(arsip.id)}/edit?${new URLSearchParams({ from: getArsipReturnPath(searchParams.get("from")) })}`}
          className="btn-primary"
        >
          <Pencil size={16} /> Edit arsip
        </Link>
      </div>
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-9">
          <section className="surface">
            <h2 className="section-heading mb-6">Informasi dokumen</h2>
            <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {fields.map(([label, value]) => (
                <div
                  key={label}
                  className={label === "Klasifikasi" ? "sm:col-span-2" : ""}
                >
                  <dt className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {label}
                  </dt>
                  <dd
                    className={`break-words text-sm leading-relaxed text-[var(--text-primary)] ${label === "Nomor surat" ? "font-mono" : ""}`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {arsip.deskripsi && (
              <p className="mt-6 border-t border-[var(--line)] pt-6 text-sm leading-relaxed text-[var(--text-secondary)]">
                {arsip.deskripsi}
              </p>
            )}
          </section>
          <section className="surface">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="section-heading flex items-center gap-3">
                <FileText size={19} className="text-[var(--accent-text)]" />{" "}
                Dokumen digital
              </h2>
              {links.open && (
                <a
                  className="btn-ghost"
                  href={links.open}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buka dokumen
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            {links.preview ? (
              previewOpen ? (
                <iframe
                  title={`Pratinjau: ${arsip.perihal}`}
                  src={links.preview}
                  className="h-[60vh] min-h-80 w-full rounded-2xl border border-[var(--line)] bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-[var(--line)] p-10 text-center">
                  <FileText
                    size={38}
                    className="mx-auto mb-5 text-[var(--accent-text)]"
                  />
                  <h3 className="mb-3 text-lg font-normal">
                    Dokumen siap dibaca.
                  </h3>
                  <p className="mx-auto mb-6 max-w-sm text-sm text-[var(--text-muted)]">
                    Lihat isi dokumen tanpa meninggalkan halaman ini.
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => setPreviewOpen(true)}
                  >
                    Tampilkan pratinjau
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              )
            ) : (
              <div className="empty-state !py-9">
                <Link2 size={28} />
                <p>
                  {links.open
                    ? "Pratinjau tidak tersedia untuk tautan ini. Buka dokumen di tab baru."
                    : "Belum ada dokumen digital yang ditautkan."}
                </p>
              </div>
            )}
            {links.download && (
              <a
                className="btn-ghost mt-4"
                href={links.download}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} /> Unduh dokumen
              </a>
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-9">
          <section>
            <h2 className="section-heading mb-5">Masa retensi</h2>
            <p className="mb-5 text-3xl font-normal tracking-tight text-[var(--warning)]">
              {permanent ? "Permanen" : status}
            </p>
            <dl className="space-y-5 border-l border-[var(--line)] pl-5">
              <div>
                <dt className="mb-1 text-xs text-[var(--text-muted)]">
                  Tanggal surat
                </dt>
                <dd className="text-sm">
                  {formatArchiveDate(arsip.tanggalSurat)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-[var(--text-muted)]">
                  Batas retensi tersimpan
                </dt>
                <dd className="text-sm">
                  {permanent
                    ? "Arsip permanen"
                    : arsip.tanggalRetensi
                      ? formatArchiveDate(arsip.tanggalRetensi)
                      : "Belum ditetapkan"}
                </dd>
              </div>
            </dl>
            {classification && (
              <p className="mt-5 text-xs leading-relaxed text-[var(--text-muted)]">
                Klasifikasi: retensi aktif {classification.retensiAktif || 0}{" "}
                tahun, inaktif {classification.retensiInaktif || 0} tahun.
              </p>
            )}
          </section>
          <section className="border-t border-[var(--line)] pt-6">
            <h2 className="section-heading mb-5 flex items-center gap-2">
              <Tag size={17} /> Label
            </h2>
            <div className="flex flex-wrap gap-2">
              {arsip.arsip_labels?.length ? (
                arsip.arsip_labels.map((link) => (
                  <LabelBadge
                    key={link.label_id ?? link.labels?.id}
                    label={link.labels}
                  />
                ))
              ) : (
                <span className="text-sm text-[var(--text-muted)]">
                  Belum ada label.
                </span>
              )}
            </div>
          </section>
          {arsip.created_at && (
            <p className="border-t border-[var(--line)] pt-6 text-xs text-[var(--text-muted)]">
              Ditambahkan {formatArchiveDate(arsip.created_at)}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
