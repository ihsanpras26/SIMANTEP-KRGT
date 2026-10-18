function requireClient(client) {
  if (!client) throw new Error("Koneksi database belum tersedia.");
}
export async function deleteArchive(client, id) {
  requireClient(client);
  if (!id) throw new Error("ID arsip tidak valid.");
  const { data, error } = await client
    .from("arsip")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length)
    throw new Error("Arsip tidak ditemukan atau akses hapus tidak diizinkan.");
  return data;
}
export async function saveArchive(client, { id, payload, labelIds = [] }) {
  requireClient(client);
  if (payload.nomorSurat) {
    let lookup = client
      .from("arsip")
      .select("id")
      .eq("nomorSurat", payload.nomorSurat);
    if (id) lookup = lookup.neq("id", id);
    const { data, error } = await lookup.limit(1);
    if (error) throw new Error(error.message);
    if (data?.length)
      throw new Error("Nomor surat sudah digunakan arsip lain.");
  }
  const mutation = id
    ? client.from("arsip").update(payload).eq("id", id)
    : client
        .from("arsip")
        .insert({ ...payload, created_at: new Date().toISOString() });
  const { data: record, error } = await mutation.select().single();
  if (error) throw new Error(error.message);
  if (!record?.id)
    throw new Error("Arsip tidak ditemukan atau akses simpan tidak diizinkan.");
  try {
    const current = await client
      .from("arsip_labels")
      .select("label_id")
      .eq("arsip_id", record.id);
    if (current.error) throw new Error(current.error.message);
    const before = new Set(
      (current.data || []).map((link) => String(link.label_id)),
    );
    const after = new Set(labelIds.map(String));
    const added = [...after].filter((labelId) => !before.has(labelId));
    const removed = [...before].filter((labelId) => !after.has(labelId));
    // Add first and remove only changed relationships; never wipe all labels.
    if (added.length) {
      const result = await client.from("arsip_labels").upsert(
        added.map((labelId) => ({ arsip_id: record.id, label_id: labelId })),
        { onConflict: "arsip_id,label_id", ignoreDuplicates: true },
      );
      if (result.error) throw new Error(result.error.message);
      const verification = await client
        .from("arsip_labels")
        .select("label_id")
        .eq("arsip_id", record.id)
        .in("label_id", added);
      if (verification.error) throw new Error(verification.error.message);
      const saved = new Set(
        (verification.data || []).map((link) => String(link.label_id)),
      );
      if (added.some((labelId) => !saved.has(labelId)))
        throw new Error(
          "Sebagian label tidak tersimpan. Periksa akses lalu coba lagi.",
        );
    }
    if (removed.length) {
      const result = await client
        .from("arsip_labels")
        .delete()
        .eq("arsip_id", record.id)
        .in("label_id", removed)
        .select("label_id");
      if (result.error) throw new Error(result.error.message);
      if (result.data?.length !== removed.length)
        throw new Error(
          "Sebagian label tidak dapat dilepas. Periksa akses lalu coba lagi.",
        );
    }
    return { record, labelError: null };
  } catch (labelError) {
    // Keep saved identity so a retry updates instead of duplicating the archive.
    return {
      record,
      labelError: labelError.message || "Gagal menyimpan label.",
    };
  }
}
