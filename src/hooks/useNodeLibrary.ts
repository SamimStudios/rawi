// src/pages/app/build/node/hooks/useNodeLibrary.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type NodeType = 'media' | 'group' | 'form' | string;

export interface NodeLibraryEntry {
  id: string;                 // should be lib_*
  node_type: NodeType;
  version?: number;
  active?: boolean;
  content: any;
  created_at?: string | null;
  updated_at?: string | null;
}

/* ---------- tiny utils ---------- */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x ?? null));
const normalizeDash = (s?: string) => (s ?? '').replace(/[\u2010-\u2015\u2212]/g, '-'); // normalize weird dashes → '-'

function log(title: string, obj: any) {
  try {
    // prettier logs, safe stringify
    const json = JSON.stringify(obj, (k, v) => (typeof v === 'function' ? `[Function ${v.name || 'fn'}]` : v), 2);
    console.log(title, json);
  } catch {
    console.log(title, obj);
  }
}

/* ---------- sanitize to LIBRARY (template-only) ---------- */
function stripRuntimeInstancesForLibrary(nodeType: string, content: any): any {
  if (!content || typeof content !== 'object') return content;

  if (nodeType === 'group' && content.kind === 'GroupContent') {
    const c = { ...content };
    if ('instances' in c) delete c.instances;
    if (!Array.isArray(c.children)) c.children = [];
    // coerce child ids to strings, drop empties
    c.children = (c.children || []).filter(Boolean).map(String);
    return c;
  }

  if (nodeType === 'form' && content.kind === 'FormContent') {
    const forceArray = (xs: any) => (Array.isArray(xs) ? xs : []);
    const sanitizeItems = (items: any[]): any[] =>
      forceArray(items).map((it: any) => {
        if (!it || typeof it !== 'object') return it;

        if (it.kind === 'CollectionFieldItem') {
          const { instances, ...rest } = it;
          return rest;
        }

        if (it.kind === 'CollectionSection') {
          const { instances, children, ...rest } = it;
          return { ...rest, children: sanitizeItems(children || []) };
        }

        if (it.kind === 'SectionItem') {
          return { ...it, children: sanitizeItems(it.children || []) };
        }

        return it; // FieldItem, etc.
      });

    return {
      ...content,
      version: 'v2-items',                   // canonical
      items: sanitizeItems(content.items),   // ensure all children arrays exist
    };
  }

  return content;
}

/* ---------- validators (LIBRARY template-only) – tolerant about empty children ---------- */
function explainMedia(c: any) {
  if (!c || c.kind !== 'MediaContent') return { ok: false, why: 'kind must be "MediaContent"' };
  if (typeof c.path !== 'string' || !c.path) return { ok: false, why: 'path must be non-empty string' };
  const t = String(c.type);
  if (!['image', 'video', 'audio', 'file'].includes(t)) return { ok: false, why: 'type must be image|video|audio|file' };
  if (c.selected_version_idx != null && typeof c.selected_version_idx !== 'number') return { ok: false, why: 'selected_version_idx must be number' };
  if (c.versions != null && !Array.isArray(c.versions)) return { ok: false, why: 'versions must be array' };
  if (Array.isArray(c.versions)) {
    for (let i = 0; i < c.versions.length; i++) {
      const v = c.versions[i];
      if (!v || v.kind !== 'MediaVersion') return { ok: false, why: `versions[${i}].kind must be "MediaVersion"` };
      if (typeof v.idx !== 'number' || v.idx < 1) return { ok: false, why: `versions[${i}].idx must be >= 1` };
      if (v.uri != null && typeof v.uri !== 'string') return { ok: false, why: `versions[${i}].uri must be string` };
    }
  }
  return { ok: true } as const;
}

function explainGroup(c: any) {
  if (!c || c.kind !== 'GroupContent') return { ok: false, why: 'kind must be "GroupContent"' };
  if (typeof c.path !== 'string' || !c.path) return { ok: false, why: 'path must be non-empty string' };
  if (!Array.isArray(c.children)) return { ok: false, why: 'children must be string[]' };
  if ('instances' in c) return { ok: false, why: 'instances[] is runtime-only' };

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

  if ((c.children || []).some((id: any) => typeof id !== 'string' || !id)) return { ok: false, why: 'children[] must be non-empty strings' };
  return { ok: true } as const;
}

function explainForm(c: any) {
  if (!c || c.kind !== 'FormContent') return { ok: false, why: 'kind must be "FormContent"' };
  if (!Array.isArray(c.items)) return { ok: false, why: 'items must be an array' };

  const checkItems = (items: any[], path = 'items'): { ok: boolean; why?: string } => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const here = `${path}[${i}]`;

      if (!it?.kind) return { ok: false, why: `${here}.kind missing` };

      if (it.kind === 'FieldItem') {
        if (typeof it.path !== 'string' || typeof it.ref !== 'string') return { ok: false, why: `${here} FieldItem requires path/ref` };
        continue;
      }

      if (it.kind === 'SectionItem') {
        // tolerate empty children
        if (typeof it.path !== 'string') return { ok: false, why: `${here} SectionItem requires path` };
        if (it.children != null && !Array.isArray(it.children)) return { ok: false, why: `${here} SectionItem children must be array` };
        const r = it.children ? checkItems(it.children, `${here}.children`) : { ok: true };
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
        if (it.children != null && !Array.isArray(it.children)) return { ok: false, why: `${here} CollectionSection children must be array` };
        if (typeof it.default_instances !== 'number') return { ok: false, why: `${here} default_instances must be number` };
        const r = it.children ? checkItems(it.children, `${here}.children`) : { ok: true };
        if (!r.ok) return r;
        continue;
      }

      return { ok: false, why: `${here}.kind "${it.kind}" not allowed` };
    }
    return { ok: true };
  };

  return checkItems(c.items);
}

function validateLibraryNodeContent(nodeType: string, content: any) {
  if (nodeType === 'media') return explainMedia(content);
  if (nodeType === 'group') return explainGroup(content);
  if (nodeType === 'form')  return explainForm(content);
  return { ok: true as const };
}

/* ---------- hook ---------- */
export function useNodeLibrary() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<NodeLibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  /* validate with sanitize first, and LOG reasons */
  const validateEntry = useCallback(async (entry: any) => {
    try {
      console.groupCollapsed('%cValidating node entry', 'color:#999');
      console.log('Node type:', entry?.node_type);

      if (!entry?.id || typeof entry.id !== 'string') { console.log('id invalid'); console.groupEnd(); return false; }
      if (!entry?.node_type || typeof entry.node_type !== 'string') { console.log('node_type invalid'); console.groupEnd(); return false; }
      if (!entry?.content || typeof entry.content !== 'object') { console.log('content invalid'); console.groupEnd(); return false; }

      // sanitize first
      let content = clone(entry.content);
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') content.version = 'v2-items';
      }
      content = stripRuntimeInstancesForLibrary(entry.node_type, content);

      log('Content structure (sanitized):', content);

      const res = validateLibraryNodeContent(entry.node_type, content);
      console.log('Validation result:', res.ok, res.why ? `— ${res.why}` : '');
      console.groupEnd();
      return !!res.ok;
    } catch {
      console.groupEnd();
      return false;
    }
  }, []);

  /* upsert with deep logging + adaptive fallback */
  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      // sanitize
      let content = stripRuntimeInstancesForLibrary(entry.node_type, entry.content);
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') content = { ...content, version: 'v2-items' };
      }

      // pre-validate (logs reasons)
      const ok = await validateEntry({ ...entry, content });
      if (!ok) throw new Error('Invalid content structure for node type');

      // enforce lib_ prefix
      const id = entry.id.startsWith('lib_') ? entry.id : `lib_${entry.id}`;

      // ATTEMPT 1: minimal payload
      const payload1: any = { id, node_type: entry.node_type, content: content };

      console.groupCollapsed('%cLibrary upsert — attempt #1 (minimal)', 'color:#999');
      log('Payload:', payload1);
      const { error: e1 } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .upsert(payload1, { onConflict: 'id' });
      console.groupEnd();

      if (!e1) {
        toast({ title: 'Success', description: 'Node library entry saved successfully' });
        await fetchEntries();
        return true;
      }

      // ATTEMPT 2: add defaults for common NOT NULLs
      const needsVersion = /null value in column "version"/i.test(String(e1?.message || ''));
      const needsActive  = /null value in column "active"/i.test(String(e1?.message || ''));

      const payload2: any = { ...payload1 };
      if (needsVersion) payload2.version = (entry as any).version ?? 1;
      if (needsActive)  payload2.active  = (entry as any).active ?? true;

      if (needsVersion || needsActive) {
        console.groupCollapsed('%cLibrary upsert — attempt #2 (with defaults)', 'color:#999');
        log('Payload:', payload2);
        const { error: e2 } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('node_library')
          .upsert(payload2, { onConflict: 'id' });
        console.groupEnd();

        if (!e2) {
          toast({ title: 'Success', description: 'Node library entry saved successfully' });
          await fetchEntries();
          return true;
        }

        console.error('node_library upsert error (attempt 2):', e2);
        throw e2;
      }

      console.error('node_library upsert error (attempt 1):', e1);
      throw e1;
    } catch (err: any) {
      // dump full error for debugging (PostgREST shows code/details/hint/message)
      console.error('saveEntry error:', err);
      log('saveEntry error object:', err);
      const msg = err?.message || 'Failed to save node library entry';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast, validateEntry]);

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

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return {
    entries, loading, error,
    fetchEntries, fetchEntry,
    validateEntry, saveEntry, deleteEntry,
  };
}

export default useNodeLibrary;
