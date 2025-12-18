import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

export const KLASIFIKASI_KEYS = {
    all: ['klasifikasi'],
    list: () => [...KLASIFIKASI_KEYS.all, 'list'],
};

export function useKlasifikasi() {
    return useQuery({
        queryKey: KLASIFIKASI_KEYS.list(),
        queryFn: async () => {
            if (!supabase) return [];

            // Logic to fetch all (pagination handling from App.jsx)
            const PAGE_SIZE = 1000;
            let allKlasifikasi = [];
            let from = 0;
            let hasMore = true;

            while (hasMore) {
                const to = from + PAGE_SIZE - 1;
                const { data, error } = await supabase
                    .from('klasifikasi')
                    .select('*')
                    .order('kode', { ascending: true })
                    .range(from, to);

                if (error) throw error;

                allKlasifikasi = allKlasifikasi.concat(data || []);
                if (!data || data.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    from += PAGE_SIZE;
                }
            }

            // Client side sorting for consistent order
            const sorted = (allKlasifikasi || []).slice().sort((a, b) =>
                a.kode.localeCompare(b.kode, undefined, { numeric: true })
            );

            return sorted;
        },
        staleTime: 1000 * 60 * 60, // 1 hour (klasifikasi changes rarely)
    });
}
