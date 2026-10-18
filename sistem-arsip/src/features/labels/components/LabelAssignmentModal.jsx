import { useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import { useLabels } from "../hooks/useLabels";
import { assignArchiveLabels } from "../services/labelService";
import LabelBadge from "./LabelBadge";
import LabelForm from "./LabelForm";

// Content only: the archive screen supplies the accessible outer dialog.
export default function LabelAssignmentModal({
  targetArsips,
  onClose,
  showNotification,
  onBusyChange,
}) {
  const labels = useLabels();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const [search, setSearch] = useState("");
  const [labelId, setLabelId] = useState("");
  const [action, setAction] = useState("add");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const targetIds = useMemo(
    () => [
      ...new Set(
        (Array.isArray(targetArsips) ? targetArsips : [targetArsips])
          .filter(Boolean)
          .map((item) => item.id)
          .filter((id) => id !== null && id !== undefined),
      ),
    ],
    [targetArsips],
  );
  const filtered = (labels.data || []).filter((label) =>
    label.name
      .toLocaleLowerCase("id")
      .includes(search.trim().toLocaleLowerCase("id")),
  );
  const selected = labels.data?.find(
    (label) => String(label.id) === String(labelId),
  );
  const mutation = useMutation({
    mutationFn: () => assignArchiveLabels(supabase, targetIds, labelId, action),
    onSuccess: (result) => {
      const text = result.changed
        ? `Label ${action === "add" ? "ditambahkan ke" : "dilepas dari"} ${result.changed} arsip.${result.unchanged ? ` ${result.unchanged} arsip tidak memerlukan perubahan.` : ""}`
        : action === "add"
          ? "Semua arsip terpilih sudah memiliki label ini."
          : "Label ini tidak terpasang pada arsip terpilih.";
      setMessage(text);
      showNotification?.(text);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["labels"] }),
        queryClient.invalidateQueries({ queryKey: ["arsip"] }),
      ]),
  });
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    onBusyChange?.(true);
    setMessage("");
    try {
      await mutation.mutateAsync();
    } catch {
      /* Keep failed requests visible and retryable. */
    } finally {
      submitting.current = false;
      onBusyChange?.(false);
    }
  };
  const chooseAction = (value) => {
    setAction(value);
    setMessage("");
    mutation.reset();
  };
  if (creating)
    return (
      <LabelForm
        onBusyChange={onBusyChange}
        onCancel={() => setCreating(false)}
        onSaved={(label) => {
          setCreating(false);
          setLabelId(label.id);
          setMessage("Label dibuat. Pilih tindakan lalu terapkan ke arsip.");
        }}
      />
    );

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-[var(--text-muted)]">
        Kelola label untuk{" "}
        <span className="text-[var(--text-primary)]">
          {targetIds.length} arsip terpilih
        </span>
        .
      </p>
      <fieldset disabled={mutation.isPending}>
        <legend className="field-label">Tindakan</legend>
        <div className="flex flex-wrap gap-3">
          {[
            ["add", "Tambahkan label"],
            ["remove", "Lepas label"],
          ].map(([value, title]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm"
            >
              <input
                type="radio"
                name="label-action"
                value={value}
                checked={action === value}
                onChange={() => chooseAction(value)}
                className="accent-[#8052ff]"
              />
              {title}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="relative">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          className="field pl-10"
          aria-label="Cari label"
          placeholder="Cari label…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={mutation.isPending}
        />
      </div>
      {labels.isPending ? (
        <p className="empty-state" role="status">
          Memuat label…
        </p>
      ) : labels.isError ? (
        <div role="alert" className="dialog-error">
          <p>Label gagal dimuat. {labels.error.message}</p>
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => labels.refetch()}
          >
            Coba lagi
          </button>
        </div>
      ) : (
        <fieldset
          disabled={mutation.isPending}
          className="max-h-64 space-y-1 overflow-y-auto"
        >
          <legend className="sr-only">Pilih satu label</legend>
          {filtered.length ? (
            filtered.map((label) => (
              <label
                key={label.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${String(label.id) === String(labelId) ? "border-[#8052ff]" : "border-transparent hover:border-[var(--line)]"}`}
              >
                <input
                  type="radio"
                  name="selected-label"
                  value={label.id}
                  checked={String(label.id) === String(labelId)}
                  onChange={() => {
                    setLabelId(label.id);
                    setMessage("");
                    mutation.reset();
                  }}
                  className="accent-[#8052ff]"
                />
                <LabelBadge label={label} size="md" />
              </label>
            ))
          ) : (
            <p className="empty-state">Tidak ada label yang cocok.</p>
          )}
        </fieldset>
      )}
      {selected && (
        <p className="text-sm text-[var(--text-muted)]">
          {action === "add" ? "Tambahkan" : "Lepas"}{" "}
          <span className="text-[var(--text-primary)]">{selected.name}</span>{" "}
          {action === "add" ? "ke" : "dari"} {targetIds.length} arsip.{" "}
          {action === "remove" && "Label tetap tersedia untuk arsip lain."}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-[var(--success)]">
          {message}
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="dialog-error">
          {mutation.error.message}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-5">
        <button
          type="button"
          className="btn-ghost"
          disabled={mutation.isPending}
          onClick={() => {
            setMessage("");
            setCreating(true);
          }}
        >
          <Plus size={16} /> Buat label
        </button>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            {message ? "Selesai" : "Batal"}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending || !selected || !targetIds.length}
          >
            {mutation.isPending
              ? "Menerapkan…"
              : action === "add"
                ? "Tambahkan label"
                : "Lepas label"}
          </button>
        </div>
      </div>
    </form>
  );
}
