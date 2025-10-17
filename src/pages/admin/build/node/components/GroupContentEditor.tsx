// src/pages/app/build/node/components/GroupContentEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FolderTree, Layers, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeLibrary } from '@/hooks/useNodeLibrary';

/**
 * GroupContentEditor — SSOT-aligned (per ai_scenes_node_contracts)
 * - Regular Group:
 *   { kind:'Group', path, label?, children:string[], x_ui?, x_meta? }
 * - Collection Group (builder enforces EXACTLY ONE instance as a template):
 *   {
 *     kind:'Group', path, label?,
 *     collection:{
 *       min?:number, max?:number, default_instances?:number,
 *       allow_add?:boolean, allow_remove?:boolean, allow_reorder?:boolean,
 *       label_template?:string
 *     },
 *     instances:[{ i:1, idx?:number, label?:I18nText, children:string[] }],
 *     x_ui?, x_meta?
 *   }
 *
 * - Children are picked from a dropdown list of node library entries (no free typing).
 * - Verbose debug logs with [GroupBuilder].
 */

type I18nText = { fallback: string; key?: string };

type GroupRegular = {
  kind: 'Group';
  path: string;
  label?: I18nText;
  children: string[];
  x_ui?: { arrangeable?: boolean };
  x_meta?: { description?: I18nText };
};

type GroupInstance = {
  i: number; // always 1 in builder
  idx?: number;
  label?: I18nText;
  children: string[];
};

type GroupCollection = {
  kind: 'Group';
  path: string;
  label?: I18nText;
  collection: {
    min?: number;
    max?: number;
    default_instances?: number;
    allow_add?: boolean;
    allow_remove?: boolean;
    allow_reorder?: boolean;
    label_template?: string;
  };
  instances: GroupInstance[]; // builder enforces [ { i:1, ... } ]
  x_ui?: { arrangeable?: boolean };
  x_meta?: { description?: I18nText };
};

type GroupContent = GroupRegular | GroupCollection;

interface GroupContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ---------------- utils ---------------- */

const numOrUndef = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const strOrUndef = (v: any) => (typeof v === 'string' && v.trim() !== '' ? v : undefined);
const boolFromAny = (v: any) => !!v;

function isCollectionGroup(c: GroupContent): c is GroupCollection {
  return !!(c as any)?.collection && Array.isArray((c as any)?.instances);
}

function normalize(content: GroupContent): GroupContent {
  const basePath = content.path?.trim() || 'group';

  if (isCollectionGroup(content)) {
    // Enforce exactly ONE instance template (i=1)
    const first = content.instances?.[0] ?? ({ i: 1, children: [] } as GroupInstance);
    const only: GroupInstance = {
      i: 1,
      idx: first.idx,
      label: first.label
        ? { fallback: first.label.fallback ?? '', key: strOrUndef(first.label.key) }
        : undefined,
      children: Array.isArray(first.children) ? first.children : [],
    };
    const col = content.collection || {};
    const out: GroupCollection = {
      kind: 'Group',
      path: basePath,
      label: content.label
        ? { fallback: content.label.fallback ?? '', key: strOrUndef(content.label.key) }
        : undefined,
      collection: {
        min: numOrUndef(col.min),
        max: numOrUndef(col.max),
        default_instances: numOrUndef(col.default_instances),
        allow_add: col.allow_add === undefined ? undefined : boolFromAny(col.allow_add),
        allow_remove: col.allow_remove === undefined ? undefined : boolFromAny(col.allow_remove),
        allow_reorder: col.allow_reorder === undefined ? undefined : boolFromAny(col.allow_reorder),
        label_template: strOrUndef(col.label_template),
      },
      instances: [only],
      x_ui: content.x_ui,
      x_meta: content.x_meta,
    };
    return out;
  }

  // Regular group
  const out: GroupRegular = {
    kind: 'Group',
    path: basePath,
    label: content.label
      ? { fallback: content.label.fallback ?? '', key: strOrUndef(content.label.key) }
      : undefined,
    children: Array.isArray((content as any).children) ? (content as any).children : [],
    x_ui: content.x_ui,
    x_meta: content.x_meta,
  };
  return out;
}

/** Accept legacy-ish shapes and convert to SSOT */
function migrateLegacy(raw: any): GroupContent {
  console.debug('[GroupBuilder] 🧪 migrateLegacy input:', raw);

  if (raw && raw.kind === 'Group') {
    const normalized = normalize(raw as GroupContent);
    console.debug('[GroupBuilder] ✅ already Group; normalized:', normalized);
    return normalized;
  }

  // Minimal fallback
  const minimal: GroupRegular = {
    kind: 'Group',
    path: (raw?.path ?? 'group') as string,
    label: raw?.label && typeof raw.label === 'object'
      ? { fallback: raw.label.fallback ?? '', key: strOrUndef(raw.label.key) }
      : undefined,
    children: Array.isArray(raw?.children) ? raw.children : [],
    x_ui: raw?.arrangeable != null ? { arrangeable: !!raw.arrangeable } : undefined,
    x_meta: raw?.description ? { description: raw.description } : undefined,
  };
  const normalized = normalize(minimal);
  console.debug('[GroupBuilder] 🔁 migrated legacy → SSOT:', normalized);
  return normalized;
}

/* ---------------- component ---------------- */

export function GroupContentEditor({ content, onChange }: GroupContentEditorProps) {
  const ck = useMemo(() => JSON.stringify(content || {}), [content]);
  const initial = useMemo(() => migrateLegacy(content), [ck]);
  const [state, setState] = useState<GroupContent>(initial);
  const [mode, setMode] = useState<'regular' | 'collection'>(isCollectionGroup(initial) ? 'collection' : 'regular');

  // Node library (for dropdowns)
  const { entries, fetchEntries } = useNodeLibrary();
  useEffect(() => { fetchEntries().catch(() => void 0); }, [fetchEntries]);
  const nodeOptions = useMemo(
    () => (entries || []).map((e: any) => ({ id: e.id, label: e.name ? `${e.name} • ${e.id}` : e.id })),
    [entries]
  );

  useEffect(() => {
    const next = migrateLegacy(content);
    setState(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
    setMode(isCollectionGroup(next) ? 'collection' : 'regular');
  }, [ck]);

  const emit = (updater: (prev: GroupContent) => GroupContent) => {
    setState(prev => {
      const next = normalize(updater(prev));
      console.debug('[GroupBuilder] 📤 onChange', next);
      onChange(next as unknown as Record<string, any>);
      return next;
    });
  };

  /* --------- basic handlers --------- */

  const updatePath = (p: string) => {
    const safe = p?.trim() || 'group';
    emit(prev => ({ ...prev, path: safe }));
    console.debug('[GroupBuilder] 🧭 path →', safe);
  };

  const updateLabel = (field: 'fallback' | 'key', val: string) => {
    emit(prev => {
      const label: I18nText = {
        fallback: field === 'fallback' ? val : (prev as any).label?.fallback ?? '',
        key: field === 'key' ? strOrUndef(val) : (prev as any).label?.key
      };
      return { ...prev, label };
    });
  };

  const updateArrangeable = (val: boolean) => {
    emit(prev => {
      const x_ui = { ...(prev as any).x_ui, arrangeable: val };
      return { ...prev, x_ui };
    });
  };

  const updateDescription = (field: 'fallback' | 'key', val: string) => {
    emit(prev => {
      const prevDesc = (prev as any)?.x_meta?.description || {};
      const desc: I18nText = {
        fallback: field === 'fallback' ? val : (prevDesc.fallback ?? ''),
        key: field === 'key' ? strOrUndef(val) : prevDesc.key
      };
      const x_meta = { ...(prev as any).x_meta, description: desc };
      return { ...prev, x_meta };
    });
  };

  const toggleMode = (newMode: 'regular' | 'collection') => {
    setMode(newMode);
    emit(prev => {
      if (newMode === 'collection') {
        console.debug('[GroupBuilder] 🔁 mode regular → collection (init 1 instance template)');
        const firstChildren = !isCollectionGroup(prev) ? (prev.children || []) : (prev.instances?.[0]?.children || []);
        const col: GroupCollection = {
          kind: 'Group',
          path: prev.path,
          label: (prev as any).label,
          collection: {
            min: 1,
            default_instances: 1,
            allow_add: true,
            allow_remove: true,
            allow_reorder: true,
            label_template: undefined,
          },
          instances: [{ i: 1, children: [...firstChildren] }],
          x_ui: (prev as any).x_ui,
          x_meta: (prev as any).x_meta,
        };
        return col;
      } else {
        console.debug('[GroupBuilder] 🔁 mode collection → regular');
        const reg: GroupRegular = {
          kind: 'Group',
          path: prev.path,
          label: (prev as any).label,
          children: isCollectionGroup(prev) && prev.instances?.[0]?.children ? [...prev.instances[0].children] : [],
          x_ui: (prev as any).x_ui,
          x_meta: (prev as any).x_meta,
        };
        return reg;
      }
    });
  };

  /* --------- CHILDREN (REGULAR) — dropdown add + badges list --------- */

  const addChildRegularFromSelect = (nodeId: string) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const children = [...(prev as GroupRegular).children, nodeId];
      return { ...(prev as GroupRegular), children };
    });
    console.debug('[GroupBuilder] ➕ add child (regular):', nodeId);
  };

  const removeChildRegular = (idx: number) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const children = [...(prev as GroupRegular).children];
      children.splice(idx, 1);
      return { ...(prev as GroupRegular), children };
    });
    console.debug('[GroupBuilder] 🗑️ remove child (regular) idx:', idx);
  };

  /* --------- CHILDREN (COLLECTION TEMPLATE) — dropdown add + badges list --------- */

  const addChildInstanceFromSelect = (nodeId: string) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0] || { i: 1, children: [] as string[] };
      const nextIns = [{ ...ins, i: 1, children: [...ins.children, nodeId] }];
      return { ...pc, instances: nextIns };
    });
    console.debug('[GroupBuilder] ➕ add child (collection template):', nodeId);
  };

  const removeChildInstance = (idx: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0];
      const children = [...ins.children];
      children.splice(idx, 1);
      const nextIns = [{ ...ins, i: 1, children }];
      return { ...pc, instances: nextIns };
    });
    console.debug('[GroupBuilder] 🗑️ remove child (collection template) idx:', idx);
  };

  /* --------- COLLECTION PROPERTY setters --------- */

  const setCollectionField = <K extends keyof GroupCollection['collection']>(k: K, v: GroupCollection['collection'][K]) => {
    emit(prev => {
      const pc: GroupCollection = isCollectionGroup(prev)
        ? prev as GroupCollection
        : {
            kind: 'Group',
            path: prev.path,
            label: (prev as any).label,
            collection: {},
            instances: [{ i: 1, children: [] }],
            x_ui: (prev as any).x_ui,
            x_meta: (prev as any).x_meta,
          };
      return { ...pc, collection: { ...pc.collection, [k]: v } };
    });
  };

  const setInstanceIdx = (idxVal?: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0];
      const nextIns = [{ ...ins, i: 1, idx: idxVal }];
      return { ...pc, instances: nextIns };
    });
  };

  const setInstanceLabel = (field: 'fallback' | 'key', value: string) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0];
      const label: I18nText = {
        fallback: field === 'fallback' ? value : (ins.label?.fallback ?? ''),
        key: field === 'key' ? strOrUndef(value) : ins.label?.key
      };
      const nextIns = [{ ...ins, i: 1, label }];
      return { ...pc, instances: nextIns };
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Group Configuration</h3>
          <p className="text-sm text-muted-foreground">SSOT-aligned. In collection mode you define ONE template instance; the job builder will duplicate it.</p>
        </div>

        {/* Basics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FolderTree className="w-4 h-4" /> Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label>Mode</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant={mode === 'regular' ? 'default' : 'outline'} size="sm" onClick={() => toggleMode('regular')}>
                  Regular
                </Button>
                <Button type="button" variant={mode === 'collection' ? 'default' : 'outline'} size="sm" onClick={() => toggleMode('collection')}>
                  Collection
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Path</Label>
              <Input value={state.path} onChange={(e) => updatePath(e.target.value)} placeholder="group" />
            </div>

            <div className="space-y-2">
              <Label>Label (fallback)</Label>
              <Input
                value={(state as any).label?.fallback ?? ''}
                onChange={(e) => updateLabel('fallback', e.target.value)}
                placeholder="Group title shown in UI"
              />
            </div>

            <div className="space-y-2">
              <Label>Label (i18n key)</Label>
              <Input
                value={(state as any).label?.key ?? ''}
                onChange={(e) => updateLabel('key', e.target.value)}
                placeholder="app.groups.my_group"
              />
            </div>

            <div className="space-y-2">
              <Label>Arrangeable (UI)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!(state as any)?.x_ui?.arrangeable}
                  onChange={(e) => updateArrangeable(e.target.checked)}
                />
                <span className="text-sm text-muted-foreground">UI-only flag (not validated by SSOT)</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description (fallback)</Label>
              <Input
                value={(state as any)?.x_meta?.description?.fallback ?? ''}
                onChange={(e) => updateDescription('fallback', e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (i18n key)</Label>
              <Input
                value={(state as any)?.x_meta?.description?.key ?? ''}
                onChange={(e) => updateDescription('key', e.target.value)}
                placeholder="app.groups.my_group.description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Regular children — dropdown add + badges list */}
        {mode === 'regular' && !isCollectionGroup(state) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4" /> Children (node library)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Add node from library</Label>
                <Select onValueChange={(v) => addChildRegularFromSelect(v)}>
                  <SelectTrigger><SelectValue placeholder="Select a node…" /></SelectTrigger>
                  <SelectContent>
                    {nodeOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {state.children.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3">
                  No children yet. Use the selector above to add nodes.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {state.children.map((cid, idx) => (
                    <Badge key={`${cid}-${idx}`} variant="secondary" className="flex items-center gap-2">
                      <span className="truncate max-w-[220px]">{cid}</span>
                      <button aria-label="remove" className="ml-1 hover:opacity-70" onClick={() => removeChildRegular(idx)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Collection: settings + ONE template instance (i=1) */}
        {mode === 'collection' && isCollectionGroup(state) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collection settings</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={(state.collection.min ?? '') as any}
                    onChange={(e) => setCollectionField('min', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={(state.collection.max ?? '') as any}
                    onChange={(e) => setCollectionField('max', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default instances</Label>
                  <Input
                    type="number"
                    value={(state.collection.default_instances ?? '') as any}
                    onChange={(e) => setCollectionField('default_instances', e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    placeholder="e.g., 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allow add</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection.allow_add}
                      onChange={(e) => setCollectionField('allow_add', e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">Allow adding instances in job builder</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allow remove</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection.allow_remove}
                      onChange={(e) => setCollectionField('allow_remove', e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">Allow removing instances in job builder</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allow reorder</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!state.collection.allow_reorder}
                      onChange={(e) => setCollectionField('allow_reorder', e.target.checked)}
                    />
                    <span className="text-sm text-muted-foreground">Allow drag-reordering in job builder</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label>Label template</Label>
                  <Input
                    value={state.collection.label_template ?? ''}
                    onChange={(e) => setCollectionField('label_template', e.target.value || undefined)}
                    placeholder="e.g., Shot #{i}"
                  />
                  <p className="text-[11px] text-muted-foreground">Supports <code>#{'{i}'}</code> to insert 1-based instance index.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template instance (i1)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Instance idx (optional)</Label>
                  <Input
                    type="number"
                    value={(state.instances[0]?.idx ?? '') as any}
                    onChange={(e) => setInstanceIdx(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="e.g., 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instance label (fallback)</Label>
                  <Input
                    value={state.instances[0]?.label?.fallback ?? ''}
                    onChange={(e) => setInstanceLabel('fallback', e.target.value)}
                    placeholder="e.g., Shot A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instance label (i18n key)</Label>
                  <Input
                    value={state.instances[0]?.label?.key ?? ''}
                    onChange={(e) => setInstanceLabel('key', e.target.value)}
                    placeholder="app.groups.scene.shot_a"
                  />
                </div>

                {/* Template instance children — dropdown add + badges list */}
                <div className="md:col-span-3 space-y-2">
                  <div className="space-y-2">
                    <Label>Add node to template from library</Label>
                    <Select onValueChange={(v) => addChildInstanceFromSelect(v)}>
                      <SelectTrigger><SelectValue placeholder="Select a node…" /></SelectTrigger>
                      <SelectContent>
                        {nodeOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {(state.instances[0]?.children?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground border rounded-md p-3">
                      No children yet for this template instance. Use the selector above to add nodes.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {state.instances[0].children.map((cid, idx) => (
                        <Badge key={`${cid}-${idx}`} variant="secondary" className="flex items-center gap-2">
                          <span className="truncate max-w-[220px]">{cid}</span>
                          <button aria-label="remove" className="ml-1 hover:opacity-70" onClick={() => removeChildInstance(idx)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
