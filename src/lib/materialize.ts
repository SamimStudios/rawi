// src/lib/materialize.ts
import { supabase } from '@/integrations/supabase/client';

export async function materializeCollections(jobId: string, nodeIds: string[]) {
  const { data, error } = await supabase.functions.invoke('materialize_collections', {
    body: { job_id: jobId, node_ids: nodeIds },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'materialize failed');
  return true;
}
