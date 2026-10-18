import { useContext, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Link2,
  Loader2,
  Save,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useArsip } from '../hooks/useArsip';
import { useKlasifikasi } from '../../klasifikasi/hooks/useKlasifikasi';
import { useLabels } from '../../labels/hooks/useLabels';
import LabelBadge from '../../labels/components/LabelBadge';
import {
  localDate,
  normalizeArchive,
  parseArchiveDate,
} from '../utils/archiveFields';
import { saveArchive } from '../services/archiveMutations';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from '../../../components/ui';

import { NavigationGuardContext } from '../../../lib/navigationGuard';

const initialValues = (archive) => ({
  nomorSurat: archive?.nomorSurat || '',
  perihal: archive?.perihal || '',
  tanggalSurat: parseArchiveDate(archive?.tanggalSurat) || localDate(),
  kodeKlasifikasi: archive?.kodeKlasifikasi || '',
  pengirim: archive?.pengirim || '',
  tujuanSurat: archive?.tujuanSurat || '',
  googleDriveLink: archive?.googleDriveLink || '',
});

export default function ArsipForm({ supabase, arsipToEdit, onFinish }) {
  const queryClient = useQueryClient();
  const classifications = useKlasifikasi();
  const labels = useLabels();
  const [values, setValues] = useState(() => initialValues(arsipToEdit));
  const [labelIds, setLabelIds] = useState(() =>
    (arsipToEdit?.arsip_labels || []).map((link) =>
      String(link.label_id ?? link.labels?.id),
    ),
  );
  const [savedRecord, setSavedRecord] = useState(arsipToEdit || null);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const allowNavigation = useRef(false);
  const logoutGuard = useContext(NavigationGuardContext);
  const [pendingLogout, setPendingLogout] = useState(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigation.current &&
      (dirty || saving) &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  const pendingExit = useRef(null);
  pendingExit.current = { blocker, pendingLogout };
  useEffect(() => {
    if (!logoutGuard || (!dirty && !saving)) return;
    const guard = (proceed) => setPendingLogout({ proceed });
    logoutGuard.current = guard;
    return () => {
      if (logoutGuard.current === guard) logoutGuard.current = null;
    };
  }, [logoutGuard, dirty, saving]);
  const stay = () => {
    if (saving) return;
    if (blocker.state === 'blocked') blocker.reset();
    setPendingLogout(null);
  };
  const discard = () => {
    if (saving) return;
    if (pendingLogout) {
      const { proceed } = pendingLogout;
      setPendingLogout(null);
      proceed();
    } else if (blocker.state === 'blocked') blocker.proceed();
  };
  const [senderQuery, setSenderQuery] = useState('');
  const submitting = useRef(false);
  const formRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => setSenderQuery(values.pengirim.trim()), 200);
    return () => clearTimeout(timer);
  }, [values.pengirim]);
  const suggestions = useArsip(
    { searchTerm: senderQuery, pageSize: 10 },
    { enabled: senderQuery.length > 1 },
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = (name, value) => {
    setDirty(true);
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setValues((previous) => {
      const next = { ...previous, [name]: value };
      if (name === 'nomorSurat' && !previous.kodeKlasifikasi) {
        const code = value.split('/')[0].trim().toLowerCase();
        const match = (classifications.data || []).find(
          (item) => item.kode.toLowerCase() === code,
        );
        if (match) next.kodeKlasifikasi = match.kode;
      }
      return next;
    });
  };
  const toggleLabel = (id) => {
    setDirty(true);
    setLabelIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const result = normalizeArchive(
      values,
      classifications.data || [],
      savedRecord,
    );
    setErrors(result.errors);
    if (Object.keys(result.errors).length) {
      formRef.current?.elements
        .namedItem(Object.keys(result.errors)[0])
        ?.focus();
      return;
    }
    submitting.current = true;
    setSaving(true);
    setFailure('');
    try {
      const { record, labelError } = await saveArchive(supabase, {
        id: savedRecord?.id,
        payload: result.payload,
        labelIds,
      });
      setSavedRecord(record);
      await queryClient.invalidateQueries({ queryKey: ['arsip'] });
      await queryClient.invalidateQueries({ queryKey: ['labels'] });
      if (labelError) {
        setFailure(
          `Data arsip sudah tersimpan, tetapi label belum lengkap: ${labelError} Klik Simpan untuk mencoba kembali tanpa membuat arsip baru.`,
        );
        return;
      }
      allowNavigation.current = true;
      setDirty(false);
      toast.success(
        arsipToEdit
          ? 'Perubahan arsip disimpan.'
          : 'Arsip berhasil ditambahkan.',
      );
      const exit = pendingExit.current;
      if (exit.pendingLogout) {
        setPendingLogout(null);
        await exit.pendingLogout.proceed();
      } else if (exit.blocker.state === 'blocked') exit.blocker.proceed();
      else onFinish();
    } catch (error) {
      setFailure(error.message || 'Arsip belum tersimpan. Coba kembali.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  const cancel = () => {
    if (!saving) onFinish();
  };
  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event) => update(name, event.target.value),
    className: 'field',
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });
  const errorText = (name) =>
    errors[name] && (
      <p id={`${name}-error`} className="mt-2 text-sm text-[var(--danger)]">
        {errors[name]}
      </p>
    );
  const selectedCode = (classifications.data || []).find(
    (item) => item.kode === values.kodeKlasifikasi,
  );
  const dataError = classifications.error || labels.error;
  return (
    <div className="archive-form-page">
      <button
        type="button"
        className="btn-ghost mb-6"
        onClick={cancel}
        disabled={saving}
      >
        <ArrowLeft size={16} /> Kembali ke arsip
      </button>
      <div className="mb-10">
        <h1 className="page-heading">
          {arsipToEdit ? 'Edit arsip' : 'Tambah arsip'}
        </h1>
        <p className="page-description">
          Isi informasi surat. Kolom bertanda * wajib diisi.
        </p>
      </div>
      {dataError && (
        <div className="dialog-error mb-6" role="alert">
          Data pendukung gagal dimuat.{' '}
          <button
            className="btn-ghost"
            onClick={() => {
              classifications.refetch();
              labels.refetch();
            }}
          >
            Coba lagi
          </button>
        </div>
      )}
      <form ref={formRef} onSubmit={submit} noValidate>
        <fieldset
          disabled={
            saving ||
            classifications.isPending ||
            labels.isPending ||
            !!dataError
          }
          className="min-w-0 border-0 p-0"
        >
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-10">
              <section className="surface">
                <div className="mb-6 flex items-center gap-3">
                  <FileText size={19} className="text-[var(--accent-text)]" />
                  <h2 className="section-heading">Identitas surat</h2>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    * Wajib diisi
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="nomorSurat">
                      Nomor surat
                    </label>
                    <input
                      {...fieldProps('nomorSurat')}
                      placeholder="005/001/KRGT/2026"
                      autoComplete="off"
                    />
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Kode klasifikasi dikenali dari awal nomor surat.
                    </p>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="tanggalSurat">
                      Tanggal surat *
                    </label>
                    <input
                      {...fieldProps('tanggalSurat')}
                      type="date"
                      required
                    />
                    {errorText('tanggalSurat')}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="perihal">
                      Perihal *
                    </label>
                    <textarea
                      {...fieldProps('perihal')}
                      rows={3}
                      required
                      placeholder="Contoh: Undangan rapat koordinasi"
                    />
                    {errorText('perihal')}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="kodeKlasifikasi">
                      Kode klasifikasi *
                    </label>
                    <input
                      {...fieldProps('kodeKlasifikasi')}
                      list="archive-classifications"
                      required
                      autoComplete="off"
                      placeholder="Ketik atau pilih kode klasifikasi"
                    />
                    <datalist id="archive-classifications">
                      {(classifications.data || []).map((item) => (
                        <option key={item.id} value={item.kode}>
                          {item.deskripsi}
                        </option>
                      ))}
                    </datalist>
                    {errorText('kodeKlasifikasi')}
                    {selectedCode && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {selectedCode.deskripsi}
                      </p>
                    )}
                  </div>
                </div>
              </section>
              <section className="surface">
                <h2 className="section-heading mb-6">Pengirim & tujuan</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="pengirim">
                      Pengirim
                    </label>
                    <input
                      {...fieldProps('pengirim')}
                      list="sender-suggestions"
                      placeholder="Nama atau instansi pengirim"
                    />
                    <datalist id="sender-suggestions">
                      {[
                        ...new Set(
                          (suggestions.data?.data || [])
                            .map((item) => item.pengirim)
                            .filter(Boolean),
                        ),
                      ].map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="tujuanSurat">
                      Tujuan surat
                    </label>
                    <input
                      {...fieldProps('tujuanSurat')}
                      placeholder="Kepala UPT; Sekretariat"
                    />
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Pisahkan beberapa tujuan dengan titik koma.
                    </p>
                  </div>
                </div>
              </section>
              <section className="surface">
                <div className="mb-6 flex items-center gap-3">
                  <Link2 size={19} className="text-[var(--accent-text)]" />
                  <h2 className="section-heading">Dokumen digital</h2>
                </div>
                <label className="field-label" htmlFor="googleDriveLink">
                  Tautan dokumen
                </label>
                <input
                  {...fieldProps('googleDriveLink')}
                  type="url"
                  placeholder="https://drive.google.com/file/d/…"
                />
                {errorText('googleDriveLink')}
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Tempel tautan Google Drive atau dokumen daring. Pastikan
                  penerima memiliki izin untuk membukanya.
                </p>
                {arsipToEdit?.filePath && (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    File tersimpan tetap tersedia saat tautan dokumen
                    dikosongkan.
                  </p>
                )}
              </section>
            </div>
            <aside className="min-w-0 space-y-8">
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <Tag size={18} className="text-[var(--accent-text)]" />
                  <h2 className="section-heading">Label arsip</h2>
                </div>
                <p className="mb-5 text-sm text-[var(--text-muted)]">
                  Kelompokkan dokumen agar lebih cepat ditemukan.
                </p>
                <div className="space-y-2">
                  {(labels.data || []).map((label) => (
                    <label
                      key={label.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-[var(--hover)]"
                    >
                      <input
                        type="checkbox"
                        checked={labelIds.includes(String(label.id))}
                        onChange={() => toggleLabel(String(label.id))}
                        className="h-4 w-4 accent-[#8052ff]"
                      />
                      <LabelBadge label={label} />
                    </label>
                  ))}
                </div>
                {!labels.isPending && !labels.data?.length && (
                  <p className="text-sm text-[var(--text-muted)]">
                    Belum ada label. Label dapat dibuat melalui menu Label.
                  </p>
                )}
              </section>
            </aside>
          </div>
          {failure && (
            <div role="alert" className="dialog-error mt-8">
              {failure}
            </div>
          )}
          <div className="form-savebar mt-10 flex flex-wrap items-center justify-between gap-4">
            <span role="status" className="text-sm text-[var(--text-muted)]">
              {saving
                ? 'Menyimpan perubahan…'
                : classifications.isPending || labels.isPending
                  ? 'Memuat pilihan klasifikasi dan label…'
                  : dirty
                    ? 'Perubahan belum disimpan'
                    : 'Isi data lalu simpan arsip'}
            </span>
            <div className="flex gap-3">
              <button className="btn-secondary" type="button" onClick={cancel}>
                Batal
              </button>
              <button className="btn-primary" type="submit">
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}{' '}
                {saving ? 'Menyimpan…' : 'Simpan arsip'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      <Modal
        isOpen={blocker.state === 'blocked' || !!pendingLogout}
        onClose={stay}
        size="sm"
      >
        <ModalHeader onClose={stay}>
          <ModalTitle>Simpan perubahan dulu?</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-[var(--text-secondary)]">
            Perubahan Anda belum disimpan. Keluar sekarang akan menghapus isian
            terbaru.
          </p>
        </ModalContent>
        <ModalFooter>
          <button className="btn-secondary" disabled={saving} onClick={stay}>
            Lanjut mengisi
          </button>
          <button className="btn-secondary" disabled={saving} onClick={discard}>
            Keluar tanpa menyimpan
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
