import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveDashboardData } from '../src/app/dashboardData.js';

const now = new Date('2026-10-18T12:00:00Z');
const classifications = [
  { kode: '005', deskripsi: 'Undangan' },
  { kode: '521', deskripsi: 'Konservasi' },
];
const row = (id, date, extra = {}) => ({
  id,
  tanggalSurat: date,
  kodeKlasifikasi: '005',
  pengirim: 'Sekretariat KRGT',
  ...extra,
});
const report = (rows, period = {}) =>
  deriveDashboardData(rows, classifications, now, period);

test('all-time totals include undated rows while the chart explains excluded dates', () => {
  const result = report([
    row(1, '2025-02-28'),
    row(2, ''),
    row(3, '2025-02-30'),
    row(4, '2026-01-01'),
  ]);
  assert.equal(result.metrics.total, 4);
  assert.equal(result.quality.undated, 2);
  assert.equal(
    result.series.reduce((sum, point) => sum + point.count, 0),
    2,
  );
  assert.equal(result.comparison, null);
  assert.deepEqual(result.availableYears, [2026, 2025]);
});

test('year and month scope all counts, rankings and rows consistently', () => {
  const rows = [
    row(1, '2025-01-01'),
    row(2, '2026-01-02'),
    row(3, '2026-02-01'),
    row(4, null),
  ];
  const result = report(rows, { year: '2026', month: '1' });
  assert.deepEqual(
    result.rows.map((item) => item.id),
    [2],
  );
  assert.equal(result.metrics.total, 1);
  assert.equal(result.senders[0].count, 1);
  assert.equal(result.classifications[0].count, 1);
  assert.equal(
    result.series.reduce((sum, point) => sum + point.count, 0),
    1,
  );
});

test('document coverage counts valid URLs and stored files without implying access was checked', () => {
  const result = report([
    row(1, '2025-01-01', {
      googleDriveLink: 'https://drive.google.com/file/d/a/view',
    }),
    row(2, '2025-01-01', { filePath: 'docs/a.pdf' }),
    row(3, '2025-01-01', { googleDriveLink: 'javascript:alert(1)' }),
    row(4, '2025-01-01', { googleDriveLink: '  ', filePath: ' ' }),
    row(5, '2025-01-01', { googleDriveLink: 'broken', filePath: 'docs/b.pdf' }),
  ]);
  assert.equal(result.metrics.digital, 3);
  assert.equal(result.metrics.missingDigital, 2);
  assert.equal(result.metrics.digitalPercent, 60);
  assert.equal(report([]).metrics.digitalPercent, null);
});

test('rankings normalize spaces and case, retain unknown codes, and expose missing metadata', () => {
  const result = report([
    row(1, '2025-01-01'),
    row(2, '2025-01-02', { pengirim: '  sekretariat   KRGT ' }),
    row(3, '2025-01-03', { pengirim: '', kodeKlasifikasi: '999' }),
    row(4, '2025-01-04', { pengirim: 'DLH', kodeKlasifikasi: '' }),
  ]);
  assert.equal(result.metrics.senders, 2);
  assert.equal(result.metrics.classifications, 1);
  assert.equal(result.senders[0].count, 2);
  assert.equal(result.quality.missingSender, 1);
  assert.equal(result.quality.unknownClassification, 2);
  assert.equal(
    result.classifications.reduce((sum, item) => sum + item.count, 0),
    4,
  );
  assert.equal(
    result.classifications.find((item) => item.key === '999').known,
    false,
  );
});

test('a current year compares the same elapsed date in the previous year', () => {
  const result = report(
    [
      row(1, '2026-10-18'),
      row(2, '2026-10-19'),
      row(3, '2025-10-18'),
      row(4, '2025-10-19'),
      row(5, '2025-02-01'),
    ],
    { year: '2026' },
  );
  assert.equal(result.metrics.total, 1);
  assert.equal(result.comparison.previous, 2);
  assert.equal(result.comparison.percent, -50);
  assert.equal(result.end, '2026-10-18');
  assert.equal(result.series.length, 10);
});

test('a current month compares equal elapsed days and crosses January correctly', () => {
  const rows = [
    row(1, '2026-01-10'),
    row(2, '2026-01-16'),
    row(3, '2025-12-10'),
    row(4, '2025-12-16'),
  ];
  const result = deriveDashboardData(
    rows,
    classifications,
    new Date('2026-01-15T12:00:00Z'),
    { year: '2026', month: '1' },
  );
  assert.equal(result.metrics.total, 1);
  assert.equal(result.comparison.previous, 1);
  assert.equal(result.comparison.percent, 0);
  assert.equal(result.comparison.start, '2025-12-01');
  assert.equal(result.comparison.end, '2025-12-15');
});

test('a zero baseline never becomes fabricated 100 percent growth', () => {
  const result = report([row(1, '2026-01-01')], { year: '2026' });
  assert.equal(result.comparison.previous, 0);
  assert.equal(result.comparison.percent, null);
  assert.equal(result.comparison.delta, 1);
});

test('historical months compare full months and clamp leap-year partial comparisons', () => {
  const rows = [
    row(1, '2024-02-29'),
    row(2, '2023-02-28'),
    row(3, '2023-03-01'),
  ];
  const result = deriveDashboardData(
    rows,
    classifications,
    new Date('2024-02-29T12:00:00Z'),
    { year: '2024' },
  );
  assert.equal(result.comparison.end, '2023-02-28');
  assert.equal(result.comparison.previous, 1);
  const monthly = report([row(1, '2025-03-31'), row(2, '2025-02-28')], {
    year: '2025',
    month: '3',
  });
  assert.equal(monthly.comparison.end, '2025-02-28');
  assert.equal(monthly.comparison.previous, 1);
});

test('an empty selected period stays empty and invalid URL choices normalize safely', () => {
  const rows = [row(1, '2025-01-01')];
  const empty = report(rows, { year: '2025', month: '2' });
  assert.equal(empty.metrics.total, 0);
  assert.equal(empty.metrics.digitalPercent, null);
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.series.length, 28);
  assert.equal(report(rows, { year: 'bogus', month: '9' }).period.year, 'all');
  assert.equal(report(rows, { year: '2025', month: '99' }).period.month, 'all');
});

test('future periods have no misleading historical growth and ranks are stable on ties', () => {
  const result = report(
    [
      row(2, '2027-01-01', { pengirim: 'B' }),
      row(1, '2027-01-02', { pengirim: 'A' }),
    ],
    { year: '2027' },
  );
  assert.equal(result.comparison, null);
  assert.deepEqual(
    result.senders.map((item) => item.label),
    ['A', 'B'],
  );
});
