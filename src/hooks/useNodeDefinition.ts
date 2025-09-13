import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NodeDefinition {
  id: string;
  def_key: string;
  title: string;
  node_type: string;
  path_template: string;
  content_template: any[];
  edit_template: any;
  actions_template: any;
  dependencies_template: any[];
  active: boolean;
  version: number;
}

export function useNodeDefinition(defKey: string) {
  const [nodeDefinition, setNodeDefinition] = useState<NodeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNodeDefinition() {
      try {
        setLoading(true);
        setError(null);
        
        // Query the actual node_definitions table (with type casting until table is in types)
        const { data, error: queryError } = await (supabase as any)
          .from('node_definitions')
          .select('*')
          .eq('def_key', defKey)
          .eq('active', true)
          .single();

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            // No rows returned
            setNodeDefinition(null);
            return;
          }
          throw queryError;
        }
        
        setNodeDefinition(data as NodeDefinition);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch node definition');
      } finally {
        setLoading(false);
      }
    }

    if (defKey) {
      fetchNodeDefinition();
    }
  }, [defKey]);

  return { nodeDefinition, loading, error };
}