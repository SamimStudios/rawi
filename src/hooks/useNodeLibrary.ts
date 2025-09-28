// src/pages/app/build/node/hooks/useNodeLibrary.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type NodeType = 'media' | 'group' | 'form' | string;

export interface NodeLibraryEntry {
  id: string;                 // prefer lib_* ids
  node_type: NodeType;
  version?: number;
  active?: boolean;
  content: any;
  created_at?: string | null;
  updated_at?: string | null;
}

/* ───────────────────────── utils ───────────────────────── */
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x ?? null));
const normalizeDash = (s?: string) => (s ?? '').replace(/[\u2010-\u2015\u2212]/g, '-');

const logJSON = (label: string, obj: any) => {
  try {
    // avoid crashing stringify on functions etc.
    const j = JSON.stringify(obj, (k, v) => (typeof v === 'function' ? `[fn ${v.name || 'anon'}]` : v), 2);
    console.log(label, j);
  } catch {
    console.log(label, obj);
  }
};

/* ───────────────── sanitize to LIBRARY (template-only) ───────────────── */
function sanitizeForLibrary(nodeType: string, content: any): any {
  if (!content || typeof content !== 'object') return content;

  if (nodeType === 'group' && content.kind === 'GroupContent') {
    const c = { ...content };
    // runtime instances never stored in library
    if ('instances' in c) delete c.instances;
    // children is a string[] of library node ids
    c.children = Array.isArray(c.children) ? c.children.filter(Boolean).map(String) : [];
    return c;
  }

  if (nodeType === 'form' && content.kind === 'FormContent') {
    const cleanseItems = (items: any[]): any[] =>
      (Array.isArray(items) ? items : []).map((it: any) => {
        if (!it || typeof it !== 'object') return it;

        if (it.kind === 'CollectionFieldItem') {
          const { instances, ...rest } = it; // drop runtime instances
          return rest;
        }
        if (it.kind === 'CollectionSection') {
          const { instances, children, ...rest } = it;
          return { ...rest, children: cleanseItems(children || []) };
        }
        if (it.kind === 'SectionItem') {
          return { ...it, children: cleanseItems(it.children || []) };
        }
        return it; // FieldItem etc.
      });

    return { ...content, version: 'v2-items', items: cleanseItems(content.items) };
  }

  if (nodeType === 'media' && content.kind === 'MediaContent') {
    // nothing special; zero versions allowed
    return content;
  }

  return content;
}

/* ───────────────── validators (template-only, tolerant) ───────────────── */

// Keep these deliberately permissive to stop false negatives.
// We only enforce structural invariants per SSOT.

function validateMediaTemplate(c: any) {
  if (!c || c.kind !== 'MediaContent') return { ok: false, why: 'kind != MediaContent' };
  if (typeof c.path !== 'string' || !c.path) return { ok: false, why: 'path required' };
  if (!['image','video','audio','file'].includes(String(c.type))) return { ok: false, why: 'type invalid' };
  if (c.selected_version_idx != null && typeof c.selected_version_idx !== 'number')
    return { ok: false, why: 'selected_version_idx must be number' };
  if (c.versions != null && !Array.isArray(c.versions))
    return { ok: false, why: 'versions must be array' };
  return { ok: true } as const;
}

function validateGroupTemplate(c: any) {
  if (!c || c.kind !== 'GroupContent') return { ok: false, why: 'kind != GroupContent' };
  if (typeof c.path !== 'string' || !c.path) return { ok: false, why: 'path required' };
  if (!Array.isArray(c.children)) return { ok: false, why: 'children must be string[]' };
  if ((c.children || []).some((id: any) => typeof id !== 'string' || !id))
    return { ok: false, why: 'children[] must be non-empty strings' };
  // collection is optional; if present just basic type sanity
  if (c.collection && typeof c.collection !== 'object') return { ok: false, why: 'collection must be object' };
  return { ok: true } as const;
}

function validateFormTemplate(c: any) {
  if (!c || c.kind !== 'FormContent') return { ok: false, why: 'kind != FormContent' };
  if (!Array.isArray(c.items)) return { ok: false, why: 'items must be array' };

  const check = (items: any[], p = 'items'): { ok: boolean; why?: string } => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const here = `${p}[${i}]`;

      if (!it?.kind) return { ok: false, why: `${here}.kind missing` };

      if (it.kind === 'FieldItem') {
        if (typeof it.path !== 'string' || typeof it.ref !== 'string')
          return { ok: false, why: `${here} FieldItem needs path & ref` };
        continue;
      }

      if (it.kind === 'SectionItem') {
        if (typeof it.path !== 'string') return { ok: false, why: `${here} SectionItem needs path` };
        if (it.children != null && !Array.isArray(it.children))
          return { ok: false, why: `${here} SectionItem children must be array` };
        const r = it.children ? check(it.children, `${here}.children`) : { ok: true };
        if (!r.ok) return r;
        continue;
      }

      if (it.kind === 'CollectionFieldItem') {
        if ('instances' in it) return { ok: false, why: `${here} CollectionFieldItem instances[] is runtime-only` };
        if (typeof it.path !== 'string' || typeof it.ref !== 'string')
          return { ok: false, why: `${here} CollectionFieldItem needs path & ref` };
        // default_instances recommended; if missing, coerce later in runtime
        continue;
      }

      if (it.kind === 'CollectionSection') {
        if ('instances' in it) return { ok: false, why: `${here} CollectionSection instances[] is runtime-only` };
        if (typeof it.path !== 'string') return { ok: false, why: `${here} CollectionSection needs path` };
        if (it.children != null && !Array.isArray(it.children))
          return { ok: false, why: `${here} CollectionSection children must be array` };
        // default_instances recommended; if missing, coerce later in runtime
        const r = it.children ? check(it.children, `${here}.children`) : { ok: true };
        if (!r.ok) return r;
        continue;
      }

      return { ok: false, why: `${here}.kind "${it.kind}" not allowed` };
    }
    return { ok: true };
  };

  return check(c.items);
}

function validateLibraryNodeContent(nodeType: string, content: any) {
  if (nodeType === 'media') return validateMediaTemplate(content);
  if (nodeType === 'group') return validateGroupTemplate(content);
  if (nodeType === 'form')  return validateFormTemplate(content);
  return { ok: true as const };
}

/* ───────────────── hook ───────────────── */
export function useNodeLibrary() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<NodeLibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* READ ALL */
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

  /* READ ONE */
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

  /* VALIDATE (sanitize first) — with loud logs */
  const validateEntry = useCallback(async (entry: any) => {
    console.groupCollapsed('%cValidating node entry', 'color:#8a8');
    try {
      console.log('Node type:', entry?.node_type);

      if (!entry?.id || typeof entry.id !== 'string') { console.log('❌ id invalid'); return false; }
      if (!entry?.node_type || typeof entry.node_type !== 'string') { console.log('❌ node_type invalid'); return false; }
      if (!entry?.content || typeof entry.content !== 'object') { console.log('❌ content invalid'); return false; }

      // normalize common gotchas
      let content = clone(entry.content);
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') content.version = 'v2-items';
      }

      // sanitize → then validate
      content = sanitizeForLibrary(entry.node_type, content);
      logJSON('Content structure (sanitized):', content);

      const res = validateLibraryNodeContent(entry.node_type, content);
      console.log('Validation result:', res.ok, res.why ? `— ${res.why}` : '');
      return !!res.ok;
    } catch (e) {
      console.log('❌ validateEntry threw:', e);
      return false;
    } finally {
      console.groupEnd();
    }
  }, []);

  /* SAVE (insert or update) — NO on_conflict required */
  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      // sanitize first
      let content = sanitizeForLibrary(entry.node_type, entry.content);
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') content = { ...content, version: 'v2-items' };
      }

      // validate (logs details)
      const ok = await validateEntry({ ...entry, content });
      if (!ok) throw new Error('Invalid content structure for node type');

      // enforce lib_ prefix (common check)
      const id = entry.id.startsWith('lib_') ? entry.id : `lib_${entry.id}`;

      // existence check (so we can choose insert vs update)
      const { data: existing, error: existsErr } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .select('id', { count: 'exact', head: false })
        .eq('id', id);

      if (existsErr) {
        console.error('existence check error:', existsErr);
        // continue; we can still try an insert
      }

      const payload: any = {
        id,
        node_type: entry.node_type,
        content,
      };

      const isUpdate = Array.isArray(existing) && existing.length > 0;

      console.groupCollapsed(
        `%cLibrary ${isUpdate ? 'UPDATE' : 'INSERT'} payload`,
        'color:#888'
      );
      logJSON('Payload:', payload);
      console.groupEnd();

      let dbErr: any = null;

      if (isUpdate) {
        const { error } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('node_library')
          .update(payload)
          .eq('id', id);
        dbErr = error || null;
      } else {
        const { error } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('node_library')
          .insert(payload);
        dbErr = error || null;
      }

      if (dbErr) {
        console.error('node_library save error:', dbErr);
        logJSON('node_library save error object:', dbErr);
        throw dbErr;
      }

      toast({ title: 'Success', description: 'Node library entry saved successfully' });
      await fetchEntries();
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to save node library entry';
      console.error('saveEntry error:', err);
      logJSON('saveEntry error object:', err);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEntries, toast, validateEntry]);

  /* DELETE */
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
