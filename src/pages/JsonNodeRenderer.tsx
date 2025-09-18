import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditButton } from '@/components/ui/edit-button';
import { AlertCircle, RefreshCw, Edit2, X, Save, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ContentRenderer } from '@/components/content-renderer/ContentRenderer';

// Type definitions
interface Node {
  id: string;
  job_id: string;
  node_type: string;
  path: string;
  parent_id?: string;
  content: string;
  edit: string;
  actions: string;
  dependencies: string;
  removable: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  is_section: boolean;
}

interface I18nText {
  key?: string;
  fallback: string;
}

interface FieldItem {
  ref: string;
  idx: number;
  required?: boolean;
  editable?: boolean;
  importance?: "low" | "normal" | "high";
  rules?: Record<string, any>;
  repeatable?: {
    min?: number;
    max?: number;
  };
  item_instance_id?: number;
  value?: any;
  ui?: {
    override?: boolean;
    label?: I18nText;
    placeholder?: I18nText;
    help?: I18nText;
  };
}

interface Section {
  id: string;
  idx: number;
  label: I18nText;
  description?: I18nText;
  items: FieldItem[];
  subsections?: Section[];
  repeatable?: {
    min?: number;
    max?: number;
  };
  section_instance_id?: number;
  collapsed?: boolean;
  hidden?: boolean;
  required?: boolean;
}

interface NodeContent {
  version: string;
  sections: Section[];
}

interface FieldRegistry {
  id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  resolvedOptions?: Array<{
    value: string;
    label: string;
    extras?: Record<string, any>;
  }>;
}

interface JsonNodeRendererProps {
  nodeId?: string;
}

const defaultNodeJson = `{
  "id": "2041b303-a2ec-4f9b-bee2-cccd46fb8563",
  "job_id": "78bfbff5-3f75-446a-9cb2-814f27ebb80b",
  "node_type": "form",
  "path": "root.user_input",
  "parent_id": null,
  "content": "{\\"version\\": \\"v1-sections\\", \\"sections\\": [{\\"id\\": \\"plan\\", \\"idx\\": 1, \\"items\\": [{\\"ref\\": \\"title\\", \\"idx\\": 1, \\"required\\": true}, {\\"ref\\": \\"logline\\", \\"idx\\": 2, \\"required\\": true}], \\"label\\": {\\"key\\": \\"sections.plan\\", \\"fallback\\": \\"Plan\\"}}]}",
  "edit": "{}",
  "actions": "{}",
  "dependencies": "[]",
  "removable": true,
  "created_at": "2025-09-16 06:42:08.971583+00",
  "updated_at": "2025-09-16 06:42:08.971583+00",
  "version": 1,
  "is_section": false
}`;

export const JsonNodeRenderer: React.FC<JsonNodeRendererProps> = ({ nodeId }) => {
  const { getAccentClasses } = useLanguage();
  
  // State
  const [node, setNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [fieldRegistry, setFieldRegistry] = useState<FieldRegistry[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Memoized computed values
  const errorCount = useMemo(() => Object.keys(validationErrors).length, [validationErrors]);
  
  const nodeContent = useMemo(() => {
    if (!node) return null;
    try {
      return typeof node.content === 'string' 
        ? JSON.parse(node.content) as NodeContent
        : node.content as NodeContent;
    } catch (e) {
      console.error('Error parsing node content:', e);
      return null;
    }
  }, [node]);

  const hasEditableFields = useMemo(() => {
    if (!nodeContent?.sections) return false;
    
    const checkItems = (items: FieldItem[]): boolean => 
      items.some(item => item.editable !== false);
    
    const checkSection = (section: Section): boolean => 
      checkItems(section.items || []) || 
      (section.subsections || []).some(checkSection);
    
    return nodeContent.sections.some(checkSection);
  }, [nodeContent]);

  // Field key generation using ltree-like paths
  const generateFieldPath = useCallback((
    ancestorPath: string,
    itemRef: string,
    itemInstanceId?: number,
    arrayIndex?: number
  ): string => {
    let path = `${ancestorPath}.${itemRef}`;
    if (itemInstanceId && itemInstanceId > 1) {
      path += `_${itemInstanceId}`;
    }
    if (arrayIndex !== undefined) {
      path += `[${arrayIndex}]`;
    }
    return path;
  }, []);

  // Form value operations
  const handleFieldChange = useCallback((fieldPath: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldPath]: value }));
    
    // Clear validation error for this field
    setValidationErrors(prev => {
      if (!prev[fieldPath]) return prev;
      const newErrors = { ...prev };
      delete newErrors[fieldPath];
      return newErrors;
    });
  }, []);

  // Validation
  const validateField = useCallback((field: FieldRegistry, value: any): string | null => {
    const rules = field.rules || {};
    
    if (rules.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Add more validation logic as needed
    return null;
  }, []);

  const validateAllFields = useCallback((sections: Section[], values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const validateSection = (section: Section, ancestorPath: string) => {
      const sectionPath = `${ancestorPath}.${section.id}${section.section_instance_id ? `_${section.section_instance_id}` : ''}`;
      
      // Validate items
      section.items?.forEach(item => {
        const registry = fieldRegistry.find(r => r.id === item.ref);
        if (registry) {
          const fieldPath = generateFieldPath(sectionPath, item.ref, item.item_instance_id);
          const fieldValue = values[fieldPath] ?? item.value ?? registry.default_value;
          
          if (item.required && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
            errors[fieldPath] = 'This field is required';
          } else {
            const validationError = validateField(registry, fieldValue);
            if (validationError) {
              errors[fieldPath] = validationError;
            }
          }
        }
      });

      // Validate subsections
      section.subsections?.forEach(subsection => 
        validateSection(subsection, sectionPath)
      );
    };

    sections.forEach((section, idx) => 
      validateSection(section, `root.${idx}`)
    );
    
    return errors;
  }, [fieldRegistry, generateFieldPath, validateField]);

  // Save operation
  const saveNode = useCallback(async () => {
    if (!node || !nodeContent) return;

    const errors = validateAllFields(nodeContent.sections, formValues);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      const updatedContent = { ...nodeContent };
      
      // Update section values with form values
      const updateSectionValues = (section: Section, ancestorPath: string) => {
        const sectionPath = `${ancestorPath}.${section.id}${section.section_instance_id ? `_${section.section_instance_id}` : ''}`;
        
        section.items?.forEach(item => {
          const fieldPath = generateFieldPath(sectionPath, item.ref, item.item_instance_id);
          if (Object.prototype.hasOwnProperty.call(formValues, fieldPath)) {
            item.value = formValues[fieldPath];
          }
        });
        
        section.subsections?.forEach(subsection => 
          updateSectionValues(subsection, sectionPath)
        );
      };
      
      updatedContent.sections.forEach((section, idx) => 
        updateSectionValues(section, `root.${idx}`)
      );

      const { error } = await (supabase as any)
        .from('nodes')
        .update({ 
          content: JSON.stringify(updatedContent),
          updated_at: new Date().toISOString()
        })
        .eq('id', node.id);

      if (error) throw error;

      setNode(prev => prev ? {
        ...prev,
        content: JSON.stringify(updatedContent),
        updated_at: new Date().toISOString()
      } : null);

      setIsEditingNode(false);
      toast.success('Node saved successfully');
    } catch (error) {
      console.error('Error saving node:', error);
      toast.error('Failed to save node');
    }
  }, [node, nodeContent, formValues, validateAllFields, generateFieldPath]);

  // Data loading
  useEffect(() => {
    const loadNode = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let nodeData: Node;

        if (nodeId) {
        const { data, error: fetchError } = await (supabase as any)
            .from('nodes')
            .select('*')
            .eq('id', nodeId)
            .single();

          if (fetchError) throw fetchError;
          if (!data) throw new Error('Node not found');
          
          nodeData = {
            ...data,
            path: String(data.path),
            content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
            edit: typeof data.edit === 'string' ? data.edit : JSON.stringify(data.edit),
            actions: typeof data.actions === 'string' ? data.actions : JSON.stringify(data.actions),
            dependencies: typeof data.dependencies === 'string' ? data.dependencies : JSON.stringify(data.dependencies)
          };
        } else {
          nodeData = JSON.parse(defaultNodeJson);
        }

        setNode(nodeData);

        // Extract initial form values
        try {
          const content: NodeContent = typeof nodeData.content === 'string' 
            ? JSON.parse(nodeData.content) 
            : nodeData.content;
          
          const initialValues: Record<string, any> = {};
          
          const extractValues = (section: Section, ancestorPath: string) => {
            const sectionPath = `${ancestorPath}.${section.id}${section.section_instance_id ? `_${section.section_instance_id}` : ''}`;
            
            section.items?.forEach(item => {
              const fieldPath = generateFieldPath(sectionPath, item.ref, item.item_instance_id);
              if (item.value !== undefined) {
                initialValues[fieldPath] = item.value;
              }
            });
            
            section.subsections?.forEach(subsection => 
              extractValues(subsection, sectionPath)
            );
          };

          content.sections.forEach((section, idx) => 
            extractValues(section, `root.${idx}`)
          );
          
          setFormValues(initialValues);
        } catch (e) {
          console.error('Error parsing node content:', e);
        }

      } catch (error) {
        console.error('Error loading node:', error);
        setError(error instanceof Error ? error.message : 'Failed to load node');
      } finally {
        setIsLoading(false);
      }
    };

    const loadFieldRegistry = async () => {
      try {
        const { data, error } = await supabase
          .from('field_registry')
          .select('*')
          .order('id');

        if (error) throw error;
        setFieldRegistry(data || []);
      } catch (error) {
        console.error('Error loading field registry:', error);
      }
    };

    loadNode();
    loadFieldRegistry();
  }, [nodeId, generateFieldPath]);

  // Validation on form changes
  useEffect(() => {
    if (node && isEditingNode && nodeContent) {
      const errors = validateAllFields(nodeContent.sections, formValues);
      setValidationErrors(errors);
    }
  }, [formValues, isEditingNode, node, nodeContent, validateAllFields]);

  // Real-time subscription
  useEffect(() => {
    if (!nodeId) return;

    const channel = supabase
      .channel(`node-${nodeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'storyboard_nodes',
        filter: `id=eq.${nodeId}`
      }, (payload) => {
        setNode(payload.new as Node);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nodeId]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading node...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Node not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!nodeContent) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Invalid node content format</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!nodeContent.sections || nodeContent.sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No sections found in this node</p>
        </CardContent>
      </Card>
    );
  }

  const sortedSections = [...nodeContent.sections]
    .filter(section => !section.hidden)
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  return (
    <Card className={cn(
      "transition-all duration-300",
      isEditingNode && "ring-2 ring-yellow-500/50 border-yellow-500/30"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">
            {node.path}
            {node.job_id && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Job: {node.job_id.slice(0, 8)}...
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Updated: {new Date(node.updated_at).toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {hasEditableFields && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingNode(!isEditingNode)}
            >
              {isEditingNode ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ContentRenderer
          sections={sortedSections}
          fieldRegistry={fieldRegistry}
          isEditing={isEditingNode}
          formValues={formValues}
          onValueChange={handleFieldChange}
          validationErrors={validationErrors}
          generateFieldPath={generateFieldPath}
        />

        {isEditingNode && (
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingNode(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveNode}
              disabled={errorCount > 0}
              variant="default"
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JsonNodeRenderer;