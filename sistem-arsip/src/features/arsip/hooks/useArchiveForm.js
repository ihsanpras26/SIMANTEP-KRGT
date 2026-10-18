import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useArsip } from './useArsip';
import { useKlasifikasi } from '../../klasifikasi/hooks/useKlasifikasi';
import { useLabels } from '../../labels/hooks/useLabels';
import {
  localDate,
  normalizeArchive,
  parseArchiveDate,
  safeDocumentUrl,
} from '../utils/archiveFields';
import { saveArchive } from '../services/archiveMutations';
import { NavigationGuardContext } from '../../../lib/navigationGuard';

const names = {
  perihal: 'Perihal',
  nomorSurat: 'Nomor surat',
  tanggalSurat: 'Tanggal surat',
  kodeKlasifikasi: 'Kode klasifikasi',
  pengirim: 'Pengirim',
  tujuanSurat: 'Tujuan surat',
  googleDriveLink: 'Tautan dokumen',
};
const required = ['perihal', 'tanggalSurat', 'kodeKlasifikasi'];
const hinted = [
  'tanggalSurat',
  'kodeKlasifikasi',
  'tujuanSurat',
  'googleDriveLink',
];
const initialValues = (archive) => ({
  perihal: archive?.perihal || '',
  nomorSurat: archive?.nomorSurat || '',
  tanggalSurat: archive ? parseArchiveDate(archive.tanggalSurat) : localDate(),
  kodeKlasifikasi: archive?.kodeKlasifikasi || '',
  pengirim: archive?.pengirim || '',
  tujuanSurat: archive?.tujuanSurat || '',
  googleDriveLink: archive?.googleDriveLink || '',
});
const initialLabels = (archive) =>
  (archive?.arsip_labels || [])
    .map((link) => link.label_id ?? link.labels?.id)
    .filter((id) => id !== null && id !== undefined && id !== '')
    .map(String);
const signature = (values, ids) =>
  JSON.stringify([
    Object.keys(names).map((name) => values[name]),
    [...new Set(ids)].sort(),
  ]);
const automaticCode = (number, options) =>
  options.find(
    (option) =>
      option.kode.toLocaleLowerCase('id-ID') ===
      number.split('/')[0].trim().toLocaleLowerCase('id-ID'),
  )?.kode || '';

export { names as ARCHIVE_FIELD_NAMES, required as ARCHIVE_REQUIRED_FIELDS };

export function useArchiveForm({ supabase, arsipToEdit, onFinish }) {
  const queryClient = useQueryClient();
  const classifications = useKlasifikasi();
  const labels = useLabels();
  const codes = useMemo(
    () => classifications.data || [],
    [classifications.data],
  );
  const [values, setValues] = useState(() => initialValues(arsipToEdit));
  const [labelIds, setLabelIds] = useState(() => initialLabels(arsipToEdit));
  const [baseline, setBaseline] = useState(() =>
    signature(initialValues(arsipToEdit), initialLabels(arsipToEdit)),
  );
  const [codeMode, setCodeMode] = useState(
    arsipToEdit?.kodeKlasifikasi ? 'manual' : 'automatic',
  );
  const [savedRecord, setSavedRecord] = useState(arsipToEdit || null);
  const [savedAt, setSavedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState(null);
  const [saving, setSaving] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const dirty = signature(values, labelIds) !== baseline;
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
  const failureRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => setSenderQuery(values.pengirim.trim()), 200);
    return () => clearTimeout(timer);
  }, [values.pengirim]);
  const suggestions = useArsip(
    { searchTerm: senderQuery, pageSize: 10 },
    { enabled: senderQuery.length > 1 },
  );
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  useEffect(() => {
    if (codeMode !== 'automatic') return;
    setValues((previous) => {
      const code = automaticCode(previous.nomorSurat, codes);
      return code === previous.kodeKlasifikasi
        ? previous
        : { ...previous, kodeKlasifikasi: code };
    });
  }, [codes, codeMode]);

  const focusField = (name) =>
    requestAnimationFrame(() => {
      const field = formRef.current?.elements.namedItem(name);
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  const focusFailure = () =>
    requestAnimationFrame(() => {
      failureRef.current?.focus({ preventScroll: true });
      failureRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  const update = (name, value) => {
    if (name === 'kodeKlasifikasi') setCodeMode('manual');
    const next = { ...values, [name]: value };
    if (name === 'nomorSurat' && codeMode === 'automatic')
      next.kodeKlasifikasi = automaticCode(value, codes);
    setValues(next);
    const validation = normalizeArchive(next, codes, savedRecord).errors;
    setErrors((previous) => ({
      ...previous,
      [name]: attempted || previous[name] ? validation[name] : undefined,
      ...(name === 'nomorSurat' && codeMode === 'automatic'
        ? {
            kodeKlasifikasi: attempted ? validation.kodeKlasifikasi : undefined,
          }
        : {}),
    }));
    if (failure && !failure.partial) setFailure(null);
  };
  const blur = (name) => {
    const next = { ...values, [name]: values[name].trim() };
    setValues(next);
    if (name !== 'nomorSurat')
      setErrors((previous) => ({
        ...previous,
        [name]: normalizeArchive(next, codes, savedRecord).errors[name],
      }));
  };
  const selectAutomatic = () => {
    const code = automaticCode(values.nomorSurat, codes);
    setCodeMode('automatic');
    setValues((previous) => ({ ...previous, kodeKlasifikasi: code }));
    setErrors((previous) => ({ ...previous, kodeKlasifikasi: undefined }));
    focusField('kodeKlasifikasi');
  };
  const toggleLabel = (id) =>
    setLabelIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || classifications.isPending || !codes.length)
      return;
    const result = normalizeArchive(values, codes, savedRecord);
    setAttempted(true);
    setErrors(result.errors);
    const firstError = Object.keys(names).find((name) => result.errors[name]);
    if (firstError) {
      focusField(firstError);
      return;
    }
    submitting.current = true;
    setSaving(true);
    setFailure(null);
    try {
      const { record, labelError } = await saveArchive(supabase, {
        id: savedRecord?.id,
        payload: result.payload,
        labelIds,
      });
      setSavedRecord(record);
      // Mark consumers stale without waiting on unrelated form suggestion/label queries.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['arsip'],
          refetchType: 'none',
        }),
        queryClient.invalidateQueries({
          queryKey: ['labels'],
          refetchType: 'none',
        }),
      ]);
      if (labelError) {
        setFailure({
          partial: true,
          message:
            'Data arsip sudah tersimpan, tetapi label belum lengkap. Klik Simpan arsip untuk mencoba lagi.',
          detail: labelError,
        });
        focusFailure();
        return;
      }
      allowNavigation.current = true;
      setBaseline(signature(values, labelIds));
      setSavedAt(Date.now());
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
      const message = error.message || '';
      if (/nomor surat sudah|duplicate.*nomor/i.test(message)) {
        setErrors({ nomorSurat: 'Nomor surat sudah digunakan arsip lain.' });
        focusField('nomorSurat');
      } else {
        setFailure({
          partial: false,
          message: /izin|akses|permission|denied/i.test(message)
            ? 'Anda belum memiliki izin untuk menyimpan arsip. Hubungi pengelola.'
            : /fetch|network|connection/i.test(message)
              ? 'Koneksi terputus. Periksa internet Anda lalu coba lagi.'
              : 'Arsip belum tersimpan. Isian Anda tetap tersedia. Coba simpan lagi.',
          detail: message,
        });
        focusFailure();
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  const cancel = () => {
    if (!saving) onFinish();
  };
  const validation = normalizeArchive(values, codes, savedRecord).errors;
  const complete = required.filter((name) => !validation[name]).length;
  const errorNames = Object.keys(names).filter((name) => errors[name]);
  const selectedCode = codes.find(
    (item) =>
      item.kode.toLocaleLowerCase('id-ID') ===
      values.kodeKlasifikasi.trim().toLocaleLowerCase('id-ID'),
  );
  const suggestedCode = automaticCode(values.nomorSurat, codes);
  const validLink = safeDocumentUrl(values.googleDriveLink);
  const displayedLabels = (labels.data || []).filter((label) =>
    label.name
      .toLocaleLowerCase('id-ID')
      .includes(labelSearch.trim().toLocaleLowerCase('id-ID')),
  );
  const canSave = !saving && !classifications.isPending && codes.length > 0;
  const status = saving
    ? 'Menyimpan arsip…'
    : failure?.partial
      ? 'Arsip tersimpan · label belum lengkap'
      : errorNames.length
        ? 'Periksa kolom yang ditandai'
        : savedAt && !dirty
          ? 'Perubahan sudah tersimpan'
          : classifications.isPending
            ? 'Memuat pilihan klasifikasi…'
            : !codes.length
              ? 'Klasifikasi diperlukan untuk menyimpan'
              : complete === 3
                ? 'Informasi wajib lengkap · siap disimpan'
                : `Lengkapi ${3 - complete} kolom wajib lagi`;
  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event) => update(name, event.target.value),
    onBlur: () => blur(name),
    className: 'field',
    'aria-invalid': !!errors[name],
    'aria-describedby':
      [
        errors[name] ? `${name}-error` : '',
        hinted.includes(name) ? `${name}-hint` : '',
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  });
  return {
    classifications,
    labels,
    codes,
    values,
    labelIds,
    codeMode,
    errors,
    attempted,
    failure,
    saving,
    labelSearch,
    setLabelSearch,
    dirty,
    pendingLogout,
    blocker,
    stay,
    discard,
    suggestions,
    formRef,
    failureRef,
    focusField,
    update,
    selectAutomatic,
    toggleLabel,
    submit,
    cancel,
    validation,
    complete,
    errorNames,
    selectedCode,
    suggestedCode,
    validLink,
    displayedLabels,
    canSave,
    status,
    fieldProps,
  };
}
