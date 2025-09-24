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
  GripVertical,
  Trash2,
  Plus,
  Upload
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import SystematicFieldRenderer from './SystematicFieldRenderer';
import { useNodeState } from '@/hooks/useNodeState';
import { useDependencies } from '@/hooks/useDependencies';
import { JobNode } from '@/hooks/useJobs';

interface SystematicNodeRendererProps {
  node: JobNode;
  onUpdate: (nodeId: string, content: any) => Promise<void>;
  mode?: 'idle' | 'edit';
  onModeChange?: (mode: 'idle' | 'edit') => void;
  className?: string;
}

export default function SystematicNodeRenderer({
  node,
  onUpdate,
  mode: externalMode,
  onModeChange,
  className
}: SystematicNodeRendererProps) {
  const { toast } = useToast();
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const mode = externalMode || internalMode;
  const setMode = onModeChange || setInternalMode;

  const {
    nodeContent,
    updateField,
    hasUnsavedChanges,
    isAutoSaving,
    fieldErrors
  } = useNodeState(node, onUpdate);

  const {
    isBlocked,
    unmetDependencies,
    canGenerate,
    canValidate
  } = useDependencies(node);

  // Get node metadata
  const label = nodeContent?.label?.fallback || nodeContent?.label?.key || node.path;
  const description = nodeContent?.description?.fallback || nodeContent?.description?.key || '';
  const lastUpdated = node.user_data?.updated_at || node.updated_at;
  const hasGenerateAction = Boolean(node.library_id); // Simplified check
  const hasValidateAction = Boolean(node.library_id); // Simplified check

  // Persist collapse state per addr
  const collapseKey = `node-collapsed-${node.path}`;
  
  useEffect(() => {
    const stored = localStorage.getItem(collapseKey);
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored));
    }
  }, [collapseKey]);

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem(collapseKey, JSON.stringify(collapsed));
  }, [collapseKey]);

  // Check if all field values are empty (for empty state)
  const isEmptyNode = useCallback(() => {
    if (node.node_type !== 'form' || !nodeContent?.items) return false;
    
    return nodeContent.items.every((item: any) => {
      if (item.kind === 'SectionItem') return true; // Skip sections
      if (item.kind === 'FieldItem') {
        const value = item.value;
        return !value || 
               (typeof value === 'string' && value.trim() === '') ||
               (Array.isArray(value) && value.length === 0);
      }
      return true;
    });
  }, [node.node_type, nodeContent]);

  const handleGenerate = useCallback(async () => {
    try {
      setIsSaving(true);
      // TODO: Implement generate action via edge function
      toast({
        title: "Generate started",
        description: "Generation in progress...",
      });
    } catch (error) {
      toast({
        title: "Generate failed",
        description: "Failed to start generation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  const handleValidate = useCallback(async () => {
    try {
      setIsSaving(true);
      // TODO: Implement validate action via edge function
      toast({
        title: "Validation started", 
        description: "Validating fields...",
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Failed to validate fields",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'idle' ? 'edit' : 'idle';
    setMode(newMode);
  }, [mode, setMode]);

  const renderFormContent = () => {
    if (!nodeContent?.items) return null;

    return (
      <div className="space-y-6">
        {nodeContent.items.map((item: any, index: number) => {
          if (item.kind === 'SectionItem') {
            return (
              <Collapsible key={item.ref || index} defaultOpen={!item.collapsed}>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                  <div>
                    <h4 className="font-medium">{item.label?.fallback || item.ref}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description.fallback}
                      </p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="space-y-4 pl-4">
                    {/* Render fields within this section */}
                    {nodeContent.items
                      .filter((subItem: any) => subItem.path?.startsWith(item.path))
                      .filter((subItem: any) => subItem.kind === 'FieldItem')
                      .map((fieldItem: any, fieldIndex: number) => (
                        <SystematicFieldRenderer
                          key={fieldItem.ref || fieldIndex}
                          field={{
                            id: fieldItem.ref,
                            widget: fieldItem.widget || 'text',
                            datatype: fieldItem.datatype || 'text',
                            ui: fieldItem.ui,
                            rules: fieldItem.rules,
                            options: fieldItem.options,
                            default_value: fieldItem.default_value
                          }}
                          value={fieldItem.value}
                          onChange={(newValue) => updateField(fieldItem.ref, newValue)}
                        />
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          if (item.kind === 'FieldItem') {
            return (
              <SystematicFieldRenderer
                key={item.ref || index}
                field={{
                  id: item.ref,
                  widget: item.widget || 'text',
                  datatype: item.datatype || 'text',
                  ui: item.ui,
                  rules: item.rules,
                  options: item.options,
                  default_value: item.default_value
                }}
                value={item.value}
                onChange={(newValue) => updateField(item.ref, newValue)}
              />
            );
          }

          return null;
        })}
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

  const renderContent = () => {
    // Show empty state if all fields are empty and has generate action
    if (mode === 'idle' && isEmptyNode() && hasGenerateAction) {
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
              disabled={!canGenerate || isSaving}
              className="mt-4"
            >
              {isSaving ? (
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

    if (hasUnsavedChanges || isAutoSaving) {
      badges.push(
        <Badge key="saving" variant="secondary" className="gap-1">
          <Clock className="h-3 w-3 animate-spin" />
          {isAutoSaving ? 'Saving...' : 'Unsaved'}
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

    return badges;
  };

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <Collapsible open={!isCollapsed} onOpenChange={handleCollapseChange}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
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

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Type: {node.node_type}
                  </span>
                  {lastUpdated && (
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-muted-foreground">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMode}
                  className="h-8"
                >
                  {mode === 'edit' ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Done
                    </>
                  ) : (
                    <>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </>
                  )}
                </Button>

                {mode === 'edit' && hasValidateAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidate}
                    disabled={!canValidate || isSaving}
                    className="h-8"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Validate
                  </Button>
                )}

                {hasGenerateAction && !isEmptyNode() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={!canGenerate || isSaving}
                    className="h-8"
                  >
                    <Play className="mr-1 h-3 w-3" />
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
                      Path: {node.path}
                    </DropdownMenuItem>
                    {node.arrangeable && (
                      <DropdownMenuItem>
                        <GripVertical className="mr-2 h-4 w-4" />
                        Reorder
                      </DropdownMenuItem>
                    )}
                    {node.removable && (
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderContent()}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}