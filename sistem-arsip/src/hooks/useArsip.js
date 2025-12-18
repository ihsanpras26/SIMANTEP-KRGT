import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

export const ARSIP_KEYS = {
    all: ['arsip'],
    list: (params) => [...ARSIP_KEYS.all, 'list', params],
    detail: (id) => [...ARSIP_KEYS.all, 'detail', id],
};

export function useArsip(params = {}) {
    const {
        page = 1,
        pageSize = 10,
        searchTerm = '',
        filterKlasifikasi = 'all',
        filterLabel = 'all',
        sortBy = 'tanggalSurat',
        sortOrder = 'desc'
    } = params;

    return useQuery({
        queryKey: ARSIP_KEYS.list({ page, pageSize, searchTerm, filterKlasifikasi, filterLabel, sortBy, sortOrder }),
        queryFn: async () => {
            if (!supabase) return { data: [], count: 0 };

            let query = supabase
                .from('arsip')
                .select('*, arsip_labels(label_id, labels(*))', { count: 'exact' });

            // Filters
            if (searchTerm) {
                query = query.or(`nomorSurat.ilike.%${searchTerm}%,perihal.ilike.%${searchTerm}%`);
            }
            if (filterKlasifikasi !== 'all') {
                query = query.eq('kodeKlasifikasi', filterKlasifikasi);
            }
            // Label filtering using inner join for many-to-many relationship
            if (filterLabel !== 'all') {
                // Use !inner join to filter by arsip_labels relationship
                // This ensures only arsip with the specific label_id are returned
                query = supabase
                    .from('arsip')
                    .select('*, arsip_labels!inner(label_id, labels(*))', { count: 'exact' })
                    .eq('arsip_labels.label_id', filterLabel);

                // Re-apply other filters if they were set
                if (searchTerm) {
                    query = query.or(`nomorSurat.ilike.%${searchTerm}%,perihal.ilike.%${searchTerm}%`);
                }
                if (filterKlasifikasi !== 'all') {
                    query = query.eq('kodeKlasifikasi', filterKlasifikasi);
                }
            }

            // Sorting
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            // Pagination
            // Pagination
            if (page !== 'all') {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            return { data, count };
        },
        placeholderData: keepPreviousData, // Keep old data while fetching new page
    });
}
