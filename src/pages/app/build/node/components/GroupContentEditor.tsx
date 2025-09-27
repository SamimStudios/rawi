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
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderTree,
  Layers,
  RefreshCw,
  Dot
} from 'lucide-react';

/* ===================== SSOT contracts ===================== */
type I18nText = { fallback: string; key?: string };
type GroupCollection = {
  min?: number;
  max?: number;
  default_instances?: number;
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  label_template?: string;
};
type GroupInstance = {
  i: number;
  idx: number;
  label?: string;
  children: string[]; // library node ids
};
type GroupContent = {
  kind: 'GroupContent';
  path: string;
  label?: I18nText;
  description?: I18nText;
  // regular
  children?: string[];
  // collection
  collection?: GroupCollection;
  instances?: GroupInstance[];
};

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ===================== Helpers ===================== */
type LibNode = { id: string; node_type: string; title?: string | null; active?: boolean | null; version?: number | null };
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));

function normalize(raw: any): GroupContent {
  const isCollection = !!raw?.collection || Array.isArray(raw?.instances);
  const content: GroupContent = {
    kind: 'GroupContent',
    path: typeof raw?.path === 'string' && raw.path.length ? raw.path : 'group',
    label: raw?.label,
    description: raw?.description,
    children: !isCollection ? (Array.isArray(raw?.children) ? raw.children : []) : undefined,
    collection: isCollection ? (raw?.collection ?? {}) : undefined,
    instances: isCollection
      ? (Array.isArray(raw?.instances)
          ? raw.instances.map((x: any, i: number) => ({
              i: typeof x?.i === 'number' ? x.i : i + 1,
              idx: typeof x?.idx === 'number' ? x.idx : i + 1,
              label: x?.label,
              children: Array.isArray(x?.children) ? x.children : [],
            }))
          : [])
      : undefined,
  };
  return sanitize(content);
}

function sanitize(c: GroupContent): GroupContent {
  const out = { ...c, kind: 'GroupContent', path: c.path || 'group' } as GroupContent;
  const collectionOn = !!out.collection || (out.instances && out.instances.length > 0);
  if (collectionOn) {
    delete (out as any).children;
    const inst = (out.instances ?? []).map((x, i) => ({
      ...x,
      i: i + 1,
      idx: i + 1,
      children: uniq(x.children ?? []),
    }));
    out.instances = inst;
    out.collection = out.collection ?? {};
  } else {
    delete (out as any).collection;
    delete (out as any).instances;
    out.children = uniq(out.children ?? []);
  }
  return out;
}

/* ===================== Library Picker ===================== */
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
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [rows, setRows] = useState<LibNode[]>([]);
  const [pickId, setPickId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchLib = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // note: keeping per-call schema to avoid changing global client (you said you also use public)
      let query = supabase
        // @ts-ignore
        .schema(schema as any)
        .from('node_library')
        .select('id, node_type, title, active, version')
        .order('title', { ascending: true })
        .limit(500);

      if (activeOnly) query = query.eq('active', true);
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
  }, [schema, typeFilter, activeOnly]);

  useEffect(() => { fetchLib(); }, [fetchLib]);

  const addPick = () => {
    if (!pickId) return;
    onChange(uniq([...(selected ?? []), pickId]));
    setPickId(''); // reset for next add
  };

  const remove = (id: string) => onChange((selected ?? []).filter(x => x !== id));

  // map for quick label lookup
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

            {/* active only */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">active</span>
              <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            </div>

            <Button variant="outline" size="sm" onClick={fetchLib} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {err && (
          <div className="text-xs text-destructive flex items-center gap-1">
            <Dot className="w-4 h-4" /> {err}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Select value={pickId} onValueChange={(v) => setPickId(v)}>
            <SelectTrigger className="w-[32rem]">
              <SelectValue placeholder={loading ? 'Loading…' : 'Choose a node'} />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {rows.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {(r.title || r.id.slice(0, 12))} — {r.node_type}{r.version != null ? ` v${r.version}` : ''}{r.active === false ? ' (inactive)' : ''}
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
                  {(r?.title || id.slice(0, 10))} — {r?.node_type || 'node'}
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
  const [isCollection, setIsCollection] = useState<boolean>(() => !!(content?.collection || content?.instances));

  // push baseline on mount
  useEffect(() => {
    onChange(sanitize(state) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync from parent
  useEffect(() => {
    const next = normalize(content || {});
    setState(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    setIsCollection(!!(content?.collection || content?.instances));
  }, [content]);

  const commit = (updater: (prev: GroupContent) => GroupContent) => {
    setState(prev => {
      const next = sanitize(updater(prev));
      onChange(next as any);
      return next;
    });
  };

  // regular children handlers
  const setChildren = (ids: string[]) =>
    commit(prev => ({ ...prev, children: ids, collection: undefined, instances: undefined }));

  // collection handlers
  const setCollectionOnOff = (on: boolean) => {
    setIsCollection(on);
    if (on) {
      commit(prev => ({
        ...prev,
        children: undefined,
        collection: {
          allow_add: true,
          allow_remove: true,
          allow_reorder: true,
          default_instances: 1,
          label_template: 'Instance #{i}',
        },
        instances: [{ i: 1, idx: 1, children: [] }],
      }));
    } else {
      commit(prev => ({ ...prev, collection: undefined, instances: undefined, children: [] }));
    }
  };

  const setCollectionField = <K extends keyof GroupCollection>(k: K, v: GroupCollection[K]) =>
    commit(prev => ({ ...prev, collection: { ...(prev.collection ?? {}), [k]: v } }));

  const addInstance = () =>
    commit(prev => ({
      ...prev,
      instances: [ ...(prev.instances ?? []), { i: (prev.instances?.length ?? 0) + 1, idx: (prev.instances?.length ?? 0) + 1, children: [] } ],
    }));

  const removeInstance = (iNum: number) =>
    commit(prev => ({
      ...prev,
      instances: (prev.instances ?? []).filter(x => x.i !== iNum).map((x, idx) => ({ ...x, i: idx + 1, idx: idx + 1 })),
    }));

  const moveInstance = (iNum: number, dir: -1 | 1) =>
    commit(prev => {
      const arr = [...(prev.instances ?? [])];
      const idx = arr.findIndex(x => x.i === iNum);
      if (idx < 0) return prev;
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return prev;
      const tmp = arr[idx];
      arr[idx] = arr[ni];
      arr[ni] = tmp;
      return { ...prev, instances: arr.map((x, i) => ({ ...x, i: i + 1, idx: i + 1 })) };
    });

  const setInstanceChildren = (iNum: number, ids: string[]) =>
    commit(prev => ({
      ...prev,
      instances: (prev.instances ?? []).map(x => (x.i === iNum ? { ...x, children: ids } : x)),
    }));

  const setInstanceLabel = (iNum: number, label: string) =>
    commit(prev => ({
      ...prev,
      instances: (prev.instances ?? []).map(x => (x.i === iNum ? { ...x, label: label || undefined } : x)),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Group Node Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Build a regular group (single children list) or a <strong>collection</strong> with multiple instances. You can nest other <em>groups</em> from the library.
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
                <span className="text-sm">{isCollection ? 'Collection' : 'Regular group'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Toggle between one list of children or instances with their own children.</p>
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

      {/* Regular Group */}
      {!isCollection && (
        <LibraryPicker
          selected={state.children ?? []}
          onChange={setChildren}
          label="Children (library nodes)"
          hint="Pick any node types, including other groups. Order will be preserved."
        />
      )}

      {/* Collection */}
      {isCollection && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Collection Settings
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={addInstance}>
                <Plus className="w-4 h-4 mr-2" />
                Add instance
              </Button>
            </div>
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
                  value={state.collection?.default_instances ?? ''}
                  onChange={(e) => setCollectionField('default_instances', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Label Template</Label>
                <Input
                  value={state.collection?.label_template ?? ''}
                  onChange={(e) => setCollectionField('label_template', e.target.value || undefined)}
                  placeholder="Instance #{i}"
                />
              </div>
              <div className="space-y-2">
                <Label>Controls</Label>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!state.collection?.allow_add} onChange={(e) => setCollectionField('allow_add', e.target.checked)} />
                    add
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!state.collection?.allow_remove} onChange={(e) => setCollectionField('allow_remove', e.target.checked)} />
                    remove
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!state.collection?.allow_reorder} onChange={(e) => setCollectionField('allow_reorder', e.target.checked)} />
                    reorder
                  </label>
                </div>
              </div>
            </div>

            {/* Instances */}
            {(state.instances ?? []).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No instances yet. Click <strong>Add instance</strong>.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {(state.instances ?? []).map((inst) => (
                  <Card key={inst.i}>
                    <CardHeader className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Instance #{inst.i}</Badge>
                        <Input
                          className="w-64"
                          placeholder="Optional label"
                          value={inst.label ?? ''}
                          onChange={(e) => setInstanceLabel(inst.i, e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveInstance(inst.i, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => moveInstance(inst.i, +1)}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeInstance(inst.i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <LibraryPicker
                        selected={inst.children}
                        onChange={(ids) => setInstanceChildren(inst.i, ids)}
                        label="Instance children (library nodes)"
                        hint="Pick any node types, including other groups."
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default GroupContentEditor;
