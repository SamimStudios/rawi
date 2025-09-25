/**
 * NodeRenderer - Renders job nodes using ltree hybrid address system
 * 
 * Key Features:
 * - Direct field rendering with ltree addresses: {node.path}#{fieldRef}.value
 * - No intermediate state management - fields manage their own state
 * - Simple field discovery from node content
 * - Proper mode handling (idle/edit)
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
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FieldHybridRenderer } from './FieldHybridRenderer';
import type { JobNode } from '@/hooks/useJobs';

interface NodeRendererProps {
  node: JobNode;
  onUpdate: (node: JobNode) => Promise<void>; // Fixed signature
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
  
  // Local UI state management
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Mode can be controlled externally or internally
  const mode = externalMode || internalMode;
  const setMode = onModeChange || setInternalMode;
  
  // Extract node content with fallbacks
  const nodeContent = node.content || {};
  
  // Computed properties for UI state
  const label = nodeContent?.label?.fallback || nodeContent?.label?.key || node.path;
  const description = nodeContent?.description?.fallback || '';
  const hasGenerateAction = Boolean(node.generate_n8n_id);
  
  // Discover fields from node content
  const fieldRefs = discoverFieldRefs(nodeContent);
  const canEdit = node.node_type === 'form' && fieldRefs.length > 0;
  
  /**
   * Recursively discover field references from node content
   */
  function discoverFieldRefs(content: any): string[] {
    const refs: string[] = [];
    
    function traverse(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.kind === 'FieldItem' && obj.ref) {
        refs.push(obj.ref);
      }
      
      // Traverse arrays and objects
      Object.values(obj).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(traverse);
        } else if (typeof value === 'object') {
          traverse(value);
        }
      });
    }
    
    traverse(content);
    return refs;
  }
  
  // Auto-edit behavior for empty first nodes
  useEffect(() => {
    if (node.idx === 1 && canEdit && mode === 'idle') {
      setMode('edit');
    }
  }, [node.idx, canEdit, mode, setMode]);
  
  // Mode handlers
  const handleStartEdit = useCallback(() => {
    setMode('edit');
    setIsCollapsed(false);
  }, [setMode]);
  
  /**
   * Save edit handler - node will be updated through field callbacks
   */
  const handleSaveEdit = useCallback(async () => {
    try {
      setMode('idle');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
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
  }, [setMode, toast]);
  
  /**
   * Cancel edit handler - reverts to saved state
   */
  const handleCancelEdit = useCallback(() => {
    setMode('idle');
    setHasUnsavedChanges(false);
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
   * Address format: {node.path}#{fieldRef}.value
   */
  const renderFieldItem = (item: any, index: number) => {
    return (
      <div key={item.ref} className="space-y-2">
        <FieldHybridRenderer
          node={node}
          fieldRef={item.ref}
          onChange={(value) => {
            setHasUnsavedChanges(true);
            // Field updates are handled by useHybridValue internally
          }}
          mode={mode}
        />
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
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!hasUnsavedChanges}
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
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {hasGenerateAction && (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
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
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-muted rounded text-xs">
                <h5 className="font-medium mb-2">Node Debug</h5>
                <div className="space-y-1">
                  <div>Fields: {fieldRefs.length}</div>
                  <div>Field Refs: {fieldRefs.join(', ')}</div>
                  <div>Unsaved: {hasUnsavedChanges ? 'Yes' : 'No'}</div>
                  <div>Mode: {mode}</div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}