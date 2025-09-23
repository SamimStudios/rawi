import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RuleConfig {
  type: 'boolean' | 'number' | 'string' | 'array';
  label: string;
  description?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export interface FieldContracts {
  datatypes: string[];
  widgets: string[];
  rules: Record<string, Record<string, RuleConfig>>;
  widgetCompatibility: Record<string, string[]>;
}

export function useFieldContracts() {
  const [contracts, setContracts] = useState<FieldContracts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);

      // Get available datatypes using direct SQL query
      const datatypeQuery = await supabase
        .from('field_registry')
        .select('datatype')
        .limit(1);

      const widgetQuery = await supabase  
        .from('field_registry')
        .select('widget')
        .limit(1);

      // Hardcode the enums based on what we know from the schema
      const datatypes = ['string', 'number', 'boolean', 'array', 'object', 'uuid', 'url', 'date', 'datetime'];
      const widgets = ['text', 'textarea', 'select', 'radio', 'checkbox', 'tags', 'group', 'date', 'datetime', 'url', 'color', 'file'];

      // Define basic rules for each datatype (simplified approach)
      const rulesConfig: Record<string, Record<string, RuleConfig>> = {
        string: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          },
          minLength: {
            type: 'number',
            label: 'Min Length',
            description: 'Minimum number of characters',
            min: 0
          },
          maxLength: {
            type: 'number',
            label: 'Max Length',
            description: 'Maximum number of characters',
            min: 1
          },
          pattern: {
            type: 'string',
            label: 'Pattern',
            description: 'Regular expression pattern'
          }
        },
        number: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          },
          minimum: {
            type: 'number',
            label: 'Minimum',
            description: 'Minimum value'
          },
          maximum: {
            type: 'number',
            label: 'Maximum',
            description: 'Maximum value'
          }
        },
        boolean: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        },
        array: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          },
          minItems: {
            type: 'number',
            label: 'Min Items',
            description: 'Minimum number of items',
            min: 0
          },
          maxItems: {
            type: 'number',
            label: 'Max Items',
            description: 'Maximum number of items',
            min: 1
          }
        },
        object: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        },
        uuid: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        },
        url: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        },
        date: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        },
        datetime: {
          required: {
            type: 'boolean',
            label: 'Required',
            description: 'Field is required'
          }
        }
      };

      // Define widget compatibility
      const widgetCompatibility: Record<string, string[]> = {
        string: ['text', 'textarea', 'select', 'radio', 'url'],
        number: ['text', 'select', 'radio'],
        boolean: ['checkbox', 'select', 'radio'],
        array: ['tags', 'checkbox'],
        object: ['file', 'group'],
        uuid: ['select', 'radio'],
        url: ['url', 'text'],
        date: ['date'],
        datetime: ['datetime']
      };

      setContracts({
        datatypes: datatypes,
        widgets: widgets,
        rules: rulesConfig,
        widgetCompatibility
      });

    } catch (err) {
      console.error('Error fetching field contracts:', err);
      setError('Failed to load field contracts');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableWidgets = (datatype: string): string[] => {
    if (!contracts) return [];
    return contracts.widgetCompatibility[datatype] || [];
  };

  const getAvailableRules = (datatype: string): Record<string, RuleConfig> => {
    if (!contracts) return {};
    return contracts.rules[datatype] || {};
  };

  const widgetRequiresOptions = (widget: string): boolean => {
    return ['select', 'radio', 'checkbox', 'tags'].includes(widget);
  };

  return {
    contracts,
    loading,
    error,
    getAvailableWidgets,
    getAvailableRules,
    widgetRequiresOptions,
    refresh: fetchContracts
  };
}