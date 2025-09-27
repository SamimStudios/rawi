// src/lib/materialize.ts
import { supabase } from '@/integrations/supabase/client';

export async function materializeCollections(jobId: string, nodeIds: string[]) {
  try {
    const { data, error } = await supabase.functions.invoke('materialize_collections', {
      body: { job_id: jobId, node_ids: nodeIds },
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || 'materialize failed');
    return true;
  } catch (e) {
    console.warn('⚠️ materializeCollections skipped:', e);
    return false; // non-blocking
  }
}
