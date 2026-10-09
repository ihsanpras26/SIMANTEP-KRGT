import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useKlasifikasi } from '../../klasifikasi/hooks/useKlasifikasi';
import { normalizeListState } from '../utils/listState';
import { fetchArsip, fetchArsipDetail, needsCompleteResult } from '../services/arsipService';

export const ARSIP_KEYS = {
  all: ['arsip'],
  list: params => [...ARSIP_KEYS.all, 'list', params],
  detail: id => [...ARSIP_KEYS.all, 'detail', id],
};

export function useArsip(rawParams = {}) {
  const { viewMode: _viewMode, ...params } = normalizeListState(rawParams);
  const klasifikasi = useKlasifikasi();
  const complete = needsCompleteResult(params);
  const needsStatus = params.filterStatus !== 'all' || params.sortBy === 'status';
  const queryParams = complete ? { ...params, page: 'all', pageSize: 10 } : params;
  const now = new Date();
  const classificationVersion = needsStatus ? (klasifikasi.data || []).map(k => [k.kode, k.retensiAktif, k.retensiInaktif]) : null;

  const query = useQuery({
    queryKey: ARSIP_KEYS.list({ ...queryParams, ...(needsStatus ? { classificationVersion, day: now.toDateString() } : {}) }),
    enabled: Boolean(supabase) && (!needsStatus || klasifikasi.isSuccess),
    queryFn: ({ signal }) => fetchArsip(supabase, queryParams, klasifikasi.data || [], signal, now),
    select: result => complete && params.page !== 'all'
      ? { ...result, data: result.data.slice((params.page - 1) * params.pageSize, params.page * params.pageSize) }
      : result,
    placeholderData: keepPreviousData,
  });
  if (needsStatus && klasifikasi.isError) {
    return { ...query, isError: true, error: klasifikasi.error, refetch: klasifikasi.refetch };
  }
  return { ...query, isLoading: query.isLoading || (needsStatus && klasifikasi.isPending) };
}

export function useArsipDetail(id) {
  return useQuery({
    queryKey: ARSIP_KEYS.detail(id),
    enabled: Boolean(supabase && id),
    queryFn: ({ signal }) => fetchArsipDetail(supabase, id, signal),
    staleTime: 0,
  });
}
