/**
 * NodeRenderer - Advanced form node rendering component with field isolation
 * 
 * This component renders job nodes with proper field-level state management using
 * the ltree address system for unique field identification and storage.
 * 
 * Key Features:
 * - Uses ltree addresses (job_id.node_path.field_ref) for field isolation
 * - Batched field operations for performance optimization
 * - Optimistic UI updates with proper error handling
 * - Debounced auto-save to prevent excessive API calls
 * - Field-level loading and error states
 * - Supports nested sections and collection instances
 * 
 * Address System:
 * Each field gets a unique ltree address: {job_id}.{node_path}.fields.{field_ref}
 * This ensures complete isolation between fields across different nodes/jobs
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
import { useNodeFieldManager } from '@/hooks/useNodeFieldManager';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import FieldManagerDebugPanel from '../FieldManagerDebugPanel';
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
  
  // Initialize field manager with ltree address system integration
  // This handles all field-level operations using unique addresses: {job_id}.{node_path}.fields.{field_ref}
  const fieldManager = useNodeFieldManager({ node, onUpdate });
  
  // Local UI state management
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Mode can be controlled externally or internally
  const mode = externalMode || internalMode;
  const setMode = onModeChange || setInternalMode;
  
  // Extract node content with fallbacks
  const nodeContent = node.content || {};
  
  // Computed properties for UI state
  const label = nodeContent?.label?.fallback || nodeContent?.label?.key || node.path;
  const description = nodeContent?.description?.fallback || '';
  const hasGenerateAction = Boolean(node.generate_n8n_id);
  const canEdit = node.node_type === 'form' && fieldManager.fieldRefs.length > 0;
  const isEmpty = isNodeEmpty();
  
  /**
   * Check if node is empty by examining all field values through the address system
   * This uses the field manager's ltree-based value resolution
   */
  function isNodeEmpty(): boolean {
    if (node.node_type !== 'form') return false;
    
    return fieldManager.fieldRefs.every(ref => {
      // Get field value using ltree address: {job_id}.{node_path}.fields.{field_ref}
      const value = fieldManager.getFieldValue(ref);
      return !value || 
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0);
    });
  }
  
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
  
  /**
   * Save edit handler - commits all field changes using ltree addresses
   * 
   * Process:
   * 1. Field manager saves all dirty fields to their ltree addresses
   * 2. Node content is updated with current field values
   * 3. Database is updated with new node content
   * 4. UI state is updated to reflect successful save
   */
  const handleSaveEdit = useCallback(async () => {
    try {
      // Save all changes through field manager (uses ltree addresses internally)
      await fieldManager.saveAllChanges();
      setMode('idle');
      setLastSaved(new Date());
      
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
    }
  }, [fieldManager, setMode, toast]);
  
  /**
   * Cancel edit handler - reverts to saved state
   * Field manager handles reloading original values from ltree addresses
   */
  const handleCancelEdit = useCallback(() => {
    // Field manager handles reloading original values from ltree
    setMode('idle');
  }, [setMode]);
  
  /**
   * Generate content handler - triggers n8n function execution
   * Uses the node's generate_n8n_id to invoke the appropriate function
   */
  const handleGenerate = useCallback(async () => {
    if (!onGenerate || !node.generate_n8n_id) return;
    
    try {
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
    }
  }, [onGenerate, node.id, node.generate_n8n_id, toast]);
  
  /**
   * Render individual field item using the ltree address system
   * 
   * Each field is rendered with:
   * - Unique ltree address for field isolation: {job_id}.{node_path}.fields.{field_ref}
   * - Field registry entry from cache for field definition
   * - Field state management (loading, error, dirty tracking)
   * - Optimistic UI updates with backend synchronization
   * 
   * @param item - Field item configuration from node content
   * @param index - Array index for React key fallback
   */
  const renderFieldItem = (item: any, index: number) => {
    // Get field definition from registry cache (batched loading)
    const fieldEntry = fieldManager.getFieldEntry(item.ref);
    // Get current field state (value, loading, error, dirty status)
    const fieldState = fieldManager.getFieldState(item.ref);
    
    // Handle missing field registry entries
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
        {/* Render field using systematic renderer with ltree-backed value */}
        <SystematicFieldRenderer
          field={fieldEntry}
          value={fieldManager.getFieldValue(item.ref)} // Uses ltree address internally
          onChange={(newValue) => {
            console.log(`[UI] Field ${item.ref} changed to:`, newValue);
            // Save to ltree address: {job_id}.{node_path}.fields.{field_ref}
            fieldManager.setFieldValue(item.ref, newValue);
          }}
          loading={fieldState.loading}
          error={fieldState.error}
        />
        {/* Show unsaved changes indicator for dirty fields */}
        {fieldState.isDirty && mode === 'edit' && (
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
    if (fieldManager.isLoading) return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Saving...</Badge>;
    if (fieldManager.hasUnsavedChanges) return <Badge variant="outline">Unsaved</Badge>;
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
                    disabled={fieldManager.isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={fieldManager.isLoading || !fieldManager.hasUnsavedChanges}
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
                    disabled={fieldManager.isLoading}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {hasGenerateAction && (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={fieldManager.isLoading}
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
            
            {/* 
              Debug Panel - Development monitoring for ltree address system
              Shows:
              - Batch queue stats for ltree operations
              - Field registry cache hit rates
              - Active field references using address system
              - Performance metrics for optimization tracking
            */}
            {process.env.NODE_ENV === 'development' && (
              <FieldManagerDebugPanel
                getBatchStats={fieldManager.getBatchStats}
                getCacheStats={fieldManager.getCacheStats}
                fieldRefs={fieldManager.fieldRefs}
                className="mt-4"
              />
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}