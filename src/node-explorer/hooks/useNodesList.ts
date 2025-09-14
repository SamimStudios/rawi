import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Node } from '../types/node';

interface UseNodesListOptions {
  jobId?: string;
  nodeType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface NodesListResponse {
  nodes: Node[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  meta: {
    filters: {
      jobId?: string;
      nodeType?: string;
      search?: string;
    };
    count: number;
  };
}

export function useNodesList(options: UseNodesListOptions = {}) {
  const [data, setData] = useState<NodesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (options.jobId) params.set('job_id', options.jobId);
        if (options.nodeType) params.set('node_type', options.nodeType);
        if (options.search) params.set('search', options.search);
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.offset) params.set('offset', options.offset.toString());

        const queryString = params.toString();
        const url = queryString ? `list-nodes?${queryString}` : 'list-nodes';

        const { data: response, error: apiError } = await supabase.functions.invoke(url, {
          method: 'GET'
        });

        if (apiError) {
          throw new Error(apiError.message || 'Failed to fetch nodes');
        }

        if (response?.error) {
          console.error('API response error:', response.error);
          throw new Error(response.error);
        }

        console.log('Raw API response:', response);

        setData(response);
        console.log('Nodes list data set:', response);
      } catch (err) {
        console.error('Error fetching nodes list:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, [
    options.jobId,
    options.nodeType,
    options.search,
    options.limit,
    options.offset
  ]);

  const refetch = () => {
    const fetchNodes = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.jobId) params.set('job_id', options.jobId);
        if (options.nodeType) params.set('node_type', options.nodeType);
        if (options.search) params.set('search', options.search);
        if (options.limit) params.set('limit', options.limit.toString());
        if (options.offset) params.set('offset', options.offset.toString());

        const queryString = params.toString();
        const url = queryString ? `list-nodes?${queryString}` : 'list-nodes';

        const { data: response, error: apiError } = await supabase.functions.invoke(url, {
          method: 'GET'
        });

        if (apiError) {
          throw new Error(apiError.message || 'Failed to fetch nodes');
        }

        if (response?.error) {
          throw new Error(response.error);
        }

        setData(response);
      } catch (err) {
        console.error('Error fetching nodes list:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch nodes');
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  };

  return { data, loading, error, refetch };
}