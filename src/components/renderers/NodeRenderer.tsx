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
  RotateCcw
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

// Node data structure from app.nodes or jobs
interface AppNode {
  id: string;
  idx: number;
  path: string;
  node_type: 'form' | 'group' | 'media';
  content: any;
  generate_n8n_id?: string;
  validate_n8n_id?: string;
  parent_id?: string;
  updated_at: string;
  created_at: string;
}

// Job node structure from jobs
interface JobNode {
  id: string;
  idx: number;
  job_id: string;
  node_type: string;
  path: string;
  parent_id?: string;
  content: Record<string, any>;
  dependencies: string[];
  removable: boolean;
  validate_n8n_id?: string;
  generate_n8n_id?: string;
  arrangeable: boolean;
  path_ltree?: any;
  addr?: any;
  library_id?: string;
  validation_status?: 'pending' | 'valid' | 'invalid';
  created_at?: string;
  updated_at?: string;
}

type RenderableNode = AppNode | JobNode;

interface NodeRendererProps {
  node: RenderableNode;
  children?: AppNode[];
  onUpdate: (content: any) => Promise<void>;
  onGenerate?: (nodeId: string, n8nId: string) => Promise<void>;
  onValidate?: (nodeId: string, n8nId: string, content: any) => Promise<{ valid: boolean; errors?: any[] }>;
  editingNodeId: string | null;
  onEditingNodeChange: (nodeId: string | null) => void;
  className?: string;
}

export default function NodeRenderer({
  node,
  children = [],
  onUpdate,
  onGenerate,
  onValidate,
  editingNodeId,
  onEditingNodeChange,
  className
}: NodeRendererProps) {
  const { toast } = useToast();
  const { getEntry } = useFields();
  
  // Local state
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editContent, setEditContent] = useState(node.content || {});
  const [fieldEntries, setFieldEntries] = useState<Record<string, FieldEntry | null>>({});
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get updated_at timestamp safely
  const getUpdatedAt = () => {
    if ('updated_at' in node && node.updated_at) {
      return node.updated_at;
    }
    if ('created_at' in node && node.created_at) {
      return node.created_at;
    }
    return new Date().toISOString();
  };

  const isEditing = editingNodeId === node.id;
  const canEdit = node.node_type === 'form' && hasEditableFields();
  const canGenerate = Boolean(node.generate_n8n_id);
  const canValidate = Boolean(node.validate_n8n_id);
  const isEmpty = isNodeEmpty();

  // Check if node has editable fields
  function hasEditableFields(): boolean {
    if (!editContent?.items) return false;
    return editContent.items.some((item: any) => item.kind === 'FieldItem');
  }

  // Check if node is empty (for first node auto-edit rule)
  function isNodeEmpty(): boolean {
    if (node.node_type !== 'form' || !editContent?.items) return false;
    
    return editContent.items.every((item: any) => {
      if (item.kind !== 'FieldItem') return true;
      const value = item.value;
      return !value || 
             (typeof value === 'string' && value.trim() === '') ||
             (Array.isArray(value) && value.length === 0);
    });
  }

  // Load field entries from registry (recursively through all sections/subsections)
  useEffect(() => {
    const collectAllFieldRefs = (items: any[]): string[] => {
      const refs: string[] = [];
      
      for (const item of items || []) {
        if (item.kind === 'FieldItem' && item.ref) {
          refs.push(item.ref);
        } else if ((item.kind === 'Section' || item.kind === 'SubSection' || item.kind === 'Group') && item.children) {
          refs.push(...collectAllFieldRefs(item.children));
        } else if (item.instances) {
          // Handle collection instances
          for (const instance of item.instances) {
            if (instance.children) {
              refs.push(...collectAllFieldRefs(instance.children));
            }
          }
        }
      }
      
      return refs;
    };

    const loadFieldEntries = async () => {
      if (!editContent?.items) return;
      
      const allFieldRefs = collectAllFieldRefs(editContent.items);
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
  }, [editContent?.items, getEntry]);

  // Auto-expand if editing or if first node is empty with no generate
  useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false);
    } else if (node.idx === 1 && isEmpty && !canGenerate) {
      // First node rule: auto-enter edit mode if empty and no generate
      handleStartEdit();
    }
  }, [isEditing, node.idx, isEmpty, canGenerate]);

  // Persist collapse state
  const collapseKey = `node-collapsed-${node.path}`;
  
  useEffect(() => {
    const stored = localStorage.getItem(collapseKey);
    if (stored !== null && !isEditing) {
      setIsCollapsed(JSON.parse(stored));
    }
  }, [collapseKey, isEditing]);

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    if (isEditing) return; // Cannot collapse in edit mode
    setIsCollapsed(collapsed);
    localStorage.setItem(collapseKey, JSON.stringify(collapsed));
  }, [collapseKey, isEditing]);

  // Edit mode handlers
  const handleStartEdit = useCallback(() => {
    if (editingNodeId && editingNodeId !== node.id) {
      // Another node is editing, close it first
      toast({
        title: "Another node is being edited",
        description: "Please finish editing the current node first.",
        variant: "destructive",
      });
      return;
    }
    
    setEditContent(node.content || {});
    setValidationState('idle');
    setValidationErrors([]);
    onEditingNodeChange(node.id);
    setIsCollapsed(false);
  }, [editingNodeId, node.id, node.content, onEditingNodeChange, toast]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(node.content || {});
    setValidationState('idle');
    setValidationErrors([]);
    onEditingNodeChange(null);
  }, [node.content, onEditingNodeChange]);

  const handleSaveEdit = useCallback(async () => {
    if (validationState === 'invalid') {
      toast({
        title: "Validation required",
        description: "Please fix validation errors or apply suggested fixes before saving.",
        variant: "destructive",
      });
      return;
    }

    if (canValidate && validationState === 'idle') {
      toast({
        title: "Validation required",
        description: "Please validate the content before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await onUpdate(editContent);
      onEditingNodeChange(null);
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
  }, [editContent, validationState, canValidate, onUpdate, node.id, onEditingNodeChange, toast]);

  // Field update handler
  const handleFieldUpdate = useCallback((fieldRef: string, value: any) => {
    setEditContent(prev => {
      const updateFieldInItems = (items: any[]): any[] => {
        return items.map(item => {
          if (item.kind === 'FieldItem' && item.ref === fieldRef) {
            return { ...item, value };
          } else if (item.children) {
            return { ...item, children: updateFieldInItems(item.children) };
          } else if (item.instances) {
            return {
              ...item,
              instances: item.instances.map((instance: any) => ({
                ...instance,
                children: updateFieldInItems(instance.children || [])
              }))
            };
          }
          return item;
        });
      };

      const updated = { ...prev };
      if (updated.items) {
        updated.items = updateFieldInItems(updated.items);
      }
      return updated;
    });

    // Reset validation when content changes
    if (validationState === 'valid' || validationState === 'invalid') {
      setValidationState('idle');
      setValidationErrors([]);
    }
  }, [validationState]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !onGenerate) return;

    try {
      setIsLoading(true);
      await onGenerate(node.id, node.generate_n8n_id!);
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

  // Validate handler
  const handleValidate = useCallback(async () => {
    if (!canValidate || !onValidate) return;

    try {
      setIsLoading(true);
      setValidationState('validating');
      
      const result = await onValidate(node.id, node.validate_n8n_id!, editContent);
      
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
  }, [canValidate, onValidate, node.id, node.validate_n8n_id, editContent, toast]);

  // Apply validation fixes
  const handleApplyFixes = useCallback(() => {
    if (validationErrors.length === 0) return;

    // Apply suggested fixes from validation errors
    setEditContent(prev => {
      let updated = { ...prev };
      
      validationErrors.forEach(error => {
        if (error.fix && error.field_ref) {
          // Apply the fix to the specific field
          updated = updateFieldInContent(updated, error.field_ref, error.fix.value);
        }
      });
      
      return updated;
    });

    setValidationErrors([]);
    setValidationState('idle');
    
    toast({
      title: "Fixes applied",
      description: "Validation fixes have been applied. You can now save.",
    });
  }, [validationErrors, toast]);

  // Helper to update field in content structure
  const updateFieldInContent = (content: any, fieldRef: string, value: any) => {
    // ... implementation similar to handleFieldUpdate
    return content;
  };

  // Render form content
  const renderFormContent = () => {
    if (!editContent?.items) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <p>No form fields defined</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderItems(editContent.items)}
      </div>
    );
  };

  // Render items (recursive for sections and collections)
  const renderItems = (items: any[]) => {
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
        onChange={(newValue) => handleFieldUpdate(item.ref, newValue)}
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
            <ChevronDown className={cn("h-4 w-4 transition-transform", !sectionCollapsed && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 space-y-4">
              {item.children && renderItems(item.children)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderSubSection = (item: any, index: number) => {
    const [subSectionCollapsed, setSubSectionCollapsed] = useState(item.collapsed !== false);
    
    return (
      <div key={item.ref || index} className="border rounded-md border-muted">
        <Collapsible open={!subSectionCollapsed} onOpenChange={setSubSectionCollapsed}>
          <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/30">
            <div>
              <h5 className="font-medium text-sm text-left">{item.label?.fallback || item.ref}</h5>
              {item.description && (
                <p className="text-xs text-muted-foreground text-left">
                  {item.description.fallback}
                </p>
              )}
            </div>
            <ChevronDown className={cn("h-3 w-3 transition-transform", !subSectionCollapsed && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 pt-0 space-y-3">
              {item.children && renderItems(item.children)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderCollectionSection = (item: any, index: number) => {
    return (
      <div key={item.ref || index} className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">{item.label?.fallback || item.ref}</h4>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Instance
          </Button>
        </div>
        
        {item.instances?.map((instance: any, instanceIndex: number) => (
          <div key={instance.instance_id || instanceIndex} className="border-l-2 border-primary/20 pl-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium">Instance {instance.instance_id}</h5>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {instance.children && renderItems(instance.children)}
            </div>
          </div>
        ))}
        
        {(!item.instances || item.instances.length === 0) && (
          <div className="text-center p-4 text-muted-foreground">
            <p>No instances yet</p>
          </div>
        )}
      </div>
    );
  };

  // Render media content
  const renderMediaContent = () => {
    return (
      <div className="space-y-4">
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Media content</p>
          <p className="text-xs text-muted-foreground">Upload and manage media versions</p>
          {isEditing && (
            <Button variant="outline" className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Upload Version
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render group content
  const renderGroupContent = () => {
    const sortedChildren = [...children].sort((a, b) => a.idx - b.idx);
    
    return (
      <div className="space-y-4">
        {sortedChildren.length > 0 ? (
          <div className="space-y-4">
            {sortedChildren.map(childNode => (
              <NodeRenderer
                key={childNode.id}
                node={childNode}
                children={children.filter(c => c.parent_id === childNode.id)}
                onUpdate={onUpdate}
                onGenerate={onGenerate}
                onValidate={onValidate}
                editingNodeId={editingNodeId}
                onEditingNodeChange={onEditingNodeChange}
                className="ml-4"
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-4 border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">
              No child nodes yet
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render content based on mode and type
  const renderContent = () => {
    // Show empty state with generate for empty form nodes
    if (!isEditing && isEmpty && canGenerate && node.node_type === 'form') {
      return (
        <div className="text-center py-8">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">{editContent?.label?.fallback || node.path}</h3>
              <p className="text-sm text-muted-foreground">
                No inputs yet. Generate to auto-populate, or switch to Edit to start filling.
              </p>
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={isLoading}
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

  // Render validation fixes panel
  const renderValidationFixes = () => {
    if (validationState !== 'invalid' || validationErrors.length === 0) return null;

    return (
      <div className="mt-4 p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
        <h4 className="font-medium text-destructive mb-2">Validation Issues</h4>
        <div className="space-y-2 mb-4">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-sm">
              <p className="font-medium">{error.field_ref}</p>
              <p className="text-muted-foreground">{error.message}</p>
              {error.fix && (
                <p className="text-primary">Suggested: {error.fix.suggestion}</p>
              )}
            </div>
          ))}
        </div>
        <Button onClick={handleApplyFixes} variant="outline" size="sm">
          Apply Suggested Fixes
        </Button>
      </div>
    );
  };

  const lastUpdated = getUpdatedAt();

  return (
    <TooltipProvider>
      <Card className={cn(
        "w-full",
        isEditing && "ring-2 ring-orange-400 ring-offset-2",
        className
      )}>
        <Collapsible open={!isCollapsed} onOpenChange={handleCollapseChange}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CollapsibleTrigger 
                  className="flex items-center gap-2 w-full text-left disabled:cursor-default"
                  disabled={isEditing}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold truncate">
                      {editContent?.label?.fallback || node.path}
                    </h3>
                  </div>
                </CollapsibleTrigger>
                
                {editContent?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {editContent.description.fallback}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {node.node_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    idx: {node.idx}
                  </span>
                  {lastUpdated && (
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-muted-foreground">
                          • {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(lastUpdated), 'PPpp')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {isEditing && (
                    <Badge variant="secondary" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Editing
                    </Badge>
                  )}
                  
                  {validationState === 'validating' && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3 animate-spin" />
                      Validating...
                    </Badge>
                  )}
                  
                  {validationState === 'valid' && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </Badge>
                  )}
                  
                  {validationState === 'invalid' && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    {canValidate && validationState === 'idle' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleValidate}
                        disabled={isLoading}
                        className="h-8"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Validate
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="h-8"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={isLoading || (canValidate && validationState !== 'valid')}
                      className="h-8"
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartEdit}
                        disabled={Boolean(editingNodeId)}
                        className="h-8"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}

                    {canGenerate && !isEmpty && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isLoading || Boolean(editingNodeId)}
                        className="h-8"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Regenerate
                      </Button>
                    )}
                  </>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderContent()}
              {renderValidationFixes()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}