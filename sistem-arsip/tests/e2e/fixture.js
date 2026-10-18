export const admin = {
  id: "admin-id",
  email: "admin@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
};
export const classifications = [
  {
    id: "k1",
    kode: "005",
    deskripsi: "Undangan dan koordinasi",
    retensiAktif: 5,
    retensiInaktif: 2,
  },
  {
    id: "k2",
    kode: "521",
    deskripsi: "Konservasi tanaman",
    retensiAktif: 0,
    retensiInaktif: 0,
  },
];
export const labels = [
  { id: "l1", name: "Operasional", color: "bg-blue-500", icon: "Tag" },
  { id: "l2", name: "Prioritas", color: "violet", icon: "Star" },
];
export function makeRows() {
  return Array.from({ length: 37 }, (_, i) => ({
    id: `a${i + 1}`,
    nomorSurat: `005/${String(i + 1).padStart(3, "0")}/KRGT/2026`,
    perihal: `Dokumen koordinasi ${i + 1}`,
    tanggalSurat: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
    tanggalRetensi:
      i % 3 === 0 ? "2020-01-01T00:00:00Z" : "2031-01-01T00:00:00Z",
    kodeKlasifikasi: "005",
    pengirim: i % 2 ? "Dinas Lingkungan Hidup" : "Sekretariat KRGT",
    tujuanSurat: "Kepala UPT",
    googleDriveLink: "https://drive.google.com/file/d/demo_file/view",
    created_at: "2026-01-01T00:00:00Z",
    arsip_labels: i % 2 ? [{ label_id: "l1", labels: labels[0] }] : [],
  }));
}
export function session() {
  const payload = Buffer.from(
    JSON.stringify({
      sub: admin.id,
      email: admin.email,
      aud: "authenticated",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: "fixture-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: admin,
  };
}
export async function fixture(
  page,
  { authenticated = true, fail = null } = {},
) {
  const state = {
    rows: makeRows(),
    labels: [...labels],
    classifications: [...classifications],
    requests: [],
    fail,
  };
  if (authenticated)
    await page.addInitScript(
      (value) =>
        localStorage.setItem("sb-fixture-auth-token", JSON.stringify(value)),
      session(),
    );
  await page.routeWebSocket("**/realtime/**", (socket) => socket.close());
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1") return route.continue();
    if (url.hostname !== "fixture.supabase.co") return route.abort();
    if (url.pathname.startsWith("/auth/v1/")) {
      if (url.pathname.endsWith("/logout"))
        return route.fulfill({ status: 204 });
      return route.fulfill({ json: session() });
    }
    if (!url.pathname.startsWith("/rest/v1/"))
      return route.fulfill({ status: 200, json: {} });
    const table = url.pathname.split("/").at(-1);
    const method = request.method();
    const params = url.searchParams;
    const body = request.postDataJSON();
    state.requests.push({
      table,
      method,
      params: Object.fromEntries(params),
      body,
    });
    if (state.fail?.(table, method))
      return route.fulfill({
        status: 403,
        json: { code: "42501", message: "Akses ditolak untuk pengujian" },
      });
    let data =
      table === "arsip"
        ? state.rows
        : table === "labels"
          ? state.labels
          : table === "klasifikasi"
            ? state.classifications
            : state.rows.flatMap((row) =>
                row.arsip_labels.map((link) => ({
                  arsip_id: row.id,
                  label_id: link.label_id,
                })),
              );
    data = [...data];
    for (const [key, value] of params) {
      if (
        ["select", "order", "offset", "limit", "or", "on_conflict"].includes(
          key,
        )
      )
        continue;
      if (key === "matched_labels.label_id") {
        data = data.filter((row) =>
          row.arsip_labels?.some((link) => link.label_id === value.slice(3)),
        );
        continue;
      }
      if (value.startsWith("eq."))
        data = data.filter((row) => String(row[key]) === value.slice(3));
      if (value.startsWith("neq."))
        data = data.filter((row) => String(row[key]) !== value.slice(4));
      if (value.startsWith("in.(")) {
        const wanted = value
          .slice(4, -1)
          .split(",")
          .map((v) => v.replaceAll('"', ""));
        data = data.filter((row) => wanted.includes(String(row[key])));
      }
      if (value.startsWith("gte."))
        data = data.filter((row) => row[key] >= value.slice(4));
      if (value.startsWith("lt."))
        data = data.filter((row) => row[key] < value.slice(3));
    }
    const search = params.get("or")?.match(/imatch\."([^"]*)"/)?.[1];
    if (search)
      data = data.filter((row) =>
        ["nomorSurat", "perihal", "pengirim"].some((key) =>
          String(row[key] || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      );
    if (method === "POST") {
      const inserted = (Array.isArray(body) ? body : [body]).map(
        (row, index) => ({
          id: `new-${Date.now()}-${index}`,
          arsip_labels: [],
          ...row,
        }),
      );
      if (table === "arsip") state.rows.push(...inserted);
      if (table === "labels") state.labels.push(...inserted);
      if (table === "klasifikasi") state.classifications.push(...inserted);
      if (table === "arsip_labels")
        for (const row of inserted) {
          const archive = state.rows.find((a) => a.id === row.arsip_id);
          if (
            archive &&
            !archive.arsip_labels.some((l) => l.label_id === row.label_id)
          )
            archive.arsip_labels.push({
              label_id: row.label_id,
              labels: state.labels.find((l) => l.id === row.label_id),
            });
        }
      data = inserted;
    }
    if (method === "PATCH") {
      data.forEach((row) => Object.assign(row, body));
    }
    if (method === "DELETE") {
      if (table === "arsip")
        state.rows = state.rows.filter((row) => !data.includes(row));
      if (table === "labels")
        state.labels = state.labels.filter((row) => !data.includes(row));
      if (table === "klasifikasi")
        state.classifications = state.classifications.filter(
          (row) => !data.includes(row),
        );
      if (table === "arsip_labels")
        for (const item of data) {
          const archive = state.rows.find((a) => a.id === item.arsip_id);
          if (archive)
            archive.arsip_labels = archive.arsip_labels.filter(
              (link) => link.label_id !== item.label_id,
            );
        }
    }
    const orders = (params.get("order") || "").split(",").filter(Boolean);
    data.sort((a, b) => {
      for (const order of orders) {
        const [key, direction] = order.split(".");
        const diff = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
        if (diff) return direction === "desc" ? -diff : diff;
      }
      return 0;
    });
    const count = data.length;
    const offset = Number(params.get("offset") || 0);
    data = data.slice(offset, offset + Number(params.get("limit") || 1000));
    const object = request
      .headers()
      .accept?.includes("application/vnd.pgrst.object");
    const result = object ? data[0] || null : data;
    return route.fulfill({
      status: 200,
      body: method === "HEAD" ? "" : JSON.stringify(result),
      headers: {
        "Content-Type": "application/json",
        "Content-Range": `${offset}-${offset + data.length - 1}/${count}`,
        "Access-Control-Expose-Headers": "Content-Range",
      },
    });
  });
  return state;
}
