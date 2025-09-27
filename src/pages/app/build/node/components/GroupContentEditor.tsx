// src/pages/app/build/node/components/GroupContentEditor.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FolderTree, RefreshCw } from 'lucide-react';

/* ===================== SSOT contracts ===================== */
type I18nText = { fallback: string; key?: string };
type GroupCollection = {
  min?: number;
  max?: number;
  default_instances?: number;   // how many clones to materialize at job time
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  label_template?: string;
};
type GroupContent = {
  kind: 'GroupContent';
  path: string;
  label?: I18nText;
  description?: I18nText;
  // template children (library node ids) — used for both regular & collection
  children: string[];
  // collection config (no instances in library)
  collection?: GroupCollection;
};

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ===================== Helpers ===================== */
type LibNode = { id: string; node_type: string };
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));

function normalize(raw: any): GroupContent {
  const out: GroupContent = {
    kind: 'GroupContent',
    path: typeof raw?.path === 'string' && raw.path.length ? raw.path : 'group',
    label: raw?.label,
    description: raw?.description,
    children: Array.isArray(raw?.children) ? raw.children : [],
    collection: raw?.collection ? { ...raw.collection } : undefined,
  };

  // NEVER keep instances in the library shape
  if ('instances' in (raw || {})) {
    // ignore at library level
  }

  return sanitize(out);
}

function sanitize(c: GroupContent): GroupContent {
  const out: GroupContent = {
    kind: 'GroupContent',
    path: c.path || 'group',
    label: c.label,
    description: c.description,
    children: uniq(c.children ?? []),
    collection: c.collection ? { ...c.collection } : undefined,
  };

  // ensure defaults but do NOT add instances
  if (out.collection) {
    if (out.collection.default_instances == null) out.collection.default_instances = 1;
    if (!out.collection.label_template) out.collection.label_template = 'Instance #{i}';
  }

  return out;
}

/* ===================== Library Picker (dropdown, no search) ===================== */
function LibraryPicker({
  selected,
  onChange,
  label = 'Children',
  hint,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const [schema, setSchema] = useState<'app' | 'public'>('app');
  const [typeFilter, setTypeFilter] = useState<'all' | 'form' | 'group' | 'media'>('all');
  const [rows, setRows] = useState<LibNode[]>([]);
  const [pickId, setPickId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchLib = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      let query = supabase
        // @ts-ignore
        .schema(schema as any)
        .from('node_library')
        .select('id, node_type')
        .order('id', { ascending: true })
        .limit(500);

      if (typeFilter !== 'all') query = query.eq('node_type', typeFilter);

      const { data, error } = await query;
      if (error) throw error;
      setRows((data ?? []) as any);
    } catch (e: any) {
      console.error('Library fetch error:', e);
      setRows([]);
      setErr(typeof e?.message === 'string' ? e.message : 'Failed to load node library');
    } finally {
      setLoading(false);
    }
  }, [schema, typeFilter]);

  useEffect(() => { fetchLib(); }, [fetchLib]);

  const addPick = () => {
    if (!pickId) return;
    onChange(uniq([...(selected ?? []), pickId]));
    setPickId('');
  };

  const remove = (id: string) => onChange((selected ?? []).filter(x => x !== id));

  const map = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            <div className="text-sm font-medium">{label}</div>
            <Badge variant="outline" className="ml-2">{rows.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* schema toggle */}
            <Select value={schema} onValueChange={(v: any) => setSchema(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="app">app</SelectItem>
                <SelectItem value="public">public</SelectItem>
              </SelectContent>
            </Select>

            {/* type filter */}
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all types</SelectItem>
                <SelectItem value="form">form</SelectItem>
                <SelectItem value="group">group</SelectItem>
                <SelectItem value="media">media</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchLib} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {err && <div className="text-xs text-destructive">{err}</div>}

        <div className="flex items-center gap-2">
          <Select value={pickId} onValueChange={(v) => setPickId(v)}>
            <SelectTrigger className="w-[32rem]">
              <SelectValue placeholder={loading ? 'Loading…' : 'Choose a node'} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {rows.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id} — {r.node_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addPick} disabled={!pickId || loading}>
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {(selected ?? []).length === 0 ? (
          <div className="text-xs text-muted-foreground">No children selected yet.</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {(selected ?? []).map((id) => {
              const r = map.get(id);
              return (
                <Badge key={id} variant="secondary" className="gap-2">
                  {id} — {r?.node_type || 'node'}
                  <button onClick={() => remove(id)} className="text-destructive">×</button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ===================== Main ===================== */
export function GroupContentEditor({ content, onChange }: Props) {
  const [state, setState] = useState<GroupContent>(() => normalize(content || {}));
  const [isCollection, setIsCollection] = useState<boolean>(() => !!content?.collection);

  // push baseline on mount
  useEffect(() => {
    onChange(sanitize(state) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync from parent
  useEffect(() => {
    const next = normalize(content || {});
    setState(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    setIsCollection(!!content?.collection);
  }, [content]);

  const commit = (updater: (prev: GroupContent) => GroupContent) => {
    setState(prev => {
      const next = sanitize(updater(prev));
      onChange(next as any);
      return next;
    });
  };

  const setChildren = (ids: string[]) =>
    commit(prev => ({ ...prev, children: ids }));

  const setCollectionOnOff = (on: boolean) => {
    setIsCollection(on);
    if (on) {
      // turn ON: keep children (template), attach a default collection config
      commit(prev => ({
        ...prev,
        collection: {
          ...(prev.collection ?? {}),
          default_instances: prev.collection?.default_instances ?? 1,
          allow_add: prev.collection?.allow_add ?? true,
          allow_remove: prev.collection?.allow_remove ?? true,
          allow_reorder: prev.collection?.allow_reorder ?? true,
          label_template: prev.collection?.label_template ?? 'Instance #{i}',
        },
      }));
    } else {
      // turn OFF: remove collection config, keep children as regular group
      commit(prev => {
        const clone = { ...prev };
        delete (clone as any).collection;
        return clone;
      });
    }
  };

  const setCollectionField = <K extends keyof GroupCollection>(k: K, v: GroupCollection[K]) =>
    commit(prev => ({ ...prev, collection: { ...(prev.collection ?? {}), [k]: v } }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Group Node Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Build a regular group (single children list) or a <strong>collection</strong> template that will be duplicated at job time.
        </p>
      </div>

      {/* properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Path</Label>
              <Input
                value={state.path}
                onChange={(e) => commit(prev => ({ ...prev, path: e.target.value || 'group' }))}
                placeholder="group"
              />
              <p className="text-xs text-muted-foreground">Used by addressing (e.g., items.group).</p>
            </div>

            <div className="space-y-2">
              <Label>Use Collection</Label>
              <div className="flex items-center gap-3">
                <Switch checked={isCollection} onCheckedChange={setCollectionOnOff} />
                <span className="text-sm">{isCollection ? 'Collection (template only)' : 'Regular group'}</span>
              </div>
              <p className="text-xs text-muted-foreground">When ON, these children form the template duplicated at job time.</p>
            </div>

            <div className="space-y-2">
              <Label>Optional Label (i18n fallback)</Label>
              <Input
                value={state.label?.fallback ?? ''}
                onChange={(e) => commit(prev => ({ ...prev, label: { ...(prev.label ?? {}), fallback: e.target.value || '' } }))}
                placeholder=""
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template children — ALWAYS visible */}
      <LibraryPicker
        selected={state.children ?? []}
        onChange={setChildren}
        label={isCollection ? 'Template Children (library nodes)' : 'Children (library nodes)'}
        hint={isCollection ? 'These nodes will be duplicated per instance at job time.' : 'Pick any node types, including other groups.'}
      />

      {/* Collection settings (only when ON) */}
      {isCollection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Min</Label>
                <Input
                  type="number"
                  value={state.collection?.min ?? ''}
                  onChange={(e) => setCollectionField('min', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="—"
                />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input
                  type="number"
                  value={state.collection?.max ?? ''}
                  onChange={(e) => setCollectionField('max', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="—"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Instances</Label>
                <Input
                  type="number"
                  value={state.collection?.default_instances ?? 1}
                  onChange={(e) => setCollectionField('default_instances', e.target.value === '' ? 1 : Number(e.target.value))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Label Template</Label>
                <Input
                  value={state.collection?.label_template ?? 'Instance #{i}'}
                  onChange={(e) => setCollectionField('label_template', e.target.value || 'Instance #{i}')}
                  placeholder="Instance #{i}"
                />
              </div>
              <div className="space-y-2">
                <Label>Controls</Label>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection?.allow_add}
                      onChange={(e) => setCollectionField('allow_add', e.target.checked)}
                    />
                    add
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection?.allow_remove}
                      onChange={(e) => setCollectionField('allow_remove', e.target.checked)}
                    />
                    remove
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection?.allow_reorder}
                      onChange={(e) => setCollectionField('allow_reorder', e.target.checked)}
                    />
                    reorder
                  </label>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Instances are created when the node is materialized for a job (using <code>default_instances</code>). No instances are stored in the library.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default GroupContentEditor;
