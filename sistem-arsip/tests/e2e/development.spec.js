import { test, expect } from '@playwright/test';
import { fixture } from './fixture';

test('development access opens the workspace without login or an account menu', async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_AUTH_ENABLED !== 'false',
    'Requires the development-access server',
  );
  const state = await fixture(page, { authenticated: false });
  await page.goto('/arsip');
  await expect(
    page.getByRole('heading', { name: 'Daftar arsip', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Mode development', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Menu akun/ })).toHaveCount(0);
  await expect(page.getByText('1–10', { exact: true })).toBeVisible();
  expect(state.requests.some((request) => request.table === 'arsip')).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Klasifikasi', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Klasifikasi arsip', exact: true }),
  ).toBeVisible();
});
