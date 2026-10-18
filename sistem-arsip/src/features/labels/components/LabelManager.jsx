import { useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as defaultClient } from "../../../lib/supabaseClient";
import { useLabels } from "../hooks/useLabels";
import { deleteLabel } from "../services/labelService";
import LabelBadge from "./LabelBadge";
import LabelForm from "./LabelForm";

export default function LabelManager({
  supabase = defaultClient,
  showNotification,
  onBusyChange,
}) {
  const labels = useLabels();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const deletion = useMutation({
    mutationFn: (id) => deleteLabel(supabase, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["labels"] }),
        queryClient.invalidateQueries({ queryKey: ["arsip"] }),
      ]);
      setDeleting(null);
      setMessage("Label berhasil dihapus.");
      showNotification?.("Label berhasil dihapus.");
    },
  });
  const handleDelete = async () => {
    if (submitting.current) return;
    submitting.current = true;
    onBusyChange?.(true);
    try {
      await deletion.mutateAsync(deleting.id);
    } catch {
      /* Error remains in confirmation. */
    } finally {
      submitting.current = false;
      onBusyChange?.(false);
    }
  };
  if (editor)
    return (
      <LabelForm
        key={editor.id || "new"}
        label={editor.id ? editor : null}
        supabase={supabase}
        onBusyChange={onBusyChange}
        onCancel={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          setMessage("Label berhasil disimpan.");
          showNotification?.("Label berhasil disimpan.");
        }}
      />
    );
  if (deleting)
    return (
      <div className="space-y-5">
        <h3 className="section-heading">Hapus label?</h3>
        <LabelBadge label={deleting} size="md" />
        <p className="text-sm text-[var(--text-muted)]">
          Label ini akan dilepas dari semua arsip yang menggunakannya. Arsip
          tetap tersimpan. Tindakan ini tidak dapat diurungkan.
        </p>
        {deletion.error && (
          <p role="alert" className="dialog-error">
            {deletion.error.message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="btn-secondary"
            disabled={deletion.isPending}
            onClick={() => setDeleting(null)}
          >
            Batal
          </button>
          <button
            className="btn-primary"
            disabled={deletion.isPending}
            onClick={handleDelete}
          >
            {deletion.isPending ? "Menghapus…" : "Hapus label"}
          </button>
        </div>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          {labels.data?.length || 0} label tersedia
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            setMessage("");
            setEditor({});
          }}
        >
          <Plus size={16} /> Buat label
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm text-[var(--success)]">
          {message}
        </p>
      )}
      {labels.isPending ? (
        <p role="status" className="empty-state">
          Memuat label…
        </p>
      ) : labels.isError ? (
        <div className="dialog-error" role="alert">
          <p>Label gagal dimuat. {labels.error.message}</p>
          <button
            className="btn-secondary mt-3"
            onClick={() => labels.refetch()}
          >
            Coba lagi
          </button>
        </div>
      ) : !labels.data?.length ? (
        <p className="empty-state">Belum ada label. Buat label pertama Anda.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {labels.data.map((label) => (
            <li
              key={label.id}
              className="flex min-w-0 items-center justify-between gap-3 py-4"
            >
              <LabelBadge label={label} size="md" />
              <div className="flex shrink-0 gap-1">
                <button
                  className="icon-button"
                  aria-label={`Edit label ${label.name}`}
                  onClick={() => {
                    setMessage("");
                    setEditor(label);
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Hapus label ${label.name}`}
                  onClick={() => {
                    deletion.reset();
                    setMessage("");
                    setDeleting(label);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
