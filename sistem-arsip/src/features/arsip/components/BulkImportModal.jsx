import { useRef, useState } from "react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useKlasifikasi } from "../../klasifikasi/hooks/useKlasifikasi";
import {
  generateTemplate,
  parseFile,
  validateAllRows,
  importValidRows,
} from "../utils/importHelpers";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from "../../../components/ui";

export default function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create",
  supabase,
}) {
  const classifications = useKlasifikasi();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const inputRef = useRef(null);
  const running = useRef(false);
  const validCount = rows.filter((row) => row.valid).length;
  const invalidCount = rows.length - validCount;
  const filteredRows = showErrors ? rows.filter((row) => !row.valid) : rows;
  const preview = filteredRows.slice((previewPage - 1) * 25, previewPage * 25);
  const close = () => {
    if (!running.current) onClose();
  };
  const choose = async (selected) => {
    if (!selected || running.current) return;
    if (!/\.(xlsx?|csv)$/i.test(selected.name)) {
      setError("Pilih file Excel (.xlsx, .xls) atau CSV.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError(
        "Ukuran file maksimal 10 MB. Bagi file menjadi beberapa bagian.",
      );
      return;
    }
    running.current = true;
    setBusy("Membaca file");
    setError("");
    setResults(null);
    setRows([]);
    setFile(selected);
    setPreviewPage(1);
    setShowErrors(false);
    try {
      const data = await parseFile(selected);
      if (!data.length)
        throw new Error(
          "File kosong. Gunakan template dan isi baris data terlebih dahulu.",
        );
      setBusy("Memvalidasi data");
      const validated = await validateAllRows(
        data,
        supabase,
        classifications.data || [],
        [],
        mode,
      );
      setRows(validated);
    } catch (failure) {
      setError(failure.message || "File gagal dibaca.");
      setFile(null);
    } finally {
      running.current = false;
      setBusy("");
    }
  };
  const runImport = async () => {
    if (running.current || !validCount || results) return;
    running.current = true;
    setBusy("Menyimpan arsip");
    setProgress(0);
    setError("");
    try {
      const imported = await importValidRows(rows, supabase, setProgress);
      setResults(imported);
      if (imported.success) {
        await queryClient.invalidateQueries({ queryKey: ["arsip"] });
        await queryClient.invalidateQueries({ queryKey: ["labels"] });
        await onSuccess?.();
      }
    } catch (failure) {
      setError(
        failure.message ||
          "Impor gagal. Periksa hasil sebelum mencoba kembali.",
      );
    } finally {
      running.current = false;
      setBusy("");
    }
  };
  const template = async () => {
    try {
      await generateTemplate(classifications.data || []);
    } catch {
      setError("Template belum dapat diunduh. Coba kembali.");
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={close} size="xl">
      <ModalHeader onClose={busy ? undefined : close}>
        <ModalTitle>
          {mode === "update"
            ? "Perbarui arsip secara massal."
            : "Bawa arsip Anda ke sini."}
        </ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="mb-6 text-sm leading-relaxed text-[var(--text-muted)]">
          {mode === "update"
            ? "Nomor surat yang cocok akan diperbarui; nomor baru akan ditambahkan. Kolom kosong tidak menghapus data lama."
            : "Unggah spreadsheet, periksa hasil validasi, lalu simpan baris yang valid."}{" "}
          Format tanggal: YYYY-MM-DD. Label tidak diubah melalui impor.
        </p>
        <ol
          className="mb-8 flex flex-wrap gap-5 text-xs text-[var(--text-muted)]"
          aria-label="Tahapan impor"
        >
          {["Pilih file", "Periksa data", "Simpan arsip"].map(
            (label, index) => (
              <li
                key={label}
                className={`flex items-center gap-2 ${index === (results ? 2 : rows.length ? 1 : 0) ? "text-[var(--accent-text)]" : ""}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">
                  {index + 1}
                </span>
                {label}
              </li>
            ),
          )}
        </ol>
        {classifications.error && (
          <div role="alert" className="dialog-error mb-4">
            Klasifikasi gagal dimuat.{" "}
            <button
              className="btn-ghost"
              onClick={() => classifications.refetch()}
            >
              Coba lagi
            </button>
          </div>
        )}
        {error && (
          <div role="alert" className="dialog-error mb-4">
            {error}
          </div>
        )}
        {!file && !busy && (
          <div
            className="rounded-3xl border border-dashed border-[var(--line)] px-6 py-12 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!classifications.isPending && !classifications.error)
                choose(event.dataTransfer.files[0]);
            }}
          >
            <Upload
              size={32}
              className="mx-auto mb-5 text-[var(--accent-text)]"
            />
            <h3 className="mb-2 text-xl font-normal">Letakkan file di sini</h3>
            <p className="mb-6 text-sm text-[var(--text-muted)]">
              Excel atau CSV, maksimal 10 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".xlsx,.xls,.csv"
              aria-label="Pilih file arsip"
              disabled={classifications.isPending || !!classifications.error}
              onChange={(event) => choose(event.target.files[0])}
            />
            <button
              className="btn-primary"
              disabled={classifications.isPending || !!classifications.error}
              onClick={() => inputRef.current?.click()}
            >
              Pilih file
              <Upload size={16} />
            </button>
            <div className="mt-6">
              <button
                className="btn-ghost"
                onClick={template}
                disabled={classifications.isPending}
              >
                <Download size={16} /> Unduh template
              </button>
            </div>
          </div>
        )}
        {busy && (
          <div className="py-10 text-center" role="status">
            <Loader2
              size={28}
              className="mx-auto mb-4 animate-spin text-[#8052ff]"
            />
            <p>{busy}…</p>
            {busy === "Menyimpan arsip" && (
              <>
                <progress
                  className="mt-5 h-2 w-full accent-[#8052ff]"
                  max="100"
                  value={progress}
                  aria-label="Progres impor"
                />
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {progress}% · Tunggu hingga proses selesai
                </p>
              </>
            )}
          </div>
        )}
        {file && !busy && !results && rows.length > 0 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 text-sm">
                <FileSpreadsheet
                  size={18}
                  className="shrink-0 text-[var(--accent-text)]"
                />
                <span className="truncate">{file.name}</span>
              </p>
              <button
                className="btn-ghost"
                onClick={() => {
                  setFile(null);
                  setRows([]);
                }}
              >
                <X size={15} /> Ganti file
              </button>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <span className="text-[var(--success)]">
                {validCount} baris valid
              </span>
              <button
                className="text-[var(--warning)] underline-offset-4 hover:underline"
                aria-pressed={showErrors}
                onClick={() => {
                  setShowErrors(!showErrors);
                  setPreviewPage(1);
                }}
              >
                {invalidCount} perlu diperbaiki{" "}
                {showErrors ? "· Tampilkan semua" : "· Lihat"}
              </button>
            </div>
            <div
              className="max-h-80 overflow-auto"
              tabIndex={0}
              role="region"
              aria-label="Pratinjau impor"
            >
              <table className="data-table w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>Nomor surat / Perihal</th>
                    <th>Hasil pemeriksaan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((item) => (
                    <tr key={item.index}>
                      <td>{item.rowNumber}</td>
                      <td>
                        <span className="block text-sm">
                          {item.row.nomor_surat || "Tanpa nomor"}
                        </span>
                        <span className="line-clamp-1 text-xs text-[var(--text-muted)]">
                          {item.row.perihal || "Perihal tidak diubah"}
                        </span>
                      </td>
                      <td className="text-xs">
                        {item.valid ? (
                          <span className="text-[var(--success)]">
                            {item.isUpdate ? "Perbarui arsip" : "Tambah arsip"}
                          </span>
                        ) : (
                          <ul className="space-y-1 text-[var(--warning)]">
                            {item.errors.map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRows.length > 25 && (
              <div className="flex items-center justify-between text-sm">
                <button
                  className="btn-ghost"
                  disabled={previewPage === 1}
                  onClick={() => setPreviewPage(previewPage - 1)}
                >
                  Sebelumnya
                </button>
                <span>
                  {previewPage} / {Math.ceil(filteredRows.length / 25)}
                </span>
                <button
                  className="btn-ghost"
                  disabled={previewPage * 25 >= filteredRows.length}
                  onClick={() => setPreviewPage(previewPage + 1)}
                >
                  Berikutnya
                </button>
              </div>
            )}
            {invalidCount > 0 && (
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                Hanya {validCount} baris valid yang akan disimpan. Perbaiki
                baris lainnya di spreadsheet, lalu impor kembali.
              </p>
            )}
          </div>
        )}
        {results && (
          <div className="space-y-6">
            <Check size={36} className="text-[var(--success)]" />
            <div>
              <h3 className="text-2xl font-normal">
                {results.success} arsip berhasil disimpan.
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {results.failed
                  ? `${results.failed} baris gagal disimpan. Periksa rincian di bawah.`
                  : "Data sudah tersedia di daftar arsip."}
              </p>
            </div>
            {results.errors.length > 0 && (
              <ul className="max-h-64 space-y-3 overflow-auto text-sm">
                {results.errors.map((item) => (
                  <li key={item.row} className="text-[var(--warning)]">
                    Baris {item.row} · {item.nomorSurat}: {item.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </ModalContent>
      <ModalFooter>
        <button className="btn-secondary" disabled={!!busy} onClick={close}>
          {results ? "Tutup" : "Batal"}
        </button>
        {rows.length > 0 && !results && (
          <button
            className="btn-primary"
            disabled={!validCount || !!busy}
            onClick={runImport}
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Simpan {validCount} arsip
          </button>
        )}
        {results && (
          <button
            className="btn-primary"
            onClick={() => {
              setFile(null);
              setRows([]);
              setResults(null);
              setError("");
            }}
          >
            Impor file lain
          </button>
        )}
      </ModalFooter>
    </Modal>
  );
}
