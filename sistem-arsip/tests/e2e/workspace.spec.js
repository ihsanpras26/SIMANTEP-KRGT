import { test, expect } from "@playwright/test";
import { fixture } from "./fixture";

test("login is isolated from archive requests and restores authenticated workspace", async ({
  page,
}) => {
  const state = await fixture(page, { authenticated: false });
  await page.goto("/arsip");
  await expect(
    page.getByRole("heading", { name: "Masuk ke SIMANTEP" }),
  ).toBeVisible();
  expect(state.requests).toHaveLength(0);
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(
    page.getByRole("heading", { name: "Daftar arsip" }),
  ).toBeVisible();
});

test("archive search, filters, pagination and direct edit preserve route state", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/arsip?page=2");
  await expect(page.getByText("11–20", { exact: true })).toBeVisible();
  await page
    .getByLabel("Cari arsip", { exact: true })
    .fill("Dokumen koordinasi 12");
  await expect(
    page.getByRole("button", { name: /^Dokumen koordinasi 12 / }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/page=2/);
  await page
    .getByRole("button", { name: "Edit Dokumen koordinasi 12", exact: true })
    .click();
  await expect(page).toHaveURL(/\/arsip\/a12\/edit/);
  await page.reload();
  await expect(page.getByLabel("Perihal *", { exact: true })).toHaveValue(
    "Dokumen koordinasi 12",
  );
  await page.getByRole("button", { name: "Kembali ke arsip" }).click();
  await expect(page).toHaveURL(/q=Dokumen/);
  await expect(page.getByLabel("Cari arsip", { exact: true })).toHaveValue(
    "Dokumen koordinasi 12",
  );
});

test("delete reaches archives only and confirms before mutation", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/arsip?q=Dokumen+koordinasi+12");
  await page
    .getByRole("button", { name: "Hapus Dokumen koordinasi 12", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Hapus arsip ini?" }),
  ).toBeVisible();
  expect(state.requests.filter((r) => r.method === "DELETE")).toHaveLength(0);
  await page.getByRole("button", { name: "Hapus arsip", exact: true }).click();
  await expect(page.getByText("Arsip berhasil dihapus.")).toBeVisible();
  expect(
    state.requests.filter((r) => r.method === "DELETE").map((r) => r.table),
  ).toEqual(["arsip"]);
  expect(state.rows.some((row) => row.id === "a12")).toBe(false);
});

test("create form saves metadata and returns to list", async ({ page }) => {
  const state = await fixture(page);
  await page.goto("/arsip/tambah");
  await page
    .getByLabel("Perihal *", { exact: true })
    .fill("Arsip baru pengujian");
  await page.getByLabel("Kode klasifikasi *", { exact: true }).fill("005");
  await page
    .getByLabel("Tujuan surat", { exact: true })
    .fill("Kepala UPT; Sekretariat");
  await page.getByRole("button", { name: "Simpan arsip" }).click();
  await expect(page).toHaveURL(/\/arsip$/);
  expect(
    state.rows.find((row) => row.perihal === "Arsip baru pengujian")
      .tujuanSurat,
  ).toBe("Kepala UPT; Sekretariat");
});

test("command search uses keyboard navigation and restores focus", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/arsip");
  await expect(
    page.getByRole("heading", { name: "Daftar arsip" }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Pencarian cepat" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Cari arsip atau halaman" })
    .fill("Dokumen koordinasi 12");
  await expect(
    page.getByRole("option", { name: /Dokumen koordinasi 12/ }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/arsip\/a12/);
  await expect(
    page.getByRole("heading", { name: "Dokumen koordinasi 12", exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
});

for (const width of [320, 768, 1440]) {
  test(`all main routes fit the viewport at ${width}px`, async ({
    page,
  }, testInfo) => {
    await fixture(page);
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/arsip",
      "/arsip?view=grid",
      "/arsip/tambah",
      "/arsip/a12",
      "/label",
      "/klasifikasi",
    ]) {
      await page.goto(route);
      await expect(page.locator("main h1").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      const overflow =
        size.scroll > size.viewport + 1
          ? await page.evaluate(() =>
              [...document.querySelectorAll("body *")]
                .filter(
                  (el) =>
                    el.getBoundingClientRect().right > window.innerWidth &&
                    !el.closest("table"),
                )
                .slice(0, 12)
                .map((el) => ({
                  tag: el.tagName,
                  className: el.className,
                  width: el.getBoundingClientRect().width,
                })),
            )
          : [];
      if (overflow.length)
        await page.screenshot({
          path: testInfo.outputPath("overflow.png"),
          fullPage: true,
        });
      expect(
        size.scroll,
        `${route}: ${JSON.stringify(overflow)}`,
      ).toBeLessThanOrEqual(size.viewport + 1);
      if (
        [320, 1440].includes(width) &&
        ["/arsip", "/label", "/klasifikasi"].includes(route)
      )
        await page.screenshot({
          path: testInfo.outputPath(`${route.slice(1)}-${width}.png`),
          fullPage: true,
        });
    }
    expect(errors).toEqual([]);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${width}.png`),
      fullPage: true,
    });
  });
}

test("export includes every matching row beyond the current page", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/arsip");
  await expect(page.getByText("1–10", { exact: true })).toBeVisible();
  expect(
    state.requests
      .filter((r) => r.table === "arsip" && r.method === "GET")
      .every((r) => Number(r.params.limit) <= 10),
  ).toBe(true);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor", exact: true }).click();
  const file = await downloaded;
  const XLSX = await import("xlsx");
  const { readFile } = await import("node:fs/promises");
  const workbook = XLSX.read(await readFile(await file.path()), {
    type: "buffer",
  });
  const exported = XLSX.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]],
  );
  expect(exported).toHaveLength(37);
  expect(new Set(exported.map((row) => row.nomor_surat)).size).toBe(37);
});

test("import previews invalid rows and saves only validated rows", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/arsip");
  await page.getByRole("button", { name: "Lainnya", exact: true }).click();
  await page.getByRole("menuitem", { name: "Impor Excel / CSV" }).click();
  await page.getByLabel("Pilih file arsip").setInputFiles({
    name: "arsip.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "nomor_surat,tanggal_surat,perihal,kode_klasifikasi\nNEW-001,2026-01-02,Arsip impor baru,005\nNEW-002,2026-02-30,Tanggal tidak valid,005\n",
    ),
  });
  await expect(page.getByText("1 baris valid", { exact: true })).toBeVisible();
  expect(state.requests.filter((r) => r.method === "POST")).toHaveLength(0);
  await page.getByRole("button", { name: "Simpan 1 arsip" }).click();
  await expect(
    page.getByRole("heading", { name: "1 arsip berhasil disimpan." }),
  ).toBeVisible();
  expect(
    state.rows.filter((row) => row.nomorSurat?.startsWith("NEW-")),
  ).toHaveLength(1);
});

test("failed label save retries the saved archive without duplicating it", async ({
  page,
}) => {
  const state = await fixture(page, {
    fail: (table, method) => table === "arsip_labels" && method === "POST",
  });
  await page.goto("/arsip/tambah");
  await page
    .getByLabel("Perihal *", { exact: true })
    .fill("Arsip dengan label");
  await page.getByLabel("Kode klasifikasi *", { exact: true }).fill("005");
  await page.getByLabel("Prioritas", { exact: true }).check();
  await page.getByRole("button", { name: "Simpan arsip" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Data arsip sudah tersimpan",
  );
  expect(
    state.rows.filter((row) => row.perihal === "Arsip dengan label"),
  ).toHaveLength(1);
  state.fail = null;
  await page.getByRole("button", { name: "Simpan arsip" }).click();
  await expect(page).toHaveURL(/\/arsip$/);
  const saved = state.rows.filter(
    (row) => row.perihal === "Arsip dengan label",
  );
  expect(saved).toHaveLength(1);
  expect(saved[0].arsip_labels.map((link) => link.label_id)).toEqual(["l2"]);
});

test("label assignment adds and removes without changing other memberships", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/arsip?q=Dokumen+koordinasi+12");
  await page
    .getByRole("button", { name: "Label Dokumen koordinasi 12", exact: true })
    .click();
  await page.getByRole("radio", { name: "Prioritas", exact: true }).check();
  await page
    .getByRole("button", { name: "Tambahkan label", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "ditambahkan ke 1 arsip",
  );
  expect(
    state.rows
      .find((row) => row.id === "a12")
      .arsip_labels.map((link) => link.label_id),
  ).toEqual(["l1", "l2"]);
  await page.getByRole("radio", { name: "Lepas label", exact: true }).check();
  await page.getByRole("button", { name: "Lepas label", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "dilepas dari 1 arsip",
  );
  expect(
    state.rows
      .find((row) => row.id === "a12")
      .arsip_labels.map((link) => link.label_id),
  ).toEqual(["l1"]);
});

test("metadata create, edit and delete refresh the workspace", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/klasifikasi");
  await page.getByRole("button", { name: "Tambah kode" }).click();
  await page.getByLabel("Kode klasifikasi", { exact: true }).fill("999");
  await page
    .getByRole("textbox", { name: "Deskripsi", exact: true })
    .fill("Klasifikasi pengujian");
  await page.getByLabel("Aktif (tahun)", { exact: true }).fill("0");
  await page.getByLabel("Inaktif (tahun)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Simpan klasifikasi" }).click();
  await expect(page.getByText("Klasifikasi berhasil disimpan.")).toBeVisible();
  await page.getByLabel("Cari kode atau deskripsi klasifikasi").fill("999");
  await page
    .getByRole("button", { name: "Edit klasifikasi 999", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Deskripsi", exact: true })
    .fill("Klasifikasi diperbarui");
  await page.getByRole("button", { name: "Simpan klasifikasi" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    state.classifications.find((row) => row.kode === "999").deskripsi,
  ).toBe("Klasifikasi diperbarui");
  await page
    .getByRole("button", { name: "Hapus klasifikasi 999", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Hapus klasifikasi", exact: true })
    .click();
  await expect(page.getByText("Klasifikasi berhasil dihapus.")).toBeVisible();
  expect(state.classifications.some((row) => row.kode === "999")).toBe(false);
  await page.goto("/label");
  await page.getByRole("button", { name: "Kelola label", exact: true }).click();
  await page.getByRole("button", { name: "Buat label", exact: true }).click();
  await page.getByLabel("Nama label", { exact: true }).fill("Label pengujian");
  await page.getByRole("button", { name: "Simpan label" }).click();
  await expect(page.getByText("Label berhasil disimpan.")).toBeVisible();
  await page
    .getByRole("button", { name: "Edit label Label pengujian" })
    .click();
  await page.getByLabel("Nama label", { exact: true }).fill("Label diperbarui");
  await page.getByRole("button", { name: "Simpan label" }).click();
  await page
    .getByRole("button", { name: "Hapus label Label diperbarui" })
    .click();
  await page.getByRole("button", { name: "Hapus label", exact: true }).click();
  await expect(page.getByText("Label berhasil dihapus.")).toBeVisible();
  expect(state.labels.some((row) => row.name.startsWith("Label "))).toBe(false);
});

test("mobile drawer and dialogs close with Escape and restore focus", async ({
  page,
}) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/arsip");
  const toggle = page.locator("#mobile-menu-toggle");
  await toggle.click();
  await expect(
    page.getByRole("dialog", { name: "Navigasi utama" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("link", { name: "Label arsip", exact: true }).click();
  await expect(page).toHaveURL(/\/label$/);
  const manage = page.getByRole("button", {
    name: "Kelola label",
    exact: true,
  });
  await manage.click();
  await expect(
    page.getByRole("dialog", { name: "Kelola label" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(manage).toBeFocused();
});
