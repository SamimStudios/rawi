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
  type: string;
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
      const { data, error } = await supabase
        .schema('app' as any)
        .from('n8n_functions')
        .select('id, name, type, active')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setN8NFunctions(data || []);
    } catch (err) {
      console.error('Error fetching n8n functions:', err);
    }
  }, []);

  const validateEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    try {
      console.group('🔍 Validating node entry');
      console.log('Node type:', entry.node_type);
      console.log('Content structure:', entry.content);

      const { data, error } = await supabase.rpc('is_valid_content_shape', {
        node_type: entry.node_type,
        content: entry.content
      });

      if (error) {
        console.error('❌ RPC validation error:', error);
        console.groupEnd();
        throw error;
      }
      
      console.log('✅ Validation result:', data);
      console.groupEnd();
      return data as boolean;
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