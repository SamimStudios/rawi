/**
 * Unified Node Renderer - Final implementation using ltree system
 */
import React, { useState, useCallback, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Check, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  X,
  Save,
  RotateCcw,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import { useFields, type FieldEntry } from '@/hooks/useFields';
import { useNodeData } from '@/hooks/useNodeData';
import { useDependencies } from '@/hooks/useDependencies';
import type { JobNode } from '@/hooks/useJobs';

interface UnifiedNodeRendererProps {
  node: JobNode;
  onUpdate: (nodeId: string, content: any) => Promise<void>;
  onGenerate?: (nodeId: string, n8nId: string) => Promise<void>;
  onValidate?: (nodeId: string, n8nId: string, content: any) => Promise<{ valid: boolean; errors?: any[] }>;
  onDelete?: (nodeId: string) => Promise<void>;
  mode?: 'idle' | 'edit';
  onModeChange?: (mode: 'idle' | 'edit') => void;
  showPath?: boolean;
  className?: string;
}

export default function UnifiedNodeRenderer({
  node,
  onUpdate,
  onGenerate,
  onValidate,
  onDelete,
  mode: externalMode,
  onModeChange,
  showPath = false,
  className
}: UnifiedNodeRendererProps) {
  const { toast } = useToast();
  const { getEntry } = useFields();
  
  // Local state
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [fieldEntries, setFieldEntries] = useState<Record<string, FieldEntry | null>>({});
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mode management
  const mode = externalMode || internalMode;
  const setMode = onModeChange || setInternalMode;

  // Use enhanced node data management
  const {
    nodeContent,
    setFieldValue,
    hasUnsavedChanges,
    isAutoSaving,
    fieldErrors,
    fieldStates,
    saveChanges,
    discardChanges,
    validateAllFields,
    addresses
  } = useNodeData({ 
    node, 
    onUpdate,
    autoSave: mode === 'edit'
  });

  // Check dependencies
  const {
    isBlocked,
    unmetDependencies,
    canGenerate,
    canValidate
  } = useDependencies(node);

  // Computed properties
  const label = nodeContent?.label?.fallback || nodeContent?.label?.key || node.path;
  const description = nodeContent?.description?.fallback || nodeContent?.description?.key || '';
  const lastUpdated = node.updated_at;
  const hasGenerateAction = Boolean(node.generate_n8n_id);
  const hasValidateAction = Boolean(node.validate_n8n_id);
  const canEdit = node.node_type === 'form' && hasEditableFields();
  const isEmpty = isNodeEmpty();

  // Check if node has editable fields
  function hasEditableFields(): boolean {
    if (!nodeContent?.items) return false;
    return nodeContent.items.some((item: any) => item.kind === 'FieldItem');
  }

  // Check if node is empty (for auto-edit behavior)
  function isNodeEmpty(): boolean {
    if (node.node_type !== 'form' || !nodeContent?.items) return false;
    
    return nodeContent.items.every((item: any) => {
      if (item.kind !== 'FieldItem') return true;
      const value = item.value;
      return !value || 
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0);
    });
  }

  // Load field entries from registry
  useEffect(() => {
    const loadFieldEntries = async () => {
      if (!nodeContent?.items) return;
      
      const collectFieldRefs = (items: any[]): string[] => {
        const refs: string[] = [];
        for (const item of items || []) {
          if (item?.kind === 'FieldItem' && item.ref) {
            refs.push(item.ref);
          }
          if (Array.isArray(item?.children)) {
            refs.push(...collectFieldRefs(item.children));
          }
          if (Array.isArray(item?.items)) {
            refs.push(...collectFieldRefs(item.items));
          }
          if (Array.isArray(item?.instances)) {
            for (const inst of item.instances) {
              if (Array.isArray(inst?.children)) refs.push(...collectFieldRefs(inst.children));
              if (Array.isArray(inst?.items)) refs.push(...collectFieldRefs(inst.items));
            }
          }
        }
        return refs;
      };
      
      const allFieldRefs = Array.from(new Set(collectFieldRefs(nodeContent.items)));
      const entries: Record<string, FieldEntry | null> = {};
      
      for (const ref of allFieldRefs) {
        try {
          const fieldEntry = await getEntry(ref);
          entries[ref] = fieldEntry;
        } catch (error) {
          console.error(`Failed to load field entry for ${ref}:`, error);
          entries[ref] = null;
        }
      }
      
      setFieldEntries(entries);
    };

    loadFieldEntries();
  }, [nodeContent?.items, getEntry]);

  // Persist collapse state
  const collapseKey = `unified-node-collapsed-${node.path}`;
  
  useEffect(() => {
    const stored = localStorage.getItem(collapseKey);
    if (stored !== null && mode === 'idle') {
      setIsCollapsed(JSON.parse(stored));
    }
  }, [collapseKey, mode]);

  // Auto-edit behavior for empty first nodes
  useEffect(() => {
    if (node.idx === 1 && isEmpty && !hasGenerateAction && canEdit && mode === 'idle') {
      setMode('edit');
    }
  }, [node.idx, isEmpty, hasGenerateAction, canEdit, mode, setMode]);

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    if (mode === 'edit') return; // Cannot collapse in edit mode
    setIsCollapsed(collapsed);
    localStorage.setItem(collapseKey, JSON.stringify(collapsed));
  }, [collapseKey, mode]);

  // Mode handlers
  const handleStartEdit = useCallback(() => {
    setValidationState('idle');
    setValidationErrors([]);
    setMode('edit');
    setIsCollapsed(false);
  }, [setMode]);

  const handleCancelEdit = useCallback(() => {
    discardChanges();
    setValidationState('idle');
    setValidationErrors([]);
    setMode('idle');
  }, [discardChanges, setMode]);

  const handleSaveEdit = useCallback(async () => {
    if (validationState === 'invalid') {
      toast({
        title: "Validation required",
        description: "Please fix validation errors or validate the content before saving.",
        variant: "destructive",
      });
      return;
    }

    if (hasValidateAction && validationState === 'idle') {
      toast({
        title: "Validation recommended",
        description: "Consider validating the content before saving.",
        variant: "destructive",
      });
    }

    try {
      setIsLoading(true);
      await saveChanges();
      setMode('idle');
      toast({
        title: "Changes saved",
        description: "Node content has been updated successfully.",
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
  }, [validationState, hasValidateAction, saveChanges, setMode, toast]);

  // Action handlers
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !onGenerate || !node.generate_n8n_id) return;

    try {
      setIsLoading(true);
      await onGenerate(node.id, node.generate_n8n_id);
      toast({
        title: "Generation completed",
        description: "Content has been generated successfully.",
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
  }, [canGenerate, onGenerate, node.id, node.generate_n8n_id, toast]);

  const handleValidate = useCallback(async () => {
    if (!canValidate || !onValidate || !node.validate_n8n_id) return;

    try {
      setIsLoading(true);
      setValidationState('validating');
      
      const result = await onValidate(node.id, node.validate_n8n_id, nodeContent);
      
      if (result.valid) {
        setValidationState('valid');
        setValidationErrors([]);
        toast({
          title: "Validation passed",
          description: "All fields are valid.",
        });
      } else {
        setValidationState('invalid');
        setValidationErrors(result.errors || []);
        toast({
          title: "Validation failed",
          description: "Please review the suggested fixes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setValidationState('invalid');
      toast({
        title: "Validation error",
        description: "Failed to validate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [canValidate, onValidate, node.id, node.validate_n8n_id, nodeContent, toast]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    try {
      setIsLoading(true);
      await onDelete(node.id);
      toast({
        title: "Node deleted",
        description: "Node has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete node. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, node.id, toast]);

  // Apply validation fixes
  const handleApplyFixes = useCallback(async () => {
    if (validationErrors.length === 0) return;

    try {
      // Apply suggested fixes from validation errors
      for (const error of validationErrors) {
        if (error.fix && error.field_ref) {
          await setFieldValue(error.field_ref, error.fix.value);
        }
      }

      setValidationErrors([]);
      setValidationState('idle');
      
      toast({
        title: "Fixes applied",
        description: "Validation fixes have been applied.",
      });
    } catch (error) {
      toast({
        title: "Failed to apply fixes",
        description: "Could not apply all validation fixes.",
        variant: "destructive",
      });
    }
  }, [validationErrors, setFieldValue, toast]);

  // Render different content types
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

  const renderItems = (items: any[]): React.ReactNode[] => {
    return items.map((item: any, index: number) => {
      if (item.kind === 'FieldItem') {
        return renderFieldItem(item, index);
      } else if (item.kind === 'SectionItem' || item.kind === 'Section') {
        return renderSection(item, index);
      } else if (item.kind === 'SubSection') {
        return renderSubSection(item, index);
      } else if (item.kind === 'CollectionSectionItem') {
        return renderCollectionSection(item, index);
      }
      return null;
    });
  };

  const renderFieldItem = (item: any, index: number) => {
    const fieldEntry = fieldEntries[item.ref];
    
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
      <SystematicFieldRenderer
        key={item.ref || index}
        field={fieldEntry}
        value={item.value}
        onChange={(newValue) => setFieldValue(item.ref, newValue)}
        loading={fieldStates[item.ref]?.loading}
        error={fieldStates[item.ref]?.error || fieldErrors[item.ref]}
      />
    );
  };

  const renderSection = (item: any, index: number) => {
    const [sectionCollapsed, setSectionCollapsed] = useState(item.collapsed !== false);
    
    return (
      <div key={item.ref || index} className="border rounded-lg">
        <Collapsible open={!sectionCollapsed} onOpenChange={setSectionCollapsed}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
            <div>
              <h4 className="font-medium text-left">{item.label?.fallback || item.ref}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground text-left">
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

  const renderSubSection = (item: any, index: number) => {
    return (
      <div key={item.ref || index} className="pl-4 border-l-2 border-muted space-y-4">
        {item.label && (
          <h5 className="font-medium text-sm">{item.label.fallback || item.ref}</h5>
        )}
        {renderItems(item.children || [])}
      </div>
    );
  };

  const renderCollectionSection = (item: any, index: number) => {
    return (
      <div key={item.ref || index} className="border rounded-lg p-4">
        <h4 className="font-medium mb-4">{item.label?.fallback || item.ref}</h4>
        {item.instances?.map((instance: any, instanceIndex: number) => (
          <div key={instance.instance_id || instanceIndex} className="border-l-2 pl-4 mb-4">
            <h5 className="text-sm font-medium mb-2">Instance {instance.instance_id}</h5>
            <div className="space-y-4">
              {renderItems(instance.children || [])}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMediaContent = () => {
    return (
      <div className="space-y-4">
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Media content</p>
          <p className="text-xs text-muted-foreground">Upload and manage media versions</p>
          <Button variant="outline" className="mt-4">
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      </div>
    );
  };

  const renderGroupContent = () => {
    return (
      <div className="space-y-4">
        <div className="text-center p-4 border rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Group node - contains child nodes at path: {node.path}.*
          </p>
          <Button variant="outline" size="sm" className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Child Node
          </Button>
        </div>
      </div>
    );
  };

  // Main content renderer
  const renderContent = () => {
    // Show empty state for empty nodes with generate capability
    if (mode === 'idle' && isEmpty && hasGenerateAction) {
      return (
        <div className="text-center py-8">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{label}</h3>
              <p className="text-sm text-muted-foreground">
                No inputs yet. Generate to auto-populate, or switch to Edit to start filling.
              </p>
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={!canGenerate || isLoading}
              className="mt-4"
            >
              {isLoading ? (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
      );
    }

    // Regular content based on node type
    switch (node.node_type) {
      case 'form':
        return renderFormContent();
      case 'media':
        return renderMediaContent();
      case 'group':
        return renderGroupContent();
      default:
        return (
          <div className="text-center p-4 text-muted-foreground">
            Unknown node type: {node.node_type}
          </div>
        );
    }
  };

  // Status badges
  const renderStatusBadges = () => {
    const badges = [];

    if (isBlocked) {
      badges.push(
        <Tooltip key="blocked">
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Blocked
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Waiting for: {unmetDependencies.join(', ')}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (mode === 'edit' && (hasUnsavedChanges || isAutoSaving)) {
      badges.push(
        <Badge key="saving" variant="secondary" className="gap-1">
          <Clock className="h-3 w-3 animate-spin" />
          {isAutoSaving ? 'Auto-saving...' : 'Unsaved changes'}
        </Badge>
      );
    }

    if (Object.keys(fieldErrors).length > 0) {
      badges.push(
        <Badge key="errors" variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {Object.keys(fieldErrors).length} Error{Object.keys(fieldErrors).length !== 1 ? 's' : ''}
        </Badge>
      );
    }

    if (validationState === 'valid') {
      badges.push(
        <Badge key="validated" variant="default" className="gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Validated
        </Badge>
      );
    }

    if (validationState === 'invalid') {
      badges.push(
        <Badge key="validation-failed" variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Validation Failed
        </Badge>
      );
    }

    return badges;
  };

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <Collapsible 
          open={!isCollapsed || mode === 'edit'} 
          onOpenChange={handleCollapseChange}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CollapsibleTrigger 
                  className="flex items-center gap-2 w-full text-left"
                  disabled={mode === 'edit'}
                >
                  <div className="flex items-center gap-2">
                    {(isCollapsed && mode !== 'edit') ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold truncate">{label}</h3>
                  </div>
                </CollapsibleTrigger>
                
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Type: {node.node_type}</span>
                  {showPath && <span>• Path: {node.path}</span>}
                  {lastUpdated && (
                    <Tooltip>
                      <TooltipTrigger>
                        <span>
                          • Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(lastUpdated), 'PPpp')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {renderStatusBadges()}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {mode === 'edit' ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-8"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isLoading}
                      className="h-8"
                    >
                      {isLoading ? (
                        <Clock className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-3 w-3" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-8"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )
                )}

                {mode === 'edit' && hasValidateAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidate}
                    disabled={!canValidate || isLoading}
                    className="h-8"
                  >
                    {validationState === 'validating' ? (
                      <Clock className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    )}
                    Validate
                  </Button>
                )}

                {hasGenerateAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={!canGenerate || isLoading}
                    className="h-8"
                  >
                    {isLoading ? (
                      <Clock className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="mr-1 h-3 w-3" />
                    )}
                    Generate
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs">
                      ID: {node.id}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      Path: {node.path}
                    </DropdownMenuItem>
                    {addresses && (
                      <DropdownMenuItem className="text-xs">
                        Address: {addresses.nodeContent()}
                      </DropdownMenuItem>
                    )}
                    {validationErrors.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleApplyFixes}>
                          <Settings className="mr-2 h-4 w-4" />
                          Apply Fixes
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Node
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Node</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this node? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 border border-destructive/50 rounded-md bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Validation Issues</h4>
                  <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        • {error.message || `Error in ${error.field_ref}`}
                      </p>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyFixes}
                    className="mt-2"
                  >
                    Apply Suggested Fixes
                  </Button>
                </div>
              )}
              
              {renderContent()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}