// src/pages/app/build/node/hooks/useNodeLibrary.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

/** ---------- Types ---------- */
export type NodeType = 'media' | 'group' | 'form' | string;

export interface NodeLibraryEntry {
  id: string;                 // prefer lib_*
  node_type: NodeType;
  version?: number;
  active?: boolean;
  content: any;
  created_at?: string | null;
  updated_at?: string | null;
}

/** ---------- Utils ---------- */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x ?? null));
const normalizeDash = (s?: string) =>
  (s ?? '').replace(/[\u2010-\u2015\u2212]/g, '-'); // en/em/figure/minus → '-'

function logGroup(title: string, obj: any) {
  try {
    // safer stringify to avoid functions/BigInt errors
    const json = JSON.stringify(obj, (k, v) => (typeof v === 'function' ? `[Function ${v.name||'fn'}]` : v), 2);
    // eslint-disable-next-line no-console
    console.log(title, json);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(title, obj);
  }
}

/** ---------- Sanitizers (LIBRARY) ---------- */
function stripRuntimeInstancesForLibrary(nodeType: string, content: any): any {
  if (!content) return content;

  if (nodeType === 'group' && content?.kind === 'GroupContent') {
    const c = { ...content };
    if ('instances' in c) delete c.instances;
    return c;
  }

  if (nodeType === 'form' && content?.kind === 'FormContent') {
    const cleanseItems = (items: any[]): any[] =>
      (items || []).map((it: any) => {
        if (it?.kind === 'CollectionFieldItem') {
          const { instances, ...rest } = it || {};
          return { ...rest };
        }
        if (it?.kind === 'CollectionSection') {
          const { instances, children = [], ...rest } = it || {};
          return { ...rest, children: cleanseItems(children) };
        }
        if (it?.kind === 'SectionItem') {
          return { ...it, children: cleanseItems(it.children || []) };
        }
        return it;
      });

    const version = 'v2-items'; // canonical
    return { ...content, version, items: cleanseItems(content.items || []) };
  }

  return content;
}

/** ---------- Validators (LIBRARY = template-only) with explanations ---------- */
function explainGroupTemplate(c: any): { ok: boolean; why?: string } {
  if (!c || c.kind !== 'GroupContent') return { ok: false, why: 'kind must be "GroupContent"' };
  if (typeof c.path !== 'string' || !c.path.length) return { ok: false, why: 'path must be non-empty string' };
  if (!Array.isArray(c.children)) return { ok: false, why: 'children must be string[] (library node ids)' };
  if ('instances' in c) return { ok: false, why: 'instances[] is runtime-only; strip before saving' };

  if (c.collection) {
    const col = c.collection;
    if (col.default_instances != null && typeof col.default_instances !== 'number') return { ok: false, why: 'collection.default_instances must be number' };
    if (col.min != null && typeof col.min !== 'number') return { ok: false, why: 'collection.min must be number' };
    if (col.max != null && typeof col.max !== 'number') return { ok: false, why: 'collection.max must be number' };
    if (col.allow_add != null && typeof col.allow_add !== 'boolean') return { ok: false, why: 'collection.allow_add must be boolean' };
    if (col.allow_remove != null && typeof col.allow_remove !== 'boolean') return { ok: false, why: 'collection.allow_remove must be boolean' };
    if (col.allow_reorder != null && typeof col.allow_reorder !== 'boolean') return { ok: false, why: 'collection.allow_reorder must be boolean' };
    if (col.label_template != null && typeof col.label_template !== 'string') return { ok: false, why: 'collection.label_template must be string' };
  }

  const badChild = (c.children || []).find((id: any) => typeof id !== 'string' || !id.length);
  if (badChild) return { ok: false, why: 'children[] must be non-empty strings' };
  return { ok: true };
}

function explainFormTemplate(c: any): { ok: boolean; why?: string } {
  if (!c || c.kind !== 'FormContent') return { ok: false, why: 'kind must be "FormContent"' };
  if (!Array.isArray(c.items)) return { ok: false, why: 'items must be an array' };

  const checkItems = (items: any[], path = 'items'): { ok: boolean; why?: string } => {
    for (let i = 0; i < (items || []).length; i++) {
      const it = items[i];
      const here = `${path}[${i}]`;
      if (!it?.kind) return { ok: false, why: `${here}.kind missing` };

      if (it.kind === 'FieldItem') {
        if (typeof it.path !== 'string' || typeof it.ref !== 'string') return { ok: false, why: `${here} FieldItem requires path/ref` };
        continue;
      }

      if (it.kind === 'SectionItem') {
        if (typeof it.path !== 'string') return { ok: false, why: `${here} SectionItem requires path` };
        if (!Array.isArray(it.children)) return { ok: false, why: `${here} SectionItem children[] missing` };
        const r = checkItems(it.children, `${here}.children`);
        if (!r.ok) return r;
        continue;
      }

      if (it.kind === 'CollectionFieldItem') {
        if ('instances' in it) return { ok: false, why: `${here} CollectionFieldItem instances[] is runtime-only` };
        if (typeof it.path !== 'string' || typeof it.ref !== 'string') return { ok: false, why: `${here} CollectionFieldItem requires path/ref` };
        if (typeof it.default_instances !== 'number') return { ok: false, why: `${here} default_instances must be number` };
        continue;
      }

      if (it.kind === 'CollectionSection') {
        if ('instances' in it) return { ok: false, why: `${here} CollectionSection instances[] is runtime-only` };
        if (typeof it.path !== 'string') return { ok: false, why: `${here} CollectionSection requires path` };
        if (!Array.isArray(it.children)) return { ok: false, why: `${here} CollectionSection children[] missing` };
        if (typeof it.default_instances !== 'number') return { ok: false, why: `${here} default_instances must be number` };
        const r = checkItems(it.children, `${here}.children`);
        if (!r.ok) return r;
        continue;
      }

      return { ok: false, why: `${here}.kind "${it.kind}" not allowed` };
    }
    return { ok: true };
  };

  return checkItems(c.items);
}

function explainMediaTemplate(c: any): { ok: boolean; why?: string } {
  if (!c || c.kind !== 'MediaContent') return { ok: false, why: 'kind must be "MediaContent"' };
  if (typeof c.path !== 'string' || !c.path.length) return { ok: false, why: 'path must be non-empty string' };
  const t = String(c.type);
  if (!['image', 'video', 'audio', 'file'].includes(t)) return { ok: false, why: 'type must be image|video|audio|file' };
  if (c.selected_version_idx != null && typeof c.selected_version_idx !== 'number') return { ok: false, why: 'selected_version_idx must be number' };
  if (c.versions != null) {
    if (!Array.isArray(c.versions)) return { ok: false, why: 'versions must be array' };
    for (let i = 0; i < c.versions.length; i++) {
      const v = c.versions[i];
      if (!v || v.kind !== 'MediaVersion') return { ok: false, why: `versions[${i}].kind must be "MediaVersion"` };
      if (typeof v.idx !== 'number' || v.idx < 1) return { ok: false, why: `versions[${i}].idx must be >=1` };
      if (v.uri != null && typeof v.uri !== 'string') return { ok: false, why: `versions[${i}].uri must be string` };
    }
  }
  return { ok: true };
}

function validateLibraryNodeContent(nodeType: string, content: any): { ok: boolean; why?: string } {
  if (nodeType === 'group') return explainGroupTemplate(content);
  if (nodeType === 'form') return explainFormTemplate(content);
  if (nodeType === 'media') return explainMediaTemplate(content);
  return { ok: true };
}

/** ---------- Hook ---------- */
export function useNodeLibrary() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<NodeLibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Read all entries */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .select('id, node_type, version, active, content')
        .order('id', { ascending: true });

      if (error) throw error;
      setEntries((data ?? []) as any);
    } catch (e: any) {
      console.error('fetchEntries error:', e);
      setError(e?.message || 'Failed to fetch node library entries');
      toast({ title: 'Error', description: 'Failed to fetch node library entries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /** Read single entry by id */
  const fetchEntry = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .select('id, node_type, version, active, content')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as NodeLibraryEntry;
    } catch (e: any) {
      console.error('fetchEntry error:', e);
      setError(e?.message || 'Failed to fetch node library entry');
      toast({ title: 'Error', description: 'Failed to fetch node library entry', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /** Validate entry (sanitize first) — with logging */
  const validateEntry = useCallback(async (entry: any) => {
    try {
      console.groupCollapsed('%cValidating node entry', 'color:#888');
      console.log('Node type:', entry?.node_type);

      if (!entry?.id || typeof entry.id !== 'string') { console.log('id invalid'); return false; }
      if (!entry?.node_type || typeof entry.node_type !== 'string') { console.log('node_type invalid'); return false; }
      if (!entry?.content || typeof entry.content !== 'object') { console.log('content invalid'); return false; }

      // Normalize dashes in any string-y version; sanitize first
      let content = clone(entry.content);
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') content.version = 'v2-items';
      }
      content = stripRuntimeInstancesForLibrary(entry.node_type, content);

      logGroup('Content structure:', content);

      const res = validateLibraryNodeContent(entry.node_type, content);
      console.log('Validation result:', res.ok, res.why ? `— ${res.why}` : '');
      console.groupEnd();

      return !!res.ok;
    } catch (e) {
      console.groupEnd();
      return false;
    }
  }, []);

  /** Upsert entry (adaptive) */
  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      // SANITIZE
      let sanitizedContent = stripRuntimeInstancesForLibrary(entry.node_type, entry.content);
      if (entry.node_type === 'form' && sanitizedContent?.kind === 'FormContent') {
        const v = normalizeDash(String(sanitizedContent.version ?? ''));
        if (v !== 'v2-items') sanitizedContent = { ...sanitizedContent, version: 'v2-items' };
      }

      // VALIDATE
      const tempEntry = { ...entry, content: sanitizedContent };
      const isValid = await validateEntry(tempEntry);
      if (!isValid) throw new Error('Invalid content structure for node type');

      // ID prefix
      const id = entry.id.startsWith('lib_') ? entry.id : `lib_${entry.id}`;

      // Try minimal payload first
      const payloadBase: any = { id, node_type: entry.node_type, content: sanitizedContent };

      console.groupCollapsed('%cLibrary upsert (attempt 1: minimal payload)', 'color:#888');
      logGroup('Payload:', payloadBase);

      let { error: err1 } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .upsert(payloadBase, { onConflict: 'id' });

      console.groupEnd();

      if (!err1) {
        toast({ title: 'Success', description: 'Node library entry saved successfully' });
        await fetchEntries();
        return true;
      }

      // If DB complains about NOT NULL columns (version/active), retry with defaults
      const msg = String(err1?.message || '');
      const needsVersion = /null value in column "version"/i.test(msg);
      const needsActive  = /null value in column "active"/i.test(msg);

      const payloadRetry: any = { ...payloadBase };
      if (needsVersion) payloadRetry.version = (entry as any).version ?? 1;
      if (needsActive)  payloadRetry.active  = (entry as any).active ?? true;

      if (needsVersion || needsActive) {
        console.groupCollapsed('%cLibrary upsert (attempt 2: with defaults)', 'color:#888');
        logGroup('Payload:', payloadRetry);

        const { error: err2 } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('node_library')
          .upsert(payloadRetry, { onConflict: 'id' });

        console.groupEnd();

        if (!err2) {
          toast({ title: 'Success', description: 'Node library entry saved successfully' });
          await fetchEntries();
          return true;
        }

        console.error('node_library upsert error (attempt 2):', err2);
        throw err2;
      }

      // Not a NOT NULL issue — surface the exact error
      console.error('node_library upsert error (attempt 1):', err1);
      throw err1;
    } catch (e: any) {
      const msg = e?.message || 'Failed to save node library entry';
      console.error('saveEntry error:', e);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast, validateEntry]);

  /** Delete entry */
  const deleteEntry = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const libId = id.startsWith('lib_') ? id : `lib_${id}`;
      const { error } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .delete()
        .eq('id', libId);
      if (error) throw error;

      toast({ title: 'Deleted', description: `Library node "${libId}" deleted.` });
      await fetchEntries();
      return true;
    } catch (e: any) {
      console.error('deleteEntry error:', e);
      setError(e?.message || 'Failed to delete node library entry');
      toast({ title: 'Error', description: 'Failed to delete node library entry', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    fetchEntry,
    validateEntry,
    saveEntry,
    deleteEntry,
  };
}

export default useNodeLibrary;
