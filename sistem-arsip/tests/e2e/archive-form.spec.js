import { test, expect } from '@playwright/test';
import { fixture } from './fixture';

test.describe('touch classification selection', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('tapping a search result chooses the code and preserves the form', async ({ page }) => {
    await fixture(page);
    await page.goto('/arsip/tambah');
    await page.getByLabel('Perihal *', { exact: true }).fill('Undangan koordinasi');
    const code = page.getByRole('combobox', { name: 'Kode klasifikasi *', exact: true });
    await code.fill('undangan');
    await page.getByRole('option', { name: /005.*Undangan dan koordinasi/ }).tap();
    await expect(code).toHaveValue('005');
    await expect(code).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue('Undangan koordinasi');
    await expect(page).toHaveURL(/\/arsip\/tambah$/);
  });
});

test('classification follows the number until manually chosen and can be searched by description with a keyboard', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip/tambah');
  await page
    .getByLabel('Nomor surat', { exact: true })
    .fill('005/NEW/KRGT/2026');
  await expect(
    page.getByLabel('Kode klasifikasi *', { exact: true }),
  ).toHaveValue('005');
  await page
    .getByLabel('Nomor surat', { exact: true })
    .fill('521/NEW/KRGT/2026');
  await expect(
    page.getByLabel('Kode klasifikasi *', { exact: true }),
  ).toHaveValue('521');
  const code = page.getByRole('combobox', {
    name: 'Kode klasifikasi *',
    exact: true,
  });
  await code.fill('undangan');
  await expect(
    page.getByRole('option', { name: /005.*Undangan dan koordinasi/ }),
  ).toBeVisible();
  await code.press('ArrowDown');
  await code.press('Enter');
  await expect(code).toHaveValue('005');
  await expect(code).toBeFocused();
  await page
    .getByLabel('Nomor surat', { exact: true })
    .fill('521/CHANGED/KRGT/2026');
  await expect(code).toHaveValue('005');
  await page
    .getByRole('button', { name: 'Gunakan kode 521', exact: true })
    .click();
  await expect(code).toHaveValue('521');
});

test('restoring original values and labels does not warn about unsaved changes', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip/tambah');
  await page.getByLabel('Perihal *', { exact: true }).fill('Percobaan');
  await page.getByLabel('Perihal *', { exact: true }).fill('');
  await page.getByLabel('Prioritas', { exact: true }).check();
  await page.getByLabel('Prioritas', { exact: true }).uncheck();
  await page
    .getByRole('button', { name: 'Kembali ke arsip', exact: true })
    .click();
  await expect(page).toHaveURL(/\/arsip$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('optional labels failing to load do not prevent completing and saving the archive', async ({
  page,
}) => {
  const state = await fixture(page, {
    fail: (table, method) => table === 'labels' && method === 'GET',
  });
  await page.goto('/arsip/tambah');
  const subject = page.getByLabel('Perihal *', { exact: true });
  await expect(subject).toBeEnabled();
  await subject.fill('Surat tetap dapat disimpan');
  await page.getByLabel('Kode klasifikasi *', { exact: true }).fill('005');
  await expect(
    page.getByText(
      'Label belum dapat dimuat. Anda tetap bisa menyimpan arsip.',
    ),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Simpan arsip', exact: true }).click();
  await expect(page).toHaveURL(/\/arsip$/);
  expect(
    state.rows.filter((row) => row.perihal === 'Surat tetap dapat disimpan'),
  ).toHaveLength(1);
});

test('validation on blur and error summary point to the exact field without clearing other inputs', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip/tambah');
  const link = page.getByLabel('Tautan dokumen', { exact: true });
  await link.fill('bukan-tautan');
  await link.press('Tab');
  await expect(link).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByText('Gunakan tautan dokumen http:// atau https:// yang valid.', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel('Perihal *', { exact: true })
    .fill('Undangan koordinasi');
  await page.getByRole('button', { name: 'Simpan arsip', exact: true }).click();
  await expect(
    page.getByRole('alert', { name: 'Periksa isian berikut' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Periksa Tautan dokumen', exact: true })
    .click();
  await expect(link).toBeFocused();
  await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue(
    'Undangan koordinasi',
  );
});

test('a duplicate number is flagged at its field and a successful save does not wait for optional refetches', async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto('/arsip/tambah');
  await page.getByLabel('Perihal *', { exact: true }).fill('Surat baru');
  await page
    .getByLabel('Nomor surat', { exact: true })
    .fill(state.rows[0].nomorSurat);
  await page.getByRole('button', { name: 'Simpan arsip', exact: true }).click();
  await expect(page.getByLabel('Nomor surat', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByLabel('Nomor surat', { exact: true })).toBeFocused();
  await page
    .getByLabel('Nomor surat', { exact: true })
    .fill('005/UNIQUE/KRGT/2026');
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/rest/v1/labels*', async (route) => {
    await gate;
    await route.fallback();
  });
  try {
    await page
      .getByRole('button', { name: 'Simpan arsip', exact: true })
      .click();
    await expect(page).toHaveURL(/\/arsip$/, { timeout: 3000 });
  } finally {
    release();
  }
  expect(
    state.rows.filter((row) => row.nomorSurat === '005/UNIQUE/KRGT/2026'),
  ).toHaveLength(1);
});

test('missing classifications keep text editable and show a clear loading state', async ({
  page,
}) => {
  await fixture(page);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/rest/v1/klasifikasi*', async (route) => {
    await gate;
    await route.fallback();
  });
  await page.goto('/arsip/tambah');
  try {
    await expect(page.getByLabel('Perihal *', { exact: true })).toBeEnabled();
    await page
      .getByLabel('Perihal *', { exact: true })
      .fill('Isian selama memuat');
    await page.getByLabel('Nomor surat', { exact: true }).fill('005/NEW');
    await expect(
      page.getByRole('button', { name: 'Memuat klasifikasi…', exact: true }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByLabel('Kode klasifikasi *', { exact: true }),
  ).toHaveValue('005');
  await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue(
    'Isian selama memuat',
  );
});

test('an invalid stored date stays empty during edit and requires correction', async ({
  page,
}) => {
  const state = await fixture(page);
  state.rows[0].tanggalSurat = null;
  await page.goto('/arsip/a1/edit');
  await expect(page.getByLabel('Tanggal surat *', { exact: true })).toHaveValue(
    '',
  );
  await page.getByRole('button', { name: 'Simpan arsip', exact: true }).click();
  await expect(
    page.getByLabel('Tanggal surat *', { exact: true }),
  ).toBeFocused();
});

test('confirmed saves finish without waiting for a label-list refresh', async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto('/arsip/tambah');
  await expect(page.getByLabel('Prioritas', { exact: true })).toBeEnabled();
  await page
    .getByLabel('Perihal *', { exact: true })
    .fill('Simpan tanpa menunggu daftar label');
  await page.getByLabel('Kode klasifikasi *', { exact: true }).fill('005');
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/rest/v1/labels*', async (route) => {
    await gate;
    await route.fallback();
  });
  try {
    await page
      .getByRole('button', { name: 'Simpan arsip', exact: true })
      .click();
    await expect(page).toHaveURL(/\/arsip$/, { timeout: 3000 });
  } finally {
    release();
  }
  expect(
    state.rows.filter(
      (row) => row.perihal === 'Simpan tanpa menunggu daftar label',
    ),
  ).toHaveLength(1);
});

for (const width of [320, 1440]) {
  test(`save feedback and classification choices remain usable at ${width}px in both themes`, async ({
    page,
  }, info) => {
    await fixture(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/arsip/tambah');
    await expect(
      page.getByRole('button', { name: 'Simpan arsip', exact: true }),
    ).toBeInViewport();
    await page
      .getByLabel('Perihal *', { exact: true })
      .fill('Undangan rapat koordinasi');
    await page
      .getByLabel('Nomor surat', { exact: true })
      .fill('521/017/KRGT/2026');
    await expect(
      page.getByLabel('Kode klasifikasi *', { exact: true }),
    ).toHaveValue('521');
    const code = page.getByRole('combobox', {
      name: 'Kode klasifikasi *',
      exact: true,
    });
    await code.focus();
    await expect(
      page.getByRole('option', { name: /521.*Konservasi tanaman/ }),
    ).toBeVisible();
    await code.press('Escape');
    await expect(code).toHaveAttribute('aria-expanded', 'false');
    await expect(code).toBeFocused();
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: info.outputPath('form-light.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Gunakan mode gelap' }).click();
    await page.screenshot({
      path: info.outputPath('form-dark.png'),
      fullPage: true,
    });
  });
}
