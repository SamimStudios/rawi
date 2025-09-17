import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { EditButton } from '@/components/ui/edit-button';
import { AlertCircle, RefreshCw, ChevronDown, ChevronRight, Save, X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Node structure interfaces
interface Node {
  id: string;
  job_id: string;
  node_type: string;
  path: string;
  parent_id?: string;
  content: string; // JSON string
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
  field_id: string;
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

interface JsonNodeRendererProps {
  nodeId?: string;
}

// Value display component for non-editing mode
const ValueDisplay: React.FC<{ 
  value: any; 
  registry: FieldRegistry; 
  importance?: string; 
}> = ({ value, registry, importance }) => {
  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return '—';
    }
    
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '—';
    }
    
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    
    return String(val);
  };

  return (
    <div className="text-foreground">
      {formatValue(value)}
    </div>
  );
};

const JsonNodeRenderer: React.FC<JsonNodeRendererProps> = ({ nodeId }) => {
  const [node, setNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [fieldRegistry, setFieldRegistry] = useState<FieldRegistry[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Calculate error count
  const errorCount = Object.keys(validationErrors).length;

  // Check if any field is editable to show edit button
  const hasEditableFields = (sections: Section[]): boolean => {
    const checkItems = (items: FieldItem[]): boolean => 
      items.some(item => item.editable !== false);
    
    const checkSection = (section: Section): boolean => 
      checkItems(section.items || []) || 
      (section.subsections || []).some(checkSection);
    
    return sections.some(checkSection);
  };

  // Helper to get field key for form state
  const getFieldKey = (sectionId: string, itemRef: string, sectionInstanceId?: number, itemInstanceId?: number): string => {
    let key = `${sectionId}.${itemRef}`;
    if (sectionInstanceId !== undefined && sectionInstanceId > 1) {
      key = `${sectionId}_${sectionInstanceId}.${itemRef}`;
    }
    if (itemInstanceId !== undefined && itemInstanceId > 1) {
      key += `_${itemInstanceId}`;
    }
    return key;
  };

  // Helper to toggle section collapse state
  const toggleSectionCollapse = (sectionPath: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionPath]: !prev[sectionPath]
    }));
  };

  // Helper to add section instance
  const addSectionInstance = (sectionId: string, sections: Section[]) => {
    // This would need to be implemented based on the backend structure
    // For now, just show a toast
    toast.info('Add section instance functionality would be implemented here');
  };

  // Helper to remove section instance
  const removeSectionInstance = (sectionId: string, instanceId: number) => {
    toast.info('Remove section instance functionality would be implemented here');
  };

  // Helper to add item instance
  const addItemInstance = (sectionId: string, itemRef: string) => {
    toast.info('Add item instance functionality would be implemented here');
  };

  // Helper to remove item instance
  const removeItemInstance = (sectionId: string, itemRef: string, instanceId: number) => {
    toast.info('Remove item instance functionality would be implemented here');
  };

  // Validation function
  const validateField = (field: FieldRegistry, value: any): string | null => {
    const rules = field.rules || {};
    
    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Type-specific validations would go here
    // For now, return null (no error)
    return null;
  };

  // Validate all form values
  const validateAllFields = (sections: Section[], values: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const validateSection = (section: Section) => {
      // Check direct items
      section.items?.forEach(item => {
        const registry = fieldRegistry.find(r => r.field_id === item.ref);
        if (registry) {
          const fieldKey = getFieldKey(section.id, item.ref, section.section_instance_id, item.item_instance_id);
          const fieldValue = values[fieldKey] ?? item.value ?? registry.default_value;
          
          // Apply field-level required rule
          if (item.required && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
            errors[fieldKey] = 'This field is required';
          } else {
            const validationError = validateField(registry, fieldValue);
            if (validationError) {
              errors[fieldKey] = validationError;
            }
          }
        }
      });

      // Check subsections
      section.subsections?.forEach(validateSection);
    };

    sections.forEach(validateSection);
    return errors;
  };

  // Handle field value changes
  const handleFieldChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Save node changes
  const saveNode = async () => {
    if (!node) return;

    // Validate all fields
    const errors = validateAllFields(JSON.parse(node.content).sections, formValues);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      // Update the node content with form values
      const updatedContent = JSON.parse(node.content);
      
      // Update section values with form values
      const updateSectionValues = (section: Section) => {
        section.items?.forEach(item => {
          const fieldKey = getFieldKey(section.id, item.ref, section.section_instance_id, item.item_instance_id);
          if (formValues.hasOwnProperty(fieldKey)) {
            item.value = formValues[fieldKey];
          }
        });
        section.subsections?.forEach(updateSectionValues);
      };
      
      updatedContent.sections.forEach(updateSectionValues);

      const { error } = await supabase
        .from('storyboard_nodes')
        .update({ 
          content: JSON.stringify(updatedContent),
          updated_at: new Date().toISOString()
        })
        .eq('id', node.id);

      if (error) throw error;

      // Update local state
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
  };

  // Field Item Renderer
  const FieldItemRenderer: React.FC<{ 
    item: FieldItem; 
    sectionId: string; 
    registry: FieldRegistry; 
    isEditing: boolean;
    formValues: Record<string, any>;
    onValueChange: (key: string, value: any) => void;
    validationErrors: Record<string, string>;
    sectionInstanceId?: number;
  }> = ({ item, sectionId, registry, isEditing, formValues, onValueChange, validationErrors, sectionInstanceId }) => {
    const fieldKey = getFieldKey(sectionId, item.ref, sectionInstanceId, item.item_instance_id);
    const fieldValue = formValues[fieldKey] ?? item.value ?? registry.default_value;
    const fieldError = validationErrors[fieldKey];

    const getImportanceLabelClasses = (importance?: string) => {
      switch (importance) {
        case 'high': return 'text-lg font-bold';
        case 'low': return 'text-sm font-light text-muted-foreground';
        default: return 'text-base font-medium';
      }
    };

    const getImportanceValueClasses = (importance?: string) => {
      switch (importance) {
        case 'high': return 'text-base font-semibold';
        case 'low': return 'text-sm text-muted-foreground';
        default: return 'text-base';
      }
    };

    const getLabel = (item: FieldItem, registry: FieldRegistry) => {
      if (item.ui?.override && item.ui.label) {
        return item.ui.label.fallback || item.ui.label.key;
      }
      if (registry.ui?.label) {
        return registry.ui.label.fallback || registry.ui.label.key || registry.field_id;
      }
      return registry.field_id;
    };

    const isRepeatable = item.repeatable && item.repeatable.max && item.repeatable.max > 1;
    const repeatableValues = isRepeatable && Array.isArray(fieldValue) ? fieldValue : [];
    const canAdd = !isRepeatable || !item.repeatable?.max || repeatableValues.length < item.repeatable.max;
    const canRemove = !isRepeatable || !item.repeatable?.min || repeatableValues.length > (item.repeatable.min || 0);

    const handleRepeatableAdd = () => {
      addItemInstance(sectionId, item.ref);
    };

    const handleRepeatableRemove = (instanceId: number) => {
      removeItemInstance(sectionId, item.ref, instanceId);
    };

    const handleRepeatableChange = (index: number, value: any) => {
      if (Array.isArray(fieldValue)) {
        const newItems = [...fieldValue];
        newItems[index] = value;
        onValueChange(fieldKey, newItems);
      }
    };

    if (!isEditing) {
      if (isRepeatable && Array.isArray(fieldValue) && fieldValue.length > 0) {
        return (
          <div className="space-y-2">
            <div className={getImportanceLabelClasses(item.importance)}>
              {getLabel(item, registry)}
              {item.required && <span className="text-accent ml-1">*</span>}
            </div>
            {fieldValue.map((value: any, index: number) => (
              <div key={index} className={getImportanceValueClasses(item.importance)}>
                <ValueDisplay value={value} registry={registry} importance={item.importance} />
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <div className={getImportanceLabelClasses(item.importance)}>
            {getLabel(item, registry)}
            {item.required && <span className="text-accent ml-1">*</span>}
          </div>
          <div className={getImportanceValueClasses(item.importance)}>
            <ValueDisplay value={fieldValue} registry={registry} importance={item.importance} />
          </div>
        </div>
      );
    }

    // Editing mode
    if (isRepeatable) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className={getImportanceLabelClasses(item.importance)}>
              {getLabel(item, registry)}
              {item.required && <span className="text-accent ml-1">*</span>}
            </div>
            {canAdd && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleRepeatableAdd}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {repeatableValues.length === 0 ? (
            <div className="text-muted-foreground text-sm">No items yet. Click + to add one.</div>
          ) : (
            <div className="space-y-2">
              {repeatableValues.map((value: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <DynamicFieldRenderer
                      field={registry}
                      value={value}
                      onChange={(newValue) => handleRepeatableChange(index, newValue)}
                      formValues={formValues}
                      disabled={item.editable === false}
                    />
                  </div>
                  {canRemove && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRepeatableRemove(index + 1)}
                      className="h-6 w-6 p-0 text-accent hover:text-accent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {fieldError && (
            <div className="text-sm text-accent">{fieldError}</div>
          )}
        </div>
      );
    }

    // Single field editing
    return (
      <div className="space-y-1">
        <DynamicFieldRenderer
          field={registry}
          value={fieldValue}
          onChange={(value) => onValueChange(fieldKey, value)}
          formValues={formValues}
          disabled={item.editable === false}
        />
        {fieldError && (
          <div className="text-sm text-accent">{fieldError}</div>
        )}
      </div>
    );
  };

  // Section Renderer
  const SectionRenderer: React.FC<{
    section: Section;
    fieldRegistry: FieldRegistry[];
    isEditing: boolean;
    formValues: Record<string, any>;
    onValueChange: (key: string, value: any) => void;
    validationErrors: Record<string, string>;
    depth?: number;
  }> = ({ section, fieldRegistry, isEditing, formValues, onValueChange, validationErrors, depth = 0 }) => {
    if (section.hidden) return null;

    const sectionPath = `section_${section.id}_${section.section_instance_id || 1}`;
    const isCollapsed = section.collapsed ? collapsedSections[sectionPath] !== false : collapsedSections[sectionPath] === true;
    
    const isRepeatable = section.repeatable && section.repeatable.max && section.repeatable.max > 1;
    const canAddSection = !isRepeatable || !section.repeatable?.max || true; // Would need proper instance counting
    const canRemoveSection = !isRepeatable || !section.repeatable?.min || (section.section_instance_id || 1) > (section.repeatable.min || 1);

    // Sort items by idx
    const sortedItems = [...(section.items || [])].sort((a, b) => (a.idx || 0) - (b.idx || 0));
    const sortedSubsections = [...(section.subsections || [])].sort((a, b) => (a.idx || 0) - (b.idx || 0));

    const renderSectionHeader = () => (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isCollapsed && "-rotate-90"
              )} />
            </Button>
          </CollapsibleTrigger>
          <div>
            <h3 className={cn(
              "font-semibold",
              depth === 0 ? "text-xl" : "text-lg"
            )}>
              {section.label.fallback}
              {section.required && <span className="text-accent ml-1">*</span>}
            </h3>
            {section.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {section.description.fallback}
              </p>
            )}
          </div>
        </div>
        
        {isEditing && isRepeatable && (
          <div className="flex items-center gap-2">
            {canAddSection && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => addSectionInstance(section.id, [])}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add {section.label.fallback}
              </Button>
            )}
            {canRemoveSection && (section.section_instance_id || 1) > 1 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => removeSectionInstance(section.id, section.section_instance_id || 1)}
                className="h-8 text-accent border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    );

    return (
      <Collapsible 
        open={!isCollapsed} 
        onOpenChange={() => toggleSectionCollapse(sectionPath)}
        className="space-y-4"
      >
        {renderSectionHeader()}
        
        <CollapsibleContent className="space-y-6">
          {/* Direct items */}
          {sortedItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedItems.map((item) => {
                const registry = fieldRegistry.find(r => r.field_id === item.ref);
                if (!registry) {
                  return (
                    <div key={`${item.ref}_${item.item_instance_id || 1}`} className="text-muted-foreground">
                      Field registry not found for: {item.ref}
                    </div>
                  );
                }

                return (
                  <FieldItemRenderer
                    key={`${item.ref}_${item.item_instance_id || 1}`}
                    item={item}
                    sectionId={section.id}
                    registry={registry}
                    isEditing={isEditing}
                    formValues={formValues}
                    onValueChange={onValueChange}
                    validationErrors={validationErrors}
                    sectionInstanceId={section.section_instance_id}
                  />
                );
              })}
            </div>
          )}

          {/* Subsections */}
          {sortedSubsections.map((subsection) => (
            <div key={`${subsection.id}_${subsection.section_instance_id || 1}`} className="ml-4 border-l-2 border-border pl-4">
              <SectionRenderer
                section={subsection}
                fieldRegistry={fieldRegistry}
                isEditing={isEditing}
                formValues={formValues}
                onValueChange={onValueChange}
                validationErrors={validationErrors}
                depth={depth + 1}
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Load node data
  useEffect(() => {
    const loadNode = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let nodeData: Node;

        if (nodeId) {
          const { data, error: fetchError } = await supabase
            .from('storyboard_nodes')
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
          // Use default node for testing
          nodeData = JSON.parse(defaultNodeJson);
        }

        setNode(nodeData);

        // Parse content and extract form values
        try {
          const content: NodeContent = JSON.parse(nodeData.content);
          const initialValues: Record<string, any> = {};
          
          const extractValues = (section: Section) => {
            section.items?.forEach(item => {
              const fieldKey = getFieldKey(section.id, item.ref, section.section_instance_id, item.item_instance_id);
              if (item.value !== undefined) {
                initialValues[fieldKey] = item.value;
              }
            });
            section.subsections?.forEach(extractValues);
          };

          content.sections.forEach(extractValues);
          setFormValues(initialValues);

          // Set initial collapsed state based on section properties
          const initialCollapsedState: Record<string, boolean> = {};
          const setCollapsedState = (section: Section) => {
            const sectionPath = `section_${section.id}_${section.section_instance_id || 1}`;
            if (section.collapsed) {
              initialCollapsedState[sectionPath] = true;
            }
            section.subsections?.forEach(setCollapsedState);
          };
          content.sections.forEach(setCollapsedState);
          setCollapsedSections(initialCollapsedState);

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
          .order('field_id');

        if (error) throw error;
        setFieldRegistry(data || []);
      } catch (error) {
        console.error('Error loading field registry:', error);
      }
    };

    loadNode();
    loadFieldRegistry();
  }, [nodeId]);

  // Update validation when formValues change
  useEffect(() => {
    if (node && isEditingNode) {
      try {
        const content: NodeContent = JSON.parse(node.content);
        const errors = validateAllFields(content.sections, formValues);
        setValidationErrors(errors);
      } catch (error) {
        console.error('Error validating fields:', error);
      }
    }
  }, [formValues, isEditingNode, node, fieldRegistry]);

  // Set up real-time subscription
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

  let nodeContent: NodeContent;
  try {
    nodeContent = JSON.parse(node.content);
  } catch (e) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid node content format</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!nodeContent.sections) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No sections found in node content</AlertDescription>
        </Alert>
      </div>
    );
  }

  const showEditButton = hasEditableFields(nodeContent.sections);
  
  // Sort sections by idx
  const sortedSections = [...nodeContent.sections]
    .filter(section => !section.hidden)
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Node Card */}
        <div className="lg:col-span-3">
          <Card className={cn(
            "transition-all duration-300",
            isEditingNode && "ring-2 ring-yellow-500/50 border-yellow-500/30"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-2xl">{node.node_type} Node</CardTitle>
                <CardDescription>{node.path}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <div className="flex items-center gap-1 text-accent">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {showEditButton && (
                  <EditButton
                    onClick={() => setIsEditingNode(!isEditingNode)}
                    isEditing={isEditingNode}
                    variant="outline"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {sortedSections.map((section) => (
                <SectionRenderer
                  key={`${section.id}_${section.section_instance_id || 1}`}
                  section={section}
                  fieldRegistry={fieldRegistry}
                  isEditing={isEditingNode}
                  formValues={formValues}
                  onValueChange={handleFieldChange}
                  validationErrors={validationErrors}
                />
              ))}

              {isEditingNode && (
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingNode(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveNode}
                    disabled={errorCount > 0}
                    variant="default"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Node Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Node ID</div>
                <div className="text-sm font-mono break-all">{node.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Job ID</div>
                <div className="text-sm font-mono break-all">{node.job_id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Type</div>
                <div className="text-sm">{node.node_type}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Path</div>
                <div className="text-sm">{node.path}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Version</div>
                <div className="text-sm">{node.version}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Updated</div>
                <div className="text-sm">{new Date(node.updated_at).toLocaleDateString()}</div>
              </div>

              {/* Debug section */}
              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">Debug</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Form Values</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(formValues, null, 2)}
                    </pre>
                  </div>
                  {errorCount > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground">Validation Errors</div>
                      <pre className="text-xs bg-accent/10 text-accent p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(validationErrors, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JsonNodeRenderer;