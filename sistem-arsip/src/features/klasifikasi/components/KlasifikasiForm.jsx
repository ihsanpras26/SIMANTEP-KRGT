import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as defaultClient } from "../../../lib/supabaseClient";
import { saveKlasifikasi } from "../services/klasifikasiService";

export default function KlasifikasiForm({
  supabase = defaultClient,
  klasifikasiToEdit,
  onFinish,
  onCancel,
  onBusyChange,
}) {
  const [values, setValues] = useState(() => ({
    kode: klasifikasiToEdit?.kode ?? "",
    deskripsi: klasifikasiToEdit?.deskripsi ?? "",
    retensiAktif: klasifikasiToEdit?.retensiAktif ?? "",
    retensiInaktif: klasifikasiToEdit?.retensiInaktif ?? "",
  }));
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: () => saveKlasifikasi(supabase, values, klasifikasiToEdit?.id),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["klasifikasi"] }),
        queryClient.invalidateQueries({ queryKey: ["arsip"] }),
      ]);
      onFinish?.(data);
    },
  });
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    onBusyChange?.(true);
    try {
      await mutation.mutateAsync();
    } catch {
      /* Retain inputs and surface the mutation error. */
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
    <form onSubmit={submit} className="space-y-6">
      <p className="text-sm text-[var(--text-muted)]">
        Tentukan kode, deskripsi, dan masa simpan untuk kelompok arsip ini.
      </p>
      <label className="block">
        <span className="field-label">Kode klasifikasi</span>
        <input
          autoFocus
          className="field"
          name="kode"
          value={values.kode}
          onChange={update}
          required
          disabled={mutation.isPending || Boolean(klasifikasiToEdit)}
          placeholder="Contoh: 800.1.11"
        />
      </label>
      <label className="block">
        <span className="field-label">Deskripsi</span>
        <textarea
          className="field min-h-28 resize-y"
          name="deskripsi"
          value={values.deskripsi}
          onChange={update}
          required
          disabled={mutation.isPending}
          placeholder="Contoh: Administrasi pegawai"
        />
      </label>
      <fieldset disabled={mutation.isPending}>
        <legend className="field-label">Masa retensi</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-muted)]">
              Aktif (tahun)
            </span>
            <input
              className="field"
              name="retensiAktif"
              type="number"
              min="0"
              step="1"
              value={values.retensiAktif}
              onChange={update}
              placeholder="Belum ditentukan"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-muted)]">
              Inaktif (tahun)
            </span>
            <input
              className="field"
              name="retensiInaktif"
              type="number"
              min="0"
              step="1"
              value={values.retensiInaktif}
              onChange={update}
              placeholder="Belum ditentukan"
            />
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
          Isi 0 pada kedua retensi untuk arsip permanen. Kosongkan jika retensi
          belum ditentukan.
        </p>
      </fieldset>
      {mutation.error && (
        <p className="dialog-error" role="alert">
          {mutation.error.code === "23505"
            ? `Kode klasifikasi "${values.kode}" sudah digunakan.`
            : mutation.error.message}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--line)] pt-5">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel || onFinish}
          disabled={mutation.isPending}
        >
          Batal
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={
            mutation.isPending ||
            !values.kode.trim() ||
            !values.deskripsi.trim()
          }
        >
          {mutation.isPending ? "Menyimpan…" : "Simpan klasifikasi"}
        </button>
      </div>
    </form>
  );
}
