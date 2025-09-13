import { useMemo } from 'react';
import { FieldRegistryEntry } from './useFieldRegistry';

export interface FieldItem {
  ref: string;
  value?: any;
  editable?: 'none' | 'simple' | 'n8n';
  hierarchy?: 'important' | 'default' | 'small' | 'hidden';
  removable?: boolean;
  label?: string;
  group?: string;
}

interface UseFieldItemProps {
  fieldItems: FieldItem[];
  fieldRegistry: FieldRegistryEntry[];
}

export function useFieldItem({ fieldItems, fieldRegistry }: UseFieldItemProps) {
  
  // Extract unique field IDs from field items, handling dotted references
  const extractedFieldIds = useMemo(() => {
    return fieldItems
      .map(item => {
        // Extract base field ID from dotted references
        // e.g., "lead.character_name" -> "character_name"
        // e.g., "supporting.character_gender" -> "character_gender"  
        // e.g., "size" -> "size"
        const parts = item.ref.split('.');
        return parts[parts.length - 1];
      })
      .filter((ref, index, arr) => arr.indexOf(ref) === index); // Remove duplicates
  }, [fieldItems]);

  // Create lookup map for field registry
  const fieldRegistryMap = useMemo(() => {
    const map: Record<string, FieldRegistryEntry> = {};
    fieldRegistry.forEach(field => {
      map[field.field_id] = field;
    });
    return map;
  }, [fieldRegistry]);

  // Group field items by their group property
  const groupedFieldItems = useMemo(() => {
    const groups: Record<string, FieldItem[]> = {};
    
    fieldItems.forEach(item => {
      const group = item.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    return groups;
  }, [fieldItems]);

  // Get field registry entry for a given field item
  const getFieldRegistryEntry = (fieldItem: FieldItem): FieldRegistryEntry | null => {
    const parts = fieldItem.ref.split('.');
    const baseFieldId = parts[parts.length - 1];
    return fieldRegistryMap[baseFieldId] || null;
  };

  // Map form data to the correct structure for database storage
  const mapFormDataToStructure = (formData: any) => {
    const result: any = {};
    
    fieldItems.forEach(item => {
      const parts = item.ref.split('.');
      const baseFieldId = parts[parts.length - 1];
      const value = formData[baseFieldId];
      
      if (value !== undefined) {
        if (parts.length === 1) {
          // Simple field (e.g., "size", "language", "genres")
          result[parts[0]] = value;
        } else if (parts.length === 2) {
          // Nested field (e.g., "lead.character_name", "supporting.character_gender")
          const [category, field] = parts;
          if (!result[category]) result[category] = {};
          result[category][field] = value;
        } else if (parts.length > 2) {
          // Deep nested field - build the structure recursively
          let current = result;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = value;
        }
      }
    });
    
    return result;
  };

  // Extract form defaults from field registry and field items
  const getFormDefaults = () => {
    const defaults: any = {};
    
    fieldItems.forEach(item => {
      const fieldEntry = getFieldRegistryEntry(item);
      if (fieldEntry && fieldEntry.default_value !== undefined) {
        const parts = item.ref.split('.');
        const baseFieldId = parts[parts.length - 1];
        defaults[baseFieldId] = fieldEntry.default_value;
      }
    });
    
    return defaults;
  };

  return {
    extractedFieldIds,
    fieldRegistryMap,
    groupedFieldItems,
    getFieldRegistryEntry,
    mapFormDataToStructure,
    getFormDefaults
  };
}