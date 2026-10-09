import test from 'node:test';
import assert from 'node:assert/strict';
import { readListState, updateListParams, normalizeListState, getArsipReturnPath, matchesArsipSearch } from '../src/features/arsip/utils/listState.js';

const read = value => readListState(new URLSearchParams(value));
test('URL restores search, filters, sort, page size, page, and view', () => {
  assert.deepEqual(read('q=DLH&status=inactive&date=2026-10-09&klasifikasi=521&label=l1&sort=nomorSurat&order=asc&page=3&pageSize=20&view=grid'), {
    searchTerm: 'DLH', filterStatus: 'inactive', filterDate: '2026-10-09', filterKlasifikasi: '521', filterLabel: 'l1', sortBy: 'nomorSurat', sortOrder: 'asc', page: 3, pageSize: 20, viewMode: 'grid',
  });
});
test('invalid URL values cannot create invalid pages, dates, or sort columns', () => {
  for (const page of ['all', '-1', '1.5', '0', 'Infinity', '9007199254740991']) assert.equal(read(`page=${page}`).page, 1);
  assert.equal(read('date=2026-02-30').filterDate, '');
  assert.equal(read('date=2024-02-29').filterDate, '2024-02-29');
  assert.equal(read('pageSize=999&sort=invalid&status=nope').pageSize, 10);
  assert.equal(read('sort=invalid').sortBy, 'tanggalSurat');
  assert.equal(normalizeListState({ page: 'all' }).page, 'all');
});
test('changes reset pagination atomically while preserving unrelated URL state', () => {
  const params = new URLSearchParams('page=3&label=l1&campaign=example');
  const updated = updateListParams(params, { filterStatus: 'inactive', filterDate: '2026-10-09' });
  assert.equal(readListState(updated).page, 1);
  assert.equal(updated.get('label'), 'l1');
  assert.equal(updated.get('campaign'), 'example');
  assert.equal(params.get('page'), '3');
  for (const patch of [{ searchTerm: 'A' }, { sortBy: 'label' }, { sortOrder: 'asc' }, { pageSize: 50 }]) {
    assert.equal(readListState(updateListParams(params, patch)).page, 1);
  }
});
test('pagination/view changes preserve filters and defaults are omitted from URLs', () => {
  const params = new URLSearchParams('status=active&page=3');
  assert.equal(readListState(updateListParams(params, { viewMode: 'grid' })).page, 3);
  assert.equal(readListState(updateListParams(params, { page: 4 })).filterStatus, 'active');
  assert.equal(updateListParams(params, { filterStatus: 'all' }).toString(), '');
});
test('detail return links allow only the two list routes', () => {
  for (const path of ['/arsip?status=active&page=2', '/semua-arsip?q=DLH']) assert.equal(getArsipReturnPath(path), path);
  for (const path of ['//evil.test', 'https://evil.test', '/arsip/other', '/arsip/tambah', undefined]) assert.equal(getArsipReturnPath(path), '/arsip');
});
test('command search uses actual archive number, subject, and sender fields', () => {
  const row = { nomorSurat: '005/021/KRGT/2026', perihal: 'Undangan rapat', pengirim: 'Dinas Lingkungan Hidup' };
  for (const term of ['005/021', 'RAPAT', ' lingkungan ']) assert.ok(matchesArsipSearch(row, term));
  assert.equal(matchesArsipSearch(row, 'nomor tidak ada'), false);
  assert.equal(matchesArsipSearch({}, 'rapat'), false);
});
