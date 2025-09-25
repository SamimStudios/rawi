/**
 * Modern Node Renderer using existing ltree addressing system
 * Uses LtreeAddresses and HybridAddrService for consistent data access
 */
import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  ChevronDown, 
  Edit, 
  Check, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Save,
  X,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLtreeResolver } from '@/hooks/useLtreeResolver';
import { createLtreeAddresses } from '@/lib/ltree/addresses';
import { useFields, type FieldEntry } from '@/hooks/useFields';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import type { JobNode } from '@/hooks/useJobs';

interface NodeRendererProps {
  node: JobNode;
  onUpdate: (nodeId: string, content: any) => Promise<void>;
  onGenerate?: (nodeId: string, n8nId: string) => Promise<void>;
  mode?: 'idle' | 'edit';
  onModeChange?: (mode: 'idle' | 'edit') => void;
  showPath?: boolean;
  className?: string;
}

export default function NodeRenderer({
  node,
  onUpdate,
  onGenerate,
  mode: externalMode,
  onModeChange,
  showPath = false,
  className
}: NodeRendererProps) {
  const { toast } = useToast();
  const { getEntry } = useFields();
  const { resolveValue, setValue } = useLtreeResolver();
  
  // Local state
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [fieldEntries, setFieldEntries] = useState<Record<string, FieldEntry | null>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fieldStates, setFieldStates] = useState<Record<string, { loading?: boolean; error?: string; isDirty?: boolean }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Mode management
  const mode = externalMode || internalMode;
  const setMode = onModeChange || setInternalMode;
  
  // Ltree address builder
  const addresses = createLtreeAddresses(node.job_id, node.path);
  
  // Get node content
  const nodeContent = node.content || {};
  
  // Computed properties
  const label = nodeContent?.label?.fallback || nodeContent?.label?.key || node.path;
  const description = nodeContent?.description?.fallback || '';
  const hasGenerateAction = Boolean(node.generate_n8n_id);
  const canEdit = node.node_type === 'form' && hasEditableFields();
  const isEmpty = isNodeEmpty();
  
  // Get field value using ltree addressing
  const getFieldValue = useCallback((fieldRef: string): any => {
    return fieldValues[fieldRef];
  }, [fieldValues]);
  
  // Set field value using ltree addressing
  const setFieldValue = useCallback(async (fieldRef: string, value: any) => {
    const address = addresses.fieldValue(fieldRef);
    
    try {
      // Set loading state
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { ...prev[fieldRef], loading: true, error: undefined }
      }));
      
      // Update via ltree
      await setValue(node.job_id, address, value);
      
      // Update local state immediately
      setFieldValues(prev => ({ ...prev, [fieldRef]: value }));
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { ...prev[fieldRef], loading: false, isDirty: true }
      }));
      
      setHasUnsavedChanges(true);
      
      // Auto-save if in edit mode
      if (mode === 'edit' && onUpdate) {
        setTimeout(() => {
          saveAllChanges();
        }, 300);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update field';
      setFieldStates(prev => ({
        ...prev,
        [fieldRef]: { ...prev[fieldRef], loading: false, error: errorMessage }
      }));
      console.error(`Failed to update field ${fieldRef}:`, error);
    }
  }, [addresses, setValue, node.job_id, mode, onUpdate]);
  
  // Collect field references from the content structure
  function collectFieldRefs(items: any[]): string[] {
    const refs: string[] = [];
    
    function traverse(items: any[]) {
      for (const item of items || []) {
        if (item?.kind === 'FieldItem' && item.ref) {
          refs.push(item.ref);
        }
        if (item?.children) traverse(item.children);
        if (item?.items) traverse(item.items);
        if (item?.instances) {
          for (const instance of item.instances) {
            if (instance?.children) traverse(instance.children);
          }
        }
      }
    }
    
    traverse(items);
    return Array.from(new Set(refs));
  }
  
  function hasEditableFields(): boolean {
    return collectFieldRefs(nodeContent?.items || []).length > 0;
  }
  
  function isNodeEmpty(): boolean {
    if (node.node_type !== 'form') return false;
    
    const fieldRefs = collectFieldRefs(nodeContent?.items || []);
    return fieldRefs.every(ref => {
      const value = getFieldValue(ref);
      return !value || 
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0);
    });
  }
  
  // Load field entries and values from registry and ltree
  useEffect(() => {
    const loadFieldData = async () => {
      const fieldRefs = collectFieldRefs(nodeContent?.items || []);
      const entries: Record<string, FieldEntry | null> = {};
      const values: Record<string, any> = {};
      
      for (const ref of fieldRefs) {
        try {
          // Load field entry
          entries[ref] = await getEntry(ref);
          
          // Load current value via ltree
          const address = addresses.fieldValue(ref);
          const currentValue = await resolveValue(node.job_id, address);
          values[ref] = currentValue;
          
        } catch (error) {
          console.error(`Failed to load field data for ${ref}:`, error);
          entries[ref] = null;
          values[ref] = undefined;
        }
      }
      
      setFieldEntries(entries);
      setFieldValues(values);
    };
    
    loadFieldData();
  }, [nodeContent?.items, getEntry, addresses, resolveValue, node.job_id]);
  
  // Auto-edit behavior for empty first nodes
  useEffect(() => {
    if (node.idx === 1 && isEmpty && !hasGenerateAction && canEdit && mode === 'idle') {
      setMode('edit');
    }
  }, [node.idx, isEmpty, hasGenerateAction, canEdit, mode, setMode]);
  
  // Mode handlers
  const handleStartEdit = useCallback(() => {
    setMode('edit');
    setIsCollapsed(false);
  }, [setMode]);
  
  // Save all changes to the database
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges || !onUpdate) return;
    
    try {
      // Create updated content with current field values
      const updatedContent = { ...nodeContent };
      
      // Update the content structure with current values
      function updateItems(items: any[]) {
        for (const item of items || []) {
          if (item?.kind === 'FieldItem' && item.ref && fieldValues[item.ref] !== undefined) {
            item.value = fieldValues[item.ref];
          }
          if (item?.children) updateItems(item.children);
          if (item?.items) updateItems(item.items);
          if (item?.instances) {
            for (const instance of item.instances) {
              if (instance?.children) updateItems(instance.children);
            }
          }
        }
      }
      
      updateItems(updatedContent?.items || []);
      
      await onUpdate(node.id, updatedContent);
      
      // Reset dirty states
      setFieldStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = { ...updated[key], isDirty: false };
        });
        return updated;
      });
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error;
    }
  }, [hasUnsavedChanges, onUpdate, nodeContent, fieldValues, node.id]);
  
  const handleCancelEdit = useCallback(() => {
    // Reset to original values by reloading from ltree
    const loadOriginalValues = async () => {
      const fieldRefs = collectFieldRefs(nodeContent?.items || []);
      const values: Record<string, any> = {};
      
      for (const ref of fieldRefs) {
        try {
          const address = addresses.fieldValue(ref);
          const originalValue = await resolveValue(node.job_id, address);
          values[ref] = originalValue;
        } catch (error) {
          console.error(`Failed to reload field ${ref}:`, error);
        }
      }
      
      setFieldValues(values);
      setFieldStates({});
      setHasUnsavedChanges(false);
    };
    
    loadOriginalValues();
    setMode('idle');
  }, [nodeContent?.items, addresses, resolveValue, node.job_id, setMode]);
  
  const handleSaveEdit = useCallback(async () => {
    try {
      setIsLoading(true);
      await saveAllChanges();
      setMode('idle');
      
      toast({
        title: "Changes saved",
        description: "Node content updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [saveAllChanges, setMode, toast]);
  
  const handleGenerate = useCallback(async () => {
    if (!onGenerate || !node.generate_n8n_id) return;
    
    try {
      setIsLoading(true);
      await onGenerate(node.id, node.generate_n8n_id);
      
      toast({
        title: "Generation completed", 
        description: "Content generated successfully",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onGenerate, node.id, node.generate_n8n_id, toast]);
  
  // Render individual field using ltree addressing
  const renderFieldItem = (item: any, index: number) => {
    const fieldEntry = fieldEntries[item.ref];
    const fieldState = fieldStates[item.ref];
    const fieldError = fieldState?.error;
    
    if (!fieldEntry) {
      return (
        <div key={item.ref || index} className="p-4 border border-dashed border-destructive/50 rounded-md">
          <p className="text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Field not found in registry: {item.ref}
          </p>
        </div>
      );
    }
    
    return (
      <div key={item.ref} className="space-y-2">
        <SystematicFieldRenderer
          field={fieldEntry}
          value={getFieldValue(item.ref)}
          onChange={(newValue) => {
            console.log(`Updating field ${item.ref}:`, newValue);
            setFieldValue(item.ref, newValue);
          }}
          loading={fieldState?.loading}
          error={fieldError}
        />
        {fieldState?.isDirty && mode === 'edit' && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Unsaved changes
          </div>
        )}
      </div>
    );
  };
  
  // Recursive rendering of items
  const renderItems = (items: any[]): React.ReactNode[] => {
    return items.map((item: any, index: number) => {
      if (item.kind === 'FieldItem') {
        return renderFieldItem(item, index);
      } else if (item.kind === 'SectionItem' || item.kind === 'Section') {
        return renderSection(item, index);
      } else if (item.kind === 'CollectionSectionItem') {
        return renderCollectionSection(item, index);
      }
      return null;
    });
  };
  
  const renderSection = (item: any, index: number) => {
    const [sectionCollapsed, setSectionCollapsed] = useState(false);
    
    return (
      <div key={item.ref || index} className="border rounded-lg">
        <Collapsible open={!sectionCollapsed} onOpenChange={setSectionCollapsed}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div className="text-left">
              <h4 className="font-medium">{item.label?.fallback || item.ref}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description.fallback}
                </p>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t">
            <div className="p-4 space-y-4">
              {renderItems(item.children || [])}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };
  
  const renderCollectionSection = (item: any, index: number) => {
    return (
      <div key={item.ref || index} className="border rounded-lg p-4">
        <h4 className="font-medium mb-4">{item.label?.fallback || item.ref}</h4>
        {item.instances?.map((instance: any, instanceIndex: number) => (
          <div key={instance.instance_id || instanceIndex} className="border-l-2 pl-4 mb-4 space-y-4">
            <h5 className="text-sm font-medium">Instance {instance.instance_id}</h5>
            {renderItems(instance.children || [])}
          </div>
        ))}
      </div>
    );
  };
  
  const renderFormContent = () => {
    if (!nodeContent?.items) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <p>No form fields defined</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {renderItems(nodeContent.items)}
      </div>
    );
  };
  
  // Status indicators
  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Saving...</Badge>;
    if (hasUnsavedChanges) return <Badge variant="outline">Unsaved</Badge>;
    if (mode === 'edit') return <Badge variant="default">Editing</Badge>;
    return null;
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">{label}</h3>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isLoading || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartEdit}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {hasGenerateAction && (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        
        {showPath && (
          <p className="text-xs font-mono text-muted-foreground">{node.path}</p>
        )}
        
        {lastSaved && (
          <p className="text-xs text-muted-foreground">
            Last saved: {format(lastSaved, 'HH:mm:ss')}
          </p>
        )}
      </CardHeader>
      
      <Collapsible open={!isCollapsed || mode === 'edit'} onOpenChange={setIsCollapsed}>
        <CardContent className="pt-0">
          <CollapsibleContent>
            {node.node_type === 'form' ? renderFormContent() : (
              <div className="text-center p-8 text-muted-foreground">
                <p>Unsupported node type: {node.node_type}</p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}