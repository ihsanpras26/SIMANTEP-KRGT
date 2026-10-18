export function normalizeKlasifikasi(values) {
  const kode = String(values.kode || "").trim();
  const deskripsi = String(values.deskripsi || "").trim();
  if (!kode) throw new Error("Kode klasifikasi wajib diisi.");
  if (!deskripsi) throw new Error("Deskripsi klasifikasi wajib diisi.");
  const retention = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const years = Number(value);
    if (!Number.isSafeInteger(years) || years < 0)
      throw new Error("Retensi harus berupa jumlah tahun bulat, minimal 0.");
    return years;
  };
  return {
    kode,
    deskripsi,
    retensiAktif: retention(values.retensiAktif),
    retensiInaktif: retention(values.retensiInaktif),
  };
}

export async function saveKlasifikasi(client, values, id) {
  if (!client) throw new Error("Koneksi database belum tersedia.");
  const payload = normalizeKlasifikasi(values);
  const query = id
    ? client.from("klasifikasi").update(payload).eq("id", id)
    : client.from("klasifikasi").insert([payload]);
  const { data, error } = await query.select().single();
  if (error) throw error;
  if (!data?.id)
    throw new Error(
      "Klasifikasi tidak tersimpan. Periksa izin akses lalu coba lagi.",
    );
  return data;
}

export async function deleteKlasifikasi(client, id) {
  if (!client) throw new Error("Koneksi database belum tersedia.");
  if (!id) throw new Error("Pilih klasifikasi yang akan dihapus.");
  const { data, error } = await client
    .from("klasifikasi")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.some((row) => String(row.id) === String(id)))
    throw new Error(
      "Klasifikasi tidak terhapus. Data mungkin sudah berubah atau akses ditolak.",
    );
  return data[0];
}

export function groupKlasifikasi(rows, search = "") {
  const term = search.trim().toLocaleLowerCase("id");
  const matches = rows.filter((row) =>
    `${row.kode} ${row.deskripsi}`.toLocaleLowerCase("id").includes(term),
  );
  const visible = !term
    ? rows
    : rows.filter((row) =>
        matches.some(
          (match) =>
            row.kode === match.kode ||
            row.kode.startsWith(`${match.kode}.`) ||
            match.kode.startsWith(`${row.kode}.`),
        ),
      );
  const groups = new Map();
  for (const row of visible) {
    const code = row.kode.split(".")[0];
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(row);
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b, "id", { numeric: true }))
    .map(([code, items]) => ({
      code,
      title:
        rows.find((row) => row.kode === code)?.deskripsi ||
        "Kelompok klasifikasi",
      items: items.toSorted((a, b) =>
        a.kode.localeCompare(b.kode, "id", { numeric: true }),
      ),
    }));
}
