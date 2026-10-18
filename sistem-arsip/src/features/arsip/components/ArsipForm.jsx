import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  FolderTree,
  Info,
  Link2,
  Loader2,
  Save,
  Tag,
  Users,
} from 'lucide-react';
import LabelBadge from '../../labels/components/LabelBadge';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from '../../../components/ui';
import {
  useArchiveForm,
  ARCHIVE_FIELD_NAMES as names,
  ARCHIVE_REQUIRED_FIELDS as required,
} from '../hooks/useArchiveForm';
import ClassificationPicker from './ClassificationPicker';

function Field({
  name,
  required: isRequired,
  optional,
  error,
  hint,
  children,
}) {
  return (
    <div className={`archive-field archive-field-${name}`}>
      <div className="archive-field-label">
        <label className="field-label" htmlFor={name}>
          {names[name]}
          {isRequired ? ' *' : ''}
        </label>
        {optional && <span>Opsional</span>}
      </div>
      {children}
      {error && (
        <p id={`${name}-error`} className="archive-field-error">
          <AlertCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && (
        <div id={`${name}-hint`} className="archive-field-hint">
          {hint}
        </div>
      )}
    </div>
  );
}

export default function ArsipForm({
  supabase,
  arsipToEdit,
  onFinish,
  returnLabel = 'Kembali ke arsip',
}) {
  const {
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
  } = useArchiveForm({ supabase, arsipToEdit, onFinish });
  return (
    <div className="archive-form-page refined-archive-form">
      <button
        type="button"
        className="btn-ghost archive-back"
        onClick={cancel}
        disabled={saving}
      >
        <ArrowLeft size={15} />
        {returnLabel}
      </button>
      <header className="archive-form-heading">
        <div>
          <h1 className="page-heading">
            {arsipToEdit ? 'Edit arsip' : 'Tambah arsip'}
          </h1>
          <p className="page-description">
            Isi informasi surat, lalu simpan arsip.
          </p>
        </div>
        <span className="archive-required-note">* Wajib diisi</span>
      </header>
      {failure && (
        <div
          ref={failureRef}
          tabIndex={-1}
          className={`archive-save-message ${failure.partial ? 'is-partial' : ''}`}
          role="alert"
          aria-label={
            failure.partial ? 'Label belum lengkap' : 'Arsip belum tersimpan'
          }
        >
          <AlertCircle size={18} />
          <div>
            <h2>
              {failure.partial
                ? 'Arsip tersimpan, label perlu dicoba lagi'
                : 'Belum berhasil menyimpan'}
            </h2>
            <p>{failure.message}</p>
            {failure.detail && (
              <details>
                <summary>Detail kendala</summary>
                <p>{failure.detail}</p>
              </details>
            )}
          </div>
        </div>
      )}
      {attempted && errorNames.length > 0 && (
        <div
          className="archive-validation-summary"
          role="alert"
          aria-label="Periksa isian berikut"
        >
          <AlertCircle size={17} />
          <div>
            <p>Periksa {errorNames.length} isian berikut</p>
            <div>
              {errorNames.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => focusField(name)}
                  aria-label={`Periksa ${names[name]}`}
                >
                  {names[name]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={saving}>
        <fieldset className="archive-form-layout" disabled={saving}>
          <div className="archive-form-fields">
            <section
              className="archive-form-card"
              aria-labelledby="archive-identity-title"
            >
              <div className="archive-section-heading">
                <span className="archive-section-icon">
                  <FileText size={18} />
                </span>
                <div>
                  <h2 id="archive-identity-title">Informasi surat</h2>
                  <p>Mulai dari perihal, tanggal, dan klasifikasi.</p>
                </div>
              </div>
              <div className="archive-fields-grid">
                <Field name="perihal" required error={errors.perihal}>
                  <textarea
                    {...fieldProps('perihal')}
                    rows={2}
                    required
                    placeholder="Contoh: Undangan rapat koordinasi"
                  />
                </Field>
                <Field name="nomorSurat" optional error={errors.nomorSurat}>
                  <input
                    {...fieldProps('nomorSurat')}
                    placeholder="005/001/KRGT/2026"
                    autoComplete="off"
                  />
                </Field>
                <Field
                  name="tanggalSurat"
                  required
                  error={errors.tanggalSurat}
                  hint="Sesuaikan dengan tanggal pada surat."
                >
                  <input {...fieldProps('tanggalSurat')} type="date" required />
                </Field>
                <Field
                  name="kodeKlasifikasi"
                  required
                  error={errors.kodeKlasifikasi}
                  hint={
                    <>
                      {classifications.isPending ? (
                        'Memuat pilihan klasifikasi…'
                      ) : selectedCode ? (
                        <>
                          <span>{selectedCode.deskripsi}</span>
                          {codeMode === 'automatic' && (
                            <span className="archive-auto-note">
                              <Check size={12} />
                              Dari nomor surat
                            </span>
                          )}
                        </>
                      ) : (
                        'Cari berdasarkan kode atau deskripsi klasifikasi.'
                      )}
                      {codeMode === 'manual' &&
                        suggestedCode &&
                        suggestedCode !== values.kodeKlasifikasi && (
                          <button
                            type="button"
                            className="archive-inline-action"
                            onClick={selectAutomatic}
                          >
                            Gunakan kode {suggestedCode}
                          </button>
                        )}
                    </>
                  }
                >
                  <ClassificationPicker
                    {...fieldProps('kodeKlasifikasi')}
                    options={codes}
                    onValueChange={(value) => update('kodeKlasifikasi', value)}
                    disabled={
                      saving || classifications.isPending || !codes.length
                    }
                    required
                  />
                </Field>
              </div>
              {classifications.isError && (
                <div className="archive-metadata-message" role="alert">
                  <Info size={15} />
                  <div>
                    <p>
                      {codes.length
                        ? 'Pilihan klasifikasi belum diperbarui. Data terakhir tetap bisa dipakai.'
                        : 'Klasifikasi belum dapat dimuat. Isian Anda tetap tersedia.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => classifications.refetch()}
                      disabled={classifications.isFetching}
                    >
                      Coba muat klasifikasi
                    </button>
                  </div>
                </div>
              )}
              {!classifications.isPending &&
                !classifications.isError &&
                !codes.length && (
                  <div className="archive-metadata-message" role="status">
                    <FolderTree size={16} />
                    <div>
                      <p>
                        Belum ada klasifikasi. Tambahkan kode untuk dapat
                        menyimpan arsip.
                      </p>
                      <Link
                        to="/klasifikasi"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Kelola klasifikasi di tab baru{' '}
                        <ArrowUpRight size={12} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => classifications.refetch()}
                      >
                        Muat ulang pilihan
                      </button>
                    </div>
                  </div>
                )}
            </section>
            <section
              className="archive-form-card"
              aria-labelledby="archive-sender-title"
            >
              <div className="archive-section-heading">
                <span className="archive-section-icon">
                  <Users size={18} />
                </span>
                <div>
                  <h2 id="archive-sender-title">Pengirim & tujuan</h2>
                  <p>Bantu mengenali asal dan penerima surat.</p>
                </div>
                <span className="archive-optional-tag">Opsional</span>
              </div>
              <div className="archive-fields-grid">
                <Field name="pengirim">
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
                </Field>
                <Field
                  name="tujuanSurat"
                  hint="Pisahkan beberapa tujuan dengan titik koma (;)."
                >
                  <input
                    {...fieldProps('tujuanSurat')}
                    placeholder="Kepala UPT; Sekretariat"
                  />
                </Field>
              </div>
            </section>
            <section
              className="archive-form-card"
              aria-labelledby="archive-document-title"
            >
              <div className="archive-section-heading">
                <span className="archive-section-icon">
                  <Link2 size={18} />
                </span>
                <div>
                  <h2 id="archive-document-title">Dokumen digital</h2>
                  <p>Tautkan surat agar mudah dibuka kembali.</p>
                </div>
                <span className="archive-optional-tag">Opsional</span>
              </div>
              <Field
                name="googleDriveLink"
                error={errors.googleDriveLink}
                hint={
                  validLink ? (
                    <span className="archive-link-feedback">
                      <CheckCircle2 size={13} />
                      Format tautan valid · {new URL(validLink).hostname}
                      <a
                        href={validLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Periksa tautan <ArrowUpRight size={11} />
                      </a>
                    </span>
                  ) : (
                    'Tempel tautan Google Drive atau dokumen daring. Pastikan izin aksesnya sesuai.'
                  )
                }
              >
                <input
                  {...fieldProps('googleDriveLink')}
                  type="url"
                  inputMode="url"
                  placeholder="https://drive.google.com/file/d/…"
                />
              </Field>
              {arsipToEdit?.filePath && (
                <p className="archive-existing-file">
                  <FileText size={14} />
                  File yang sudah tersimpan tetap tersedia saat tautan
                  dikosongkan.
                </p>
              )}
            </section>
          </div>
          <aside className="archive-form-aside">
            <section
              className="archive-readiness"
              aria-labelledby="archive-ready-title"
            >
              <h2 id="archive-ready-title">Kesiapan arsip</h2>
              <p>{complete} dari 3 informasi wajib lengkap</p>
              <div
                className="archive-ready-track"
                role="progressbar"
                aria-label="Informasi wajib lengkap"
                aria-valuemin={0}
                aria-valuemax={3}
                aria-valuenow={complete}
              >
                <span style={{ width: `${(complete / 3) * 100}%` }} />
              </div>
              <ul>
                {required.map((name) => (
                  <li key={name}>
                    {validation[name] ? (
                      <Circle size={15} />
                    ) : (
                      <CheckCircle2 size={15} className="is-complete" />
                    )}
                    <span>{names[name]}</span>
                    <span className="sr-only">
                      {validation[name] ? 'belum lengkap' : 'lengkap'}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="archive-readiness-note">
                <Info size={13} />
                <span>Tersimpan setelah Anda menekan Simpan arsip.</span>
              </div>
            </section>
            <section
              className="archive-label-card"
              aria-labelledby="archive-labels-title"
            >
              <div className="archive-label-heading">
                <h2 id="archive-labels-title">
                  <Tag size={15} />
                  Label arsip
                </h2>
                <span>
                  {labelIds.length ? `${labelIds.length} dipilih` : 'Opsional'}
                </span>
              </div>
              {labels.isPending ? (
                <p className="archive-label-notice" role="status">
                  <Loader2 size={14} className="animate-spin" />
                  Memuat label…
                </p>
              ) : labels.isError && !labels.data ? (
                <div className="archive-label-notice" role="status">
                  <p>
                    Label belum dapat dimuat. Anda tetap bisa menyimpan arsip.
                  </p>
                  <button
                    type="button"
                    onClick={() => labels.refetch()}
                    disabled={labels.isFetching}
                  >
                    Coba muat label
                  </button>
                </div>
              ) : (
                <>
                  {labels.data?.length > 6 && (
                    <input
                      className="field archive-label-search"
                      aria-label="Cari label arsip"
                      placeholder="Cari label…"
                      value={labelSearch}
                      onChange={(event) => setLabelSearch(event.target.value)}
                    />
                  )}
                  <div className="archive-label-options">
                    {displayedLabels.map((label) => (
                      <label
                        key={label.id}
                        className={`archive-label-option ${labelIds.includes(String(label.id)) ? 'is-selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={labelIds.includes(String(label.id))}
                          onChange={() => toggleLabel(String(label.id))}
                        />
                        <LabelBadge label={label} />
                      </label>
                    ))}
                  </div>
                  {!labels.data?.length && (
                    <p className="archive-label-notice">
                      Belum ada label. Anda dapat menambahkannya nanti.
                    </p>
                  )}
                  {labels.data?.length > 0 && !displayedLabels.length && (
                    <p className="archive-label-notice">
                      Label tidak ditemukan.
                    </p>
                  )}
                </>
              )}
            </section>
          </aside>
        </fieldset>
        <div className="form-savebar archive-savebar">
          <div
            className={`archive-save-status ${failure || errorNames.length ? 'has-error' : complete === 3 ? 'is-ready' : ''}`}
            role="status"
            aria-live="polite"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : failure || errorNames.length ? (
              <AlertCircle size={17} />
            ) : complete === 3 ? (
              <CheckCircle2 size={17} />
            ) : (
              <Circle size={17} />
            )}
            <span>
              {status}
              {dirty && !saving && !failure?.partial && (
                <small>Perubahan belum disimpan</small>
              )}
            </span>
          </div>
          <div className="archive-save-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={cancel}
              disabled={saving}
            >
              Batal
            </button>
            <button className="btn-primary" type="submit" disabled={!canSave}>
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving
                ? 'Menyimpan…'
                : classifications.isPending
                  ? 'Memuat klasifikasi…'
                  : 'Simpan arsip'}
            </button>
          </div>
        </div>
      </form>
      <Modal
        isOpen={blocker.state === 'blocked' || !!pendingLogout}
        onClose={stay}
        size="sm"
      >
        <ModalHeader onClose={saving ? undefined : stay}>
          <ModalTitle>Simpan perubahan dulu?</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-[var(--text-secondary)]">
            {saving
              ? 'Sedang menyimpan arsip. Tunggu sebentar.'
              : failure?.partial
                ? 'Data arsip sudah tersimpan. Label yang belum tersimpan tidak akan diterapkan jika Anda keluar.'
                : 'Ada perubahan yang belum disimpan. Pilih Lanjut mengisi untuk kembali ke form.'}
          </p>
        </ModalContent>
        <ModalFooter>
          <button className="btn-primary" disabled={saving} onClick={stay}>
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
