import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FieldDefinition {
  id: string;
  datatype: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'text' | 'select' | 'multiselect' | 'file';
  widget: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'password' | 'tel' | 'search' | 'date' | 'datetime-local' | 'time' | 'month' | 'week' | 'color' | 'range' | 'checkbox' | 'radio' | 'select' | 'multiselect' | 'file' | 'image' | 'audio' | 'video';
  options?: any;
  ui?: {
    label?: { fallback: string; key?: string };
    placeholder?: { fallback: string; key?: string };
    help?: { fallback: string; key?: string };
  };
  rules?: any;
  default_value?: any;
  version?: number;
}

interface UseFieldRegistryResult {
  getField: (fieldId: string) => FieldDefinition | null;
  loading: boolean;
  error: string | null;
  refreshRegistry: () => Promise<void>;
}

/**
 * Hook to fetch and cache field definitions from app.field_registry
 */
export function useFieldRegistry(): UseFieldRegistryResult {
  const [fieldRegistry, setFieldRegistry] = useState<Map<string, FieldDefinition>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistry = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[FieldRegistry] Fetching field registry from database...');
      
      const { data, error: fetchError } = await supabase
        .from('field_registry') 
        .select('*')
        .order('id');

      if (fetchError) {
        console.error('[FieldRegistry] Database error:', fetchError);
        throw fetchError;
      }

      const registry = new Map<string, FieldDefinition>();
      data?.forEach((field) => {
        registry.set(field.id!, field as FieldDefinition);
      });

      console.log(`[FieldRegistry] Loaded ${registry.size} field definitions:`, Array.from(registry.keys()));
      setFieldRegistry(registry);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch field registry';
      console.error('[FieldRegistry] Error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const getField = (fieldId: string): FieldDefinition | null => {
    const field = fieldRegistry.get(fieldId);
    if (!field) {
      console.warn(`[FieldRegistry] Field definition not found for ID: ${fieldId}`);
      return null;
    }
    return field;
  };

  return {
    getField,
    loading,
    error,
    refreshRegistry: fetchRegistry
  };
}