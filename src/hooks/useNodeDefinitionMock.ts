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
      
      // This would normally fetch from database - currently returns empty structure
      // to demonstrate pure dynamic behavior
      return {
        definition: {
          id: crypto.randomUUID(),
          def_key: defKey,
          title: 'Dynamic Form',
          description: 'Dynamically generated form from database configuration',
          node_type: 'form' as const,
          is_section: true,
          path_template: 'root.dynamic',
          parent_path_template: null,
          content_template: [], // Empty - no hard-coded fields
          edit_template: { has_editables: true },
          actions_template: {},
          dependencies_template: [],
          version: 1,
          active: true
        },
        registryMap: {}, // Empty - no hard-coded registry
        fieldItems: [] // Empty - no hard-coded items
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}