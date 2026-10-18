import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import {
  assignArchiveLabels,
  deleteLabel,
  saveLabel,
  fetchLabelUsage,
} from '../src/features/labels/services/labelService.js';
import {
  saveKlasifikasi,
  deleteKlasifikasi,
  normalizeKlasifikasi,
  groupKlasifikasi,
} from '../src/features/klasifikasi/services/klasifikasiService.js';
import { resolveLabelColor } from '../src/features/labels/services/labelAppearance.js';

// Real Supabase request builders against a local, stateful HTTP fixture.
function fixture({
  labels = [],
  links = [],
  klasifikasi = [],
  fail,
  denyWrite = false,
  cap = 1000,
} = {}) {
  const tables = {
    labels: structuredClone(labels),
    arsip_labels: structuredClone(links),
    klasifikasi: structuredClone(klasifikasi),
    arsip: [{ id: 'a' }, { id: 'b' }],
  };
  const requests = [];
  const client = createClient(
    'https://fixture.example.test',
    'fixture-public-key',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (url, init) => {
          const parsed = new URL(url);
          const table = parsed.pathname.split('/').at(-1);
          const params = parsed.searchParams;
          const method = init.method;
          const body = init.body ? JSON.parse(init.body) : null;
          requests.push({
            table,
            params,
            method,
            body,
            prefer: new Headers(init.headers).get('Prefer'),
          });
          const error =
            typeof fail === 'function' ? fail({ method, table, body }) : fail;
          if (error)
            return new Response(JSON.stringify(error), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            });
          const matches = (row) =>
            [...params].every(([key, value]) => {
              if (value.startsWith('eq.'))
                return String(row[key]) === value.slice(3);
              if (value.startsWith('in.('))
                return value
                  .slice(4, -1)
                  .split(',')
                  .map((v) => v.replaceAll('"', ''))
                  .includes(String(row[key]));
              return true;
            });
          let rows = tables[table].filter(matches);
          if (method === 'POST') {
            rows = [];
            if (!denyWrite)
              for (const item of Array.isArray(body) ? body : [body]) {
                if (
                  table === 'arsip_labels' &&
                  tables[table].some(
                    (row) =>
                      row.arsip_id === item.arsip_id &&
                      row.label_id === item.label_id,
                  )
                )
                  continue;
                const row = {
                  ...item,
                  ...(table === 'arsip_labels'
                    ? {}
                    : { id: `new-${tables[table].length}` }),
                };
                tables[table].push(row);
                rows.push(row);
              }
          } else if (method === 'PATCH') {
            rows = denyWrite ? [] : rows.map((row) => Object.assign(row, body));
          } else if (method === 'DELETE') {
            rows = denyWrite ? [] : rows;
            tables[table] = tables[table].filter((row) => !rows.includes(row));
          }
          const count = rows.length;
          const offset = Number(params.get('offset') || 0);
          rows = rows.slice(
            offset,
            offset + Math.min(cap, Number(params.get('limit') || cap)),
          );
          const single = new Headers(init.headers)
            .get('Accept')
            ?.includes('application/vnd.pgrst.object+json');
          return new Response(
            method === 'HEAD'
              ? null
              : JSON.stringify(single ? rows[0] || null : rows),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Content-Range': `${offset}-${offset + rows.length - 1}/${count}`,
              },
            },
          );
        },
      },
    },
  );
  return { client, tables, requests };
}

test('label create/update preserve stored color and icon while trimming the name', async () => {
  const { client, tables } = fixture({
    labels: [{ id: 'l1', name: 'Lama', color: 'blue', icon: 'Tag' }],
  });
  const created = await saveLabel(client, {
    name: ' Baru ',
    color: 'bg-violet-500',
    icon: 'Star',
  });
  assert.equal(created.name, 'Baru');
  await saveLabel(
    client,
    { name: 'Penting', color: '#f0a', icon: 'Flag' },
    'l1',
  );
  assert.deepEqual(tables.labels[0], {
    id: 'l1',
    name: 'Penting',
    color: '#f0a',
    icon: 'Flag',
  });
});

test('metadata writes throw API errors and never report an invisible or absent row as saved/deleted', async () => {
  const denied = fixture({
    fail: { code: '42501', message: 'permission denied' },
  });
  await assert.rejects(
    saveLabel(denied.client, { name: 'Test', color: 'blue' }),
    { code: '42501' },
  );
  await assert.rejects(deleteLabel(denied.client, 'l1'), { code: '42501' });
  await assert.rejects(
    saveKlasifikasi(denied.client, { kode: '001', deskripsi: 'Umum' }),
    { code: '42501' },
  );
  const hidden = fixture({ denyWrite: true });
  await assert.rejects(
    saveLabel(hidden.client, { name: 'Test', color: 'blue' }, 'l1'),
    /tidak tersimpan/i,
  );
  await assert.rejects(deleteLabel(hidden.client, 'l1'), /tidak terhapus/i);
  await assert.rejects(
    saveKlasifikasi(hidden.client, { kode: '001', deskripsi: 'Umum' }, 'k1'),
    /tidak tersimpan/i,
  );
  await assert.rejects(
    deleteKlasifikasi(hidden.client, 'k1'),
    /tidak terhapus/i,
  );
});

test('label assignment adds only missing links and remains idempotent', async () => {
  const { client, tables, requests } = fixture({
    links: [{ arsip_id: 'a', label_id: 'l1' }],
  });
  assert.deepEqual(await assignArchiveLabels(client, ['a', 'b', 'b'], 'l1'), {
    changed: 1,
    unchanged: 1,
    total: 2,
  });
  assert.equal(tables.arsip_labels.length, 2);
  assert.equal(
    requests.find((r) => r.method === 'POST').params.get('on_conflict'),
    'arsip_id,label_id',
  );
  assert.match(
    requests.find((r) => r.method === 'POST').prefer,
    /resolution=ignore-duplicates/,
  );
  assert.deepEqual(await assignArchiveLabels(client, ['a', 'b'], 'l1'), {
    changed: 0,
    unchanged: 2,
    total: 2,
  });
});

test('label removal affects only selected archives and the chosen label', async () => {
  const { client, tables } = fixture({
    links: [
      { arsip_id: 'a', label_id: 'l1' },
      { arsip_id: 'b', label_id: 'l1' },
      { arsip_id: 'a', label_id: 'l2' },
    ],
  });
  assert.deepEqual(
    await assignArchiveLabels(client, ['a', 'c'], 'l1', 'remove'),
    { changed: 1, unchanged: 1, total: 2 },
  );
  assert.deepEqual(tables.arsip_labels, [
    { arsip_id: 'b', label_id: 'l1' },
    { arsip_id: 'a', label_id: 'l2' },
  ]);
  assert.deepEqual(await assignArchiveLabels(client, ['a'], 'l1', 'remove'), {
    changed: 0,
    unchanged: 1,
    total: 1,
  });
});

test('assignment rejects failed or silently denied changes', async () => {
  const failure = fixture({
    fail: { code: '42501', message: 'permission denied' },
  });
  await assert.rejects(assignArchiveLabels(failure.client, ['a'], 'l1'), {
    code: '42501',
  });
  const hiddenAdd = fixture({ denyWrite: true });
  await assert.rejects(
    assignArchiveLabels(hiddenAdd.client, ['a'], 'l1'),
    /belum diterapkan/i,
  );
  const hiddenRemove = fixture({
    denyWrite: true,
    links: [{ arsip_id: 'a', label_id: 'l1' }],
  });
  await assert.rejects(
    assignArchiveLabels(hiddenRemove.client, ['a'], 'l1', 'remove'),
    /belum dilepas/i,
  );
});

test('assignment counts and verifies all links when API representations are capped', async () => {
  const { client, tables } = fixture({ cap: 2 });
  const targets = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(await assignArchiveLabels(client, targets, 'l1'), {
    changed: 5,
    unchanged: 0,
    total: 5,
  });
  assert.deepEqual(await assignArchiveLabels(client, targets, 'l1', 'remove'), {
    changed: 5,
    unchanged: 0,
    total: 5,
  });
  assert.equal(tables.arsip_labels.length, 0);
});

test('bulk assignment bounds request size and exposes partial completion on later failure', async () => {
  let writes = 0;
  const { client, tables, requests } = fixture({
    fail: ({ method }) =>
      method === 'POST' && ++writes === 2
        ? { code: '42501', message: 'second batch denied' }
        : null,
  });
  await assert.rejects(
    assignArchiveLabels(
      client,
      Array.from({ length: 450 }, (_, i) => String(i)),
      'l1',
    ),
    (error) => {
      assert.equal(error.changedCount, 200);
      assert.match(error.message, /200/);
      return true;
    },
  );
  assert.equal(tables.arsip_labels.length, 200);
  assert.ok(
    requests
      .filter((r) => r.method === 'POST')
      .every((r) => r.body.length <= 200),
  );
});

test('label usage reads every link despite a lower API cap without downloading archives', async () => {
  const { client, requests } = fixture({
    cap: 2,
    links: Array.from({ length: 5 }, (_, i) => ({
      arsip_id: String(i),
      label_id: i < 3 ? 'l1' : 'l2',
    })),
  });
  assert.deepEqual(await fetchLabelUsage(client), {
    totalArchives: 2,
    counts: { l1: 3, l2: 2 },
  });
  assert.ok(
    requests
      .filter((r) => r.table === 'arsip')
      .every((r) => r.method === 'HEAD'),
  );
});

test('retention preserves zero versus blank, validates whole nonnegative years, and saves both fields', async () => {
  assert.deepEqual(
    normalizeKlasifikasi({
      kode: ' 001 ',
      deskripsi: ' Umum ',
      retensiAktif: '0',
      retensiInaktif: '',
    }),
    { kode: '001', deskripsi: 'Umum', retensiAktif: 0, retensiInaktif: null },
  );
  for (const invalid of [-1, 1.5, 'x', Infinity])
    assert.throws(
      () =>
        normalizeKlasifikasi({
          kode: '001',
          deskripsi: 'Umum',
          retensiAktif: invalid,
        }),
      /retensi/i,
    );
  assert.throws(
    () => normalizeKlasifikasi({ kode: ' ', deskripsi: 'Umum' }),
    /kode/i,
  );
  const { client, tables } = fixture();
  const created = await saveKlasifikasi(client, {
    kode: '001',
    deskripsi: 'Umum',
    retensiAktif: 0,
    retensiInaktif: 0,
  });
  assert.equal(created.retensiAktif, 0);
  await saveKlasifikasi(
    client,
    { kode: '001', deskripsi: 'Layanan', retensiAktif: 2, retensiInaktif: 3 },
    created.id,
  );
  assert.equal(tables.klasifikasi[0].retensiInaktif, 3);
  await deleteKlasifikasi(client, created.id);
  assert.equal(tables.klasifikasi.length, 0);
});

test('hierarchical search retains ancestors, exposes matching descendants and sorts codes numerically', () => {
  const rows = [
    { id: 'a', kode: '800', deskripsi: 'Kepegawaian' },
    { id: 'b', kode: '800.10', deskripsi: 'Disiplin' },
    { id: 'c', kode: '800.2', deskripsi: 'Cuti' },
    { id: 'd', kode: '900.1', deskripsi: 'Anggaran' },
  ];
  assert.deepEqual(
    groupKlasifikasi(rows, 'Cuti')[0].items.map((r) => r.kode),
    ['800', '800.2'],
  );
  assert.deepEqual(
    groupKlasifikasi(rows, 'Kepegawaian')[0].items.map((r) => r.kode),
    ['800', '800.2', '800.10'],
  );
  assert.equal(groupKlasifikasi(rows, 'tidak ada').length, 0);
});

test('label appearance accepts old Tailwind values, names and hex safely', () => {
  assert.equal(resolveLabelColor('bg-blue-500'), resolveLabelColor('blue'));
  assert.equal(resolveLabelColor('#f0a'), '#ff00aa');
  assert.equal(resolveLabelColor('#8052FF'), '#8052ff');
  assert.equal(resolveLabelColor(undefined), resolveLabelColor('neutral'));
  assert.equal(
    resolveLabelColor('url(javascript:alert(1))'),
    resolveLabelColor('neutral'),
  );
});
