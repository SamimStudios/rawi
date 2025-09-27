// src/pages/app/build/node/hooks/useNodeLibrary.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

/** ---------- Types ---------- */
export type NodeType = 'media' | 'group' | 'form' | string;

export interface NodeLibraryEntry {
  id: string;                 // should start with lib_
  node_type: NodeType;
  version?: number;           // if your table has NOT NULL, we default it
  active?: boolean;           // if your table has NOT NULL, we default it
  content: any;
  created_at?: string | null;
  updated_at?: string | null;
}

/** ---------- Helpers ---------- */
const normalizeDash = (s?: string) =>
  (s ?? '').replace(/[\u2010-\u2015\u2212]/g, '-'); // normalize en/em/figure dashes → '-'

/** Remove any runtime instances before LIBRARY save; normalize Form version string */
function stripRuntimeInstancesForLibrary(nodeType: string, content: any): any {
  if (!content) return content;

  if (nodeType === 'group') {
    const c = { ...content };
    if ('instances' in c) delete c.instances;
    return c;
  }

  if (nodeType === 'form') {
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

    if (content.kind === 'FormContent') {
      // normalize to canonical version label
      const version = 'v2-items';
      return { ...content, version, items: cleanseItems(content.items || []) };
    }
  }

  return content;
}

/** ---------- Validators (LIBRARY = template-only) ---------- */

function isValidMediaContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'MediaContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!['image', 'video', 'audio', 'file'].includes(String(c.type))) return false;

  if (c.selected_version_idx != null && typeof c.selected_version_idx !== 'number') return false;

  if (c.versions != null) {
    if (!Array.isArray(c.versions)) return false;
    for (const v of c.versions) {
      if (!v || v.kind !== 'MediaVersion') return false;
      if (typeof v.idx !== 'number' || v.idx < 1) return false;
      if (v.uri != null && typeof v.uri !== 'string') return false;
    }
  }
  return true; // zero versions allowed
}

function isValidGroupContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'GroupContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!Array.isArray(c.children)) return false;    // template children list
  if ('instances' in c) return false;              // runtime-only

  if (c.collection) {
    const col = c.collection;
    if (col.default_instances != null && typeof col.default_instances !== 'number') return false;
    if (col.min != null && typeof col.min !== 'number') return false;
    if (col.max != null && typeof col.max !== 'number') return false;
    if (col.allow_add != null && typeof col.allow_add !== 'boolean') return false;
    if (col.allow_remove != null && typeof col.allow_remove !== 'boolean') return false;
    if (col.allow_reorder != null && typeof col.allow_reorder !== 'boolean') return false;
    if (col.label_template != null && typeof col.label_template !== 'string') return false;
  }

  return c.children.every((id: any) => typeof id === 'string' && id.length > 0);
}

/** RELAXED: only require items[], not exact version string */
function isValidFormContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'FormContent') return false;
  if (!Array.isArray(c.items)) return false;

  const checkItems = (items: any[]): boolean =>
    (items || []).every((it: any) => {
      if (it.kind === 'FieldItem') {
        return typeof it.path === 'string' && typeof it.ref === 'string';
      }
      if (it.kind === 'SectionItem') {
        return typeof it.path === 'string' && Array.isArray(it.children) && checkItems(it.children);
      }
      if (it.kind === 'CollectionFieldItem') {
        if ('instances' in it) return false; // library must not store instances
        return typeof it.path === 'string'
          && typeof it.ref === 'string'
          && typeof it.default_instances === 'number';
      }
      if (it.kind === 'CollectionSection') {
        if ('instances' in it) return false; // library must not store instances
        return typeof it.path === 'string'
          && Array.isArray(it.children)
          && checkItems(it.children)
          && typeof it.default_instances === 'number';
      }
      return false;
    });

  return checkItems(c.items);
}

function validateLibraryNodeContent(nodeType: string, content: any): boolean {
  if (nodeType === 'group') return isValidGroupContentTemplate(content);
  if (nodeType === 'form') return isValidFormContentTemplate(content);
  if (nodeType === 'media') return isValidMediaContentTemplate(content);
  return true; // permissive for other types
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

  /** Validate entry (sanitize first) */
  const validateEntry = useCallback(async (entry: any) => {
    try {
      if (!entry?.id || typeof entry.id !== 'string') return false;
      if (!entry?.node_type || typeof entry.node_type !== 'string') return false;
      if (!entry?.content || typeof entry.content !== 'object') return false;

      // Normalize common gotchas before validating
      let content = entry.content;
      if (entry.node_type === 'form' && content?.kind === 'FormContent') {
        const v = normalizeDash(String(content.version ?? ''));
        if (v !== 'v2-items') {
          content = { ...content, version: 'v2-items' };
        }
      }
      // Drop any accidental runtime instances prior to library validation
      content = stripRuntimeInstancesForLibrary(entry.node_type, content);

      return validateLibraryNodeContent(entry.node_type, content);
    } catch {
      return false;
    }
  }, []);

  /** Upsert entry to app.node_library (TEMPLATE ONLY) */
  const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);

    try {
      // Sanitize content for library (drop instances, normalize form version & dash)
      let sanitizedContent = stripRuntimeInstancesForLibrary(entry.node_type, entry.content);
      if (entry.node_type === 'form' && sanitizedContent?.kind === 'FormContent') {
        const v = normalizeDash(String(sanitizedContent.version ?? ''));
        if (v !== 'v2-items') sanitizedContent = { ...sanitizedContent, version: 'v2-items' };
      }

      // Validate the sanitized (template-only) shape
      const tempEntry = { ...entry, content: sanitizedContent };
      const isValid = await validateEntry(tempEntry);
      if (!isValid) throw new Error('Invalid content structure for node type');

      // Enforce lib_ prefix (many schemas enforce this)
      const id = entry.id.startsWith('lib_') ? entry.id : `lib_${entry.id}`;

      // Minimal, DB-safe payload (avoid 400 Bad Request)
      const payload: any = {
        id,
        node_type: entry.node_type,
        content: sanitizedContent,
        // include defaults in case table has NOT NULL constraints
        version: (entry as any).version ?? 1,
        active: (entry as any).active ?? true,
      };

      const { error } = await supabase
        // @ts-ignore
        .schema('app' as any)
        .from('node_library')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('node_library upsert error:', error);
        throw error;
      }

      toast({ title: 'Success', description: 'Node library entry saved successfully' });
      await fetchEntries();
      return true;
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
    // initial load
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
