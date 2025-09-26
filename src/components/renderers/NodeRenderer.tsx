// src/components/renderers/NodeRenderer.tsx
/**
 * NodeRenderer — SSOT-compliant, now the only orchestrator.
 * - Renders form tree (sections, nesting, collections) recursively
 * - Uses FieldRenderer for all fields
 * - Node-level Edit/Save only
 */
import React, { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
// at top
import { FieldRenderer } from '@/components/renderers/FieldRenderer'; // ✅
import { ContentValidation, FormContent, FormItem, FieldItem, SectionItem } from '@/lib/content-contracts';
import { CreditsButton } from '@/components/ui/credits-button';
import { useToast } from '@/hooks/use-toast';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useFunctionPricing } from '@/hooks/useFunctionPricing';
import { supabase } from '@/integrations/supabase/client';
import { useNodeEditor } from '@/hooks/useNodeEditor';
import { useDrafts } from '@/contexts/DraftsContext';
import { useJobs, type JobNode } from '@/hooks/useJobs';

const DBG = true;
const nlog = (...a:any[]) => { if (DBG) console.debug('[NodeRenderer]', ...a); };

// normalize writes: ensure `value` is JSON-serializable and never `undefined`
function toWritesArray(entries: Array<{ address: string; value: any }>, nodeAddr: string) {
  const prefix = `${nodeAddr}#`;
  return entries
    .filter(e => typeof e?.address === 'string' && e.address.startsWith(prefix))
    .map(e => ({
      address: e.address,
      // strip functions/symbols and turn undefined → null to keep JSON clean
      value: e.value === undefined ? null : JSON.parse(JSON.stringify(e.value, (_k, v) => (v === undefined ? null : v)))
    }));
}



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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationState, setValidationState] = useState<'unknown' | 'valid' | 'invalid' | 'validating'>('unknown');
  const [loading, setLoading] = useState(false);

  const effectiveMode = externalMode || internalMode;
  const setEffectiveMode = onModeChange || setInternalMode;

  const label = node.content?.label?.fallback || `Node ${node.addr}`;
  const description = node.content?.description?.fallback;
  const hasValidateAction = node.validate_n8n_id;
  const hasGenerateAction = node.generate_n8n_id;

  // Pricing
  const validateCost = node.validate_n8n_id ? getPrice(node.validate_n8n_id) : 0;
  const generateCost = node.generate_n8n_id ? getPrice(node.generate_n8n_id) : 0;
  useEffect(() => {}, [validateCost, generateCost, pricingLoading]);

  const handleStartEdit = () => {
    if (startEditing(node.id)) {
      setEffectiveMode('edit');
      setIsCollapsed(false);
    }
  };

  // Read and print the Edge Function error body if present
async function logFunctionsError(where: string, err: any) {
  const resp = (err as any)?.context;
  let bodyText: string | null = null;
  try {
    if (resp && typeof resp.text === 'function') {
      bodyText = await resp.text();
    }
  } catch {}
  console.error(`[NodeRenderer] ${where}:error`, {
    message: (err as any)?.message,
    name: (err as any)?.name,
    status: (resp as any)?.status,
    body: bodyText
  });
}

const saveViaEdgeMany = async (jobId: string, writes: Array<{ address: string; value: any }>) => {
  nlog('write_many:start', { jobId, count: writes.length, sample: writes.slice(0, 3) });
  const { data, error } = await supabase.functions.invoke('ltree-resolver', {
    body: {
      operation: 'write_many',
      job_id: jobId,
      writes,
      create_missing: true,   // ← important: let the server create missing json path keys
      strict: false           // ← optional: server may accept this to skip invalid paths
    }
  });

  if (error) {
    await logFunctionsError('write_many', error);
    throw error;
  }
  if (!data?.success) {
    console.error('[NodeRenderer] write_many:failed', data);
    throw new Error(data?.error || 'ltree-resolver write_many failed');
  }
  nlog('write_many:ok', data);
};

const saveViaEdgeSingle = async (jobId: string, address: string, value: any) => {
  const body = {
    operation: 'set',
    job_id: jobId,
    address,
    value: value === undefined ? null : value,
    create_missing: true,
  };
  const { data, error } = await supabase.functions.invoke('ltree-resolver', { body });
  if (error) {
    await logFunctionsError('set', error);
    throw error;
  }
  if (!data?.success) {
    console.error('[NodeRenderer] set:failed', { address, data });
    throw new Error(data?.error || 'ltree-resolver set failed');
  }
};



  const handleSaveEdit = async () => {
    if (!node.addr) return;
    setLoading(true);
    try {
      const nodePrefix = `${node.addr}#`;

      // gather & clean
      const rawDrafts = entries(nodePrefix); // [{ address, value }]
      const writes = toWritesArray(rawDrafts, node.addr);
      nlog('save:writes', { count: writes.length, sample: writes.slice(0, 3) });
      
      // sanity: if anything slips through with a wrong prefix, we’d catch it here
      if (writes.some(w => !w.address.startsWith(nodePrefix))) {
        console.warn('[NodeRenderer] writes contain wrong node prefix', { nodePrefix, writes });
      }
      
      if (writes.length === 0) {
        setEffectiveMode('idle');
        stopEditing();
        toast({ title: 'Nothing to save', description: 'No changes detected.' });
        return;
      }
      
      try {
        await saveViaEdgeMany(node.job_id, writes);
      } catch (e) {
        console.warn('[NodeRenderer] write_many failed, falling back to per-set', e);
        for (const w of writes) {
          await saveViaEdgeSingle(node.job_id, w.address, w.value);
        }
      }
      
      await reloadNode(node.job_id, node.id);
      clearDrafts(nodePrefix);
      setEffectiveMode('idle');
      setHasUnsavedChanges(false);
      stopEditing();
      toast({ title: 'Success', description: 'Changes saved successfully' });

      }


      setEffectiveMode('idle');
      setHasUnsavedChanges(false);
      stopEditing();
    } catch (error) {
      console.error('[NodeRenderer] Save failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!node.addr) return;
    clearDrafts(`${node.addr}#`);
    setEffectiveMode('idle');
    setHasUnsavedChanges(false);
    stopEditing();
    toast({ title: 'Changes discarded', description: 'All unsaved changes have been discarded' });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('generate-node-content', {
        body: { nodeId: node.id, jobId: node.job_id, context: {} }
      });
      if (data?.success) {
        toast({ title: 'Content generated', description: 'Node content generated successfully.' });
        onUpdate?.(node.id, data.generatedContent);
      }
    } catch {
      toast({ title: 'Generation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --------- Tree rendering (no extra renderers) ---------
  const renderField = (field: FieldItem, parentPath?: string, instanceNum?: number) => (
    <FieldRenderer
      key={`field:${parentPath || ''}:${instanceNum || 0}:${field.ref}`}
      node={node}
      fieldRef={field.ref}
      sectionPath={parentPath}
      instanceNum={instanceNum}
      mode={effectiveMode}
      required={field.required}
      editable={field.editable !== false}
      onChange={() => setHasUnsavedChanges(true)}
    />
  );

  const renderSection = (section: SectionItem, parentPath?: string, inheritedInstance?: number) => {
    const sectionPath = parentPath ? `${parentPath}.${section.path}` : section.path;
    const title = section.title ?? section.path;
    const isCollection = !!section.collection;

    // Instance count: prefer explicit instances length, else default_instances, else min, else 0
    const explicit = Array.isArray((section as any).instances) ? (section as any).instances.length : undefined;
    const defCount = section.collection?.default_instances;
    const min = section.collection?.min ?? 0;
    const count = isCollection
      ? (explicit ?? (typeof defCount === 'number' && defCount > 0 ? defCount : Math.max(0, min)))
      : 0;

    return (
      <div key={`sec:${sectionPath}`} className="rounded-lg border p-3">
        <div className="font-medium">{title}</div>

        {!isCollection && (
          <div className="mt-3 space-y-3">
            {section.children?.map((child) => (
              ContentValidation.isFieldItem(child)
                ? renderField(child as FieldItem, sectionPath, inheritedInstance)
                : renderSection(child as SectionItem, sectionPath, inheritedInstance)
            ))}
          </div>
        )}

        {isCollection && (
          <div className="mt-3 space-y-4">
            {Array.from({ length: count }).map((_, idx) => {
              const i = idx + 1; // instances.i1...
              const label =
                section.collection?.label_template
                  ? section.collection.label_template.replace('#{i}', String(i))
                  : `Instance ${i}`;

              return (
                <div key={`inst:${sectionPath}:i${i}`} className="rounded-md border p-3">
                  <div className="text-sm font-medium mb-2">{label}</div>
                  <div className="space-y-3">
                    {section.children?.map((child) => (
                      ContentValidation.isFieldItem(child)
                        ? renderField(child as FieldItem, sectionPath, i)
                        : renderSection(child as SectionItem, sectionPath, i)
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFormContent = () => {
    if (!node.content) return <div className="text-center py-8 text-muted-foreground">No content defined</div>;
    if (!ContentValidation.isFormContent(node.content)) {
      return <div className="text-muted-foreground p-4 bg-muted/50 rounded">Content type not supported by SSOT renderer</div>;
    }
    const form = node.content as FormContent;
    if (!form.items?.length) return <div className="text-center py-8 text-muted-foreground">No form items defined</div>;

    return (
      <div className="space-y-4">
        {form.items.map((item: FormItem) => (
          ContentValidation.isFieldItem(item)
            ? renderField(item as FieldItem, undefined, undefined)
            : renderSection(item as SectionItem, undefined, undefined)
        ))}
      </div>
    );
  };

  return (
    <Card className={cn("w-full transition-colors", effectiveMode === 'edit' && "border-primary bg-primary/5", className)}>
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
            {effectiveMode === 'edit' ? (
              <>
                <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={loading}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </>
            ) : (
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
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
                {hasGenerateAction && (
                  <CreditsButton onClick={handleGenerate} price={generateCost} available={userCredits} loading={loading} size="sm">
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
