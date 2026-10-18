import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveDashboardData } from '../src/app/dashboardData.js';

const now = new Date('2026-01-15T12:00:00Z');
const classifications = [
  { kode: 'permanent', retensiAktif: 0, retensiInaktif: 0 },
];
const archive = (id, date, retention, code = 'standard') => ({
  id,
  tanggalSurat: date,
  tanggalRetensi: retention,
  kodeKlasifikasi: code,
});

test('dashboard totals use the same permanent and date-boundary retention semantics as archive queries', () => {
  const rows = [
    archive(1, '2026-01-01', '2026-01-15'),
    archive(2, '2025-12-01', '2026-01-14'),
    archive(3, '2025-12-02', '2020-01-01', 'permanent'),
    archive(4, 'invalid', null),
  ];
  const result = deriveDashboardData(rows, classifications, now);
  assert.deepEqual(result.stats, { total: 4, active: 3, inactive: 1 });
  assert.deepEqual(
    result.activeArchives.map((row) => row.id),
    [1, 3, 4],
  );
  assert.deepEqual(
    result.inactiveArchives.map((row) => row.id),
    [2],
  );
  assert.deepEqual(result.archivesByYear, [
    { name: 2025, Aktif: 1, Inaktif: 1 },
    { name: 2026, Aktif: 1, Inaktif: 0 },
  ]);
});

test('monthly trends correctly cross the year boundary and count all matching archives', () => {
  const rows = [
    archive(1, '2026-01-01', null),
    archive(2, '2025-12-01', null),
    archive(3, '2025-12-02', null),
    archive(4, '2024-12-01', null),
  ];
  assert.deepEqual(deriveDashboardData(rows, classifications, now).trends, {
    total: -50,
    active: -50,
    inactive: 0,
  });
});

test('empty and newly populated dashboards produce finite trends and no invalid year group', () => {
  assert.deepEqual(deriveDashboardData([], [], now).stats, {
    total: 0,
    active: 0,
    inactive: 0,
  });
  const result = deriveDashboardData(
    [archive(1, '2026-01-01', null), archive(2, '', null)],
    [],
    now,
  );
  assert.deepEqual(result.trends, { total: 100, active: 100, inactive: 0 });
  assert.equal(result.archivesByYear.length, 1);
});
