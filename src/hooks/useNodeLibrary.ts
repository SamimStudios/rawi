import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


function isValidGroupContent(c: any): boolean {
  if (!c || c.kind !== 'GroupContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;

  const hasChildren = Array.isArray(c.children);
  const hasCollection = !!c.collection || Array.isArray(c.instances);

  // Must be one or the other (or empty allowed)
  if (hasChildren && hasCollection) return false;

  // Regular group
  if (hasChildren) {
    return c.children.every((id: any) => typeof id === 'string' && id.length > 0);
  }

  // Collection group
  if (hasCollection) {
    if (!Array.isArray(c.instances)) return false;
    for (const inst of c.instances) {
      if (!inst || typeof inst.i !== 'number' || inst.i < 1) return false;
      if (typeof inst.idx !== 'number' || inst.idx < 1) return false;
      if (!Array.isArray(inst.children)) return false;
      if (!inst.children.every((id: any) => typeof id === 'string' && id.length > 0)) return false;
    }
  }

  // Allow an empty group (no children/instances) as a placeholder
  return true;
}



// --- SSOT validator for MediaContent ---
function isValidMediaContent(c: any): boolean {
  // root shape
  if (!c || c.kind !== 'MediaContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!['image','video','audio'].includes(c.type)) return false;
  if (!Array.isArray(c.versions)) return false;
  if (typeof c.selected_version_idx !== 'number') return false;

  // zero versions: allowed
  if (c.versions.length === 0) return true;

  // versions present → each must be a MediaVersion with a MediaItem
  let maxIdx = 0;
  for (const v of c.versions) {
    if (!v || v.kind !== 'MediaVersion') return false;
    if (typeof v.idx !== 'number' || v.idx < 1) return false;
    maxIdx = Math.max(maxIdx, v.idx);

    const it = v.item;
    if (!it || typeof it !== 'object') return false;

    // item kind must match type
    if (c.type === 'image' && it.kind !== 'ImageItem') return false;
    if (c.type === 'video' && it.kind !== 'VideoItem') return false;
    if (c.type === 'audio' && it.kind !== 'AudioItem') return false;

    // uri must be a string (allow empty if you want to save a stub)
    if (typeof it.uri !== 'string') return false;
  }

  // selected_version_idx must be within range when versions exist
  if (c.selected_version_idx < 1 || c.selected_version_idx > maxIdx) return false;
  return true;
}


export interface NodeLibraryEntry {
  id: string;
  node_type: 'form' | 'media' | 'group';
  content: Record<string, any>;
  payload_validate?: Record<string, any> | null;
  payload_generate?: Record<string, any> | null;
  validate_n8n_id?: string | null;
  generate_n8n_id?: string | null;
  active: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface N8NFunction {
  id: string;
  name: string;
  kind: string;
  active: boolean;
}

export function useNodeLibrary() {
  const [entries, setEntries] = useState<NodeLibraryEntry[]>([]);
  const [n8nFunctions, setN8NFunctions] = useState<N8NFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node library';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchN8NFunctions = useCallback(async () => {
    try {
      console.log('🔄 Fetching N8N functions...');
      
      const { data, error } = await supabase.functions.invoke('list-n8n-functions');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('📊 N8N functions response:', data);
      
      setN8NFunctions(data?.data || []);
      console.log('✅ N8N functions loaded:', data?.data?.length || 0);
    } catch (err) {
      console.error('❌ Error fetching n8n functions:', err);
      setN8NFunctions([]);
    }
  }, []);

    const validateEntry = useCallback(async (entry: NodeLibraryEntry) => {
    console.group('🧪 Validating node entry');
    console.log('Node type:', entry?.node_type);
    console.log('Content structure:', entry?.content);
  
    let ok = true;
    switch (entry?.node_type) {
      case 'media':
        ok = isValidMediaContent(entry?.content);
        break;
  
      // Keep your other types as-is; if you don’t have validators for them yet, default-allow:
      case 'form':
      case 'group':
        ok = isValidGroupContent(entry?.content);
        break;
      default:
        ok = true;
    }
  
    console.log('✅ Validation result:', ok);
    console.groupEnd();
  
    if (!ok) throw new Error('Invalid content structure for node type');
    return ok;
  }, []);


  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate entry before saving
      const isValid = await validateEntry(entry);
      if (!isValid) {
        throw new Error('Content validation failed - entry does not match expected structure');
      }

      const { error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .upsert(entry, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Node library entry saved successfully",
      });

      // Refresh the entries
      await fetchEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save node library entry';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to save entry: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast, validateEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Node library entry deleted successfully",
      });

      // Refresh the entries
      await fetchEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete node library entry';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast]);


  return {
    entries,
    n8nFunctions,
    loading,
    error,
    fetchEntries,
    fetchN8NFunctions,
    saveEntry,
    deleteEntry,
    validateEntry,
  };
}
