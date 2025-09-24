import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Template {
  id: string;
  name: string;
  type: string;
  description?: string;
  template: Record<string, any>;
  structure?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateNode {
  template_id: string;
  version: number;
  addr: string;
  idx: number;
  node_type: 'form' | 'media' | 'group';
  path: string;
  parent_addr: string | null;
  library_id: string;
  dependencies: string[];
  arrangeable: boolean;
  removable: boolean;
  content_override?: Record<string, any> | null;
  payload_validate_override?: Record<string, any> | null;
  payload_generate_override?: Record<string, any> | null;
  validate_n8n_id_override?: string | null;
  generate_n8n_id_override?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NodeLibraryEntry {
  id: string;
  node_type: 'form' | 'media' | 'group';
  content: Record<string, any>;
  active: boolean;
  version: number;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateNodes, setTemplateNodes] = useState<TemplateNode[]>([]);
  const [nodeLibrary, setNodeLibrary] = useState<NodeLibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        template: template.template as Record<string, any>
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplateNodes = useCallback(async (templateId: string, version?: number) => {
    try {
      let query = supabase
        .schema('app' as any)
        .from('template_nodes')
        .select('*')
        .eq('template_id', templateId);
      
      if (version !== undefined) {
        query = query.eq('version', version);
      }
      
      const { data, error } = await query.order('addr');

      if (error) throw error;
      setTemplateNodes(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching template nodes:', err);
      return [];
    }
  }, []);

  const fetchNodeLibrary = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .select('id, node_type, content, active, version')
        .eq('active', true)
        .order('id');

      if (error) throw error;
      setNodeLibrary(data || []);
    } catch (err) {
      console.error('Error fetching node library:', err);
    }
  }, []);

  const saveTemplate = useCallback(async (template: Omit<Template, 'created_at' | 'updated_at'>) => {
    console.log('🔄 saveTemplate called with:', template);
    setLoading(true);
    setError(null);
    
    try {
      // Validate template ID pattern
      console.log('✅ Validating template ID pattern:', template.id);
      if (!/^[a-z][a-z0-9_]*$/.test(template.id)) {
        throw new Error('Template ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores');
      }

      console.log('📤 Attempting to save template to Supabase...');
      const { error } = await supabase
        .schema('app' as any)
        .from('templates')
        .upsert(template, { onConflict: 'id' });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Template saved successfully');
      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      console.log('🔄 Refreshing templates list...');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('❌ saveTemplate error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to save template: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates, toast]);

  const saveTemplateNodes = useCallback(async (nodes: TemplateNode[]) => {
    console.log('🔄 saveTemplateNodes called with:', nodes);
    setLoading(true);
    setError(null);
    
    try {
      // Delete existing nodes for this template/version first
      if (nodes.length > 0) {
        console.log('🗑️ Deleting existing nodes for template:', nodes[0].template_id, 'version:', nodes[0].version);
        const { error: deleteError } = await supabase
          .schema('app' as any)
          .from('template_nodes')
          .delete()
          .eq('template_id', nodes[0].template_id)
          .eq('version', nodes[0].version);

        if (deleteError) {
          console.error('❌ Delete existing nodes error:', deleteError);
          throw deleteError;
        }
        console.log('✅ Existing nodes deleted successfully');
      }

      // Insert new nodes
      if (nodes.length > 0) {
        console.log('➕ Inserting', nodes.length, 'new nodes');
        // Transform nodes to exclude auto-generated fields
        const nodesToInsert = nodes.map(node => {
          const { addr, created_at, updated_at, ...nodeData } = node;
          return nodeData;
        });
        console.log('🔄 Transformed nodes for insertion:', nodesToInsert);
        const { error } = await supabase
          .schema('app' as any)
          .from('template_nodes')
          .insert(nodesToInsert);

        if (error) {
          console.error('❌ Insert nodes error:', error);
          throw error;
        }
        console.log('✅ Nodes inserted successfully');
      } else {
        console.log('ℹ️ No nodes to insert');
      }

      toast({
        title: "Success",
        description: "Template structure saved successfully",
      });

      return true;
    } catch (err) {
      console.error('❌ saveTemplateNodes error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template nodes';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to save template structure: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Delete template nodes first
      const { error: nodesError } = await supabase
        .schema('app' as any)
        .from('template_nodes')
        .delete()
        .eq('template_id', id);

      if (nodesError) throw nodesError;

      // Delete template
      const { error } = await supabase
        .schema('app' as any)
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      await fetchTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates, toast]);

  const cloneTemplate = useCallback(async (originalId: string, newId: string, newName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get original template
      const { data: originalTemplate, error: templateError } = await supabase
        .schema('app' as any)
        .from('templates')
        .select('*')
        .eq('id', originalId)
        .single();

      if (templateError) throw templateError;

      // Get original nodes
      const { data: originalNodes, error: nodesError } = await supabase
        .schema('app' as any)
        .from('template_nodes')
        .select('*')
        .eq('template_id', originalId);

      if (nodesError) throw nodesError;

      // Create new template
      const newTemplate = {
        ...originalTemplate,
        id: newId,
        name: newName,
        created_at: undefined,
        updated_at: undefined,
      };

      const { error: saveTemplateError } = await supabase
        .schema('app' as any)
        .from('templates')
        .insert(newTemplate);

      if (saveTemplateError) throw saveTemplateError;

      // Create new nodes
      if (originalNodes && originalNodes.length > 0) {
        const newNodes = originalNodes.map(node => {
          const { addr, created_at, updated_at, ...nodeData } = node;
          return {
            ...nodeData,
            template_id: newId,
          };
        });

        const { error: saveNodesError } = await supabase
          .schema('app' as any)
          .from('template_nodes')
          .insert(newNodes);

        if (saveNodesError) throw saveNodesError;
      }

      toast({
        title: "Success",
        description: "Template cloned successfully",
      });

      await fetchTemplates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone template';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates, toast]);

  return {
    templates,
    templateNodes,
    nodeLibrary,
    loading,
    error,
    fetchTemplates,
    fetchTemplateNodes,
    fetchNodeLibrary,
    saveTemplate,
    saveTemplateNodes,
    deleteTemplate,
    cloneTemplate,
  };
}