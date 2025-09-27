import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/** ===== 3C validators: LIBRARY is template-only (no `instances[]`) ===== **/

function isValidGroupContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'GroupContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!Array.isArray(c.children)) return false;     // template children required
  if ('instances' in c) return false;               // runtime-only
  if (c.collection) {
    const col = c.collection;
    if (col.default_instances != null && typeof col.default_instances !== 'number') return false;
    if (col.min != null && typeof col.min !== 'number') return false;
    if (col.max != null && typeof col.max !== 'number') return false;
  }
  return c.children.every((id: any) => typeof id === 'string' && id.length > 0);
}

function isValidFormContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'FormContent' || c.version !== 'v2-items') return false;
  if (!Array.isArray(c.items)) return false;

  const checkItems = (items: any[]): boolean => (items || []).every((it: any) => {
    if (it.kind === 'FieldItem') {
      return typeof it.path === 'string' && typeof it.ref === 'string';
    }
    if (it.kind === 'SectionItem') {
      return typeof it.path === 'string' && Array.isArray(it.children) && checkItems(it.children);
    }
    if (it.kind === 'CollectionFieldItem') {
      // template-only: no instances in library
      if ('instances' in it) return false;
      return typeof it.path === 'string'
        && typeof it.ref === 'string'
        && typeof it.default_instances === 'number';
    }
    if (it.kind === 'CollectionSection') {
      // template-only: no instances in library
      if ('instances' in it) return false;
      return typeof it.path === 'string'
        && Array.isArray(it.children)
        && checkItems(it.children)
        && typeof it.default_instances === 'number';
    }
    return false;
  });

  return checkItems(c.items);
}

/** Defensive: drop any runtime `instances[]` from content before saving to library */
function stripRuntimeInstancesForLibrary(nodeType: string, content: any): any {
  if (!content) return content;

  if (nodeType === 'group') {
    if (content && typeof content === 'object') {
      const c = { ...content };
      if ('instances' in c) delete c.instances;
      return c;
    }
    return content;
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
      return { ...content, items: cleanseItems(content.items || []) };
    }
  }

  return content;
}




function isValidGroupContent(c: any): boolean {
  if (!c || c.kind !== 'GroupContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;

  const hasChildren = Array.isArray(c.children);
  const hasCollection = !!c.collection || Array.isArray(c.instances);

  // Must be one or the other (or empty allowed)
  if (hasChildren && hasCollection) return false;

  // Regular group
  if (hasChildren) {
    return c.children.every((id: any) => typeof id === 'string' && id.length > 0);
  }

  // Collection group
  if (hasCollection) {
    if (!Array.isArray(c.instances)) return false;
    for (const inst of c.instances) {
      if (!inst || typeof inst.i !== 'number' || inst.i < 1) return false;
      if (typeof inst.idx !== 'number' || inst.idx < 1) return false;
      if (!Array.isArray(inst.children)) return false;
      if (!inst.children.every((id: any) => typeof id === 'string' && id.length > 0)) return false;
    }
  }

  // Allow an empty group (no children/instances) as a placeholder
  return true;
}

function isValidMediaContentTemplate(c: any): boolean {
  if (!c || c.kind !== 'MediaContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!['image','video','audio','file'].includes(String(c.type))) return false;

  if (c.selected_version_idx != null && typeof c.selected_version_idx !== 'number') return false;

  if (c.versions != null) {
    if (!Array.isArray(c.versions)) return false;
    for (const v of c.versions) {
      if (!v || v.kind !== 'MediaVersion') return false;
      if (typeof v.idx !== 'number' || v.idx < 1) return false;
      if (v.uri != null && typeof v.uri !== 'string') return false;
    }
  }
  return true; // zero versions is allowed
}




// --- SSOT validator for MediaContent ---
function isValidMediaContent(c: any): boolean {
  // root shape
  if (!c || c.kind !== 'MediaContent') return false;
  if (typeof c.path !== 'string' || !c.path.length) return false;
  if (!['image','video','audio'].includes(c.type)) return false;
  if (!Array.isArray(c.versions)) return false;
  if (typeof c.selected_version_idx !== 'number') return false;

  // zero versions: allowed
  if (c.versions.length === 0) return true;

  // versions present → each must be a MediaVersion with a MediaItem
  let maxIdx = 0;
  for (const v of c.versions) {
    if (!v || v.kind !== 'MediaVersion') return false;
    if (typeof v.idx !== 'number' || v.idx < 1) return false;
    maxIdx = Math.max(maxIdx, v.idx);

    const it = v.item;
    if (!it || typeof it !== 'object') return false;

    // item kind must match type
    if (c.type === 'image' && it.kind !== 'ImageItem') return false;
    if (c.type === 'video' && it.kind !== 'VideoItem') return false;
    if (c.type === 'audio' && it.kind !== 'AudioItem') return false;

    // uri must be a string (allow empty if you want to save a stub)
    if (typeof it.uri !== 'string') return false;
  }

  // selected_version_idx must be within range when versions exist
  if (c.selected_version_idx < 1 || c.selected_version_idx > maxIdx) return false;
  return true;
}


export interface NodeLibraryEntry {
  id: string;
  node_type: 'form' | 'media' | 'group';
  content: Record<string, any>;
  payload_validate?: Record<string, any> | null;
  payload_generate?: Record<string, any> | null;
  validate_n8n_id?: string | null;
  generate_n8n_id?: string | null;
  active: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface N8NFunction {
  id: string;
  name: string;
  kind: string;
  active: boolean;
}

export function useNodeLibrary() {
  const [entries, setEntries] = useState<NodeLibraryEntry[]>([]);
  const [n8nFunctions, setN8NFunctions] = useState<N8NFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('app' as any)
        .from('node_library')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch node library';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchN8NFunctions = useCallback(async () => {
    try {
      console.log('🔄 Fetching N8N functions...');
      
      const { data, error } = await supabase.functions.invoke('list-n8n-functions');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('📊 N8N functions response:', data);
      
      setN8NFunctions(data?.data || []);
      console.log('✅ N8N functions loaded:', data?.data?.length || 0);
    } catch (err) {
      console.error('❌ Error fetching n8n functions:', err);
      setN8NFunctions([]);
    }
  }, []);

const validateEntry = useCallback(async (entry: any) => {
  try {
    if (!entry?.id || typeof entry.id !== 'string') return false;
    if (!entry?.node_type || typeof entry.node_type !== 'string') return false;
    if (!entry?.content || typeof entry.content !== 'object') return false;

    switch (entry.node_type) {
      case 'group':
        return isValidGroupContentTemplate(entry.content);   // template-only, no instances[]
      case 'form':
        return isValidFormContentTemplate(entry.content);    // template-only, no instances[]
      case 'media':
        return isValidMediaContentTemplate(entry.content);   // allows zero versions
      default:
        return true; // other node types: permissive
    }
  } catch {
    return false;
  }
}, []);



    const saveEntry = useCallback(async (entry: Omit<NodeLibraryEntry, 'created_at' | 'updated_at'>) => {
      setLoading(true);
      setError(null);
    
      try {
        // Strip any runtime instances before validating/saving to LIBRARY
        const sanitizedContent = stripRuntimeInstancesForLibrary(entry.node_type, entry.content);
        const sanitizedEntry = { ...entry, content: sanitizedContent };
    
        // Validate (template-only)
        const isValid = await validateEntry(sanitizedEntry);
        if (!isValid) {
          throw new Error('Invalid content structure for node type');
        }
    
        // 🔴 IMPORTANT: Only send columns that exist in app.node_library
        const payload = {
          id: sanitizedEntry.id,
          node_type: sanitizedEntry.node_type,
          content: sanitizedEntry.content,
          // include these ONLY if your table actually has them:
          // version: (sanitizedEntry as any).version,
          // active: (sanitizedEntry as any).active,
        };
    
        const { error } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('node_library')
          .upsert(payload, { onConflict: 'id' });
    
        if (error) throw error;
    
        toast({
          title: 'Success',
          description: 'Node library entry saved successfully',
        });
    
        await fetchEntries();
        return true;
      } catch (err: any) {
        const msg = err?.message || 'Failed to save node library entry';
        console.error('saveEntry error:', err);
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
        return false;
      } finally {
        setLoading(false);
      }
    }, [fetchEntries, toast, validateEntry]);




  return {
    entries,
    n8nFunctions,
    loading,
    error,
    fetchEntries,
    fetchN8NFunctions,
    saveEntry,
    deleteEntry,
    validateEntry,
  };
}
