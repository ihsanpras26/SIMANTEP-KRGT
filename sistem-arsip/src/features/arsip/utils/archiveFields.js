import { getArsipStatus } from "./statusUtils.js";

export function parseArchiveDate(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date)
    return Number.isNaN(value.getTime())
      ? ""
      : value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 0 && value < 2958466)
    return new Date(Math.floor(value - 25569) * 86400000)
      .toISOString()
      .slice(0, 10);
  const text = String(value).trim();
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  const iso = local
    ? `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`
    : text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : "";
}
export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatArchiveDate(value) {
  const date = parseArchiveDate(value);
  return date
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : "—";
}
export function safeDocumentUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function normalizeArchive(
  values,
  classifications = [],
  existing = null,
) {
  const payload = Object.fromEntries(
    [
      "nomorSurat",
      "perihal",
      "kodeKlasifikasi",
      "pengirim",
      "tujuanSurat",
      "googleDriveLink",
    ].map((key) => [key, String(values[key] ?? "").trim()]),
  );
  const errors = {};
  payload.tanggalSurat = parseArchiveDate(values.tanggalSurat);
  if (payload.perihal.length < 3)
    errors.perihal = "Perihal minimal 3 karakter.";
  if (!payload.tanggalSurat)
    errors.tanggalSurat = "Masukkan tanggal surat yang valid.";
  const classification = classifications.find(
    (item) =>
      item.kode.toLocaleLowerCase() ===
      payload.kodeKlasifikasi.toLocaleLowerCase(),
  );
  if (!classification)
    errors.kodeKlasifikasi = "Pilih kode klasifikasi yang tersedia.";
  else payload.kodeKlasifikasi = classification.kode;
  if (payload.googleDriveLink && !safeDocumentUrl(payload.googleDriveLink))
    errors.googleDriveLink =
      "Gunakan tautan dokumen http:// atau https:// yang valid.";
  if (payload.tanggalSurat) {
    if (
      existing &&
      parseArchiveDate(existing.tanggalSurat) === payload.tanggalSurat
    )
      payload.tanggalRetensi = existing.tanggalRetensi ?? null;
    else {
      // Retain the existing five-year write rule and separate permanent-status rule.
      const retention = new Date(`${payload.tanggalSurat}T00:00:00Z`);
      retention.setUTCFullYear(retention.getUTCFullYear() + 5);
      payload.tanggalRetensi = retention.toISOString();
    }
  }
  return { payload, errors };
}
export function documentLinks(archive, supabaseUrl) {
  const empty = { open: "", preview: "", download: "" };
  if (archive.googleDriveLink) {
    const open = safeDocumentUrl(archive.googleDriveLink);
    if (!open) return empty;
    const url = new URL(open);
    const id =
      url.hostname === "drive.google.com"
        ? url.pathname.match(/\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id")
        : null;
    if (id && /^[\w-]+$/.test(id))
      return {
        open,
        preview: `https://drive.google.com/file/d/${id}/preview`,
        download: `https://drive.google.com/uc?export=download&id=${id}`,
      };
    return { open, preview: "", download: open };
  }
  if (!archive.filePath || !safeDocumentUrl(supabaseUrl)) return empty;
  const path = String(archive.filePath)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  const open = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/arsip-files/${path}`;
  return {
    open,
    preview: /\.(pdf|png|jpe?g|webp)$/i.test(archive.filePath) ? open : "",
    download: `${open}?download=`,
  };
}
export function exportRows(rows, classifications) {
  return rows.map((item) => ({
    nomor_surat: item.nomorSurat || "",
    tanggal_surat: parseArchiveDate(item.tanggalSurat),
    perihal: item.perihal || "",
    kode_klasifikasi: item.kodeKlasifikasi || "",
    pengirim: item.pengirim || "",
    tujuan_surat: item.tujuanSurat || "",
    google_drive_link: item.googleDriveLink || "",
    label: (item.arsip_labels || [])
      .map((link) => link.labels?.name)
      .filter(Boolean)
      .join("; "),
    status: getArsipStatus(item, classifications),
    tanggal_retensi: parseArchiveDate(item.tanggalRetensi),
  }));
}
