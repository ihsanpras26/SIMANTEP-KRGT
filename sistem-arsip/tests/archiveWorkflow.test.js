import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import {
  normalizeArchive,
  parseArchiveDate,
  documentLinks,
  exportRows,
} from '../src/features/arsip/utils/archiveFields.js';
import {
  saveArchive,
  deleteArchive,
} from '../src/features/arsip/services/archiveMutations.js';
import {
  parseFile,
  validateAllRows,
  importValidRows,
} from '../src/features/arsip/utils/importHelpers.js';

const classifications = [
  { id: 'k1', kode: '005', retensiAktif: 5, retensiInaktif: 2 },
];
const values = {
  perihal: 'Surat undangan',
  tanggalSurat: '2026-01-02',
  kodeKlasifikasi: '005',
  nomorSurat: ' 005/1 ',
  tujuanSurat: 'Kepala UPT; Sekretariat',
};
function clientFor(respond) {
  const requests = [];
  const client = createClient('https://fixture.example.test', 'fixture-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (url, init) => {
        const request = {
          url: new URL(url),
          method: init.method,
          body: init.body ? JSON.parse(init.body) : null,
        };
        requests.push(request);
        const result = respond(request, requests.length);
        return new Response(JSON.stringify(result.data ?? []), {
          status: result.status || 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Range': `0-0/${result.count ?? (Array.isArray(result.data) ? result.data.length : 1)}`,
          },
        });
      },
    },
  });
  return { client, requests };
}
test('archive validation normalizes values, rejects impossible dates and unknown classifications', () => {
  const result = normalizeArchive(values, classifications);
  assert.equal(result.payload.nomorSurat, '005/1');
  assert.equal(result.payload.tanggalRetensi, '2031-01-02T00:00:00.000Z');
  assert.deepEqual(result.errors, {});
  assert.ok(
    normalizeArchive(
      {
        ...values,
        perihal: '  ',
        tanggalSurat: '2026-02-30',
        kodeKlasifikasi: '???',
      },
      classifications,
    ).errors.perihal,
  );
  assert.ok(
    normalizeArchive({ ...values, tanggalSurat: '2026-02-30' }, classifications)
      .errors.tanggalSurat,
  );
  assert.ok(
    normalizeArchive({ ...values, kodeKlasifikasi: '???' }, classifications)
      .errors.kodeKlasifikasi,
  );
});
test('editing unrelated fields preserves the existing retention date', () => {
  const existing = { ...values, tanggalRetensi: '2035-01-01T00:00:00Z' };
  assert.equal(
    normalizeArchive(values, classifications, existing).payload.tanggalRetensi,
    existing.tanggalRetensi,
  );
});
test('spreadsheet dates parse deterministically and do not silently roll over', () => {
  assert.equal(parseArchiveDate(46024), '2026-01-02');
  assert.equal(parseArchiveDate('02/01/2026'), '2026-01-02');
  assert.equal(parseArchiveDate('2024-02-29'), '2024-02-29');
  assert.equal(parseArchiveDate('2026-02-30'), '');
  assert.equal(parseArchiveDate('not a date'), '');
});
test('document links reject executable URLs and only embed recognized Drive or storage files', () => {
  assert.deepEqual(
    documentLinks(
      { googleDriveLink: 'javascript:alert(1)' },
      'https://db.example',
    ),
    { open: '', preview: '', download: '' },
  );
  const drive = documentLinks(
    { googleDriveLink: 'https://drive.google.com/file/d/abc_123/view' },
    'https://db.example',
  );
  assert.equal(
    drive.preview,
    'https://drive.google.com/file/d/abc_123/preview',
  );
  const external = documentLinks(
    { googleDriveLink: 'https://example.org/document' },
    'https://db.example',
  );
  assert.equal(external.open, 'https://example.org/document');
  assert.equal(external.preview, '');
});
test('delete targets arsip and rejects a missing or unauthorized row', async () => {
  const f = clientFor(() => ({ data: [{ id: 'a1' }] }));
  await deleteArchive(f.client, 'a1');
  assert.equal(f.requests[0].url.pathname, '/rest/v1/arsip');
  assert.equal(f.requests[0].url.searchParams.get('id'), 'eq.a1');
  assert.equal(f.requests[0].method, 'DELETE');
  await assert.rejects(
    deleteArchive(clientFor(() => ({ data: [] })).client, 'a1'),
    /tidak ditemukan|akses/i,
  );
});
test('save stops on duplicate lookup errors instead of inserting', async () => {
  const f = clientFor(() => ({
    data: { message: 'lookup denied', code: '42501' },
    status: 403,
  }));
  await assert.rejects(
    saveArchive(f.client, { payload: values, labelIds: [] }),
    /lookup denied/,
  );
  assert.equal(f.requests.length, 1);
});
test('failed label assignment returns saved identity so retry cannot duplicate an archive', async () => {
  const f = clientFor((r) =>
    r.method === 'GET'
      ? { data: [] }
      : r.url.pathname.endsWith('/arsip')
        ? { data: { ...values, id: 'saved-id' } }
        : { data: { message: 'label denied', code: '42501' }, status: 403 },
  );
  const result = await saveArchive(f.client, {
    payload: values,
    labelIds: ['label1'],
  });
  assert.equal(result.record.id, 'saved-id');
  assert.match(result.labelError, /label denied/);
});
test('import rejects duplicate numbers in one file and propagates lookup failures', async () => {
  const f = clientFor(() => ({ data: [] }));
  const row = {
    nomor_surat: '001',
    tanggal_surat: '2026-01-02',
    perihal: 'Surat undangan',
    kode_klasifikasi: '005',
  };
  const results = await validateAllRows(
    [row, row],
    f.client,
    classifications,
    [],
    'create',
  );
  assert.equal(results.filter((r) => r.valid).length, 0);
  await assert.rejects(
    validateAllRows(
      [row],
      clientFor(() => ({ data: { message: 'lookup failed' }, status: 400 }))
        .client,
      classifications,
      [],
      'create',
    ),
    /lookup failed/,
  );
});
test('partial update import preserves absent fields and reports original spreadsheet row on error', async () => {
  const f = clientFor((r) =>
    r.method === 'GET'
      ? {
          data: [
            {
              id: 'a1',
              nomorSurat: '001',
              tanggalSurat: '2020-01-01',
              tanggalRetensi: '2030-01-01',
            },
          ],
        }
      : { data: { message: 'write denied' }, status: 403 },
  );
  const results = await validateAllRows(
    [{ nomor_surat: '001', perihal: 'Updated title' }],
    f.client,
    classifications,
    [],
    'update',
  );
  assert.equal(results[0].valid, true);
  results[0].rowNumber = 9;
  const imported = await importValidRows(results, f.client);
  assert.equal(imported.failed, 1);
  assert.equal(imported.errors[0].row, 9);
  assert.equal(f.requests.at(-1).body.tanggalRetensi, undefined);
  assert.equal(f.requests.at(-1).body.pengirim, undefined);
});
test('export uses round-trippable columns and includes optional document/party fields', () => {
  const [row] = exportRows(
    [
      {
        ...values,
        googleDriveLink: 'https://example.org/doc',
        pengirim: 'UPT',
        arsip_labels: [{ labels: { name: 'Prioritas' } }],
      },
    ],
    classifications,
  );
  assert.equal(row.tanggal_surat, '2026-01-02');
  assert.equal(row.google_drive_link, 'https://example.org/doc');
  assert.equal(row.pengirim, 'UPT');
  assert.equal(row.label, 'Prioritas');
});
test('silently denied label writes preserve saved identity and keep existing labels', async () => {
  const f = clientFor((r) =>
    r.url.pathname.endsWith('/arsip')
      ? r.method === 'GET'
        ? { data: [] }
        : { data: { ...values, id: 'saved-id' } }
      : { data: r.method === 'GET' ? [{ label_id: 'old-label' }] : [] },
  );
  const result = await saveArchive(f.client, {
    payload: values,
    labelIds: ['new-label'],
  });
  assert.equal(result.record.id, 'saved-id');
  assert.match(result.labelError, /label/i);
  assert.equal(
    f.requests.some((r) => r.method === 'DELETE'),
    false,
  );
});
test('import validation traverses capped responses and preserves spreadsheet row numbers', async () => {
  const f = clientFor((r) => {
    const offset = Number(r.url.searchParams.get('offset') || 0);
    return {
      data:
        offset === 0
          ? [{ id: 'first', nomorSurat: '001' }]
          : [{ id: 'last', nomorSurat: '002' }],
      count: 2,
    };
  });
  const rows = [
    {
      nomor_surat: '002',
      perihal: 'Surat kedua',
      tanggal_surat: '2026-01-02',
      kode_klasifikasi: '005',
      __rowNum__: 7,
    },
  ];
  const result = await validateAllRows(rows, f.client, classifications);
  assert.equal(f.requests.length, 2);
  assert.equal(result[0].valid, false);
  assert.equal(result[0].rowNumber, 8);
});

test('CSV parsing preserves literal dates and leading zero identifiers', async () => {
  const file = new Blob([
    'nomor_surat,tanggal_surat,perihal,kode_klasifikasi\n0001,2026-02-30,Surat impor,005\n',
  ]);
  const [row] = await parseFile(file);
  assert.equal(row.nomor_surat, '0001');
  assert.equal(row.kode_klasifikasi, '005');
  assert.equal(row.tanggal_surat, '2026-02-30');
});
