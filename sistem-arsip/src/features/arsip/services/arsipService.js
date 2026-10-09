import { normalizeListState } from '../utils/listState.js';
import { getArsipStatus } from '../utils/statusUtils.js';

const BATCH_SIZE = 1000;
const BASE_SELECT = '*, arsip_labels(label_id, labels(*))';
const VIRTUAL_SORTS = ['status', 'label'];

export function needsCompleteResult(params) {
  return params.page === 'all' || params.filterStatus !== 'all' || VIRTUAL_SORTS.includes(params.sortBy);
}

function buildQuery(client, params, signal, head = false) {
  // An independent embed filters parents without dropping their other labels.
  const selection = params.filterLabel === 'all' ? BASE_SELECT : `${BASE_SELECT}, matched_labels:arsip_labels!inner(label_id)`;
  let query = client.from('arsip').select(selection, { count: 'exact', head });
  const term = params.searchTerm.trim();
  if (term) {
    // Quote PostgREST values so commas/parentheses/quotes cannot change the predicate.
    const pattern = JSON.stringify(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    query = query.or(['nomorSurat', 'perihal', 'pengirim'].map(column => `${column}.imatch.${pattern}`).join(','));
  }
  if (params.filterKlasifikasi !== 'all') query = query.eq('kodeKlasifikasi', params.filterKlasifikasi);
  if (params.filterLabel !== 'all') query = query.eq('matched_labels.label_id', params.filterLabel);
  if (params.filterDate) {
    const nextDay = new Date(`${params.filterDate}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    query = query.gte('tanggalSurat', params.filterDate).lt('tanggalSurat', nextDay.toISOString().slice(0, 10));
  }
  // A unique tie-breaker keeps equal dates from moving between pages.
  if (!VIRTUAL_SORTS.includes(params.sortBy)) query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc', nullsFirst: false });
  query = query.order('id', { ascending: true });
  return signal ? query.abortSignal(signal) : query;
}

function compareVirtualRows(rows, params, klasifikasi, now) {
  const collator = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' });
  const labelText = row => (row.arsip_labels || []).map(item => item.labels?.name || '').sort(collator.compare).join(', ');
  const value = row => params.sortBy === 'status' ? getArsipStatus(row, klasifikasi, now) : labelText(row);
  return rows.sort((a, b) => (collator.compare(value(a), value(b)) * (params.sortOrder === 'asc' ? 1 : -1)) || collator.compare(String(a.id), String(b.id)));
}

// Returns a complete collection for derived status/label queries. The hook pages
// this cached collection only after filtering/sorting, never just one server page.
export async function fetchArsip(client, rawParams = {}, klasifikasi = [], signal, now = new Date()) {
  if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
  const params = normalizeListState(rawParams);
  if (!needsCompleteResult(params)) {
    const from = (params.page - 1) * params.pageSize;
    const { data, count, error } = await buildQuery(client, params, signal).range(from, from + params.pageSize - 1);
    if (error?.code === 'PGRST103' && from > 0) {
      // PostgREST can return HTTP 416 instead of an empty page. Recover the
      // filtered count so the list can replace an obsolete/out-of-range URL.
      const total = await buildQuery(client, params, signal, true).range(0, 0);
      if (total.error) throw total.error;
      return { data: [], count: total.count ?? 0 };
    }
    if (error) throw error;
    return { data: data || [], count: count ?? 0 };
  }

  let rows = [];
  let count;
  while (true) {
    const { data, count: serverCount, error } = await buildQuery(client, params, signal).range(rows.length, rows.length + BATCH_SIZE - 1);
    if (error) throw error;
    count = serverCount;
    if (!data?.length) break;
    rows = rows.concat(data);
    if (count != null ? rows.length >= count : data.length < BATCH_SIZE) break;
  }
  if (params.filterStatus !== 'all') {
    const status = params.filterStatus === 'active' ? 'Aktif' : 'Inaktif';
    rows = rows.filter(row => getArsipStatus(row, klasifikasi, now) === status);
  }
  if (VIRTUAL_SORTS.includes(params.sortBy)) rows = compareVirtualRows(rows, params, klasifikasi, now);
  return { data: rows, count: rows.length };
}

export async function fetchArsipDetail(client, id, signal) {
  if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
  let query = client.from('arsip').select(BASE_SELECT).eq('id', id);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error?.code === '22P02') return null; // Malformed UUID in a direct link.
  if (error) throw error;
  return data;
}
