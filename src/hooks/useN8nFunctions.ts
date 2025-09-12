import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface N8nFunctionRecord {
  id: string;
  name: string;
  price: number;
}

export function useN8nFunctions(names: string[]) {
  const [functions, setFunctions] = useState<N8nFunctionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!names || names.length === 0) {
          setFunctions([]);
          return;
        }
        const { data, error } = await supabase
          .from('n8n_functions')
          .select('id, name, price')
          .in('name', names)
          .eq('active', true);
        if (error) throw error;
        if (!cancelled) setFunctions(data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load functions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [names?.join('|')]);

  const byName = useMemo(() => {
    const map: Record<string, N8nFunctionRecord> = {};
    for (const f of functions) map[f.name] = f;
    return map;
  }, [functions]);

  return { functions, byName, loading, error };
}
