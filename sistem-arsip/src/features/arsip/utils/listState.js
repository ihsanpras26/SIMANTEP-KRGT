export const SORT_COLUMNS = ['tanggalSurat', 'nomorSurat', 'perihal', 'kodeKlasifikasi', 'created_at', 'status', 'label'];
export const PAGE_SIZES = [10, 20, 50, 100];
const DEFAULTS = {
  page: 1, pageSize: 10, searchTerm: '', filterKlasifikasi: 'all', filterLabel: 'all',
  filterStatus: 'all', filterDate: '', sortBy: 'tanggalSurat', sortOrder: 'desc', viewMode: 'table',
};
const URL_KEYS = {
  page: 'page', pageSize: 'pageSize', searchTerm: 'q', filterKlasifikasi: 'klasifikasi',
  filterLabel: 'label', filterStatus: 'status', filterDate: 'date', sortBy: 'sort', sortOrder: 'order', viewMode: 'view',
};

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

export function normalizeListState(state = {}) {
  const page = Number(state.page ?? 1);
  return {
    ...DEFAULTS,
    page: state.page === 'all' ? 'all' : (Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1),
    pageSize: PAGE_SIZES.includes(Number(state.pageSize)) ? Number(state.pageSize) : 10,
    searchTerm: String(state.searchTerm || ''),
    filterKlasifikasi: String(state.filterKlasifikasi || 'all'),
    filterLabel: String(state.filterLabel || 'all'),
    filterStatus: ['active', 'inactive'].includes(state.filterStatus) ? state.filterStatus : 'all',
    filterDate: validDate(state.filterDate),
    sortBy: SORT_COLUMNS.includes(state.sortBy) ? state.sortBy : DEFAULTS.sortBy,
    sortOrder: state.sortOrder === 'asc' ? 'asc' : 'desc',
    viewMode: state.viewMode === 'grid' ? 'grid' : 'table',
  };
}

export function readListState(params) {
  const state = normalizeListState(Object.fromEntries(
    Object.entries(URL_KEYS).map(([field, key]) => [field, params.get(key)]),
  ));
  // 'all' is an internal query mode, never a page in the browser URL.
  return { ...state, page: state.page === 'all' ? 1 : state.page };
}

export function updateListParams(params, patch) {
  const next = new URLSearchParams(params);
  const resetPage = Object.keys(patch).some(key => key !== 'page' && key !== 'viewMode');
  const state = normalizeListState({ ...readListState(params), ...patch, ...(resetPage ? { page: 1 } : {}) });
  for (const [field, key] of Object.entries(URL_KEYS)) {
    if (state[field] === DEFAULTS[field]) next.delete(key);
    else next.set(key, String(state[field]));
  }
  return next;
}

export function getArsipReturnPath(value) {
  return typeof value === 'string' && /^\/(arsip|semua-arsip)(\?|$)/.test(value) ? value : '/arsip';
}

export function matchesArsipSearch(arsip, query) {
  const term = query.trim().toLocaleLowerCase('id-ID');
  return ['nomorSurat', 'perihal', 'pengirim'].some(field => String(arsip[field] || '').toLocaleLowerCase('id-ID').includes(term));
}
