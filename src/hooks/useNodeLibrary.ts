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
      console.log('NodeLibrary: Fetching entries from app.node_library');
      const { data, error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('NodeLibrary: Fetch error:', error);
        throw error;
      }
      
      console.log('NodeLibrary: Fetched entries:', data?.length || 0);
      setEntries(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node library';
      console.error('NodeLibrary: Fetch failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchN8NFunctions = useCallback(async () => {
    try {
      console.log('NodeLibrary: Fetching N8N functions from public.n8n_functions');
      const { data, error } = await supabase
        .from('n8n_functions')
        .select('id, name, type, active')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('NodeLibrary: N8N functions fetch error:', error);
        throw error;
      }
      
      console.log('NodeLibrary: Fetched N8N functions:', data?.length || 0);
      setN8NFunctions(data || []);
    } catch (err) {
      console.error('NodeLibrary: Error fetching n8n functions:', err);
    }
  }, []);

  const validateEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    try {
      console.log('NodeLibrary: Validating entry content shape for type:', entry.node_type);
      console.log('NodeLibrary: Content to validate:', entry.content);
      
      // Call validation function via RPC
      const { data, error } = await supabase.rpc('is_valid_content_shape', {
        node_type: entry.node_type,
        content: entry.content
      });

      if (error) {
        console.error('NodeLibrary: Validation RPC error:', error);
        throw error;
      }
      
      console.log('NodeLibrary: Validation result:', data);
      return data as boolean;
    } catch (err) {
      console.error('NodeLibrary: Error validating entry:', err);
      return false;
    }
  }, []);

  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      console.group('NodeLibrary Save Operation');
      console.log('Schema target:', 'app.node_library');
      console.log('Entry data:', {
        id: entry.id,
        node_type: entry.node_type,
        content_keys: Object.keys(entry.content || {}),
        content_structure: entry.content,
        active: entry.active,
        version: entry.version
      });
      console.groupEnd();

      // Validate entry before saving
      console.log('NodeLibrary: Validating entry before save...');
      const isValid = await validateEntry(entry);
      if (!isValid) {
        console.error('NodeLibrary: Entry validation failed');
        throw new Error('Content validation failed - entry does not match expected structure');
      }
      console.log('NodeLibrary: Entry validation passed');

      const { error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .upsert(entry, { onConflict: 'id' });

      if (error) {
        console.error('NodeLibrary: Supabase upsert error:', error);
        throw error;
      }

      console.log('NodeLibrary: Entry saved successfully');
      toast({
        title: "Success",
        description: "Node library entry saved successfully",
      });

      // Refresh the entries
      await fetchEntries();
      return true;
    } catch (err) {
      console.group('NodeLibrary Save Error Details');
      console.error('Error saving node library entry:', err);
      if (typeof err === 'object' && err) {
        const anyErr = err as any;
        console.log('Supabase error details:', {
          code: anyErr?.code,
          message: anyErr?.message,
          details: anyErr?.details,
          hint: anyErr?.hint,
        });
      }
      console.groupEnd();
      
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