import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

export const LABEL_KEYS = {
    all: ['labels'],
    list: () => [...LABEL_KEYS.all, 'list'],
};

export function useLabels() {
    return useQuery({
        queryKey: LABEL_KEYS.list(),
        queryFn: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase
                .from('labels')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
