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

        // Mock data for development since field_registry table doesn't exist yet
        // Replace this with actual query once table is available
        const mockFields: FieldRegistryEntry[] = [
          {
            id: 'field-1',
            field_id: 'size',
            datatype: 'string',
            widget: 'select',
            options: {
              source: 'static',
              values: [
                { value: 'medium', label: { fallback: 'Medium (Recommended)' } },
                { value: 'large', label: { fallback: 'Large (Premium)' } }
              ]
            },
            rules: {},
            ui: { 
              label: { fallback: 'Project Size' },
              help: { fallback: 'Choose the size of your project' }
            },
            default_value: 'medium',
            version: 1
          },
          {
            id: 'field-2',
            field_id: 'language',
            datatype: 'string',
            widget: 'select',
            options: {
              source: 'static',
              values: [
                { value: 'en', label: { fallback: 'English' } },
                { value: 'ar', label: { fallback: 'Arabic' } }
              ]
            },
            rules: {},
            ui: { 
              label: { fallback: 'Language' },
              help: { fallback: 'Select the primary language for your project' }
            },
            default_value: 'en',
            version: 1
          },
          {
            id: 'field-3',
            field_id: 'accent',
            datatype: 'string',
            widget: 'select',
            options: {
              source: 'static',
              values: [
                { value: 'neutral', label: { fallback: 'Neutral' } },
                { value: 'british', label: { fallback: 'British' } },
                { value: 'american', label: { fallback: 'American' } }
              ]
            },
            rules: {},
            ui: { 
              label: { fallback: 'Accent' },
              help: { fallback: 'Choose the accent for voice narration' }
            },
            default_value: 'neutral',
            version: 1
          },
          {
            id: 'field-4',
            field_id: 'genres',
            datatype: 'array',
            widget: 'tags',
            options: {
              source: 'static',
              values: [
                { value: 'action', label: { fallback: 'Action' } },
                { value: 'drama', label: { fallback: 'Drama' } },
                { value: 'comedy', label: { fallback: 'Comedy' } },
                { value: 'horror', label: { fallback: 'Horror' } },
                { value: 'romance', label: { fallback: 'Romance' } },
                { value: 'thriller', label: { fallback: 'Thriller' } }
              ]
            },
            rules: { minItems: 1, maxItems: 3 },
            ui: { 
              label: { fallback: 'Genres' },
              help: { fallback: 'Select 1-3 genres for your story' }
            },
            default_value: [],
            version: 1
          },
          {
            id: 'field-5',
            field_id: 'template',
            datatype: 'string',
            widget: 'select',
            options: {
              source: 'static',
              values: [
                { value: 'cinematic_trailer', label: { fallback: 'Cinematic Trailer' } },
                { value: 'short_film', label: { fallback: 'Short Film' } }
              ]
            },
            rules: {},
            ui: { 
              label: { fallback: 'Template' },
              help: { fallback: 'Choose the type of content to create' }
            },
            default_value: 'cinematic_trailer',
            version: 1
          },
          {
            id: 'field-6',
            field_id: 'character_name',
            datatype: 'string',
            widget: 'text',
            options: null,
            rules: { minLength: 2, maxLength: 50 },
            ui: { 
              label: { fallback: 'Character Name' },
              placeholder: { fallback: 'Enter character name...' }
            },
            default_value: '',
            version: 1
          },
          {
            id: 'field-7',
            field_id: 'character_gender',
            datatype: 'string',
            widget: 'radio',
            options: {
              source: 'static',
              values: [
                { value: 'male', label: { fallback: 'Male' } },
                { value: 'female', label: { fallback: 'Female' } }
              ]
            },
            rules: {},
            ui: { 
              label: { fallback: 'Gender' }
            },
            default_value: '',
            version: 1
          },
          {
            id: 'field-8',
            field_id: 'face_ref',
            datatype: 'string',
            widget: 'file',
            options: null,
            rules: {},
            ui: { 
              label: { fallback: 'Character Image' },
              placeholder: { fallback: 'Enter image URL...' },
              help: { fallback: 'Optional: Add a reference image for the character' }
            },
            default_value: '',
            version: 1
          }
        ];
        
        const filteredFields = mockFields.filter(field => fieldIds.includes(field.field_id));
        setFields(filteredFields);
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