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
      
      // Query app.n8n_functions using direct REST API with schema profile
      const response = await fetch(`https://ubrxxvgfbwboucuxteec.supabase.co/rest/v1/n8n_functions?active=eq.true&select=id,name,kind,active&order=name`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicnh4dmdmYndib3VjdXh0ZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTQ4MTQsImV4cCI6MjA3MDkzMDgxNH0.qW50RBzQBeudVHeVLbmvYWp0dYmjWUpI5K7AbGKDtVY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicnh4dmdmYndib3VjdXh0ZWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTQ4MTQsImV4cCI6MjA3MDkzMDgxNH0.qW50RBzQBeudVHeVLbmvYWp0dYmjWUpI5K7AbGKDtVY',
          'Accept-Profile': 'app',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 N8N functions response:', data);
      
      setN8NFunctions(data || []);
      console.log('✅ N8N functions loaded:', data?.length || 0);
    } catch (err) {
      console.error('❌ Error fetching n8n functions:', err);
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