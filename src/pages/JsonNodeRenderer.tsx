import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { EditButton } from '@/components/ui/edit-button';
import { AlertCircle, RefreshCw, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

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

interface Item {
  ref: string;
  required?: boolean;
  rules?: Record<string, any>;
  editable?: boolean;
  ui_override?: {
    label?: { key: string; fallback: string };
    placeholder?: { key: string; fallback: string };
    help?: { key: string; fallback: string };
  };
  value?: any;
  repeatable?: {
    min?: number;
    max?: number;
  };
  item_instance_id?: string;
  importance?: "low" | "normal" | "high";
}

interface Subsection {
  id: string;
  label: I18nText;
  items: Item[];
}

interface Section {
  id: string;
  label: I18nText;
  items: Item[];
  subsections?: Subsection[];
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
  "content": "{\\"version\\": \\"v1-sections\\", \\"sections\\": [{\\"id\\": \\"plan\\", \\"items\\": [{\\"ref\\": \\"title\\", \\"required\\": true}, {\\"ref\\": \\"logline\\", \\"required\\": true}, {\\"ref\\": \\"genres\\", \\"rules\\": {\\"max\\": 3}, \\"required\\": true}], \\"label\\": {\\"key\\": \\"sections.plan\\", \\"fallback\\": \\"Plan\\"}}, {\\"id\\": \\"preferences\\", \\"items\\": [{\\"ref\\": \\"language\\", \\"required\\": true}, {\\"ref\\": \\"accent\\"}, {\\"ref\\": \\"size\\", \\"required\\": true}, {\\"ref\\": \\"template\\", \\"required\\": true}, {\\"ref\\": \\"consent\\"}], \\"label\\": {\\"key\\": \\"sections.preferences\\", \\"fallback\\": \\"Preferences\\"}}, {\\"id\\": \\"lead\\", \\"items\\": [{\\"ref\\": \\"character_name\\", \\"required\\": true}, {\\"ref\\": \\"character_gender\\", \\"required\\": true}, {\\"ref\\": \\"faceImage\\"}], \\"label\\": {\\"key\\": \\"sections.lead\\", \\"fallback\\": \\"Lead\\"}, \\"subsections\\": [{\\"id\\": \\"appearance\\", \\"items\\": [{\\"ref\\": \\"age_range\\"}, {\\"ref\\": \\"ethnicity\\"}, {\\"ref\\": \\"skin_tone\\"}, {\\"ref\\": \\"head\\"}, {\\"ref\\": \\"face\\"}, {\\"ref\\": \\"body\\"}, {\\"ref\\": \\"clothes\\"}, {\\"ref\\": \\"look\\"}, {\\"ref\\": \\"distinct_trait\\", \\"repeatable\\": {\\"max\\": 3, \\"min\\": 0}}], \\"label\\": {\\"key\\": \\"sections.lead.appearance\\", \\"fallback\\": \\"Appearance\\"}}, {\\"id\\": \\"persona\\", \\"items\\": [{\\"ref\\": \\"personality\\"}], \\"label\\": {\\"key\\": \\"sections.lead.persona\\", \\"fallback\\": \\"Persona\\"}}]}]}",
  "edit": "{}",
  "actions": "{}",
  "dependencies": "[]",
  "removable": true,
  "created_at": "2025-09-16 06:42:08.971583+00",
  "updated_at": "2025-09-16 07:28:12.494696+00",
  "version": 1,
  "is_section": true
}`;

// Component for displaying values in idle mode
const ValueDisplay: React.FC<{
  item: Item;
  field: FieldRegistry;
  value: any;
}> = ({ item, field, value }) => {
  const parseValueForDisplay = (val: any, datatype: string): string => {
    if (val === null || val === undefined || val === '') return 'Not set';
    
    // Handle objects by attempting to extract meaningful display value
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        return val.length > 0 ? val.map(item => 
          typeof item === 'object' ? JSON.stringify(item) : String(item)
        ).join(', ') : 'Not set';
      }
      // For non-array objects, try to stringify in a readable way
      return JSON.stringify(val);
    }
    
    switch (datatype.toLowerCase()) {
      case 'boolean':
        return val ? 'Yes' : 'No';
      case 'number':
      case 'integer':
        return String(val);
      case 'array':
        return Array.isArray(val) ? val.join(', ') : String(val);
      case 'date':
        return val instanceof Date ? val.toLocaleDateString() : String(val);
      case 'email':
      case 'url':
      case 'text':
      case 'string':
      default:
        return String(val);
    }
  };

  const getLabel = () => {
    if (item.ui_override?.label) {
      return item.ui_override.label.fallback;
    }
    return field.ui?.label?.fallback || field.field_id;
  };

  const displayValue = parseValueForDisplay(value || item.value, field.datatype);

  const getImportanceLabelClasses = () => {
    switch (item.importance) {
      case 'low':
        return 'text-xs font-normal text-muted-foreground';
      case 'high':
        return 'text-base font-bold text-foreground';
      default:
        return 'text-sm font-medium text-muted-foreground';
    }
  };

  const getImportanceValueClasses = () => {
    switch (item.importance) {
      case 'low':
        return 'text-xs font-light';
      case 'high':
        return 'text-base font-semibold';
      default:
        return 'text-sm font-normal';
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <dt className={getImportanceLabelClasses()}>{getLabel()}</dt>
      <dd className={`${getImportanceValueClasses()} ${displayValue === 'Not set' ? 'text-muted-foreground italic' : 'text-foreground'}`}>
        {displayValue}
      </dd>
    </div>
  );
};

// Component for rendering individual items
const ItemRenderer: React.FC<{
  item: Item;
  field?: FieldRegistry;
  value: any;
  onChange: (value: any) => void;
  formValues: Record<string, any>;
  isEditing?: boolean;
  validationErrors?: string[];
}> = ({ item, field, value, onChange, formValues, isEditing = false, validationErrors = [] }) => {
  const genId = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`);

  const getEffectiveArray = (): any[] => {
    const vArr = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
    const iArr = Array.isArray(item.value) ? item.value : (item.value == null || item.value === '' ? [] : [item.value]);
    return vArr.length ? vArr : iArr;
  };

  const initialCount = item.repeatable ? Math.max(item.repeatable.min ?? 1, getEffectiveArray().length || 1) : 0;
  const [instances, setInstances] = useState<string[]>(() => {
    if (item.repeatable) {
      const ids: string[] = [];
      for (let i = 0; i < initialCount; i++) {
        ids.push(i === 0 && item.item_instance_id ? item.item_instance_id! : genId());
      }
      return ids;
    }
    return [];
  });

  if (!field) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Field "{item.ref}" not found in registry</AlertDescription>
      </Alert>
    );
  }

  // Helper function for i18n text resolution (placeholder for now)
  const t = (key: string) => key; // TODO: Replace with actual i18n hook

  // Get label with ui_override support
  const getLabel = () => {
    if (item.ui_override?.label) {
      return t(item.ui_override.label.key) || item.ui_override.label.fallback;
    }
    return field.ui?.label?.fallback || field.field_id;
  };

  // Get placeholder with ui_override support
  const getPlaceholder = () => {
    if (item.ui_override?.placeholder) {
      return t(item.ui_override.placeholder.key) || item.ui_override.placeholder.fallback;
    }
    return field.ui?.placeholder?.fallback || '';
  };

  // Get help text with ui_override support
  const getHelpText = () => {
    if (item.ui_override?.help) {
      return t(item.ui_override.help.key) || item.ui_override.help.fallback;
    }
    return field.ui?.help?.fallback || '';
  };

  // Merge item rules with field rules
  const mergedRules = { ...field.rules };
  if (item.required !== undefined) {
    mergedRules.required = item.required;
  }
  if (item.rules) {
    Object.assign(mergedRules, item.rules);
  }

  // Create enhanced field with overrides
  const mergedField = {
    ...field,
    rules: mergedRules,
    ui: {
      ...field.ui,
      label: { fallback: getLabel() },
      placeholder: { fallback: getPlaceholder() },
      help: { fallback: getHelpText() }
    }
  };

  // Sync instances with array length and min bound
  useEffect(() => {
    if (!item.repeatable) return;
    const arr = getEffectiveArray();
    const targetLen = Math.max(item.repeatable.min ?? 1, arr.length || 1);
    if (targetLen !== instances.length) {
      setInstances((prev) => {
        const next = [...prev];
        if (targetLen > prev.length) {
          for (let i = prev.length; i < targetLen; i++) next.push(genId());
        } else {
          next.length = targetLen;
        }
        return next;
      });
    }
  }, [value, item.value, item.repeatable?.min]);

  // Handle repeatable instances
  const addInstance = () => {
    if (item.repeatable && instances.length < (item.repeatable.max || Infinity)) {
      const newId = genId();
      setInstances(prev => [...prev, newId]);
      const current = getEffectiveArray();
      onChange([...current, '']);
    }
  };

  const removeInstance = (instanceId: string) => {
    if (item.repeatable && instances.length > (item.repeatable.min || 0)) {
      setInstances(prev => prev.filter(id => id !== instanceId));
      // Also remove the value for this instance
      const currentValue = getEffectiveArray();
      const instanceIndex = instances.indexOf(instanceId);
      if (instanceIndex !== -1) {
        const newValue = currentValue.filter((_, index) => index !== instanceIndex);
        onChange(newValue);
      }
    }
  };

  // Handle value changes for repeatable fields
  const handleInstanceChange = (instanceId: string, newValue: any) => {
    if (item.repeatable) {
      const instanceIndex = instances.indexOf(instanceId);
      const currentValue = Array.isArray(value) ? value : [];
      const updatedValue = [...currentValue];
      updatedValue[instanceIndex] = newValue;
      onChange(updatedValue);
    } else {
      onChange(newValue);
    }
  };

  // Get controlled value - prioritize form state during editing, fallback to item.value
  const getControlledValue = (instanceIndex?: number) => {
    // During editing, prioritize form state over item.value
    if (isEditing) {
      if (item.repeatable && Array.isArray(value)) {
        return value[instanceIndex || 0] || '';
      }
      return value !== undefined ? value : '';
    }
    
    // In display mode, use item.value if available, otherwise form value
    if (item.value !== undefined) {
      return item.repeatable && Array.isArray(item.value) ? item.value[instanceIndex || 0] : item.value;
    }
    if (item.repeatable && Array.isArray(value)) {
      return value[instanceIndex || 0] || '';
    }
    return value || '';
  };

  // Get importance styling classes for typography
  const getImportanceLabelClasses = () => {
    switch (item.importance) {
      case 'low':
        return 'text-xs font-normal text-muted-foreground';
      case 'high':
        return 'text-base font-bold text-foreground';
      default:
        return 'text-sm font-medium text-foreground';
    }
  };

  // Render single field instance
  const renderFieldInstance = (instanceId: string, instanceIndex: number) => (
    <div key={instanceId} className="relative">
      <div>
        <label className={getImportanceLabelClasses()}>
          {getLabel()}
          {mergedRules.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <DynamicFieldRenderer
          field={mergedField}
          value={getControlledValue(instanceIndex)}
          onChange={(newValue) => handleInstanceChange(instanceId, newValue)}
          formValues={formValues}
          disabled={item.editable === false}
        />
      </div>
      {item.repeatable && instances.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => removeInstance(instanceId)}
          disabled={instances.length <= (item.repeatable?.min || 0)}
        >
          ×
        </Button>
      )}
    </div>
  );

  // If not editing, show display mode
  if (!isEditing) {
    return (
      <div className="space-y-2 py-2">
        <ValueDisplay 
          item={item} 
          field={field} 
          value={value || item.value} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      {/* Render field instances */}
      {item.repeatable ? (
        <div className="space-y-3">
          {instances.map((instanceId, index) => renderFieldInstance(instanceId, index))}
          
          {/* Add control only if config allows more than one instance */}
          {item.repeatable && ((item.repeatable.max ?? Infinity) > 1) && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInstance}
                disabled={instances.length >= (item.repeatable.max || Infinity)}
                className="h-7 text-xs"
              >
                + Add
              </Button>
              <div className="text-xs text-muted-foreground">
                {instances.length} of {item.repeatable.min || 0}-{item.repeatable.max || '∞'}
              </div>
            </div>
          )}
        </div>
      ) : (
        renderFieldInstance(item.item_instance_id || 'single', 0)
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {getHelpText() && (
        <div className="text-xs text-muted-foreground mt-1">
          {getHelpText()}
        </div>
      )}

      {/* Read-only indicator */}
      {item.editable === false && (
        <div className="text-xs text-muted-foreground italic">
          Read-only
        </div>
      )}
    </div>
  );
};

// Component for rendering subsections
const SubsectionRenderer: React.FC<{
  subsection: Subsection;
  sectionId: string;
  fieldRegistry: Record<string, FieldRegistry>;
  formValues: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  isEditing?: boolean;
  createFieldKey: (sectionId: string, itemRef: string, subsectionId?: string) => string;
  validationErrors: Record<string, string[]>;
}> = ({ subsection, sectionId, fieldRegistry, formValues, onFieldChange, isEditing = false, createFieldKey, validationErrors }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-border/40 rounded-lg bg-card/30 p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-8 font-medium text-sm hover:bg-transparent">
            <span className="flex items-center">
              {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              {subsection.label.fallback}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(subsection.items || []).map((item) => {
              const fieldKey = createFieldKey(sectionId, item.ref, subsection.id);
              return (
                <ItemRenderer
                  key={item.ref}
                  item={item}
                  field={fieldRegistry[item.ref]}
                  value={formValues[fieldKey] || ''}
                  onChange={(value) => onFieldChange(fieldKey, value)}
                  formValues={formValues}
                  isEditing={isEditing}
                  validationErrors={validationErrors[fieldKey] || []}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Component for rendering sections
const SectionRenderer: React.FC<{
  section: Section;
  fieldRegistry: Record<string, FieldRegistry>;
  formValues: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  isEditing?: boolean;
  createFieldKey: (sectionId: string, itemRef: string, subsectionId?: string) => string;
  validationErrors: Record<string, string[]>;
}> = ({ section, fieldRegistry, formValues, onFieldChange, isEditing = false, createFieldKey, validationErrors }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-border rounded-lg bg-card shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4 border-b border-border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto font-semibold text-base hover:bg-transparent">
              <span className="flex items-center">
                {isOpen ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                {section.label.fallback}
              </span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Direct section items */}
            {section.items && section.items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item) => {
                  const fieldKey = createFieldKey(section.id, item.ref);
                  return (
                    <ItemRenderer
                      key={item.ref}
                      item={item}
                      field={fieldRegistry[item.ref]}
                      value={formValues[fieldKey] || ''}
                      onChange={(value) => onFieldChange(fieldKey, value)}
                      formValues={formValues}
                      isEditing={isEditing}
                      validationErrors={validationErrors[fieldKey] || []}
                    />
                  );
                })}
              </div>
            )}

            {/* Subsections */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="space-y-4">
                {section.subsections.map((subsection) => (
                  <SubsectionRenderer
                    key={subsection.id}
                    subsection={subsection}
                    sectionId={section.id}
                    fieldRegistry={fieldRegistry}
                    formValues={formValues}
                    onFieldChange={onFieldChange}
                    isEditing={isEditing}
                    createFieldKey={createFieldKey}
                    validationErrors={validationErrors}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default function JsonNodeRenderer() {
  const nodeId = '2041b303-a2ec-4f9b-bee2-cccd46fb8563';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedNode, setParsedNode] = useState<Node | null>(null);
  const [nodeContent, setNodeContent] = useState<NodeContent | null>(null);
  const [fieldRegistry, setFieldRegistry] = useState<Record<string, FieldRegistry>>({});
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({});

  // Fetch field registry
  const fetchFieldRegistry = async () => {
    try {
      const { data, error } = await supabase
        .from('field_registry')
        .select('*');
      
      if (error) throw error;
      
      const registry: Record<string, FieldRegistry> = {};
      data.forEach(field => {
        registry[field.field_id] = {
          id: field.id,
          field_id: field.field_id,
          datatype: field.datatype,
          widget: field.widget,
          options: field.options,
          rules: field.rules,
          ui: field.ui,
          default_value: field.default_value,
          resolvedOptions: []
        };
      });
      
      setFieldRegistry(registry);
    } catch (err) {
      console.error('Failed to fetch field registry:', err);
      setError(`Failed to fetch field registry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Fetch node from database
  const fetchNode = async () => {
    try {
      const { data, error } = await supabase
        .from('storyboard_nodes')
        .select('*')
        .eq('id', nodeId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Node not found');
      
      if (data.node_type !== 'form') {
        throw new Error('Node type must be "form"');
      }

      // Cast the database response to our expected types
      const node: Node = {
        ...data,
        path: data.path as string,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        edit: typeof data.edit === 'string' ? data.edit : JSON.stringify(data.edit),
        actions: typeof data.actions === 'string' ? data.actions : JSON.stringify(data.actions),
        dependencies: typeof data.dependencies === 'string' ? data.dependencies : JSON.stringify(data.dependencies),
      };

      setParsedNode(node);
      
      // Parse content - handle both string and object types
      let content: NodeContent;
      if (typeof data.content === 'string') {
        content = JSON.parse(data.content);
      } else {
        content = data.content as unknown as NodeContent;
      }
      
      if (content.version !== 'v1-sections') {
        throw new Error('Only v1-sections format is supported');
      }
      
      setNodeContent(content);
      setError('');
      
      // Initialize form values with item values or default values
      const initialValues: Record<string, any> = {};
      content.sections?.forEach((section: Section) => {
        section.items?.forEach((item: Item) => {
          const fieldKey = createFieldKey(section.id, item.ref);
          if (item.value !== undefined) {
            initialValues[fieldKey] = item.value;
          } else {
            const field = fieldRegistry[item.ref];
            if (field?.default_value !== undefined) {
              initialValues[fieldKey] = field.default_value;
            }
          }
        });
        section.subsections?.forEach((subsection: Subsection) => {
          subsection.items?.forEach((item: Item) => {
            const fieldKey = createFieldKey(section.id, item.ref, subsection.id);
            if (item.value !== undefined) {
              initialValues[fieldKey] = item.value;
            } else {
              const field = fieldRegistry[item.ref];
              if (field?.default_value !== undefined) {
                initialValues[fieldKey] = field.default_value;
              }
            }
          });
        });
      });
      setFormValues(initialValues);
      
    } catch (err) {
      setError(`Failed to fetch node: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setParsedNode(null);
      setNodeContent(null);
    }
  };

  // Helper function to create unique field keys
  const createFieldKey = (sectionId: string, itemRef: string, subsectionId?: string): string => {
    if (subsectionId) {
      return `${sectionId}.${subsectionId}.${itemRef}`;
    }
    return `${sectionId}.${itemRef}`;
  };

  // Helper function to parse field key back to components
  const parseFieldKey = (fieldKey: string): { sectionId: string; subsectionId?: string; itemRef: string } => {
    const parts = fieldKey.split('.');
    if (parts.length === 3) {
      return { sectionId: parts[0], subsectionId: parts[1], itemRef: parts[2] };
    }
    return { sectionId: parts[0], itemRef: parts[1] };
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Validation logic
  const validateFormValues = (): { isValid: boolean; errors: Record<string, string[]> } => {
    const errors: Record<string, string[]> = {};
    
    if (!nodeContent) return { isValid: true, errors };
    
    // Validate all sections
    nodeContent.sections.forEach((section: Section) => {
      // Validate section items
      section.items?.forEach(item => {
        const fieldKey = createFieldKey(section.id, item.ref);
        const field = fieldRegistry[item.ref];
        const value = formValues[fieldKey];
        const fieldErrors: string[] = [];
        
        if (field) {
          // Merge item rules with field rules
          const mergedRules = { ...field.rules };
          if (item.required !== undefined) {
            mergedRules.required = item.required;
          }
          if (item.rules) {
            Object.assign(mergedRules, item.rules);
          }
          
          // Check required rule
          if (mergedRules.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
            fieldErrors.push('This field is required');
          }
          
          // Check other rules if value exists
          if (value !== undefined && value !== null && value !== '') {
            // Min length
            if (mergedRules.minLength && typeof value === 'string' && value.length < mergedRules.minLength) {
              fieldErrors.push(`Minimum length is ${mergedRules.minLength}`);
            }
            
            // Max length
            if (mergedRules.maxLength && typeof value === 'string' && value.length > mergedRules.maxLength) {
              fieldErrors.push(`Maximum length is ${mergedRules.maxLength}`);
            }
            
            // Min value
            if (mergedRules.min && typeof value === 'number' && value < mergedRules.min) {
              fieldErrors.push(`Minimum value is ${mergedRules.min}`);
            }
            
            // Max value
            if (mergedRules.max && typeof value === 'number' && value > mergedRules.max) {
              fieldErrors.push(`Maximum value is ${mergedRules.max}`);
            }
            
            // Array length constraints
            if (Array.isArray(value)) {
              if (mergedRules.min && value.length < mergedRules.min) {
                fieldErrors.push(`Minimum ${mergedRules.min} items required`);
              }
              if (mergedRules.max && value.length > mergedRules.max) {
                fieldErrors.push(`Maximum ${mergedRules.max} items allowed`);
              }
            }
            
            // Email validation
            if (field.datatype === 'email' && typeof value === 'string') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                fieldErrors.push('Invalid email format');
              }
            }
            
            // URL validation
            if (field.datatype === 'url' && typeof value === 'string') {
              try {
                new URL(value);
              } catch {
                fieldErrors.push('Invalid URL format');
              }
            }
          }
        }
        
        if (fieldErrors.length > 0) {
          errors[fieldKey] = fieldErrors;
        }
      });
      
      // Validate subsection items
      section.subsections?.forEach(subsection => {
        subsection.items?.forEach(item => {
          const fieldKey = createFieldKey(section.id, item.ref, subsection.id);
          const field = fieldRegistry[item.ref];
          const value = formValues[fieldKey];
          const fieldErrors: string[] = [];
          
          if (field) {
            // Merge item rules with field rules
            const mergedRules = { ...field.rules };
            if (item.required !== undefined) {
              mergedRules.required = item.required;
            }
            if (item.rules) {
              Object.assign(mergedRules, item.rules);
            }
            
            // Check required rule
            if (mergedRules.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
              fieldErrors.push('This field is required');
            }
            
            // Check other rules if value exists
            if (value !== undefined && value !== null && value !== '') {
              // Min length
              if (mergedRules.minLength && typeof value === 'string' && value.length < mergedRules.minLength) {
                fieldErrors.push(`Minimum length is ${mergedRules.minLength}`);
              }
              
              // Max length
              if (mergedRules.maxLength && typeof value === 'string' && value.length > mergedRules.maxLength) {
                fieldErrors.push(`Maximum length is ${mergedRules.maxLength}`);
              }
              
              // Min value
              if (mergedRules.min && typeof value === 'number' && value < mergedRules.min) {
                fieldErrors.push(`Minimum value is ${mergedRules.min}`);
              }
              
              // Max value
              if (mergedRules.max && typeof value === 'number' && value > mergedRules.max) {
                fieldErrors.push(`Maximum value is ${mergedRules.max}`);
              }
              
              // Array length constraints
              if (Array.isArray(value)) {
                if (mergedRules.min && value.length < mergedRules.min) {
                  fieldErrors.push(`Minimum ${mergedRules.min} items required`);
                }
                if (mergedRules.max && value.length > mergedRules.max) {
                  fieldErrors.push(`Maximum ${mergedRules.max} items allowed`);
                }
              }
              
              // Email validation
              if (field.datatype === 'email' && typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  fieldErrors.push('Invalid email format');
                }
              }
              
              // URL validation
              if (field.datatype === 'url' && typeof value === 'string') {
                try {
                  new URL(value);
                } catch {
                  fieldErrors.push('Invalid URL format');
                }
              }
            }
          }
          
          if (fieldErrors.length > 0) {
            errors[fieldKey] = fieldErrors;
          }
        });
      });
    });
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Get validation state
  const validationState = validateFormValues();
  const hasValidationErrors = !validationState.isValid;

  // Parse values based on field datatype
  const parseValueByDatatype = (value: any, datatype: string): any => {
    if (value === null || value === undefined || value === '') return value;
    
    switch (datatype.toLowerCase()) {
      case 'boolean':
        return Boolean(value);
      case 'number':
      case 'integer':
        return Number(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'date':
        return value instanceof Date ? value : new Date(value);
      case 'email':
      case 'url':
      case 'text':
      case 'string':
      default:
        return value;
    }
  };

  const toggleNodeEdit = () => {
    if (isEditingNode) {
      // Cancel editing - restore original values
      setFormValues(originalValues);
      setIsEditingNode(false);
      setOriginalValues({});
    } else {
      // Enter edit mode - store original values
      setOriginalValues({ ...formValues });
      setIsEditingNode(true);
    }
  };

  const saveNode = async () => {
    // Validate before saving
    const validation = validateFormValues();
    if (!validation.isValid) {
      const errorCount = Object.keys(validation.errors).length;
      toast.error(`Cannot save: ${errorCount} field${errorCount > 1 ? 's have' : ' has'} validation errors`);
      return;
    }

    try {
      if (!nodeContent || !parsedNode) {
        throw new Error('No node content to save');
      }

      // Parse values according to their datatypes and match them to their original items
      const parsedValues: Record<string, any> = {};
      
      // Get all items across all sections to parse their values
      nodeContent.sections.forEach((section: Section) => {
        // Parse section items
        section.items?.forEach(item => {
          const fieldKey = createFieldKey(section.id, item.ref);
          const field = fieldRegistry[item.ref];
          if (field && formValues[fieldKey] !== undefined) {
            parsedValues[fieldKey] = parseValueByDatatype(formValues[fieldKey], field.datatype);
          }
        });
        
        // Parse subsection items
        section.subsections?.forEach(subsection => {
          subsection.items?.forEach(item => {
            const fieldKey = createFieldKey(section.id, item.ref, subsection.id);
            const field = fieldRegistry[item.ref];
            if (field && formValues[fieldKey] !== undefined) {
              parsedValues[fieldKey] = parseValueByDatatype(formValues[fieldKey], field.datatype);
            }
          });
        });
      });

      // Create updated content with new values
      const updatedContent = JSON.parse(JSON.stringify(nodeContent)); // Deep clone
      
      // Update item values in the content using the parsed field keys
      updatedContent.sections.forEach((section: Section) => {
        // Update section items
        section.items?.forEach(item => {
          const fieldKey = createFieldKey(section.id, item.ref);
          if (parsedValues[fieldKey] !== undefined) {
            item.value = parsedValues[fieldKey];
          }
        });
        
        // Update subsection items
        section.subsections?.forEach(subsection => {
          subsection.items?.forEach(item => {
            const fieldKey = createFieldKey(section.id, item.ref, subsection.id);
            if (parsedValues[fieldKey] !== undefined) {
              item.value = parsedValues[fieldKey];
            }
          });
        });
      });

      // Save to database
      const { error } = await supabase
        .from('storyboard_nodes')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', nodeId);

      if (error) throw error;

      // Update local state
      setParsedNode(prev => prev ? { ...prev, updated_at: new Date().toISOString() } : null);
      setNodeContent(updatedContent);
      
      // Exit edit mode
      setIsEditingNode(false);
      setOriginalValues({});

      toast.success('Node saved successfully!');
    } catch (err) {
      console.error('Failed to save node:', err);
      toast.error(`Failed to save node: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchFieldRegistry();
    await fetchNode();
    setLoading(false);
  };

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('node-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'storyboard_nodes',
          filter: `id=eq.${nodeId}`
        },
        (payload) => {
          console.log('Node updated:', payload);
          if (payload.new) {
            const updatedData = payload.new;
            
            // Cast the realtime update to our expected types
            const node: Node = {
              id: updatedData.id,
              job_id: updatedData.job_id,
              node_type: updatedData.node_type,
              parent_id: updatedData.parent_id,
              removable: updatedData.removable,
              created_at: updatedData.created_at,
              updated_at: updatedData.updated_at,
              version: updatedData.version,
              is_section: updatedData.is_section,
              path: updatedData.path as string,
              content: typeof updatedData.content === 'string' ? updatedData.content : JSON.stringify(updatedData.content),
              edit: typeof updatedData.edit === 'string' ? updatedData.edit : JSON.stringify(updatedData.edit),
              actions: typeof updatedData.actions === 'string' ? updatedData.actions : JSON.stringify(updatedData.actions),
              dependencies: typeof updatedData.dependencies === 'string' ? updatedData.dependencies : JSON.stringify(updatedData.dependencies),
            };
            
            setParsedNode(node);
            
            // Parse content for display
            let content: NodeContent;
            if (typeof updatedData.content === 'string') {
              content = JSON.parse(updatedData.content);
            } else {
              content = updatedData.content as unknown as NodeContent;
            }
            
            setNodeContent(content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nodeId]);

  // Fetch on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Live Node Renderer</h1>
            <p className="text-sm text-muted-foreground">
              Node {nodeId.split('-')[0]}... • {nodeContent?.sections?.length || 0} sections
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3">
          {nodeContent && (
            <div className={`rounded-lg border-2 transition-all duration-200 ${
              isEditingNode 
                ? 'border-yellow-400/60 bg-yellow-50/5 shadow-lg shadow-yellow-400/10' 
                : 'border-border bg-card'
            }`}>
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Node: {parsedNode?.path}</h2>
                    <p className="text-sm text-muted-foreground">
                      {nodeContent.sections.length} sections • 
                      {nodeContent.sections.reduce((total, section) => {
                        const sectionItems = section.items?.length || 0;
                        const subsectionItems = section.subsections?.reduce((subTotal, sub) => 
                          subTotal + (sub.items?.length || 0), 0) || 0;
                        return total + sectionItems + subsectionItems;
                      }, 0)} fields
                      {isEditingNode && hasValidationErrors && (
                        <span className="text-destructive ml-2">
                          • {Object.keys(validationState.errors).length} validation error{Object.keys(validationState.errors).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingNode ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleNodeEdit}
                          className="h-8 text-muted-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={saveNode}
                          disabled={hasValidationErrors}
                          className="h-8"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <EditButton
                        onClick={toggleNodeEdit}
                        isEditing={isEditingNode}
                        size="sm"
                        variant="outline"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {nodeContent.sections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    fieldRegistry={fieldRegistry}
                    formValues={formValues}
                    onFieldChange={handleFieldChange}
                    isEditing={isEditingNode}
                    createFieldKey={createFieldKey}
                    validationErrors={validationState.errors}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Node Info */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
              {parsedNode && (
                <div className="space-y-2 text-xs">
                  <div><span className="font-medium">Type:</span> {parsedNode.node_type}</div>
                  <div><span className="font-medium">Job:</span> {parsedNode.job_id.split('-')[0]}...</div>
                  <div><span className="font-medium">Version:</span> {parsedNode.version}</div>
                  <div><span className="font-medium">Updated:</span> {new Date(parsedNode.updated_at).toLocaleString()}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Form State Debug */}
          {isEditingNode && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Debug Info</h3>
              <div className="text-xs space-y-1">
                <div>Fields: {Object.keys(formValues).length}</div>
                <div>Registry: {Object.keys(fieldRegistry).length}</div>
                <div className="text-destructive">
                  Errors: {Object.keys(validationState.errors).length}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}