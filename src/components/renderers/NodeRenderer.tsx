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
import type { JobNode } from '@/hooks/useJobs';

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
  
  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validateCredits, setValidateCredits] = useState<number | undefined>();
  const [generateCredits, setGenerateCredits] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  
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

  const handleStartEdit = () => setEffectiveMode('edit');
  const handleSaveEdit = () => {
    setEffectiveMode('idle');
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };
  const handleCancelEdit = () => {
    setEffectiveMode('idle');
    setHasUnsavedChanges(false);
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('validate-node-content', {
        body: { nodeId: node.id, jobId: node.job_id, fieldValues: {} }
      });
      toast({
        title: data.valid ? "Validation passed" : "Validation issues found",
        description: data.suggestions?.general || (data.valid ? "All fields are valid." : "Please review inputs."),
        variant: data.valid ? "default" : "destructive"
      });
    } catch (error) {
      toast({ title: "Validation failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
            <CreditsButton onClick={handleGenerate} credits={generateCredits} loading={loading} size="default">
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
    <Card className={cn("w-full", className)}>
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
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {effectiveMode === 'edit' && (
              <>
                <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                  <Save className="h-3 w-3 mr-1" />Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={loading}>
                  <X className="h-3 w-3 mr-1" />Cancel
                </Button>
                {hasValidateAction && (
                  <CreditsButton onClick={handleValidate} credits={validateCredits} loading={loading} size="sm">
                    Validate
                  </CreditsButton>
                )}
              </>
            )}
            {effectiveMode === 'idle' && (
              <>
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  <Edit2 className="h-3 w-3 mr-1" />Edit
                </Button>
                {hasGenerateAction && (
                  <CreditsButton onClick={handleGenerate} credits={generateCredits} loading={loading} size="sm">
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