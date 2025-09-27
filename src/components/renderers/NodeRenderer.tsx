// src/components/renderers/NodeRenderer.tsx
/**
 * NodeRenderer — SSOT-compliant, now the only orchestrator.
 * - Renders form tree (sections, nesting, collections) recursively
 * - Uses FieldRenderer for all fields
 * - Node-level Edit/Save only
 */

import React, { useState, useEffect, Fragment, useRef, useMemo } from 'react';
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

const saveViaRpc = async (jobId: string, writes: Array<{ address: string; value: any }>) => {
  nlog('saveViaRpc:start', { jobId, count: writes.length, sample: writes.slice(0, 3) });
  // TODO: Implement proper RPC call or use edge function
  // For now, log the writes that would be made
  console.log('Would save writes:', writes);
  nlog('saveViaRpc:ok', { count: writes.length });
};


// normalize writes: ensure `value` is JSON-serializable and never `undefined`
function toWritesArray(entries: Array<{ address: string; value: any }>, nodeAddr: string) {
  const prefix = `${nodeAddr}#`;
  return entries
    .filter(e => typeof e?.address === 'string' && e.address.startsWith(prefix))
    .map(e => ({
      address: e.address,
      value: e.value === undefined ? null : JSON.parse(JSON.stringify(e.value, (_k, v) => (v === undefined ? null : v)))
    }));
}

// inside NodeRenderer.tsx (near other helpers)
function getSelectedMediaVersion(content: any) {
  const versions = Array.isArray(content?.versions) ? content.versions : [];
  if (versions.length === 0) return { versions, selectedIdx: null, selected: null };
  const sel = Number.isInteger(content?.selected_version_idx) ? content.selected_version_idx : 1;
  const selected = versions.find((v: any) => v?.idx === sel) ?? versions[0];
  return { versions, selectedIdx: selected?.idx ?? 1, selected };
}




function renderMediaContent(
  node: any,
  isEditing: boolean,
  draftContent: any,
  setDraftContent: (c:any)=>void,
  nodeAddr: string,
  setDraft: (address: string, value: any) => void,
  markDirty: () => void
) {
  const content = draftContent ?? node.content ?? {};
  const type = content?.type; // "image" | "video" | "audio"
  const { versions, selectedIdx, selected } = getSelectedMediaVersion(content);

 if (!selected?.item) {
  return <div className="text-sm text-muted-foreground">
    No media yet. Use <strong>Generate</strong> to create the first version.
  </div>;
}

  const it = selected.item; // SSOT: versions[].item (single item)
  const src = it?.uri ?? it?.url ?? '';
  const poster = it?.poster;

  return (
    <div className="space-y-3">
      {type === 'image' && <img src={src} alt="" className="rounded-lg w-full h-auto" />}
      {type === 'video' && <video src={src} poster={poster} controls className="w-full rounded-lg" />}
      {type === 'audio' && <audio src={src} controls className="w-full" />}

      {isEditing && versions?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {versions
            .slice()
            .sort((a:any,b:any)=>(a.idx??0)-(b.idx??0))
            .map((v:any)=>(
              <button
                key={v.idx}
                type="button"
                className={`px-2 py-1 rounded border ${v.idx===selectedIdx ? 'border-primary' : 'border-muted-foreground/30'}`}
                onClick={() => {
                // SSOT address for the selected version index (root of MediaContent)
                setDraft(`${nodeAddr}#selected_version_idx`, v.idx);
                // reflect immediately in UI
                setDraftContent({ ...content, selected_version_idx: v.idx });
                markDirty();
              }}
              >
                v{v.idx}
              </button>
            ))}
        </div>
      )}
    </div>
  );
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
  const { entries, set: setDraft, clear: clearDrafts } = useDrafts();
  const { reloadNode } = useJobs();
  const { startEditing, stopEditing, isEditing, hasActiveEditor } = useNodeEditor();

  const [internalMode, setInternalMode] = useState<'idle' | 'edit'>('idle');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationState, setValidationState] = useState<'unknown' | 'valid' | 'invalid' | 'validating'>('unknown');
  const [loading, setLoading] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const [contentSnapshot, setContentSnapshot] = useState<any>(node.content); // NEW
  const waitingRealtimeRef = useRef(false);                   // NEW
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null); // NEW



  const effectiveMode = externalMode || internalMode;
  const setEffectiveMode = onModeChange || setInternalMode;

  // convenience: snapshot-based node passed to fields and header
  const nodeForRender = useMemo(
    () => ({ ...node, content: contentSnapshot }),
    [node, contentSnapshot]
  );
  

  const label = nodeForRender.content?.label?.fallback || `Node ${node.addr}`;
  const description = nodeForRender.content?.description?.fallback;

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

// keep snapshot in sync when parent actually provides new content
useEffect(() => {
  setContentSnapshot(node.content);
}, [node.id, node.content]);



  
// realtime subscription for this node id
useEffect(() => {
  if (!node?.id) return;

  if (channelRef.current) {
    supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  }

  const ch = supabase
    .channel(`nodes:${node.id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'app', table: 'nodes', filter: `id=eq.${node.id}` },
      async (_payload) => {
        // fetch fresh content from app.nodes table
        const { data, error } = await supabase
          .schema('app' as any)
          .from('nodes')
          .select('content')
          .eq('id', node.id)
          .single();
        if (!error && data) {
          setContentSnapshot(data.content);
          setRefreshSeq((s) => s + 1);
        } else {
          console.warn('[NodeRenderer] realtime fetch failed', error);
        }
        waitingRealtimeRef.current = false;
      }
    )
    .subscribe((status) => console.debug('[NodeRenderer] realtime:sub', status));

  channelRef.current = ch;

  return () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  };
}, [node.id]);







  // in src/components/renderers/NodeRenderer.tsx
const handleSaveEdit = async () => {
  if (!node.addr) return;
  setLoading(true);
  try {
    const nodePrefix = `${node.addr}#`;

    // gather & normalize drafts
    const rawDrafts = entries(nodePrefix); // [{ address, value }]
    const writes = toWritesArray(rawDrafts, node.addr);
    nlog('save:writes', { count: writes.length, sample: writes.slice(0, 3) });

    if (writes.length === 0) {
      setEffectiveMode('idle');
      stopEditing();
      toast({ title: 'Nothing to save', description: 'No changes detected.' });
      return;
    }

    // single RPC handles 1..N writes atomically
    await saveViaRpc(node.job_id, writes);

    // after: await saveViaRpc(node.job_id, writes);

    clearDrafts(nodePrefix);
    
    // flip UI back to idle
    setEffectiveMode('idle');
    setHasUnsavedChanges(false);
    stopEditing();
    toast({ title: 'Success', description: 'Changes saved successfully' });
    
    waitingRealtimeRef.current = true; // single set

    setTimeout(async () => {
      if (!waitingRealtimeRef.current) return; // realtime already handled it
      console.debug('[NodeRenderer] realtime:timeout → manual RPC fetch');
          const { data, error } = await supabase
            .schema('app' as any)
            .from('nodes')
            .select('content')
            .eq('id', node.id)
            .single();
      if (!error && data) {
            setContentSnapshot(data.content);
            setRefreshSeq((s) => s + 1);
      } else {
        console.warn('[NodeRenderer] manual fetch failed', error);
      }
      waitingRealtimeRef.current = false;
    }, 1500); // a small, deterministic delay is enough now
        


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
    key={`field:${node.id}:${parentPath || ''}:${instanceNum ?? 0}:${field.ref}:${refreshSeq}`}
    node={nodeForRender}
    fieldRef={field.ref}
    sectionPath={parentPath}
    instanceNum={instanceNum}
    mode={effectiveMode}
    required={field.required}
    editable={field.editable !== false}
    onChange={() => setHasUnsavedChanges(true)}
    refreshSeq={refreshSeq}   // <-- new
  />
);


  const renderSection = (section: SectionItem, parentPath?: string, inheritedInstance?: number) => {
    const sectionPath = parentPath ? `${parentPath}.${section.path}` : section.path;
    const title = (section as any).title ?? section.path;
    const isCollection = !!(section as any).collection;

    // Instance count: prefer explicit instances length, else default_instances, else min, else 0
    const explicit = Array.isArray((section as any).instances) ? (section as any).instances.length : undefined;
    const defCount = (section as any).collection?.default_instances;
    const min = (section as any).collection?.min ?? 0;
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
                (section as any).collection?.label_template
                  ? (section as any).collection.label_template.replace('#{i}', String(i))
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
    if (!nodeForRender.content) return <div className="text-center py-8 text-muted-foreground">No content defined</div>;
    if (!ContentValidation.isFormContent(nodeForRender.content)) {
      return <div className="text-muted-foreground p-4 bg-muted/50 rounded">Content type not supported by SSOT renderer</div>;
    }
    const form = nodeForRender.content as FormContent;
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
                  <CreditsButton
                    onClick={handleGenerate}
                    price={generateCost}
                    available={userCredits}
                    loading={loading}
                    size="sm"
                    variant="secondary"
                  >
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
            {node.node_type === 'form'
              ? renderFormContent()
              : node.node_type === 'media'
              ? renderMediaContent(
                  node,
                  effectiveMode === 'edit',
                  contentSnapshot,
                  (next: any) => setContentSnapshot(next),
                  node.addr,
                  setDraft,
                  () => setHasUnsavedChanges(true)
                )
              : (
                <div className="text-muted-foreground">
                  Node type '{node.node_type}' not supported by SSOT renderer.
                </div>
              )
            }


          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
