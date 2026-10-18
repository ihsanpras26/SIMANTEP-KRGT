import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  Grid2X2,
  List,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useArsip, ARSIP_KEYS } from "../hooks/useArsip";
import { useKlasifikasi } from "../../klasifikasi/hooks/useKlasifikasi";
import { useLabels } from "../../labels/hooks/useLabels";
import { readListState, updateListParams } from "../utils/listState";
import {
  formatArchiveDate,
  exportRows,
  localDate,
} from "../utils/archiveFields";
import { getArsipStatus } from "../utils/statusUtils";
import { fetchArsip, fetchArsipDetail } from "../services/arsipService";
import { deleteArchive } from "../services/archiveMutations";
import LabelBadge from "../../labels/components/LabelBadge";
import StatusBadge from "./StatusBadge";
import ActionMenu from "../../../components/ui/ActionMenu";
import Pagination from "../../../components/shared/Pagination";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from "../../../components/ui";

const BulkImportModal = lazy(() => import("./BulkImportModal"));
const LabelAssignmentModal = lazy(
  () => import("../../labels/components/LabelAssignmentModal"),
);
const sortColumns = [
  ["nomorSurat", "Nomor surat"],
  ["perihal", "Perihal"],
  ["tanggalSurat", "Tanggal surat"],
  ["kodeKlasifikasi", "Klasifikasi"],
  ["label", "Label"],
  ["status", "Status"],
];

export default function ArsipList({
  supabase,
  setEditingArsip,
  setSelectedArsipDetail,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readListState(searchParams);
  const change = (patch) =>
    setSearchParams((previous) => updateListParams(previous, patch), {
      replace: "searchTerm" in patch,
    });
  const queryClient = useQueryClient();
  const [term, setTerm] = useState(params.searchTerm);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, setSelection] = useState(new Set());
  const [importMode, setImportMode] = useState(null);
  const [labelTargets, setLabelTargets] = useState(null);
  const [labelBusy, setLabelBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exporting, setExporting] = useState(false);
  const exportController = useRef(null);
  const operation = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(params.searchTerm), 200);
    return () => clearTimeout(timer);
  }, [params.searchTerm]);
  useEffect(() => () => exportController.current?.abort(), []);
  const query = useArsip({ ...params, searchTerm: term });
  const classifications = useKlasifikasi();
  const labels = useLabels();
  const rows = query.data?.data || [];
  const count = query.data?.count || 0;
  const pages = Math.max(1, Math.ceil(count / params.pageSize));
  const pending = term !== params.searchTerm || query.isPlaceholderData;
  const loading = query.isLoading || classifications.isPending;
  const error = query.error || classifications.error;
  const scope = searchParams.toString();
  useEffect(() => setSelection(new Set()), [scope]);
  useEffect(() => {
    if (query.data && !query.isFetching && !pending && params.page > pages)
      setSearchParams(
        (previous) => updateListParams(previous, { page: pages }),
        { replace: true },
      );
  }, [
    query.data,
    query.isFetching,
    pending,
    params.page,
    pages,
    setSearchParams,
  ]);
  const selected = rows.filter((row) => selection.has(row.id));
  const toggle = (id) =>
    setSelection((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const filterCount = [
    params.filterKlasifikasi !== "all",
    params.filterLabel !== "all",
    !!params.filterDate,
  ].filter(Boolean).length;
  const prefetch = (item) =>
    queryClient.prefetchQuery({
      queryKey: ARSIP_KEYS.detail(String(item.id)),
      queryFn: ({ signal }) => fetchArsipDetail(supabase, item.id, signal),
      staleTime: 30000,
    });
  const remove = async () => {
    if (operation.current || !deleteTarget) return;
    operation.current = true;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteArchive(supabase, deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["arsip"] });
      await queryClient.invalidateQueries({ queryKey: ["labels"] });
      toast.success("Arsip berhasil dihapus.");
      setDeleteTarget(null);
      setSelection(new Set());
    } catch (failure) {
      setDeleteError(failure.message);
    } finally {
      operation.current = false;
      setDeleteBusy(false);
    }
  };
  const exportFile = async () => {
    if (exportController.current) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    try {
      const [result, XLSX] = await Promise.all([
        fetchArsip(
          supabase,
          { ...params, page: "all" },
          classifications.data || [],
          controller.signal,
        ),
        import("xlsx"),
      ]);
      if (controller.signal.aborted) return;
      if (!result.data.length) {
        toast.error("Tidak ada arsip untuk diekspor.");
        return;
      }
      const sheet = XLSX.utils.json_to_sheet(
        exportRows(result.data, classifications.data || []),
      );
      sheet["!cols"] = [28, 18, 50, 20, 30, 30, 55, 28, 16, 18].map((wch) => ({
        wch,
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Arsip");
      XLSX.writeFile(workbook, `arsip-${localDate()}.xlsx`);
      toast.success(
        `${result.data.length.toLocaleString("id-ID")} arsip diekspor sesuai filter.`,
      );
    } catch (failure) {
      if (!controller.signal.aborted)
        toast.error(`Ekspor gagal: ${failure.message}`);
    } finally {
      exportController.current = null;
      setExporting(false);
    }
  };
  const sort = (column) =>
    change({
      sortBy: column,
      sortOrder:
        params.sortBy === column && params.sortOrder === "asc" ? "desc" : "asc",
    });
  const sortIcon = (column) =>
    params.sortBy !== column ? (
      <ArrowUpDown size={13} />
    ) : params.sortOrder === "asc" ? (
      <ArrowUp size={13} />
    ) : (
      <ArrowDown size={13} />
    );
  const actions = (item) => (
    <div className="flex items-center justify-end gap-1">
      <button
        className="icon-button"
        title="Edit arsip"
        aria-label={`Edit ${item.perihal}`}
        disabled={pending}
        onClick={() => setEditingArsip(item)}
      >
        <Pencil size={15} />
      </button>
      <button
        className="icon-button"
        title="Kelola label"
        aria-label={`Label ${item.perihal}`}
        disabled={pending}
        onClick={() => setLabelTargets([item])}
      >
        <Tag size={15} />
      </button>
      <button
        className="icon-button text-[var(--danger)]"
        title="Hapus arsip"
        aria-label={`Hapus ${item.perihal}`}
        disabled={pending}
        onClick={() => {
          setDeleteError("");
          setDeleteTarget(item);
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
  const badge = (item) => (
    <StatusBadge
      status={
        getArsipStatus(item, classifications.data || []) === "Aktif"
          ? "active"
          : "inactive"
      }
    />
  );
  const labelList = (item) => (
    <div className="flex max-w-48 flex-wrap gap-1.5">
      {item.arsip_labels?.length ? (
        item.arsip_labels.map((link) => (
          <LabelBadge
            key={link.label_id ?? link.labels?.id}
            label={link.labels}
            size="sm"
          />
        ))
      ) : (
        <span className="text-xs text-[var(--text-muted)]">Tanpa label</span>
      )}
    </div>
  );

  return (
    <div
      className="space-y-8"
      aria-busy={loading || query.isFetching || pending}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="page-heading">Daftar arsip</h1>
          <p className="page-description">
            Cari surat, lihat dokumen, atau tambah arsip baru.
          </p>
        </div>
        <Link to="/arsip/tambah" className="btn-primary">
          <Plus size={17} /> Tambah arsip
        </Link>
      </div>
      <div className="archive-toolbar flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            aria-label="Cari arsip"
            className="field !h-12 !pl-12 !pr-12"
            value={params.searchTerm}
            onChange={(event) => change({ searchTerm: event.target.value })}
            placeholder="Cari nomor surat, perihal, atau pengirim…"
          />
          {params.searchTerm && (
            <button
              className="icon-button absolute right-1 top-1"
              aria-label="Hapus pencarian"
              onClick={() => change({ searchTerm: "" })}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-secondary"
            aria-expanded={filtersOpen}
            aria-controls="archive-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={16} /> Filter{" "}
            {filterCount > 0 && (
              <span className="text-[var(--accent-text)]">{filterCount}</span>
            )}
          </button>
          <ActionMenu
            items={[
              {
                label: "Impor Excel / CSV",
                icon: Upload,
                onSelect: () => setImportMode("create"),
              },
              {
                label: "Perbarui dari Excel",
                icon: Pencil,
                onSelect: () => setImportMode("update"),
              },
            ]}
          />
          <button
            className="btn-ghost"
            disabled={exporting || pending || loading || !!error}
            onClick={exportFile}
            title="Ekspor semua hasil sesuai filter"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}{" "}
            {exporting ? "Mengekspor…" : "Ekspor"}
          </button>
          {exporting && (
            <button
              className="btn-ghost"
              onClick={() => exportController.current?.abort()}
            >
              Batalkan
            </button>
          )}
        </div>
      </div>
      {filtersOpen && (
        <div
          id="archive-filters"
          className="grid gap-4 border-y border-[var(--line)] py-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <label className="field-label">
            Klasifikasi
            <input
              className="field mt-2"
              list="filter-classifications"
              value={
                params.filterKlasifikasi === "all"
                  ? ""
                  : params.filterKlasifikasi
              }
              placeholder="Semua klasifikasi"
              onChange={(event) =>
                change({ filterKlasifikasi: event.target.value || "all" })
              }
            />
            <datalist id="filter-classifications">
              {(classifications.data || []).map((item) => (
                <option key={item.id} value={item.kode}>
                  {item.deskripsi}
                </option>
              ))}
            </datalist>
          </label>
          <label className="field-label">
            Label
            <select
              className="field mt-2"
              value={params.filterLabel}
              onChange={(event) => change({ filterLabel: event.target.value })}
            >
              <option value="all">Semua label</option>
              {(labels.data || []).map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Tanggal surat
            <input
              type="date"
              className="field mt-2"
              value={params.filterDate}
              onChange={(event) => change({ filterDate: event.target.value })}
            />
          </label>
          <div className="flex items-end">
            <button
              className="btn-ghost"
              onClick={() =>
                change({
                  filterKlasifikasi: "all",
                  filterLabel: "all",
                  filterDate: "",
                })
              }
            >
              <X size={15} /> Reset filter
            </button>
          </div>
          {labels.isError && (
            <div role="alert" className="text-sm text-[var(--danger)]">
              Label gagal dimuat.{" "}
              <button onClick={() => labels.refetch()}>Coba lagi</button>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)]">
        <div
          className="flex gap-5"
          role="group"
          aria-label="Filter status arsip"
        >
          {[
            ["all", "Semua arsip"],
            ["active", "Aktif"],
            ["inactive", "Inaktif"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`border-b-2 pb-4 text-sm ${params.filterStatus === value ? "border-[#8052ff] text-[var(--text-primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              aria-pressed={params.filterStatus === value}
              onClick={() => change({ filterStatus: value })}
            >
              {label}
              {params.filterStatus === value && !pending && !loading && (
                <span className="ml-2 rounded-full bg-[var(--hover)] px-2 py-0.5 text-xs tabular-nums">
                  {count.toLocaleString("id-ID")}
                </span>
              )}
            </button>
          ))}
        </div>
        <div
          className="mb-3 flex items-center gap-1"
          role="group"
          aria-label="Tampilan arsip"
        >
          <button
            className="icon-button"
            aria-label="Tampilan tabel"
            aria-pressed={params.viewMode === "table"}
            onClick={() => change({ viewMode: "table" })}
          >
            <List size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Tampilan kartu"
            aria-pressed={params.viewMode === "grid"}
            onClick={() => change({ viewMode: "grid" })}
          >
            <Grid2X2 size={17} />
          </button>
        </div>
      </div>
      {(filterCount > 0 || params.searchTerm) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
          {params.searchTerm && <span>Pencarian: “{params.searchTerm}”</span>}
          {params.filterKlasifikasi !== "all" && (
            <button
              className="btn-ghost !text-xs"
              onClick={() => change({ filterKlasifikasi: "all" })}
            >
              {params.filterKlasifikasi}
              <X size={12} />
            </button>
          )}
          {params.filterLabel !== "all" && (
            <button
              className="btn-ghost !text-xs"
              onClick={() => change({ filterLabel: "all" })}
            >
              {labels.data?.find(
                (item) => String(item.id) === params.filterLabel,
              )?.name || "Label terpilih"}
              <X size={12} />
            </button>
          )}
          {params.filterDate && (
            <button
              className="btn-ghost !text-xs"
              onClick={() => change({ filterDate: "" })}
            >
              {formatArchiveDate(params.filterDate)}
              <X size={12} />
            </button>
          )}
        </div>
      )}
      <p className="results-feedback" role="status" aria-live="polite">
        {loading || pending || query.isFetching ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Memuat hasil…
          </>
        ) : !error ? (
          `${count.toLocaleString("id-ID")} arsip ditemukan`
        ) : (
          "Gagal memuat arsip"
        )}
      </p>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8052ff]/40 px-4 py-3">
          <span className="flex items-center gap-2 text-sm">
            <Check size={16} className="text-[var(--accent-text)]" />
            {selected.length} arsip dipilih di halaman ini
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={pending}
              onClick={() => setLabelTargets(selected)}
            >
              <Tag size={15} /> Kelola label
            </button>
            <button
              className="icon-button"
              aria-label="Batalkan pilihan"
              onClick={() => setSelection(new Set())}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {error ? (
        <div role="alert" className="empty-state">
          <FileText size={32} />
          <h2 className="section-heading">Arsip belum dapat dimuat.</h2>
          <p>{error.message || "Periksa koneksi dan coba kembali."}</p>
          <button
            className="btn-secondary"
            onClick={() => {
              query.refetch();
              classifications.refetch();
            }}
          >
            Coba lagi
          </button>
        </div>
      ) : loading ? (
        <div role="status" aria-label="Memuat arsip" className="space-y-5 py-5">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-10 animate-pulse rounded-lg bg-[var(--hover)]"
            />
          ))}
        </div>
      ) : !rows.length ? (
        <div className="empty-state">
          <Search size={32} />
          <h2 className="section-heading">
            {params.searchTerm || filterCount || params.filterStatus !== "all"
              ? "Arsip tidak ditemukan"
              : "Belum ada arsip"}
          </h2>
          <p>
            {params.searchTerm || filterCount
              ? "Coba kata kunci lain atau kurangi filter pencarian."
              : "Tambahkan arsip pertama untuk mulai menata dokumen."}
          </p>
          <button
            className="btn-secondary"
            onClick={() =>
              change({
                searchTerm: "",
                filterStatus: "all",
                filterKlasifikasi: "all",
                filterLabel: "all",
                filterDate: "",
              })
            }
          >
            Reset pencarian
          </button>
        </div>
      ) : (
        <>
          {params.viewMode === "table" ? (
            <div
              role="region"
              aria-label="Daftar arsip, geser untuk kolom lainnya"
              tabIndex={0}
              className={`archive-table-panel overflow-x-auto ${pending ? "opacity-50" : ""}`}
            >
              <table className="data-table w-full min-w-[980px]">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua arsip di halaman ini"
                        className="h-4 w-4 accent-[#8052ff]"
                        checked={
                          selected.length === rows.length && rows.length > 0
                        }
                        disabled={pending}
                        onChange={() =>
                          setSelection(
                            selected.length === rows.length
                              ? new Set()
                              : new Set(rows.map((item) => item.id)),
                          )
                        }
                      />
                    </th>
                    {sortColumns.map(([column, label]) => (
                      <th
                        key={column}
                        aria-sort={
                          params.sortBy === column
                            ? params.sortOrder === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        <button
                          className="flex items-center gap-2 text-left"
                          onClick={() => sort(column)}
                        >
                          {label}
                          {sortIcon(column)}
                        </button>
                      </th>
                    ))}
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selection.has(item.id) ? "bg-[var(--accent-soft)]" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${item.perihal}`}
                          className="h-4 w-4 accent-[#8052ff]"
                          checked={selection.has(item.id)}
                          disabled={pending}
                          onChange={() => toggle(item.id)}
                        />
                      </td>
                      <td>
                        <span className="whitespace-nowrap font-mono text-xs text-[var(--text-muted)]">
                          {item.nomorSurat || "Tanpa nomor"}
                        </span>
                      </td>
                      <td className="min-w-60 max-w-80">
                        <button
                          disabled={pending}
                          onMouseEnter={() => prefetch(item)}
                          onFocus={() => prefetch(item)}
                          onClick={() => setSelectedArsipDetail(item)}
                          className="group text-left"
                        >
                          <span className="line-clamp-2 text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
                            {item.perihal}
                          </span>
                          <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">
                            {item.pengirim || "Pengirim tidak dicantumkan"}
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap text-[var(--text-secondary)]">
                        {formatArchiveDate(item.tanggalSurat)}
                      </td>
                      <td>
                        <span
                          className="font-mono text-xs text-[var(--text-secondary)]"
                          title={
                            classifications.data?.find(
                              (k) => k.kode === item.kodeKlasifikasi,
                            )?.deskripsi
                          }
                        >
                          {item.kodeKlasifikasi}
                        </span>
                      </td>
                      <td>{labelList(item)}</td>
                      <td>{badge(item)}</td>
                      <td>{actions(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`space-y-5 ${pending ? "opacity-50" : ""}`}>
              <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                Urutkan
                <select
                  className="field !w-auto"
                  value={params.sortBy}
                  onChange={(event) => change({ sortBy: event.target.value })}
                >
                  {sortColumns.map(([column, label]) => (
                    <option key={column} value={column}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  aria-label="Balik urutan"
                  onClick={() =>
                    change({
                      sortOrder: params.sortOrder === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  {sortIcon(params.sortBy)}
                </button>
              </label>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((item) => (
                  <article
                    key={item.id}
                    className="min-w-0 rounded-3xl border border-[var(--line)] p-6"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <FileText
                        size={24}
                        className="text-[var(--accent-text)]"
                      />
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${item.perihal}`}
                        checked={selection.has(item.id)}
                        disabled={pending}
                        onChange={() => toggle(item.id)}
                        className="h-4 w-4 accent-[#8052ff]"
                      />
                    </div>
                    <button
                      onMouseEnter={() => prefetch(item)}
                      disabled={pending}
                      onClick={() => setSelectedArsipDetail(item)}
                      className="mb-4 block w-full text-left"
                    >
                      <span className="mb-2 block truncate font-mono text-xs text-[var(--text-muted)]">
                        {item.nomorSurat || "Tanpa nomor"}
                      </span>
                      <h2 className="line-clamp-2 text-lg font-normal leading-snug">
                        {item.perihal}
                        <ArrowUpRight
                          size={16}
                          className="ml-1 inline text-[var(--text-muted)]"
                        />
                      </h2>
                    </button>
                    <p className="mb-5 text-xs text-[var(--text-muted)]">
                      {formatArchiveDate(item.tanggalSurat)} ·{" "}
                      {item.kodeKlasifikasi}
                    </p>
                    {labelList(item)}
                    <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
                      {badge(item)}
                      {actions(item)}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          <Pagination
            currentPage={params.page}
            totalPages={pages}
            onPageChange={(page) => change({ page })}
            itemsPerPage={params.pageSize}
            onItemsPerPageChange={(pageSize) => change({ pageSize })}
            totalItems={count}
            startIndex={(params.page - 1) * params.pageSize}
            endIndex={Math.min(params.page * params.pageSize, count)}
            disabled={query.isFetching || pending}
          />
        </>
      )}
      {importMode && (
        <Suspense fallback={<p role="status">Membuka impor…</p>}>
          <BulkImportModal
            isOpen
            onClose={() => setImportMode(null)}
            mode={importMode}
            supabase={supabase}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["arsip"] })
            }
          />
        </Suspense>
      )}
      <Modal
        isOpen={!!labelTargets}
        onClose={() => !labelBusy && setLabelTargets(null)}
        size="sm"
      >
        <ModalHeader
          onClose={labelBusy ? undefined : () => setLabelTargets(null)}
        >
          <ModalTitle>Label untuk {labelTargets?.length || 0} arsip</ModalTitle>
        </ModalHeader>
        <ModalContent>
          {labelTargets && (
            <Suspense fallback={<p role="status">Memuat label…</p>}>
              <LabelAssignmentModal
                targetArsips={labelTargets}
                onBusyChange={setLabelBusy}
                onClose={() => setLabelTargets(null)}
              />
            </Suspense>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteBusy && setDeleteTarget(null)}
        size="sm"
      >
        <ModalHeader
          onClose={deleteBusy ? undefined : () => setDeleteTarget(null)}
        >
          <ModalTitle>Hapus arsip ini?</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="mb-3 text-[var(--text-primary)]">
            {deleteTarget?.perihal}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Arsip akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
          </p>
          {deleteError && (
            <p role="alert" className="dialog-error mt-4">
              {deleteError}
            </p>
          )}
        </ModalContent>
        <ModalFooter>
          <button
            className="btn-secondary"
            disabled={deleteBusy}
            onClick={() => setDeleteTarget(null)}
          >
            Batal
          </button>
          <button
            className="btn-primary"
            disabled={deleteBusy}
            onClick={remove}
          >
            {deleteBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {deleteBusy ? "Menghapus…" : "Hapus arsip"}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
