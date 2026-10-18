import {
  parseArchiveDate,
  normalizeArchive,
  localDate,
} from "./archiveFields.js";

export async function generateTemplate(classifications = []) {
  const XLSX = await import("xlsx");
  const rows = [
    {
      nomor_surat: "001/KRGT/2026",
      tanggal_surat: localDate(),
      perihal: "Contoh surat undangan",
      kode_klasifikasi: classifications[0]?.kode || "",
      pengirim: "UPT Kebun Raya Gunung Tidar",
      tujuan_surat: "",
      google_drive_link: "",
    },
  ];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [24, 18, 44, 22, 36, 36, 55].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Arsip");
  XLSX.writeFile(workbook, "template-arsip.xlsx");
}
export async function parseFile(file) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    raw: true,
  });
  if (!workbook.SheetNames.length)
    throw new Error("File tidak memiliki lembar kerja.");
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    defval: "",
  });
}
const columns = {
  nomor_surat: "nomorSurat",
  tanggal_surat: "tanggalSurat",
  perihal: "perihal",
  kode_klasifikasi: "kodeKlasifikasi",
  pengirim: "pengirim",
  tujuan_surat: "tujuanSurat",
  google_drive_link: "googleDriveLink",
};
export async function validateAllRows(
  rows,
  client,
  classifications,
  _labels = [],
  mode = "create",
  onProgress,
) {
  if (!client) throw new Error("Koneksi database belum tersedia.");
  const numbers = rows.map((row) => String(row.nomor_surat ?? "").trim());
  const occurrences = new Map();
  numbers
    .filter(Boolean)
    .forEach((number) =>
      occurrences.set(number, (occurrences.get(number) || 0) + 1),
    );
  const unique = [...occurrences.keys()];
  const existing = new Map();
  for (let offset = 0; offset < unique.length; offset += 100) {
    let fetched = 0;
    while (true) {
      const { data, error, count } = await client
        .from("arsip")
        .select("id,nomorSurat,tanggalSurat,tanggalRetensi", { count: "exact" })
        .in("nomorSurat", unique.slice(offset, offset + 100))
        .order("id")
        .range(fetched, fetched + 99);
      if (error) throw new Error(error.message);
      if (!data?.length) {
        if (count != null && fetched < count)
          throw new Error(
            "Pemeriksaan nomor surat belum lengkap. Coba validasi ulang.",
          );
        break;
      }
      for (const item of data) {
        if (existing.has(item.nomorSurat))
          existing.set(item.nomorSurat, { ambiguous: true });
        else existing.set(item.nomorSurat, item);
      }
      fetched += data.length;
      if (count != null && fetched >= count) break;
    }
  }
  return rows.map((row, index) => {
    const number = numbers[index];
    const found = existing.get(number);
    const isUpdate = mode === "update" && !!found?.id;
    const supplied = Object.fromEntries(
      Object.entries(columns)
        .filter(([key]) => row[key] != null && String(row[key]).trim() !== "")
        .map(([key, field]) => [field, String(row[key]).trim()]),
    );
    if (row.tanggal_surat !== "" && row.tanggal_surat != null)
      supplied.tanggalSurat = parseArchiveDate(row.tanggal_surat);
    const merged = isUpdate
      ? {
          ...found,
          perihal: "Data tersimpan",
          kodeKlasifikasi: classifications[0]?.kode,
          ...supplied,
        }
      : supplied;
    const normalized = normalizeArchive(merged, classifications, found);
    const errors = Object.values(normalized.errors);
    if (found?.ambiguous)
      errors.push(
        "Nomor surat cocok dengan lebih dari satu arsip. Perbaiki data sebelum mengimpor.",
      );
    if (found && mode === "create")
      errors.push("Nomor surat sudah ada di database.");
    if (number && occurrences.get(number) > 1)
      errors.push("Nomor surat berulang dalam file ini.");
    if (supplied.tanggalSurat > localDate())
      errors.push("Tanggal surat tidak boleh di masa depan.");
    const payload = isUpdate
      ? Object.fromEntries(
          Object.keys(supplied).map((key) => [key, normalized.payload[key]]),
        )
      : normalized.payload;
    if (isUpdate && "tanggalSurat" in supplied)
      payload.tanggalRetensi = normalized.payload.tanggalRetensi;
    onProgress?.(Math.round(((index + 1) / rows.length) * 100));
    return {
      index,
      rowNumber: Number.isInteger(row.__rowNum__)
        ? row.__rowNum__ + 1
        : index + 2,
      row,
      valid: errors.length === 0,
      errors,
      payload,
      isUpdate,
      updateTargetId: isUpdate ? found.id : null,
    };
  });
}
export async function importValidRows(validatedData, client, onProgress) {
  const valid = validatedData.filter((item) => item.valid);
  const results = { total: valid.length, success: 0, failed: 0, errors: [] };
  for (let i = 0; i < valid.length; i++) {
    const item = valid[i];
    try {
      // A preview can become stale if another user writes before the import.
      if (!item.isUpdate && item.payload.nomorSurat) {
        const check = await client
          .from("arsip")
          .select("id")
          .eq("nomorSurat", item.payload.nomorSurat)
          .limit(1);
        if (check.error) throw new Error(check.error.message);
        if (check.data?.length)
          throw new Error(
            "Nomor surat sudah terdaftar sejak pratinjau dibuat.",
          );
      }
      const query = item.isUpdate
        ? client
            .from("arsip")
            .update(item.payload)
            .eq("id", item.updateTargetId)
        : client
            .from("arsip")
            .insert({ ...item.payload, created_at: new Date().toISOString() });
      const { data, error } = await query.select("id").single();
      if (error) throw new Error(error.message);
      if (!data?.id)
        throw new Error("Data tidak tersimpan. Periksa izin akses.");
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: item.rowNumber ?? item.index + 2,
        nomorSurat: item.row.nomor_surat || "—",
        perihal: item.row.perihal,
        error: error.message,
      });
    }
    onProgress?.(Math.round(((i + 1) / valid.length) * 100));
  }
  return results;
}
