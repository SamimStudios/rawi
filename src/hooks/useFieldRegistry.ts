import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FieldRegistryEntry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options?: any;
  rules: any;
  ui: any;
  default_value?: any;
  version: number;
}

export function useFieldRegistry(fieldIds: string[]) {
  const [fields, setFields] = useState<FieldRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFields() {
      try {
        setLoading(true);
        setError(null);
        
        if (!fieldIds || fieldIds.length === 0) {
          setFields([]);
          return;
        }

        // Query the actual field_registry table (with type casting until table is in types)
        const { data, error: queryError } = await (supabase as any)
          .from('field_registry')
          .select('*')
          .in('field_id', fieldIds);

        if (queryError) throw queryError;
        
        setFields((data || []) as FieldRegistryEntry[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch field registry');
      } finally {
        setLoading(false);
      }
    }

    fetchFields();
  }, [fieldIds.join(',')]);

  const getFieldById = (fieldId: string) => {
    return fields.find(field => field.field_id === fieldId);
  };

  return { fields, getFieldById, loading, error };
}