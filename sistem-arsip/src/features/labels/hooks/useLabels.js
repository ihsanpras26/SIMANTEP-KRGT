import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";

export const LABEL_KEYS = {
  all: ["labels"],
  list: () => [...LABEL_KEYS.all, "list"],
};

export function useLabels(options = {}) {
  return useQuery({
    queryKey: LABEL_KEYS.list(),
    enabled: options.enabled !== false && Boolean(supabase),
    queryFn: async ({ signal }) => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .order("name", { ascending: true })
        .abortSignal(signal);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
