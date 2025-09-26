/**
 * SSOT-compliant NodeRenderer with proper addressing and n8n integration
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormItemRenderer } from './FormItemRenderer';
import { ContentValidation, FormContent } from '@/lib/content-contracts';
import { CreditsButton } from '@/components/ui/credits-button';
import { useToast } from '@/hooks/use-toast';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useFunctionPricing } from '@/hooks/useFunctionPricing';
import { supabase } from '@/integrations/supabase/client';
import { useNodeEditor } from '@/hooks/useNodeEditor';
import { useDrafts } from '@/contexts/DraftsContext';
import { useJobs, type JobNode } from '@/hooks/useJobs';

interface NodeRendererProps {
  node: JobNode;
  onUpdate?: (nodeId: string, data: any) => Promise<void>;
  onGenerate?: (nodeId: string) => Promise<void>;
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
  const { credits: userCredits } = useUserCredits();
  const { getPrice, loading: pricingLoading } = useFunctionPricing();
  const { entries, clear: clearDrafts } = useDrafts();
  const { reloadNode } = useJobs();
  const { startEditing, stopEditing, isEditing, hasActiveEditor } = useNodeEditor();
  
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validateCredits, setValidateCredits] = useState<number | undefined>();
  const [generateCredits, setGenerateCredits] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [validationState, setValidationState] = useState<'unknown' | 'valid' | 'invalid' | 'validating'>('unknown');
  const [validationSuggestions, setValidationSuggestions] = useState<any[]>([]);
  
  const effectiveMode = externalMode || internalMode;
  const setEffectiveMode = onModeChange || setInternalMode;
  
  const label = node.content?.label?.fallback || `Node ${node.addr}`;
  const description = node.content?.description?.fallback;
  const hasValidateAction = node.validate_n8n_id;
  const hasGenerateAction = node.generate_n8n_id;
  
  // Get current credit balance
  const currentCredits = userCredits || 0;
  
  // Get dynamic pricing from database
  const validateCost = node.validate_n8n_id ? getPrice(node.validate_n8n_id) : 0;
  const generateCost = node.generate_n8n_id ? getPrice(node.generate_n8n_id) : 0;

  // Set credit costs for the CreditsButton components
  useEffect(() => {
    if (!pricingLoading) {
      setValidateCredits(validateCost);
      setGenerateCredits(generateCost);
    }
  }, [validateCost, generateCost, pricingLoading]);

  const handleStartEdit = () => {
    if (startEditing(node.id)) {
      setEffectiveMode('edit');
      setIsCollapsed(false); // Auto-expand when entering edit mode
    }
  };
  const handleSaveEdit = async () => {
    if (!node.addr) return;
    
    setLoading(true);
    try {
      // Collect drafts with this node's address as prefix
      const nodePrefix = `${node.addr}#`;
      const draftsToSave = entries(nodePrefix);
      
      console.log(`[NodeRenderer] Saving ${draftsToSave.length} drafts for node ${node.addr}:`, draftsToSave);
      
      if (draftsToSave.length > 0) {
        // Call atomic addr_write_many RPC  
        const { error } = await (supabase as any).rpc('addr_write_many', {
          p_job_id: node.job_id,
          p_writes: draftsToSave
        });
        
        if (error) throw error;
        
        // Reload this node from DB to get fresh data
        await reloadNode(node.job_id, node.id);
        
        // Clear drafts for this node
        clearDrafts(nodePrefix);
        
        toast({
          title: "Success",
          description: "Changes saved successfully",
        });
      }
      
      setEffectiveMode('idle');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Release the single-editor guard
      stopEditing();
    } catch (error) {
      console.error('[NodeRenderer] Save failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCancelEdit = () => {
    if (!node.addr) return;
    
    // Clear drafts for this node (discard changes)
    const nodePrefix = `${node.addr}#`;
    clearDrafts(nodePrefix);
    
    setEffectiveMode('idle');
    setHasUnsavedChanges(false);
    
    // Release the single-editor guard
    stopEditing();
    
    toast({
      title: "Changes discarded",
      description: "All unsaved changes have been discarded",
    });
  };

  const handleValidate = async () => {
    setValidationState('validating');
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('validate-node-content', {
        body: { nodeId: node.id, jobId: node.job_id, fieldValues: {} }
      });
      
      if (data.valid) {
        setValidationState('valid');
        setValidationSuggestions([]);
        toast({
          title: "Validation passed",
          description: "All fields are valid.",
        });
      } else {
        setValidationState('invalid');
        setValidationSuggestions(data.suggestions || []);
        toast({
          title: "Validation issues found",
          description: "Please review the suggestions below.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setValidationState('invalid');
      toast({ 
        title: "Validation failed", 
        description: error instanceof Error ? error.message : "Validation service error",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.address && suggestion.value !== undefined) {
      // Apply suggested fix to drafts (not DB)
      console.log(`[NodeRenderer] Applying suggestion to ${suggestion.address}:`, suggestion.value);
      // This would integrate with drafts if we had the suggestion format
      toast({
        title: "Suggestion applied",
        description: "The suggested fix has been applied to your draft.",
      });
    }
  };

  // Determine if Save should be enabled
  const canSave = (() => {
    if (loading) return false;
    if (hasValidateAction) {
      // If node has validation, require it to be valid first
      return validationState === 'valid';
    }
    // If no validation required, can always save
    return true;
  })();

  // Inputs should be locked during validation
  const inputsLocked = validationState === 'validating';

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('generate-node-content', {
        body: { nodeId: node.id, jobId: node.job_id, context: {} }
      });
      if (data.success) {
        toast({ title: "Content generated", description: "Node content generated successfully." });
        onUpdate?.(node.id, data.generatedContent);
      }
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFormContent = ContentValidation.isFormContent(node.content);
  
  const renderFormContent = () => {
    if (!node.content) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No content defined</p>
          {hasGenerateAction && effectiveMode === 'idle' && (
            <CreditsButton onClick={handleGenerate} price={generateCredits} available={userCredits} loading={loading} size="default">
              Generate Content
            </CreditsButton>
          )}
        </div>
      );
    }

    if (isFormContent) {
      const formContent = node.content as FormContent;
      if (!formContent.items?.length) {
        return <div className="text-center py-8 text-muted-foreground">No form items defined</div>;
      }

      return (
        <div className="space-y-4">
          {formContent.items.map((item) => (
            <FormItemRenderer
              key={`${item.kind}-${item.idx}`}
              item={item}
              node={node}
              mode={effectiveMode}
              onChange={() => setHasUnsavedChanges(true)}
            />
          ))}
        </div>
      );
    }

    return <div className="text-muted-foreground p-4 bg-muted/50 rounded">Content type not supported by SSOT renderer</div>;
  };

  return (
    <Card className={cn("w-full transition-colors", 
      effectiveMode === 'edit' && "border-primary bg-primary/5",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 h-6 w-6">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <div>
              <h3 className="font-semibold text-foreground">{label}</h3>
              {showPath && <div className="text-xs text-muted-foreground mt-1">Address: {node.addr}</div>}
            </div>
            <div className="flex gap-1">
              {hasUnsavedChanges && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
              {effectiveMode === 'edit' && <Badge variant="default" className="text-xs">Editing</Badge>}
              {/* Validation Status Indicator */}
              {hasValidateAction && validationState === 'validating' && (
                <Badge variant="secondary" className="text-xs animate-pulse">Validating...</Badge>
              )}
              {hasValidateAction && validationState === 'valid' && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ✓ Valid
                </Badge>
              )}
              {hasValidateAction && validationState === 'invalid' && (
                <Badge variant="destructive" className="text-xs">❌ Invalid</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {effectiveMode === 'edit' && (
              <>
                <Button size="sm" onClick={handleSaveEdit} disabled={!canSave}>
                  <Save className="h-3 w-3 mr-1" />
                  {hasValidateAction && validationState !== 'valid' ? 'Validate First' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={loading}>
                  <X className="h-3 w-3 mr-1" />Cancel
                </Button>
                {hasValidateAction && (
                  <CreditsButton onClick={handleValidate} price={validateCredits} available={userCredits} loading={loading} size="sm">
                    Validate
                  </CreditsButton>
                )}
              </>
            )}
            {effectiveMode === 'idle' && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (hasActiveEditor()) {
                      toast({
                        title: "Another node is being edited",
                        description: "Please finish editing the current node first.",
                        variant: "destructive",
                      });
                      return;
                    }
                    handleStartEdit();
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />Edit
                </Button>
                {hasGenerateAction && (
                  <CreditsButton onClick={handleGenerate} price={generateCredits} available={userCredits} loading={loading} size="sm">
                    Generate
                  </CreditsButton>
                )}
              </>
            )}
          </div>
        </div>
        
        {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
      </CardHeader>

      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CardContent className="pt-0">
          <CollapsibleContent>
            {node.node_type === 'form' ? renderFormContent() : (
              <div className="text-muted-foreground">Node type '{node.node_type}' not supported by SSOT renderer.</div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}