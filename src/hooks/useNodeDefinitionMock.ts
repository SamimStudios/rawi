import { useQuery } from '@tanstack/react-query';

export interface NodeDefinition {
  id: string;
  def_key: string;
  title: string;
  description: string | null;
  node_type: 'form' | 'group' | 'media';
  is_section: boolean;
  path_template: string;
  parent_path_template: string | null;
  content_template: FieldItem[];
  edit_template: any;
  actions_template: any;
  dependencies_template: any;
  version: number;
  active: boolean;
}

export interface FieldItem {
  ref: string;
  value: any;
  editable?: 'none' | 'simple' | 'n8n';
  hierarchy?: 'important' | 'default' | 'small' | 'hidden';
  removable?: boolean;
  label?: string;
  group?: string;
  prompt?: string;
}

export interface FieldRegistry {
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
}

// Mock data for testing - will be replaced with real Supabase queries once tables exist
const MOCK_NODE_DEFINITION: NodeDefinition = {
  id: '00000000-0000-0000-0000-000000000001',
  def_key: 'root.user_input.form',
  title: 'User Input Form',
  description: 'Configure your storyboard preferences and character details',
  node_type: 'form',
  is_section: true,
  path_template: 'root.user_input',
  parent_path_template: null,
  content_template: [
    { ref: 'size', value: null, group: 'Project Settings', label: 'Video Size' },
    { ref: 'language', value: null, group: 'Project Settings', label: 'Language' },
    { ref: 'accent', value: null, group: 'Project Settings', label: 'Accent' },
    { ref: 'genres', value: [], group: 'Project Settings', label: 'Genres', prompt: 'Select up to 3 genres' },
    { ref: 'template', value: null, group: 'Project Settings', label: 'Template' },
    { ref: 'lead.character_name', value: null, group: 'Lead Character', label: 'Character Name' },
    { ref: 'lead.character_gender', value: null, group: 'Lead Character', label: 'Gender' },
    { ref: 'lead.face_ref', value: null, group: 'Lead Character', label: 'Face Reference' },
    { ref: 'supporting.character_name', value: null, group: 'Supporting Character', label: 'Character Name' },
    { ref: 'supporting.character_gender', value: null, group: 'Supporting Character', label: 'Gender' },
    { ref: 'supporting.face_ref', value: null, group: 'Supporting Character', label: 'Face Reference' }
  ],
  edit_template: { has_editables: true },
  actions_template: {},
  dependencies_template: [],
  version: 1,
  active: true
};

const MOCK_FIELD_REGISTRY: Record<string, FieldRegistry> = {
  'size': {
    field_id: 'size',
    datatype: 'string',
    widget: 'select',
    options: {
      values: [
        { value: '16:9', label: { fallback: '16:9 (Widescreen)' } },
        { value: '9:16', label: { fallback: '9:16 (Portrait)' } },
        { value: '1:1', label: { fallback: '1:1 (Square)' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Video Size' } },
    default_value: '16:9'
  },
  'language': {
    field_id: 'language',
    datatype: 'string',
    widget: 'select',
    options: {
      values: [
        { value: 'en', label: { fallback: 'English' } },
        { value: 'ar', label: { fallback: 'Arabic' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Language' } },
    default_value: 'en'
  },
  'accent': {
    field_id: 'accent',
    datatype: 'string',
    widget: 'select',
    options: {
      values: [
        { value: 'american', label: { fallback: 'American' } },
        { value: 'british', label: { fallback: 'British' } },
        { value: 'gulf', label: { fallback: 'Gulf Arabic' } },
        { value: 'egyptian', label: { fallback: 'Egyptian Arabic' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Accent' } },
    default_value: 'american'
  },
  'genres': {
    field_id: 'genres',
    datatype: 'array',
    widget: 'tags',
    options: {
      values: [
        { value: 'action', label: { fallback: 'Action' } },
        { value: 'comedy', label: { fallback: 'Comedy' } },
        { value: 'drama', label: { fallback: 'Drama' } },
        { value: 'horror', label: { fallback: 'Horror' } },
        { value: 'romance', label: { fallback: 'Romance' } },
        { value: 'sci-fi', label: { fallback: 'Sci-Fi' } },
        { value: 'thriller', label: { fallback: 'Thriller' } },
        { value: 'adventure', label: { fallback: 'Adventure' } }
      ]
    },
    rules: { required: true, maxItems: 3 },
    ui: { label: { fallback: 'Genres' }, help: { fallback: 'Select up to 3 genres' } },
    default_value: []
  },
  'template': {
    field_id: 'template',
    datatype: 'string',
    widget: 'select',
    options: {
      values: [
        { value: 'cinematic_trailer', label: { fallback: 'Cinematic Trailer' } },
        { value: 'short_film', label: { fallback: 'Short Film' } },
        { value: 'commercial', label: { fallback: 'Commercial' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Template' } },
    default_value: 'cinematic_trailer'
  },
  'lead.character_name': {
    field_id: 'lead.character_name',
    datatype: 'string',
    widget: 'text',
    options: null,
    rules: { required: true, minLength: 2, maxLength: 50 },
    ui: { label: { fallback: 'Lead Character Name' } },
    default_value: null
  },
  'lead.character_gender': {
    field_id: 'lead.character_gender',
    datatype: 'string',
    widget: 'radio',
    options: {
      values: [
        { value: 'male', label: { fallback: 'Male' } },
        { value: 'female', label: { fallback: 'Female' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Gender' } },
    default_value: null
  },
  'lead.face_ref': {
    field_id: 'lead.face_ref',
    datatype: 'string',
    widget: 'url',
    options: null,
    rules: { required: false },
    ui: { label: { fallback: 'Face Reference URL' }, help: { fallback: 'Optional reference image URL' } },
    default_value: null
  },
  'supporting.character_name': {
    field_id: 'supporting.character_name',
    datatype: 'string',
    widget: 'text',
    options: null,
    rules: { required: true, minLength: 2, maxLength: 50 },
    ui: { label: { fallback: 'Supporting Character Name' } },
    default_value: null
  },
  'supporting.character_gender': {
    field_id: 'supporting.character_gender',
    datatype: 'string',
    widget: 'radio',
    options: {
      values: [
        { value: 'male', label: { fallback: 'Male' } },
        { value: 'female', label: { fallback: 'Female' } }
      ]
    },
    rules: { required: true },
    ui: { label: { fallback: 'Gender' } },
    default_value: null
  },
  'supporting.face_ref': {
    field_id: 'supporting.face_ref',
    datatype: 'string',
    widget: 'url',
    options: null,
    rules: { required: false },
    ui: { label: { fallback: 'Face Reference URL' }, help: { fallback: 'Optional reference image URL' } },
    default_value: null
  }
};

export function useNodeDefinition(defKey: string = 'root.user_input.form') {
  return useQuery({
    queryKey: ['node-definition', defKey],
    queryFn: async (): Promise<{
      definition: NodeDefinition;
      registryMap: Record<string, FieldRegistry>;
      fieldItems: FieldItem[];
    }> => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data for now
      return {
        definition: MOCK_NODE_DEFINITION,
        registryMap: MOCK_FIELD_REGISTRY,
        fieldItems: MOCK_NODE_DEFINITION.content_template
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}