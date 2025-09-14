import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FieldRegistryItem } from '../types/node';

export function useFieldRegistry(fieldRefs: string[]) {
  const [fields, setFields] = useState<Record<string, FieldRegistryItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fieldRefs.length) return;

    const fetchFields = async () => {
      try {
        setLoading(true);
        setError(null);

        // Note: field_registry table may not exist yet, mock for now
        const data: FieldRegistryItem[] = [];
        const queryError = null;

        if (queryError) {
          throw new Error(queryError.message);
        }

        // Convert to lookup object
        const fieldsMap = data?.reduce((acc, field) => {
          acc[field.field_id] = field;
          return acc;
        }, {} as Record<string, FieldRegistryItem>) || {};

        setFields(fieldsMap);
      } catch (err) {
        console.error('Error fetching field registry:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch field registry');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [fieldRefs.join(',')]);

  const getFieldLabel = (fieldRef: string, language: 'en' | 'ar' = 'en') => {
    const field = fields[fieldRef];
    if (!field?.ui?.label) return fieldRef;

    const label = field.ui.label;
    if (language === 'ar' && label.key) {
      // In a real implementation, you'd lookup the translation by key
      return label.fallback; // Fallback for now
    }
    
    return label.fallback || fieldRef;
  };

  const getFieldPlaceholder = (fieldRef: string, language: 'en' | 'ar' = 'en') => {
    const field = fields[fieldRef];
    if (!field?.ui?.placeholder) return '';

    const placeholder = field.ui.placeholder;
    if (language === 'ar' && placeholder.key) {
      // In a real implementation, you'd lookup the translation by key
      return placeholder.fallback; // Fallback for now
    }
    
    return placeholder.fallback || '';
  };

  const getFieldHelp = (fieldRef: string, language: 'en' | 'ar' = 'en') => {
    const field = fields[fieldRef];
    if (!field?.ui?.help) return '';

    const help = field.ui.help;
    if (language === 'ar' && help.key) {
      // In a real implementation, you'd lookup the translation by key
      return help.fallback; // Fallback for now
    }
    
    return help.fallback || '';
  };

  return {
    fields,
    loading,
    error,
    getFieldLabel,
    getFieldPlaceholder,
    getFieldHelp
  };
}