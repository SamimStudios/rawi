import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import JsonNodeRenderer from './JsonNodeRenderer';

interface StoryboardNode {
  id: string;
  job_id: string;
  path: any;
  content: any;
  updated_at: string;
}

export default function Nodes() {
  const [nodes, setNodes] = useState<StoryboardNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: nodesData, error: nodesError } = await (supabase as any)
        .from('nodes')
        .select('id, job_id, path, content, updated_at, node_type')
        .eq('node_type', 'form')
        .order('updated_at', { ascending: false });

      if (nodesError) throw nodesError;

      setNodes(nodesData || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Nodes</h1>
        <p className="text-muted-foreground">
          Form nodes from the storyboard system
        </p>
      </div>

      {nodes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No form nodes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {nodes.map((node) => (
            <JsonNodeRenderer key={node.id} nodeId={node.id} />
          ))}
        </div>
      )}
    </div>
  );
}