import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

function isSSOTMedia(content: any): boolean {
  return content && content.kind === 'MediaContent' && Array.isArray(content.versions);
}

/**
 * Convert SSOT MediaContent to legacy shape expected by DB validator (if needed).
 * Keeps zero versions intact. URL can be empty.
 */
function legacyifyMediaForRPC(content: any): any {
  if (!isSSOTMedia(content)) return content;
  const selected = typeof content.selected_version_idx === 'number' ? content.selected_version_idx : undefined;
  const versions = (content.versions || []).map((v: any) => {
    const url = (v?.item?.url ?? '') as string;
    const width = v?.item?.width;
    const height = v?.item?.height;
    const duration_ms = v?.item?.duration_ms;
    const meta: Record<string, any> = {};
    if (typeof width === 'number') meta.width = width;
    if (typeof height === 'number') meta.height = height;
    if (typeof duration_ms === 'number') meta.duration = duration_ms / 1000;
    return {
      version: `v${v.idx ?? 0}`,
      url,
      metadata: meta,
    };
  });
  const def = selected ? `v${selected}` : undefined;
  const legacy = {
    type: content.type,
    versions,
    default_version: def,
  };
  console.debug('[useNodeLibrary] ↪︎ legacyifyMediaForRPC:', legacy);
  return legacy;
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
      const { data, error } = await supabase
        .schema('app' as any)
        .from('n8n_functions')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setN8NFunctions(data || []);
      console.log('✅ N8N functions loaded:', data?.length || 0);
    } catch (err) {
      console.error('❌ Error fetching n8n functions:', err);
      setN8NFunctions([]);
    }
  }, []);

  const validateEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    try {
      console.group('🔍 Validating node entry');
      console.log('Node type:', entry.node_type);
      console.log('Content structure:', entry.content);

      // Media (SSOT) with zero versions is valid per SSOT
      if (entry.node_type === 'media' && isSSOTMedia(entry.content)) {
        const versions = entry.content?.versions ?? [];
        if (versions.length === 0) {
          console.log('✅ Media SSOT with zero versions → treat as valid (per SSOT).');
          console.groupEnd();
          return true;
        }
      }

      // For media, convert SSOT → legacy for the DB validator only
      const contentForRPC =
        entry.node_type === 'media' ? legacyifyMediaForRPC(entry.content) : entry.content;

      const { data, error } = await supabase.rpc('is_valid_content_shape', {
        node_type: entry.node_type,
        content: contentForRPC,
      });

      if (error) {
        console.error('❌ RPC validation error:', error);
        console.groupEnd();
        throw error;
      }

      console.log('✅ Validation result:', data);
      console.groupEnd();
      return Boolean(data);
    } catch (err) {
      console.error('❌ Error validating entry:', err);
      console.groupEnd();
      return false;
    }
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
        title: "Saved",
        description: "Node library entry saved successfully",
      });

      // Refresh entries
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
