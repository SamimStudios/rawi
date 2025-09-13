import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NodeDefinition {
  id: string;
  def_key: string;
  title: string;
  node_type: string;
  path_template: string;
  content_template: any[];
  edit_template: any;
  actions_template: any;
  dependencies_template: any[];
  active: boolean;
  version: number;
}

export function useNodeDefinition(defKey: string) {
  const [nodeDefinition, setNodeDefinition] = useState<NodeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNodeDefinition() {
      try {
        setLoading(true);
        setError(null);
        
        // Mock data for development since tables don't exist in types yet
        // Replace this with actual query once tables are available
        const mockNodeDefinition = {
          id: 'mock-id',
          def_key: defKey,
          title: 'User Input Form',
          node_type: 'form',
          path_template: 'root.user_input.form',
          content_template: [
            { ref: 'size', group: 'project_details', hierarchy: 'important' },
            { ref: 'language', group: 'project_details', hierarchy: 'important' },
            { ref: 'accent', group: 'project_details', hierarchy: 'default' },
            { ref: 'genres', group: 'project_details', hierarchy: 'important' },
            { ref: 'template', group: 'project_details', hierarchy: 'default' },
            { ref: 'lead.character_name', group: 'lead_character', hierarchy: 'important' },
            { ref: 'lead.character_gender', group: 'lead_character', hierarchy: 'important' },
            { ref: 'lead.face_ref', group: 'lead_character', hierarchy: 'default' },
            { ref: 'supporting.character_name', group: 'supporting_character', hierarchy: 'important' },
            { ref: 'supporting.character_gender', group: 'supporting_character', hierarchy: 'important' },
            { ref: 'supporting.face_ref', group: 'supporting_character', hierarchy: 'default' }
          ],
          edit_template: { has_editables: false },
          actions_template: {},
          dependencies_template: [],
          active: true,
          version: 1
        };
        
        if (defKey === 'root.user_input.form') {
          setNodeDefinition(mockNodeDefinition);
        } else {
          setNodeDefinition(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch node definition');
      } finally {
        setLoading(false);
      }
    }

    if (defKey) {
      fetchNodeDefinition();
    }
  }, [defKey]);

  return { nodeDefinition, loading, error };
}