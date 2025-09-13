import { useState, useEffect, useMemo } from 'react';
import { FieldRegistryEntry } from './useFieldRegistry';

export interface FieldItem {
  schema_ref_id: string;
  required: boolean;
  value?: any;
  group?: string;
}

export interface ResolvedField {
  id: string;
  label: string;
  placeholder: string;
  help: string;
  widget: string;
  value: any;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  required: boolean;
  editable: boolean;
  valid: boolean;
  errors: string[];
  datatype: string;
  rules: any;
}

export interface FormSummary {
  isValid: boolean;
  dirty: boolean;
  blockingErrors: string[];
}

interface UseFieldResolverProps {
  fieldItems: FieldItem[];
  fieldRegistry: FieldRegistryEntry[];
  currentValues: Record<string, any>;
  editMode: {
    has_editables: boolean;
    validation?: {
      mode: 'lenient' | 'strict';
      client?: string;
      server?: {
        n8n_function_id: string;
        payload?: any;
      };
    };
  };
  locale?: 'en' | 'ar';
}

export function useFieldResolver({
  fieldItems,
  fieldRegistry,
  currentValues,
  editMode,
  locale = 'en'
}: UseFieldResolverProps) {
  const [resolvedFields, setResolvedFields] = useState<ResolvedField[]>([]);
  const [summary, setSummary] = useState<FormSummary>({
    isValid: true,
    dirty: false,
    blockingErrors: []
  });

  // Create registry lookup map
  const registryById = useMemo(() => {
    const map: Record<string, FieldRegistryEntry> = {};
    fieldRegistry.forEach(field => {
      map[field.field_id] = field;
    });
    return map;
  }, [fieldRegistry]);

  // Resolve options for a field
  const resolveOptions = async (field: FieldRegistryEntry): Promise<Array<{ value: string; label: string; disabled?: boolean }>> => {
    if (!field.options) return [];

    const options = field.options;

    if (options.source === 'static') {
      let values = options.values || [];
      
      // Apply dependsOn filtering if present
      if (options.dependsOn) {
        for (const dep of options.dependsOn) {
          const depValue = currentValues[dep.field];
          if (depValue && dep.allow && !dep.allow.includes(depValue)) {
            values = values.filter((v: any) => dep.allow.includes(v.value));
          }
        }
      }

      return values.map((v: any) => ({
        value: v.value,
        label: v.label?.fallback || v.value,
        disabled: v.disabled || false
      }));
    }

    if (options.source === 'endpoint') {
      try {
        // TODO: Implement endpoint fetching
        console.warn('Endpoint options not yet implemented');
        return [];
      } catch (error) {
        console.error('Failed to fetch endpoint options:', error);
        return [];
      }
    }

    if (options.source === 'table') {
      try {
        // TODO: Implement table options
        console.warn('Table options not yet implemented');
        return [];
      } catch (error) {
        console.error('Failed to fetch table options:', error);
        return [];
      }
    }

    return [];
  };

  // Validate a field value
  const validateField = (field: FieldRegistryEntry, value: any, required: boolean, options?: Array<{ value: string; label: string }>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required validation
    if (required) {
      if (field.datatype === 'string' && (!value || value.trim() === '')) {
        errors.push(`${field.ui?.label?.fallback || field.field_id} is required`);
      } else if (field.datatype === 'array' && (!value || !Array.isArray(value) || value.length === 0)) {
        errors.push(`${field.ui?.label?.fallback || field.field_id} is required`);
      } else if (field.datatype === 'number' && (value === null || value === undefined || value === '')) {
        errors.push(`${field.ui?.label?.fallback || field.field_id} is required`);
      } else if (field.datatype === 'boolean' && value === null || value === undefined) {
        errors.push(`${field.ui?.label?.fallback || field.field_id} is required`);
      }
    }

    // Datatype validation
    if (value !== null && value !== undefined && value !== '') {
      switch (field.datatype) {
        case 'string':
        case 'uuid':
        case 'url':
        case 'date':
        case 'datetime':
          if (typeof value !== 'string') {
            errors.push('Must be a text value');
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push('Must be a number');
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push('Must be true or false');
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push('Must be an array');
          }
          break;
      }
    }

    // Rules validation
    if (field.rules && value) {
      const rules = field.rules;

      // String rules
      if (field.datatype === 'string' && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`Minimum ${rules.minLength} characters required`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`Maximum ${rules.maxLength} characters allowed`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push('Must match the required pattern');
        }
      }

      // Number rules
      if (field.datatype === 'number' && typeof value === 'number') {
        if (rules.minimum !== undefined && value < rules.minimum) {
          errors.push(`Minimum value is ${rules.minimum}`);
        }
        if (rules.maximum !== undefined && value > rules.maximum) {
          errors.push(`Maximum value is ${rules.maximum}`);
        }
      }

      // Array rules
      if (field.datatype === 'array' && Array.isArray(value)) {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`Minimum ${rules.minItems} items required`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`Maximum ${rules.maxItems} items allowed`);
        }
        if (rules.uniqueItems && new Set(value).size !== value.length) {
          errors.push('All items must be unique');
        }
      }
    }

    // Choice validation for static options
    if (options && options.length > 0) {
      const validValues = options.map(opt => opt.value);
      
      if (field.widget === 'select' || field.widget === 'radio') {
        if (value && !validValues.includes(value)) {
          errors.push('Must choose from the available options');
        }
      } else if (field.widget === 'tags' && Array.isArray(value)) {
        const invalidItems = value.filter(item => !validValues.includes(item));
        if (invalidItems.length > 0) {
          errors.push('All selected items must be from the available options');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Resolve all fields
  useEffect(() => {
    const resolveFields = async () => {
      const resolved: ResolvedField[] = [];
      
      for (const fieldItem of fieldItems) {
        const registryEntry = registryById[fieldItem.schema_ref_id];
        if (!registryEntry) {
          console.warn(`Field registry entry not found for: ${fieldItem.schema_ref_id}`);
          continue;
        }

        // Resolve UI text (i18n support can be added here)
        const label = registryEntry.ui?.label?.fallback || fieldItem.schema_ref_id;
        const placeholder = registryEntry.ui?.placeholder?.fallback || '';
        const help = registryEntry.ui?.help?.fallback || '';

        // Resolve value
        const value = fieldItem.value ?? currentValues[fieldItem.schema_ref_id] ?? registryEntry.default_value ?? null;

        // Resolve options
        const options = await resolveOptions(registryEntry);

        // Validate
        const validation = validateField(registryEntry, value, fieldItem.required, options);

        resolved.push({
          id: fieldItem.schema_ref_id,
          label,
          placeholder,
          help,
          widget: registryEntry.widget,
          value,
          options: options.length > 0 ? options : undefined,
          required: fieldItem.required,
          editable: editMode.has_editables,
          valid: validation.valid,
          errors: validation.errors,
          datatype: registryEntry.datatype,
          rules: registryEntry.rules
        });
      }

      setResolvedFields(resolved);

      // Update summary
      const allErrors = resolved.flatMap(f => f.errors);
      const blockingErrors = resolved.filter(f => f.required && !f.valid).flatMap(f => f.errors);
      
      setSummary({
        isValid: allErrors.length === 0,
        dirty: resolved.some(f => f.value !== (registryById[f.id]?.default_value ?? null)),
        blockingErrors
      });
    };

    if (fieldItems.length > 0 && fieldRegistry.length > 0) {
      resolveFields();
    }
  }, [fieldItems, fieldRegistry, currentValues, editMode, registryById]);

  // Group fields by group property
  const groupedFields = useMemo(() => {
    const groups: Record<string, ResolvedField[]> = {};
    
    fieldItems.forEach(item => {
      const resolvedField = resolvedFields.find(f => f.id === item.schema_ref_id);
      if (resolvedField) {
        const group = item.group || 'default';
        if (!groups[group]) groups[group] = [];
        groups[group].push(resolvedField);
      }
    });
    
    return groups;
  }, [fieldItems, resolvedFields]);

  return {
    resolvedFields,
    groupedFields,
    summary,
    registryById
  };
}