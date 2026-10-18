function requireClient(client) {
  if (!client)
    throw new Error(
      "Koneksi database belum tersedia. Muat ulang halaman lalu coba lagi.",
    );
}

export async function saveLabel(client, values, id) {
  requireClient(client);
  const name = String(values.name || "").trim();
  if (!name) throw new Error("Nama label wajib diisi.");
  const payload = {
    name,
    color: values.color || "violet",
    icon: values.icon || "Tag",
  };
  const query = id
    ? client.from("labels").update(payload).eq("id", id)
    : client.from("labels").insert([payload]);
  const { data, error } = await query.select().single();
  if (error) throw error;
  if (!data?.id)
    throw new Error(
      "Label tidak tersimpan. Periksa izin akses lalu coba lagi.",
    );
  return data;
}

export async function deleteLabel(client, id) {
  requireClient(client);
  if (!id) throw new Error("Pilih label yang akan dihapus.");
  const { data, error } = await client
    .from("labels")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.some((row) => String(row.id) === String(id)))
    throw new Error(
      "Label tidak terhapus. Data mungkin sudah berubah atau akses ditolak.",
    );
  return data[0];
}

async function readLinks(client, ids, labelId) {
  const links = new Set();
  let offset = 0;
  for (;;) {
    const { data, count, error } = await client
      .from("arsip_labels")
      .select("arsip_id", { count: "exact" })
      .eq("label_id", labelId)
      .in("arsip_id", ids)
      .order("arsip_id")
      .range(offset, offset + 199);
    if (error) throw error;
    for (const row of data || []) links.add(String(row.arsip_id));
    offset += data?.length || 0;
    if (!data?.length || (count !== null && offset >= count)) return links;
  }
}

// Requests are bounded to keep URL filters small. A later batch can fail after
// earlier batches commit, so callers must invalidate their queries on settled.
export async function assignArchiveLabels(
  client,
  ids,
  labelId,
  action = "add",
) {
  requireClient(client);
  const targets = [
    ...new Set(
      (ids || [])
        .filter((id) => id !== null && id !== undefined && id !== "")
        .map(String),
    ),
  ];
  if (!targets.length || !labelId)
    throw new Error("Pilih arsip dan label terlebih dahulu.");
  if (!["add", "remove"].includes(action))
    throw new Error("Tindakan label tidak valid.");
  let changed = 0;
  try {
    for (let offset = 0; offset < targets.length; offset += 200) {
      const batch = targets.slice(offset, offset + 200);
      if (action === "add") {
        const { data, count, error } = await client
          .from("arsip_labels")
          .upsert(
            batch.map((arsipId) => ({ arsip_id: arsipId, label_id: labelId })),
            {
              onConflict: "arsip_id,label_id",
              ignoreDuplicates: true,
              count: "exact",
            },
          )
          .select("arsip_id");
        if (error) throw error;
        changed += count ?? data?.length ?? 0;
        const after = await readLinks(client, batch, labelId);
        if (batch.some((id) => !after.has(id)))
          throw new Error(
            "Label belum diterapkan ke semua arsip. Periksa izin akses lalu coba lagi.",
          );
      } else {
        const before = await readLinks(client, batch, labelId);
        if (!before.size) continue;
        const { data, count, error } = await client
          .from("arsip_labels")
          .delete({ count: "exact" })
          .eq("label_id", labelId)
          .in("arsip_id", batch)
          .select("arsip_id");
        if (error) throw error;
        changed += count ?? data?.length ?? 0;
        const after = await readLinks(client, batch, labelId);
        if (after.size)
          throw new Error(
            "Label belum dilepas dari semua arsip. Periksa izin akses lalu coba lagi.",
          );
      }
    }
  } catch (cause) {
    const error = new Error(
      `${changed ? `${changed} arsip sudah diperbarui. ` : ""}${cause.message || "Perubahan label gagal."}`,
    );
    error.code = cause.code;
    error.changedCount = changed;
    throw error;
  }
  return {
    changed,
    unchanged: targets.length - changed,
    total: targets.length,
  };
}

export async function fetchLabelUsage(client, signal) {
  requireClient(client);
  let totalQuery = client
    .from("arsip")
    .select("id", { count: "exact", head: true });
  if (signal) totalQuery = totalQuery.abortSignal(signal);
  const total = await totalQuery;
  if (total.error) throw total.error;
  const counts = {};
  let offset = 0;
  for (;;) {
    let query = client
      .from("arsip_labels")
      .select("arsip_id,label_id", { count: "exact" })
      .order("arsip_id")
      .order("label_id")
      .range(offset, offset + 999);
    if (signal) query = query.abortSignal(signal);
    const { data, count, error } = await query;
    if (error) throw error;
    for (const link of data || [])
      counts[link.label_id] = (counts[link.label_id] || 0) + 1;
    offset += data?.length || 0;
    if (!data?.length || (count !== null && offset >= count)) break;
  }
  return { totalArchives: total.count || 0, counts };
}
