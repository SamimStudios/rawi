import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FieldEntry {
  id: string;
  datatype: string;
  widget: string;
  options: any | null;
  rules: any;
  ui: any;
  default_value?: any;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export function useFields() {
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('field_registry')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setEntries(data as FieldEntry[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch field registry';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveEntry = useCallback(async (entry: Omit<FieldEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('field_registry')
        .upsert(entry as any, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field saved successfully",
      });

      // Refresh the entries
      await fetchEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save field';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to save field: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('field_registry')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Field deleted successfully",
      });

      // Refresh the entries
      await fetchEntries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete field';
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

  const getEntry = useCallback(async (id: string): Promise<FieldEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('field_registry')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as FieldEntry || null;
    } catch (err) {
      console.error('Error fetching field:', err);
      return null;
    }
  }, []);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    saveEntry,
    deleteEntry,
    getEntry,
  };
}