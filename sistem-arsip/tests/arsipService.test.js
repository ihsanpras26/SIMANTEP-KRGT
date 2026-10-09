import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { fetchArsip, fetchArsipDetail } from '../src/features/arsip/services/arsipService.js';
import { getArsipStatus } from '../src/features/arsip/utils/statusUtils.js';

// Use the real supabase-js query builder and capture its HTTP requests. No live
// credentials or network are involved; responses represent a controlled dataset.
function fixtureClient(rows, { cap = 1000, fail, inspect } = {}) {
  const requests = [];
  const client = createClient('https://fixture.example.test', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => {
      const params = new URL(url).searchParams;
      requests.push({ params, signal: init.signal, method: init.method });
      inspect?.(params);
      const failure = typeof fail === 'function' ? fail(params) : fail;
      if (failure) return new Response(JSON.stringify(failure), { status: failure.code === 'PGRST103' ? 416 : 400, headers: { 'Content-Type': 'application/json' } });
      const id = params.get('id');
      let data = id ? rows.filter(row => String(row.id) === id.slice(3)) : rows;
      const from = Number(params.get('offset') || 0);
      const limit = Math.min(Number(params.get('limit') || cap), cap);
      const count = data.length;
      data = data.slice(from, from + limit);
      return new Response(JSON.stringify(data), { status: 200, headers: {
        'Content-Type': 'application/json', 'Content-Range': `${from}-${from + data.length - 1}/${count}`,
      } });
    } },
  });
  return { client, requests };
}
const now = new Date('2026-10-09T12:00:00Z');
const klasifikasi = [{ kode: '001', retensiAktif: 0, retensiInaktif: 0 }];
const row = (id, tanggalRetensi, kodeKlasifikasi = '521') => ({ id, tanggalRetensi, kodeKlasifikasi, arsip_labels: [] });

test('normal lists use exact counts, stable ordering, and the requested server page', async () => {
  const { client, requests } = fixtureClient(Array.from({ length: 37 }, (_, i) => row(i + 1, null)));
  const result = await fetchArsip(client, { page: 3, pageSize: 10 });
  assert.equal(result.count, 37);
  assert.deepEqual(result.data.map(item => item.id), [21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].params.get('order'), 'tanggalSurat.desc.nullslast,id.asc');
});
test('date, classification, and label predicates compose without dropping unrelated labels', async () => {
  const { client, requests } = fixtureClient([]);
  await fetchArsip(client, { filterDate: '2024-02-29', filterKlasifikasi: '005', filterLabel: 'l1', sortBy: 'nomorSurat', sortOrder: 'asc' });
  const q = requests[0].params;
  assert.deepEqual(q.getAll('tanggalSurat'), ['gte.2024-02-29', 'lt.2024-03-01']);
  assert.equal(q.get('kodeKlasifikasi'), 'eq.005');
  assert.equal(q.get('matched_labels.label_id'), 'eq.l1');
  assert.ok(q.get('select').includes('arsip_labels(label_id,labels(*))'));
  assert.ok(q.get('select').includes('matched_labels:arsip_labels!inner(label_id)'));
  assert.equal(q.get('order'), 'nomorSurat.asc.nullslast,id.asc');
});
test('an HTTP 416 page recovers the filtered count with a HEAD request for URL correction', async () => {
  const { client, requests } = fixtureClient(Array.from({ length: 26 }, (_, i) => row(i, null)), {
    fail: params => Number(params.get('offset') || 0) > 0 ? { code: 'PGRST103', message: 'Requested range not satisfiable' } : null,
  });
  const result = await fetchArsip(client, { page: 999, filterLabel: 'l1', filterDate: '2026-10-09' });
  assert.deepEqual(result, { data: [], count: 26 });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].method, 'HEAD');
  assert.equal(requests[1].params.get('matched_labels.label_id'), 'eq.l1');
  assert.deepEqual(requests[1].params.getAll('tanggalSurat'), ['gte.2026-10-09', 'lt.2026-10-10']);
});
test('search treats punctuation and wildcard characters literally and searches the sender', async () => {
  const { client, requests } = fixtureClient([]);
  await fetchArsip(client, { searchTerm: 'A, "B" (10%_*) \\ C' });
  assert.equal(requests[0].params.get('or'), '(nomorSurat.imatch."A, \\"B\\" \\\\(10%_\\\\*\\\\) \\\\\\\\ C",perihal.imatch."A, \\"B\\" \\\\(10%_\\\\*\\\\) \\\\\\\\ C",pengirim.imatch."A, \\"B\\" \\\\(10%_\\\\*\\\\) \\\\\\\\ C")');
});
test('all-data query reads beyond API row limits, including custom lower caps', async () => {
  const rows = Array.from({ length: 1105 }, (_, i) => row(i, null));
  const { client, requests } = fixtureClient(rows, { cap: 400 });
  const result = await fetchArsip(client, { page: 'all' });
  assert.equal(result.count, 1105);
  assert.equal(result.data.length, 1105);
  assert.deepEqual(requests.map(r => Number(r.params.get('offset') || 0)), [0, 400, 800]);
});
test('status filtering evaluates all matches before slicing and respects permanent/no-retention records', async () => {
  const rows = [row(1, '2020-01-01'), row(2, '2099-01-01'), row(3, null), row(4, '2020-01-01', '001')];
  const { client } = fixtureClient(rows, { cap: 2 });
  const active = await fetchArsip(client, { filterStatus: 'active' }, klasifikasi, undefined, now);
  assert.deepEqual(active.data.map(r => r.id), [2, 3, 4]);
  assert.equal(active.count, 3);
  const inactive = await fetchArsip(client, { filterStatus: 'inactive' }, klasifikasi, undefined, now);
  assert.deepEqual(inactive.data.map(r => r.id), [1]);
  assert.equal(inactive.count, 1);
});
test('virtual status sorting uses the actual status across every fetched batch', async () => {
  const { client } = fixtureClient([row(1, '2020-01-01'), row(2, '2099-01-01'), row(3, '2020-01-01', '001')], { cap: 1 });
  const asc = await fetchArsip(client, { sortBy: 'status', sortOrder: 'asc' }, klasifikasi, undefined, now);
  const desc = await fetchArsip(client, { sortBy: 'status', sortOrder: 'desc' }, klasifikasi, undefined, now);
  assert.deepEqual(asc.data.map(r => r.id), [2, 3, 1]);
  assert.deepEqual(desc.data.map(r => r.id), [1, 2, 3]);
});
test('label sorting orders actual label names, includes unlabelled rows, and remains stable', async () => {
  const labelRow = (id, name) => ({ ...row(id, null), arsip_labels: name ? [{ labels: { name } }] : [] });
  const { client } = fixtureClient([labelRow(1, 'Zulu'), labelRow(2, 'Alpha'), labelRow(3, ''), labelRow(4, 'Alpha')], { cap: 2 });
  const result = await fetchArsip(client, { sortBy: 'label', sortOrder: 'asc' });
  assert.deepEqual(result.data.map(r => r.id), [3, 2, 4, 1]);
});
test('detail query retrieves a record by ID, returns null when absent, and includes labels', async () => {
  const { client, requests } = fixtureClient([row('record-1', null)]);
  assert.equal((await fetchArsipDetail(client, 'record-1')).id, 'record-1');
  assert.equal(await fetchArsipDetail(client, 'missing'), null);
  assert.equal(requests[0].params.get('id'), 'eq.record-1');
  assert.ok(requests[0].params.get('select').includes('labels(*)'));
});
test('malformed IDs become not-found; database errors still surface for retry', async () => {
  const malformed = fixtureClient([], { fail: { code: '22P02', message: 'invalid uuid' } });
  assert.equal(await fetchArsipDetail(malformed.client, 'bad'), null);
  const denied = fixtureClient([], { fail: { code: '42501', message: 'permission denied' } });
  await assert.rejects(fetchArsipDetail(denied.client, 'valid'), { code: '42501' });
  await assert.rejects(fetchArsip(denied.client), { code: '42501' });
});
test('the AbortSignal is passed to every request', async () => {
  const { client, requests } = fixtureClient([row(1, null)]);
  const signal = new AbortController().signal;
  await fetchArsip(client, {}, [], signal);
  await fetchArsipDetail(client, '1', signal);
  assert.ok(requests.every(r => r.signal === signal));
});
test('retention boundary stays active today and does not mutate the reference date', () => {
  const before = now.getTime();
  assert.equal(getArsipStatus(row(1, '2026-10-09'), [], now), 'Aktif');
  assert.equal(getArsipStatus(row(1, '2026-10-08'), [], now), 'Inaktif');
  assert.equal(now.getTime(), before);
});
