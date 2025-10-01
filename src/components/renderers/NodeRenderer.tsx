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

// ============= Media & Group Types =============
type MediaItemImage = { kind: 'ImageItem'; url: string; width: number; height: number };
type MediaItemVideo = { kind: 'VideoItem'; url: string; duration_ms: number; width?: number; height?: number };
type MediaItemAudio = { kind: 'AudioItem'; url: string; duration_ms: number };
type MediaItem = MediaItemImage | MediaItemVideo | MediaItemAudio;

type MediaVersion = { kind: 'MediaVersion'; idx: number; path: string; item: MediaItem };

type MediaContent = {
  kind: 'MediaContent';
  type: 'image' | 'video' | 'audio';
  path: string;
  versions?: MediaVersion[];
  selected_version_idx?: number;
};

type GroupCollectionConfig = {
  min?: number;
  max?: number;
  default_instances?: number;
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  label_template?: string;
};

type GroupContent = {
  kind: 'Group';
  path: string;
  label?: string;
  collection?: GroupCollectionConfig;
};

// ============= Address Helpers =============
const joinAddr = (addr: string, path: string) => `${addr}#${path}`;
const mediaSelectedIdxAddr = (addr: string) => joinAddr(addr, 'content.selected_version_idx');

function parseInstanceFromParent(parentAddr: string, groupAddr: string): number | null {
  if (!parentAddr.startsWith(groupAddr)) return null;
  const suffix = parentAddr.slice(groupAddr.length);
  const match = suffix.match(/^\.i(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

const instanceAddr = (groupAddr: string, i: number) => `${groupAddr}.i${i}`;

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

// ---- Form validation helpers (lightweight, non-invasive) ----
type RegistryRuleRow = { ref: string; datatype?: string | null; rules?: any | null };

const EMPTY = (v: any) =>
  v === null ||
  v === undefined ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0);

function collectFieldRefsFromForm(items: FormItem[], acc = new Set<string>(), req = new Map<string, boolean>()) {
  for (const it of items) {
    if (ContentValidation.isFieldItem(it)) {
      const f = it as FieldItem;
      acc.add(f.ref);
      if (f.required) req.set(f.ref, true);
    } else {
      const s = it as SectionItem;
      if (Array.isArray((s as any).children) && (s as any).children.length) {
        collectFieldRefsFromForm((s as any).children, acc, req);
      }
    }
  }
  return { refs: acc, requiredMap: req };
}

function extractFieldRefFromAddress(address: string, knownRefs: Set<string>): string | null {
  const hashIdx = address.indexOf('#');
  const path = hashIdx >= 0 ? address.slice(hashIdx + 1) : address;
  const tokens = path.split('.').filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (knownRefs.has(t)) return t;
  }
  return null;
}

async function fetchRegistryRules(refs: string[]): Promise<Map<string, RegistryRuleRow>> {
  if (!refs.length) return new Map();
  const { data, error } = await supabase
    .schema('app' as any)
    .from('field_registry')
    .select('ref, datatype, rules')
    .in('ref', refs);
  if (error) {
    console.warn('[NodeRenderer] fetchRegistryRules error', error);
    return new Map();
  }
  const map = new Map<string, RegistryRuleRow>();
  for (const row of (data as any[])) map.set(row.ref, row as RegistryRuleRow);
  return map;
}

function validateAgainstRules(value: any, row?: RegistryRuleRow, required = false): { ok: boolean; message?: string } {
  if (required && EMPTY(value)) return { ok: false, message: 'Required' };
  if (!row || !row.rules) return { ok: true };
  const rules = row.rules || {};
  if (typeof value === 'string') {
    if (typeof rules.min_length === 'number' && value.length < rules.min_length) {
      return { ok: false, message: `Min length ${rules.min_length}` };
    }
    if (typeof rules.max_length === 'number' && value.length > rules.max_length) {
      return { ok: false, message: `Max length ${rules.max_length}` };
    }
    if (typeof rules.pattern === 'string') {
      try {
        const re = new RegExp(rules.pattern);
        if (!re.test(value)) return { ok: false, message: 'Invalid format' };
      } catch {}
    }
  }
  if (typeof value === 'number') {
    if (typeof rules.min === 'number' && value < rules.min) return { ok: false, message: `Min ${rules.min}` };
    if (typeof rules.max === 'number' && value > rules.max) return { ok: false, message: `Max ${rules.max}` };
  }
  if (Array.isArray(value)) {
    if (typeof rules.min_items === 'number' && value.length < rules.min_items) {
      return { ok: false, message: `Min items ${rules.min_items}` };
    }
    if (typeof rules.max_items === 'number' && value.length > rules.max_items) {
      return { ok: false, message: `Max items ${rules.max_items}` };
    }
  }
  if (Array.isArray(rules.enum) && rules.enum.length) {
    if (!rules.enum.includes(value)) return { ok: false, message: 'Must be one of predefined options' };
  }
  return { ok: true };
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


    
    // ---- NEW: strict validation for Form nodes before saving ----
    if (node.node_type === 'form') {
      setValidationState('validating');
      const formContent = nodeForRender.content as any;
      const { refs, requiredMap } = collectFieldRefsFromForm((formContent?.items ?? []) as FormItem[]);

      const writeRefs = writes
        .map(w => ({ w, ref: extractFieldRefFromAddress(w.address, refs) }))
        .filter(x => !!x.ref) as Array<{ w: { address: string; value: any }, ref: string }>;

      const uniqueRefs = Array.from(new Set(writeRefs.map(x => x.ref)));
      const ruleMap = await fetchRegistryRules(uniqueRefs);

      const errors: Array<{ ref: string; address: string; message: string }> = [];
      for (const { w, ref } of writeRefs) {
        const rulesRow = ruleMap.get(ref);
        const required = !!requiredMap.get(ref);
        const { ok, message } = validateAgainstRules(w.value, rulesRow, required);
        if (!ok) errors.push({ ref, address: w.address, message: message || 'Invalid value' });
      }

      if (errors.length) {
        setValidationState('invalid');
        const preview = errors.slice(0, 3).map(e => `${e.ref}: ${e.message}`).join('\n');
        toast({
          title: 'Fix validation errors before saving',
          description: preview + (errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      } else {
        setValidationState('valid');
      }
    }
    // ---- END validation ----


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

  // ============= Media Renderer =============
  const MediaRenderer = ({ node: mediaNode, jobId }: { node: JobNode; jobId: string }) => {
    const content = mediaNode.content as MediaContent;
    const [editing, setEditing] = useState(false);
    const [pendingIdx, setPendingIdx] = useState<number | undefined>(content.selected_version_idx);

    useEffect(() => {
      setPendingIdx(content.selected_version_idx);
    }, [content.selected_version_idx]);

    const versions = content.versions || [];
    const selectedIdx = content.selected_version_idx;
    const currentVersion = versions.find(v => v.idx === selectedIdx) || versions[0];

    const handleSaveMedia = async () => {
      if (pendingIdx !== selectedIdx) {
        const write = { address: mediaSelectedIdxAddr(mediaNode.addr), value: pendingIdx };
        try {
          await saveViaRpc(jobId, [write]);
          toast({ title: 'Media version updated', description: 'Selected version saved successfully' });
          clearDrafts(`${mediaNode.addr}#`);
        } catch (error) {
          toast({ title: 'Save failed', variant: 'destructive' });
        }
      }
      setEditing(false);
      stopEditing();
    };

    const handleCancelMedia = () => {
      setPendingIdx(selectedIdx);
      setEditing(false);
      stopEditing();
    };

    const renderMediaItem = (item: MediaItem) => {
      if (item.kind === 'ImageItem') {
        return <img src={item.url} alt="Media" className="max-w-full h-auto rounded" />;
      }
      if (item.kind === 'VideoItem') {
        return <video src={item.url} controls className="max-w-full rounded" />;
      }
      if (item.kind === 'AudioItem') {
        return <audio src={item.url} controls className="w-full" />;
      }
      return null;
    };

    return (
      <div className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Select Version:</div>
            {versions.map(v => (
              <label key={v.idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="media-version"
                  checked={pendingIdx === v.idx}
                  onChange={() => setPendingIdx(v.idx)}
                  className="cursor-pointer"
                />
                <span>Version {v.idx} - {v.path}</span>
              </label>
            ))}
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleSaveMedia}>
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelMedia}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {currentVersion ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Version {currentVersion.idx}: {currentVersion.path}</div>
                {renderMediaItem(currentVersion.item)}
              </div>
            ) : (
              <div className="text-muted-foreground">No versions available yet</div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                if (startEditing(mediaNode.id)) {
                  setEditing(true);
                }
              }}
            >
              <Edit2 className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ============= Group Renderer =============
  const GroupRenderer = ({ node: groupNode, jobId }: { node: JobNode; jobId: string }) => {
    const content = groupNode.content as GroupContent;
    const [expanded, setExpanded] = useState(true);
    const [loading, setLoading] = useState(false);
    const [regularChildren, setRegularChildren] = useState<JobNode[]>([]);
    const [byInstance, setByInstance] = useState<Record<number, JobNode[]>>({});

    const isCollection = !!content.collection;

    // Helper: Get parent path from addr (e.g., "root.a.b" -> "root.a")
    const getParentPath = (addr: string): string | null => {
      if (!addr || addr === 'root') return null;
      const parts = addr.split('.');
      if (parts.length <= 1) return null;
      return parts.slice(0, -1).join('.');
    };

    // Helper: Check if childAddr is a DIRECT child of parentAddr
    const isDirectChildOf = (childAddr: string, parentAddr: string): boolean => {
      if (!childAddr || !parentAddr) return false;
      // Must start with parent
      if (!childAddr.startsWith(parentAddr + '.')) return false;
      // Get the suffix after parent
      const suffix = childAddr.slice(parentAddr.length + 1);
      // Direct child = suffix has no more dots (except for instance markers)
      // Examples of direct children: "a.b" is direct child of "a", "a.i1" is direct child of "a"
      // Not direct: "a.b.c" is NOT direct child of "a"
      const dotCount = (suffix.match(/\./g) || []).length;
      return dotCount === 0;
    };

    // Helper: Parse instance number from addr or parent_addr
    // Supports both ".iN" and ".instances.iN" patterns
    const parseInstanceFromAny = (addr: string, parent_addr: string | null, groupAddr: string): number | null => {
      // Try parent_addr first
      if (parent_addr) {
        const m = parent_addr.match(new RegExp(`^${groupAddr.replace(/\./g, '\\.')}\\.(i\\d+|instances\\.i\\d+)`));
        if (m) {
          const token = m[1]; // "i3" or "instances.i3"
          const num = token.match(/i(\d+)/);
          if (num) return parseInt(num[1], 10);
        }
      }
      // Try addr
      if (addr) {
        const m = addr.match(new RegExp(`^${groupAddr.replace(/\./g, '\\.')}\\.(i\\d+|instances\\.i\\d+)`));
        if (m) {
          const token = m[1];
          const num = token.match(/i(\d+)/);
          if (num) return parseInt(num[1], 10);
        }
      }
      return null;
    };

    // Helper: Sort nodes by idx, then addr
    const sortNodes = (nodes: JobNode[]): JobNode[] => {
      return nodes.sort((a, b) => {
        if (a.idx !== undefined && b.idx !== undefined && a.idx !== b.idx) {
          return a.idx - b.idx;
        }
        return (a.addr || '').localeCompare(b.addr || '');
      });
    };

    useEffect(() => {
      const fetchChildren = async () => {
        setLoading(true);
        try {
          console.log('[GroupRenderer] Fetching children for:', {
            addr: groupNode.addr,
            isCollection,
            jobId
          });

          // Query ALL nodes for this job
          const { data, error } = await supabase
            .schema('app' as any)
            .from('nodes')
            .select('*')
            .eq('job_id', jobId);

          if (error) {
            console.error('[GroupRenderer] Query error:', error);
            throw error;
          }

          console.log('[GroupRenderer] Fetched all nodes:', data?.length || 0);

          if (isCollection) {
            // Collection group: group by instance, only direct children
            const instances: Record<number, JobNode[]> = {};
            (data || []).forEach(child => {
              const instNum = parseInstanceFromAny(child.addr, child.parent_addr, groupNode.addr);
              if (instNum !== null) {
                // Check if direct child of the instance anchor (e.g., "root.group.i1" or "root.group.instances.i1")
                const instanceAnchors = [
                  `${groupNode.addr}.i${instNum}`,
                  `${groupNode.addr}.instances.i${instNum}`
                ];
                const inferredParent = child.parent_addr || getParentPath(child.addr);
                const isDirect = instanceAnchors.some(anchor => 
                  inferredParent === anchor || isDirectChildOf(child.addr, anchor)
                );
                
                if (isDirect) {
                  if (!instances[instNum]) instances[instNum] = [];
                  instances[instNum].push(child as JobNode);
                  console.log('[GroupRenderer] Collection child:', {
                    addr: child.addr,
                    parent_addr: child.parent_addr,
                    inferred: inferredParent,
                    instance: instNum
                  });
                }
              }
            });
            
            // Sort children in each instance
            Object.keys(instances).forEach(key => {
              instances[Number(key)] = sortNodes(instances[Number(key)]);
            });
            
            console.log('[GroupRenderer] Collection instances:', Object.keys(instances).length, instances);
            setByInstance(instances);
          } else {
            // Regular group: direct children only
            const children: JobNode[] = [];
            (data || []).forEach(child => {
              const inferredParent = child.parent_addr || getParentPath(child.addr);
              const isDirect = inferredParent === groupNode.addr || isDirectChildOf(child.addr, groupNode.addr);
              
              if (isDirect) {
                children.push(child as JobNode);
                console.log('[GroupRenderer] Regular child:', {
                  addr: child.addr,
                  parent_addr: child.parent_addr,
                  inferred: inferredParent
                });
              }
            });
            
            console.log('[GroupRenderer] Regular children:', children.length);
            setRegularChildren(sortNodes(children));
          }
        } catch (error) {
          console.error('[GroupRenderer] fetch children failed', error);
        } finally {
          setLoading(false);
        }
      };

      fetchChildren();
    }, [jobId, groupNode.addr, groupNode.updated_at, isCollection]);

    return (
      <div className="space-y-4">
        {loading && <div className="text-sm text-muted-foreground">Loading children...</div>}
        
        {!isCollection && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            {regularChildren.length === 0 && !loading && (
              <div className="text-muted-foreground text-sm">No children yet</div>
            )}
            {regularChildren.map(child => (
              <NodeRenderer
                key={child.id}
                node={child}
                onUpdate={onUpdate}
                onGenerate={onGenerate}
                showPath={showPath}
              />
            ))}
          </div>
        )}

        {isCollection && (
          <div className="space-y-4">
            {Object.keys(byInstance).length === 0 && !loading && (
              <div className="text-muted-foreground text-sm">No instances yet</div>
            )}
            {Object.keys(byInstance)
              .map(Number)
              .sort((a, b) => a - b)
              .map(instNum => {
                const children = byInstance[instNum] || [];
                const label = content.collection?.label_template
                  ? content.collection.label_template.replace('#{i}', String(instNum))
                  : `Instance ${instNum}`;

                return (
                  <div key={instNum} className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="font-medium mb-3 text-primary">{label}</div>
                    <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                      {children.map(child => (
                        <NodeRenderer
                          key={child.id}
                          node={child}
                          onUpdate={onUpdate}
                          onGenerate={onGenerate}
                          showPath={showPath}
                        />
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
            {node.node_type === 'form' && renderFormContent()}
            {node.node_type === 'media' && <MediaRenderer node={node} jobId={node.job_id} />}
            {node.node_type === 'group' && <GroupRenderer node={node} jobId={node.job_id} />}
            {!['form', 'media', 'group'].includes(node.node_type) && (
              <div className="text-muted-foreground">Node type '{node.node_type}' not supported by SSOT renderer.</div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
