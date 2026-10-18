import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as defaultClient } from "../../../lib/supabaseClient";
import { useLabels } from "../hooks/useLabels";
import { saveLabel } from "../services/labelService";
import { LABEL_COLORS } from "../services/labelAppearance";
import LabelBadge from "./LabelBadge";

const ICON_LABELS = [
  "Label",
  "Bintang",
  "Hati",
  "Penanda",
  "Bendera",
  "Kilat",
  "Jam",
  "Peringatan",
  "Selesai",
  "Informasi",
  "Tren naik",
  "Dokumen",
  "Tim",
  "Pekerjaan",
  "Arsip",
];
const ICON_NAMES = [
  "Tag",
  "Star",
  "Heart",
  "Bookmark",
  "Flag",
  "Zap",
  "Clock",
  "AlertCircle",
  "CheckCircle",
  "Info",
  "TrendingUp",
  "FileText",
  "Users",
  "Briefcase",
  "Archive",
];

export default function LabelForm({
  label,
  supabase = defaultClient,
  onSaved,
  onCancel,
  onBusyChange,
}) {
  const [values, setValues] = useState({
    name: label?.name || "",
    color: label?.color || "violet",
    icon: label?.icon || "Tag",
  });
  const submitting = useRef(false);
  const queryClient = useQueryClient();
  const labels = useLabels();
  const mutation = useMutation({
    mutationFn: async () => {
      if (
        labels.data?.some(
          (item) =>
            item.id !== label?.id &&
            item.name.trim().toLocaleLowerCase("id") ===
              values.name.trim().toLocaleLowerCase("id"),
        )
      ) {
        throw new Error("Nama label sudah digunakan. Pilih nama lain.");
      }
      return saveLabel(supabase, values, label?.id);
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["labels"] }),
        queryClient.invalidateQueries({ queryKey: ["arsip"] }),
      ]);
      onSaved?.(data);
    },
  });
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    onBusyChange?.(true);
    try {
      await mutation.mutateAsync();
    } catch {
      /* The mutation error stays visible in the form. */
    } finally {
      submitting.current = false;
      onBusyChange?.(false);
    }
  };
  const update = (event) =>
    setValues((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="section-heading">
          {label ? "Edit label" : "Buat label"}
        </h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Pilih nama, warna, dan ikon untuk mengenali arsip dengan cepat.
        </p>
      </div>
      <label className="block">
        <span className="field-label">Nama label</span>
        <input
          autoFocus
          className="field"
          name="name"
          value={values.name}
          onChange={update}
          maxLength={120}
          required
          disabled={mutation.isPending}
          placeholder="Contoh: Prioritas"
        />
      </label>
      <fieldset disabled={mutation.isPending}>
        <legend className="field-label">Warna</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LABEL_COLORS).map(([name, color]) => (
            <button
              key={name}
              type="button"
              aria-label={`Warna ${name}`}
              aria-pressed={values.color === name}
              onClick={() =>
                setValues((previous) => ({ ...previous, color: name }))
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${values.color === name ? "border-[var(--accent)]" : "border-transparent hover:border-[var(--line-strong)]"}`}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: color }}
              />
            </button>
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[var(--text-muted)]">
            Warna khusus
          </summary>
          <label className="mt-3 block">
            <span className="field-label">Kode warna</span>
            <input
              className="field"
              name="color"
              value={values.color}
              onChange={update}
              required
              placeholder="#8052ff"
            />
          </label>
        </details>
      </fieldset>
      <label className="block">
        <span className="field-label">Ikon</span>
        <select
          className="field"
          name="icon"
          value={values.icon}
          onChange={update}
          disabled={mutation.isPending}
        >
          {!ICON_NAMES.includes(values.icon) && (
            <option value={values.icon}>{values.icon}</option>
          )}
          {ICON_NAMES.map((name, index) => (
            <option key={name} value={name}>
              {ICON_LABELS[index]}
            </option>
          ))}
        </select>
      </label>
      <div>
        <span className="field-label">Pratinjau</span>
        <LabelBadge
          label={{ ...values, name: values.name || "Nama label" }}
          size="md"
        />
      </div>
      {mutation.error && (
        <p className="dialog-error" role="alert">
          {mutation.error.code === "23505"
            ? "Nama label sudah digunakan. Pilih nama lain."
            : mutation.error.message}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Batal
        </button>
        <button
          className="btn-primary"
          type="submit"
          disabled={mutation.isPending || !values.name.trim()}
        >
          {mutation.isPending ? "Menyimpan…" : "Simpan label"}
        </button>
      </div>
    </form>
  );
}
