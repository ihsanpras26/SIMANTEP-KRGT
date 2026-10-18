import { test, expect } from '@playwright/test';
import { fixture } from './fixture';

async function reportFixture(page) {
  const state = await fixture(page);
  const base = state.rows[0];
  state.rows = [
    {
      ...base,
      id: 'r1',
      tanggalSurat: '2025-01-01',
      perihal: 'Laporan tahun lalu',
      pengirim: 'Sekretariat',
    },
    {
      ...base,
      id: 'r2',
      tanggalSurat: '2026-01-02',
      perihal: 'Undangan Januari',
      pengirim: 'DLH',
      kodeKlasifikasi: '521',
      googleDriveLink: '',
    },
    {
      ...base,
      id: 'r3',
      tanggalSurat: '2026-01-03',
      perihal: 'Surat Januari',
      pengirim: 'DLH',
      kodeKlasifikasi: '521',
    },
    {
      ...base,
      id: 'r4',
      tanggalSurat: '2026-02-01',
      perihal: 'Surat Februari',
      pengirim: 'Sekretariat',
    },
    {
      ...base,
      id: 'r5',
      tanggalSurat: null,
      perihal: 'Surat tanpa tanggal',
      pengirim: '',
      googleDriveLink: '',
    },
  ];
  return state;
}

test('report filters every metric and table, persists the period, and drills into missing documents', async ({
  page,
}) => {
  await reportFixture(page);
  await page.goto('/');
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('5', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/1 arsip tanpa tanggal valid/)).toBeVisible();
  await page.getByLabel('Tahun laporan', { exact: true }).focus();
  await page.getByLabel('Tahun laporan', { exact: true }).selectOption('2026');
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('3', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Tahun laporan', { exact: true })).toBeFocused();
  await page.getByLabel('Bulan laporan', { exact: true }).selectOption('1');
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('2', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('group', { name: 'Dokumen digital', exact: true })
      .getByText('1', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Rincian arsip', exact: true })
      .getByRole('row'),
  ).toHaveCount(3);
  await page.reload();
  await expect(page.getByLabel('Tahun laporan', { exact: true })).toHaveValue(
    '2026',
  );
  await expect(page.getByLabel('Bulan laporan', { exact: true })).toHaveValue(
    '1',
  );
  await page
    .getByRole('button', { name: 'Lihat 1 arsip tanpa dokumen' })
    .click();
  const table = page.getByRole('region', {
    name: 'Rincian arsip',
    exact: true,
  });
  await expect(table.getByRole('row')).toHaveCount(2);
  await expect(
    table.getByText('Undangan Januari', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reset rincian' }).click();
  await page.getByRole('button', { name: 'Lihat 2 arsip dari DLH' }).click();
  await expect(table.getByRole('row')).toHaveCount(3);
  await table
    .getByRole('button', { name: 'Undangan Januari', exact: true })
    .click();
  await expect(page).toHaveURL(/\/arsip\/r2/);
});

test('empty periods display honest zero counts and can reset to all data', async ({
  page,
}) => {
  await reportFixture(page);
  await page.goto('/?year=2026&month=4');
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('0', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Belum ada arsip pada periode ini' }),
  ).toBeVisible();
  await expect(
    page.getByText('Belum ada data pembanding', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset periode', exact: true })
    .click();
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('5', { exact: true }),
  ).toBeVisible();
});

test('refresh failure keeps the last report and offers retry', async ({
  page,
}) => {
  const state = await reportFixture(page);
  await page.goto('/');
  await expect(
    page.getByRole('group', { name: 'Total arsip', exact: true }),
  ).toBeVisible();
  state.fail = (table) => table === 'arsip';
  await page
    .getByRole('button', { name: 'Perbarui laporan', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Laporan belum diperbarui',
    { timeout: 15000 },
  );
  await expect(
    page
      .getByRole('group', { name: 'Total arsip', exact: true })
      .getByText('5', { exact: true }),
  ).toBeVisible();
  state.fail = null;
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('detail return restores the report period and sender selection', async ({
  page,
}) => {
  await reportFixture(page);
  await page.goto('/?year=2026&month=1');
  await page.getByRole('button', { name: 'Lihat 2 arsip dari DLH' }).click();
  await page
    .getByRole('region', { name: 'Rincian arsip', exact: true })
    .getByRole('button', { name: 'Undangan Januari', exact: true })
    .click();
  await page
    .getByRole('button', { name: /Kembali ke (daftar|laporan)/ })
    .click();
  await expect(page.getByLabel('Tahun laporan', { exact: true })).toHaveValue(
    '2026',
  );
  await expect(page.getByLabel('Bulan laporan', { exact: true })).toHaveValue(
    '1',
  );
  await expect(
    page.getByRole('button', { name: 'Lihat 2 arsip dari DLH' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
