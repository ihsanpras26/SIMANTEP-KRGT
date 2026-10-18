import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
} from "../../../components/ui";
import { useKlasifikasi } from "../hooks/useKlasifikasi";
import {
  deleteKlasifikasi,
  groupKlasifikasi,
} from "../services/klasifikasiService";
import KlasifikasiForm from "./KlasifikasiForm";

function Retention({ item }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
      <span>
        Aktif{" "}
        <span className="text-[var(--text-secondary)]">
          {item.retensiAktif === null || item.retensiAktif === undefined
            ? "—"
            : `${item.retensiAktif} tahun`}
        </span>
      </span>
      <span>
        Inaktif{" "}
        <span className="text-[var(--text-secondary)]">
          {item.retensiInaktif === null || item.retensiInaktif === undefined
            ? "—"
            : `${item.retensiInaktif} tahun`}
        </span>
      </span>
    </div>
  );
}

export default function KlasifikasiManager() {
  const query = useKlasifikasi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const groups = useMemo(
    () => groupKlasifikasi(query.data || [], search),
    [query.data, search],
  );
  const deletion = useMutation({
    mutationFn: (id) => deleteKlasifikasi(supabase, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["klasifikasi"] }),
        queryClient.invalidateQueries({ queryKey: ["arsip"] }),
      ]);
      setMessage("Klasifikasi berhasil dihapus.");
      setDialog(null);
    },
  });
  const closeDialog = () => {
    if (!busy && !deletion.isPending) setDialog(null);
  };
  const handleDelete = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await deletion.mutateAsync(dialog.item.id);
    } catch {
      /* Keep the confirmation open when deletion fails. */
    } finally {
      submitting.current = false;
    }
  };
  const openEditor = (item) => {
    setMessage("");
    setDialog({ kind: "edit", item });
  };
  const openDelete = (item) => {
    deletion.reset();
    setMessage("");
    setDialog({ kind: "delete", item });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-heading">Klasifikasi arsip</h1>
          <p className="page-description">Atur kode dan masa simpan arsip.</p>
        </div>
        <button
          className="btn-primary shrink-0"
          onClick={() => openEditor(null)}
        >
          <Plus size={17} /> Tambah kode
        </button>
      </header>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <FolderTree size={20} className="text-[var(--text-muted)]" />
          <h2 className="section-heading">Klasifikasi</h2>
          <span className="text-sm text-[var(--text-muted)]">
            {query.data?.length ?? "—"} kode
          </span>
        </div>
        <div className="relative sm:w-80">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            className="field pl-10"
            aria-label="Cari kode atau deskripsi klasifikasi"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode atau deskripsi…"
          />
        </div>
      </div>
      {message && (
        <p role="status" className="text-sm text-[var(--success)]">
          {message}
        </p>
      )}
      {query.isPending ? (
        <p className="empty-state" role="status">
          Memuat klasifikasi…
        </p>
      ) : query.isError ? (
        <div className="dialog-error" role="alert">
          <p>Klasifikasi gagal dimuat. {query.error.message}</p>
          <button
            className="btn-secondary mt-3"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            Coba lagi
          </button>
        </div>
      ) : !groups.length ? (
        <div className="empty-state">
          <FolderTree
            size={28}
            className="mx-auto mb-3 text-[var(--text-muted)]"
          />
          <p>
            {search
              ? "Tidak ada klasifikasi yang cocok."
              : "Belum ada kode klasifikasi."}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {search
              ? "Coba kode atau deskripsi lain."
              : "Tambahkan kode untuk mengatur retensi arsip."}
          </p>
          {search && (
            <button className="btn-ghost mt-3" onClick={() => setSearch("")}>
              Hapus pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isOpen =
              Boolean(search.trim()) || Boolean(expanded[group.code]);
            const listId = `classification-${encodeURIComponent(group.code)}`;
            return (
              <section
                key={group.code}
                className="border-b border-[var(--line)]"
              >
                <button
                  className="flex w-full min-w-0 items-center gap-4 py-6 text-left"
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  onClick={() =>
                    setExpanded((previous) => ({
                      ...previous,
                      [group.code]: !previous[group.code],
                    }))
                  }
                >
                  {isOpen ? (
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-[var(--text-muted)]"
                    />
                  ) : (
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-[var(--text-muted)]"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 block font-mono text-sm text-[var(--accent-text)]">
                      {group.code}
                    </span>
                    <span className="block break-words text-lg font-normal text-[var(--text-primary)]">
                      {group.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {group.items.length} kode
                  </span>
                </button>
                <div id={listId} hidden={!isOpen}>
                  <ul className="pb-3">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className={`flex min-w-0 items-start justify-between gap-2 border-t border-[var(--line)] py-4 ${item.kode.split(".").length > 2 ? "pl-4 sm:pl-12" : "pl-1 sm:pl-7"}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm text-[var(--text-primary)]">
                            {item.kode}
                          </p>
                          <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-muted)]">
                            {item.deskripsi}
                          </p>
                          <Retention item={item} />
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            className="icon-button"
                            aria-label={`Edit klasifikasi ${item.kode}`}
                            onClick={() => openEditor(item)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Hapus klasifikasi ${item.kode}`}
                            onClick={() => openDelete(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <Modal
        isOpen={Boolean(dialog)}
        onClose={closeDialog}
        size={dialog?.kind === "delete" ? "sm" : "lg"}
      >
        <ModalHeader
          onClose={busy || deletion.isPending ? undefined : closeDialog}
        >
          <ModalTitle>
            {dialog?.kind === "delete"
              ? "Hapus klasifikasi?"
              : dialog?.item
                ? "Edit klasifikasi"
                : "Tambah klasifikasi"}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {dialog?.kind === "delete" ? (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                Hapus kode{" "}
                <span className="font-mono text-[var(--text-primary)]">
                  {dialog.item.kode}
                </span>{" "}
                — {dialog.item.deskripsi}? Tindakan ini tidak dapat diurungkan.
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Klasifikasi yang masih digunakan arsip mungkin tidak dapat
                dihapus.
              </p>
              {deletion.error && (
                <p className="dialog-error" role="alert">
                  {deletion.error.code === "23503"
                    ? "Klasifikasi masih digunakan oleh arsip. Ubah klasifikasi arsip terkait sebelum menghapus kode ini."
                    : deletion.error.message}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className="btn-secondary"
                  disabled={deletion.isPending}
                  onClick={closeDialog}
                >
                  Batal
                </button>
                <button
                  className="btn-primary"
                  disabled={deletion.isPending}
                  onClick={handleDelete}
                >
                  {deletion.isPending ? "Menghapus…" : "Hapus klasifikasi"}
                </button>
              </div>
            </div>
          ) : (
            dialog && (
              <KlasifikasiForm
                key={dialog.item?.id || "new"}
                klasifikasiToEdit={dialog.item}
                onBusyChange={setBusy}
                onCancel={closeDialog}
                onFinish={() => {
                  setMessage("Klasifikasi berhasil disimpan.");
                  setDialog(null);
                }}
              />
            )
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
