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

export interface UIConfig {
  label?: string;
  placeholder?: string;
  help_text?: string;
}

export interface FieldContracts {
  datatypes: string[];
  widgets: string[];
  rules: Record<string, Record<string, RuleConfig>>;
  widgetCompatibility: Record<string, string[]>;
  uiFields: Record<string, any>;
  optionsConfig: any;
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

      // Get available datatypes and widgets from field_registry table
      const { data: registryData, error: registryError } = await supabase
        .from('field_registry')
        .select('datatype, widget')
        .limit(100);

      if (registryError) {
        throw new Error(`Registry error: ${registryError.message}`);
      }

      // Extract unique datatypes and widgets
      const datatypes = [...new Set(registryData?.map(item => item.datatype) || [])];
      const widgets = [...new Set(registryData?.map(item => item.widget) || [])];

      const widgetCompatibility: Record<string, string[]> = {};
      const rulesConfig: Record<string, Record<string, RuleConfig>> = {};

      // Build widget compatibility matrix
      for (const datatype of datatypes) {
        widgetCompatibility[datatype] = [];
        
        // Get compatible widgets for each datatype
        for (const widget of widgets) {
          const isCompatible = await checkWidgetCompatibility(datatype, widget);
          if (isCompatible) {
            widgetCompatibility[datatype].push(widget);
          }
        }
      }

      // Build rules configuration for each datatype
      for (const datatype of datatypes) {
        rulesConfig[datatype] = await getDataTypeRules(datatype);
      }

      // Basic UI fields configuration
      const uiFields = {
        label: { type: 'string', label: 'Label', required: false },
        placeholder: { type: 'string', label: 'Placeholder', required: false },
        help_text: { type: 'string', label: 'Help Text', required: false }
      };

      setContracts({
        datatypes,
        widgets,
        rules: rulesConfig,
        widgetCompatibility,
        uiFields,
        optionsConfig: null
      });

    } catch (err) {
      console.error('Error fetching field contracts:', err);
      setError('Failed to load field contracts');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check widget compatibility with datatype
  const checkWidgetCompatibility = async (datatype: string, widget: string): Promise<boolean> => {
    // Basic compatibility rules - this could be enhanced with RPC calls
    const compatibilityMap: Record<string, string[]> = {
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

    return compatibilityMap[datatype]?.includes(widget) || false;
  };

  // Helper function to get rules for a specific datatype
  const getDataTypeRules = async (datatype: string): Promise<Record<string, RuleConfig>> => {
    // Basic rules configuration - could be enhanced with specific RPC calls
    const baseRules = {
      required: {
        type: 'boolean' as const,
        label: 'Required',
        description: 'Field is required'
      }
    };

    const specificRules: Record<string, Record<string, RuleConfig>> = {
      string: {
        ...baseRules,
        minLength: {
          type: 'number' as const,
          label: 'Min Length',
          description: 'Minimum number of characters',
          min: 0
        },
        maxLength: {
          type: 'number' as const,
          label: 'Max Length',
          description: 'Maximum number of characters',
          min: 1
        },
        pattern: {
          type: 'string' as const,
          label: 'Pattern',
          description: 'Regular expression pattern'
        }
      },
      number: {
        ...baseRules,
        minimum: {
          type: 'number' as const,
          label: 'Minimum',
          description: 'Minimum value'
        },
        maximum: {
          type: 'number' as const,
          label: 'Maximum',
          description: 'Maximum value'
        }
      },
      array: {
        ...baseRules,
        minItems: {
          type: 'number' as const,
          label: 'Min Items',
          description: 'Minimum number of items',
          min: 0
        },
        maxItems: {
          type: 'number' as const,
          label: 'Max Items',
          description: 'Maximum number of items',
          min: 1
        }
      }
    };

    return specificRules[datatype] || baseRules;
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