import { test, expect } from '@playwright/test';
import { fixture } from './fixture';

test('login starts light even on a dark device and remembers the chosen theme', async ({
  page,
}, info) => {
  await fixture(page, { authenticated: false });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(
    page.getByRole('heading', { name: 'Masuk ke SIMANTEP' }),
  ).toBeVisible();
  const photo = page.getByRole('img', { name: 'Kebun Raya Gunung Tidar' });
  await expect(photo).toBeVisible();
  await expect
    .poll(() =>
      photo.evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath('login-light.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Gunakan mode gelap' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Kata sandi', { exact: true }).fill('kata-sandi-uji');
  await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click();
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Sembunyikan kata sandi' }).click();
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute(
    'type',
    'password',
  );
  await page.screenshot({
    path: info.outputPath('login-dark.png'),
    fullPage: true,
  });
});

test('unsaved form changes survive cancelled navigation and can be discarded explicitly', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip/tambah');
  await page
    .getByLabel('Perihal *', { exact: true })
    .fill('Undangan rapat koordinasi');
  await page.getByRole('link', { name: 'Klasifikasi', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Simpan perubahan dulu?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut mengisi' }).click();
  await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue(
    'Undangan rapat koordinasi',
  );
  await page.getByRole('button', { name: 'Kembali ke arsip' }).click();
  await page.getByRole('button', { name: 'Keluar tanpa menyimpan' }).click();
  await expect(page).toHaveURL(/\/arsip$/);
});

test('search gives visible feedback and resets an empty result', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip');
  await expect(page.getByText('1–10', { exact: true })).toBeVisible();
  await page
    .getByLabel('Cari arsip', { exact: true })
    .fill('surat yang tidak ada');
  await expect(
    page.getByRole('heading', { name: 'Arsip tidak ditemukan' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset pencarian', exact: true })
    .click();
  await expect(page.getByLabel('Cari arsip', { exact: true })).toHaveValue('');
  await expect(page.getByText('1–10', { exact: true })).toBeVisible();
});

test('secondary archive actions support keyboard access and restore focus', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/arsip');
  const trigger = page.getByRole('button', { name: 'Lainnya', exact: true });
  await trigger.click();
  await expect(
    page.getByRole('menuitem', { name: 'Impor Excel / CSV' }),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menuitem', { name: 'Perbarui dari Excel' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Impor Excel / CSV' }).click();
  await expect(page.getByLabel('Pilih file arsip')).toBeAttached();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

for (const width of [320, 1440]) {
  test(`themes stay readable across workspace and dialogs at ${width}px`, async ({
    page,
  }, info) => {
    await fixture(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Gunakan mode gelap' }).click();
    for (const route of [
      '/',
      '/arsip',
      '/arsip/tambah',
      '/label',
      '/klasifikasi',
    ]) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      if (route === '/' || route === '/arsip')
        await page.screenshot({
          path: info.outputPath(
            `dark-${route === '/' ? 'dashboard' : 'arsip'}.png`,
          ),
          fullPage: true,
        });
    }
    await page.getByRole('button', { name: 'Tambah kode' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('dark-dialog.png'),
      fullPage: true,
    });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Gunakan mode terang' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
}

test('login and form feedback fit a small screen', async ({ page }, info) => {
  await fixture(page, { authenticated: false });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Masuk', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.screenshot({
    path: info.outputPath('login-mobile.png'),
    fullPage: true,
  });
});

test('failed login explains the problem and preserves the email for retry', async ({
  page,
}) => {
  await fixture(page, { authenticated: false });
  await page.route('**/auth/v1/token*', (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: 'invalid_grant',
        error_description: 'Invalid login credentials',
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Kata sandi', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Email atau kata sandi tidak cocok. Coba lagi.',
  );
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue(
    'admin@example.test',
  );
  await page.getByLabel('Kata sandi', { exact: true }).fill('correct-password');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Masuk', exact: true }),
  ).toBeEnabled();
});

test('form validation focuses the missing field and failed save keeps entered data', async ({
  page,
}) => {
  const state = await fixture(page, {
    fail: (table, method) => table === 'arsip' && method === 'POST',
  });
  await page.goto('/arsip/tambah');
  await page.getByRole('button', { name: 'Simpan arsip' }).click();
  await expect(page.getByLabel('Perihal *', { exact: true })).toBeFocused();
  await page.getByLabel('Perihal *', { exact: true }).fill('Undangan rapat');
  await page.getByLabel('Kode klasifikasi *', { exact: true }).fill('005');
  await page.getByRole('button', { name: 'Simpan arsip' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue(
    'Undangan rapat',
  );
  state.fail = null;
  await page.getByRole('button', { name: 'Simpan arsip' }).click();
  await expect(page).toHaveURL(/\/arsip$/);
});

test('logout asks before discarding a dirty archive form', async ({ page }) => {
  await fixture(page);
  await page.goto('/arsip/tambah');
  await page
    .getByLabel('Perihal *', { exact: true })
    .fill('Surat belum disimpan');
  await page.getByRole('button', { name: /Menu akun/ }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Simpan perubahan dulu?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut mengisi' }).click();
  await expect(page.getByLabel('Perihal *', { exact: true })).toHaveValue(
    'Surat belum disimpan',
  );
  await page.getByRole('button', { name: /Menu akun/ }).click();
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.getByRole('button', { name: 'Keluar tanpa menyimpan' }).click();
  await expect(
    page.getByRole('heading', { name: 'Masuk ke SIMANTEP' }),
  ).toBeVisible();
});

test('navigation requested during saving resumes after the save succeeds', async ({
  page,
}) => {
  await fixture(page);
  let releaseSave;
  const release = new Promise((resolve) => {
    releaseSave = resolve;
  });
  await page.route('**/rest/v1/arsip*', async (route) => {
    if (route.request().method() === 'POST') await release;
    await route.fallback();
  });
  await page.goto('/arsip/tambah');
  await page
    .getByLabel('Perihal *', { exact: true })
    .fill('Surat dalam proses simpan');
  await page.getByLabel('Kode klasifikasi *', { exact: true }).fill('005');
  await page.getByRole('button', { name: 'Simpan arsip' }).click();
  await expect(
    page.getByRole('button', { name: 'Menyimpan…', exact: true }),
  ).toBeDisabled();
  await page.getByRole('link', { name: 'Klasifikasi', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Keluar tanpa menyimpan' }),
  ).toBeDisabled();
  releaseSave();
  await expect(page).toHaveURL(/\/klasifikasi$/);
});
