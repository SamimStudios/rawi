import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WorkspaceNode } from '@/types/workspace';

export function useWorkspaceNodes(jobId: string) {
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetchNodes();
  }, [jobId]);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: nodesData, error: nodesError } = await supabase
        .from('storyboard_nodes')
        .select('*')
        .eq('job_id', jobId)
        .order('path', { ascending: true });

      if (nodesError) throw nodesError;

      setNodes(nodesData || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  return { nodes, loading, error, refetch: fetchNodes };
}