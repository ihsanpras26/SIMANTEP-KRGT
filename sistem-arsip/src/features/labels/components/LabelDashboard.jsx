import { useMemo, useState } from "react";
import { ArrowUpRight, Layers, Search, Tags } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
} from "../../../components/ui";
import { useLabels } from "../hooks/useLabels";
import { fetchLabelUsage } from "../services/labelService";
import LabelBadge from "./LabelBadge";
import LabelManager from "./LabelManager";

export default function LabelDashboard() {
  const labels = useLabels();
  const usage = useQuery({
    queryKey: ["labels", "usage"],
    queryFn: ({ signal }) => fetchLabelUsage(supabase, signal),
    staleTime: 60_000,
  });
  const [search, setSearch] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(
    () =>
      (labels.data || []).filter((label) =>
        label.name
          .toLocaleLowerCase("id")
          .includes(search.trim().toLocaleLowerCase("id")),
      ),
    [labels.data, search],
  );
  const closeManager = () => {
    if (!busy) setManagerOpen(false);
  };
  const count = (labelId) =>
    usage.isPending || usage.isError
      ? "—"
      : (usage.data?.counts[labelId] || 0).toLocaleString("id-ID");

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-heading">Label arsip</h1>
          <p className="page-description">
            Pilih label untuk melihat arsipnya.
          </p>
        </div>
        <button
          className="btn-primary shrink-0"
          onClick={() => setManagerOpen(true)}
        >
          <Tags size={17} /> Kelola label
        </button>
      </header>
      <Link
        to="/arsip"
        className="surface flex items-center justify-between gap-4 py-6"
      >
        <div className="flex items-center gap-4">
          <Layers size={24} className="text-[var(--text-muted)]" />
          <div>
            <h2 className="section-heading">Semua arsip</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {usage.isPending || usage.isError
                ? "Lihat seluruh arsip"
                : `${usage.data.totalArchives.toLocaleString("id-ID")} arsip tersimpan`}
            </p>
          </div>
        </div>
        <ArrowUpRight size={22} aria-hidden="true" />
      </Link>
      <section className="space-y-4" aria-labelledby="labels-heading">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 id="labels-heading" className="section-heading">
            Label{" "}
            <span className="ml-2 text-sm text-[var(--text-muted)]">
              {labels.data?.length ?? "—"}
            </span>
          </h2>
          <div className="relative sm:w-72">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              className="field pl-10"
              aria-label="Cari label"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari label…"
            />
          </div>
        </div>
        {usage.isError && (
          <div
            role="alert"
            className="dialog-error flex flex-wrap items-center justify-between gap-3"
          >
            <p>Jumlah arsip per label gagal dimuat.</p>
            <button
              className="btn-secondary"
              onClick={() => usage.refetch()}
              disabled={usage.isFetching}
            >
              Coba lagi
            </button>
          </div>
        )}
        {labels.isPending ? (
          <p className="empty-state" role="status">
            Memuat label…
          </p>
        ) : labels.isError ? (
          <div role="alert" className="dialog-error">
            <p>Label gagal dimuat. {labels.error.message}</p>
            <button
              className="btn-secondary mt-3"
              onClick={() => labels.refetch()}
              disabled={labels.isFetching}
            >
              Coba lagi
            </button>
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">
            <Tags size={28} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p>{search ? "Tidak ada label yang cocok." : "Belum ada label."}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {search
                ? "Gunakan kata kunci lain untuk mencari label."
                : "Buat label untuk mulai mengelompokkan arsip."}
            </p>
            {search && (
              <button className="btn-ghost mt-3" onClick={() => setSearch("")}>
                Hapus pencarian
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {filtered.map((label) => (
              <li key={label.id} className="border-b border-[var(--line)]">
                <Link
                  to={`/arsip?label=${encodeURIComponent(label.id)}`}
                  className="group flex min-h-24 items-center justify-between gap-3 py-5"
                >
                  <div className="min-w-0 space-y-2">
                    <LabelBadge label={label} size="md" />
                    <p className="pl-1 text-xs text-[var(--text-muted)]">
                      {count(label.id)} arsip
                    </p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className="shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Modal isOpen={managerOpen} onClose={closeManager} size="lg">
        <ModalHeader onClose={busy ? undefined : closeManager}>
          <ModalTitle>Kelola label</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <LabelManager onBusyChange={setBusy} />
        </ModalContent>
      </Modal>
    </div>
  );
}
