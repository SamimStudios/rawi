import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NodeResponse } from '../types/node';

interface UseNodeDataOptions {
  ancestors?: boolean;
  children?: boolean;
  descendants?: boolean;
  depth?: number;
  types?: string[];
  normalizedForms?: boolean;
}

export function useNodeData(nodeId: string, options: UseNodeDataOptions = {}) {
  const [data, setData] = useState<NodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) return;

    const fetchNode = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (options.ancestors) params.set('ancestors', '1');
        if (options.children) params.set('children', '1');
        if (options.descendants) params.set('descendants', '1');
        if (options.depth !== undefined) params.set('depth', options.depth.toString());
        if (options.types?.length) params.set('types', options.types.join(','));
        if (options.normalizedForms) params.set('normalized_forms', '1');

        const queryString = params.toString();
        const url = queryString ? `get-node/${nodeId}?${queryString}` : `get-node/${nodeId}`;

        const { data: response, error: apiError } = await supabase.functions.invoke(url, {
          method: 'GET'
        });

        if (apiError) {
          throw new Error(apiError.message || 'Failed to fetch node data');
        }

        if (response?.error) {
          throw new Error(response.error);
        }

        setData(response);
      } catch (err) {
        console.error('Error fetching node data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch node data');
      } finally {
        setLoading(false);
      }
    };

    fetchNode();
  }, [
    nodeId, 
    options.ancestors, 
    options.children, 
    options.descendants, 
    options.depth, 
    options.types?.join(','), 
    options.normalizedForms
  ]);

  const refetch = () => {
    if (!nodeId) return;
    const fetchNode = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.ancestors) params.set('ancestors', '1');
        if (options.children) params.set('children', '1');
        if (options.descendants) params.set('descendants', '1');
        if (options.depth !== undefined) params.set('depth', options.depth.toString());
        if (options.types?.length) params.set('types', options.types.join(','));
        if (options.normalizedForms) params.set('normalized_forms', '1');

        const queryString = params.toString();
        const url = queryString ? `get-node/${nodeId}?${queryString}` : `get-node/${nodeId}`;

        const { data: response, error: apiError } = await supabase.functions.invoke(url, {
          method: 'GET'
        });

        if (apiError) {
          throw new Error(apiError.message || 'Failed to fetch node data');
        }

        if (response?.error) {
          throw new Error(response.error);
        }

        setData(response);
      } catch (err) {
        console.error('Error fetching node data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch node data');
      } finally {
        setLoading(false);
      }
    };
    fetchNode();
  };

  return { data, loading, error, refetch };
}