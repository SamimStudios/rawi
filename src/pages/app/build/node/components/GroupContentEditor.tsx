// src/pages/app/build/node/components/GroupContentEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layers, FolderTree } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNodeLibrary } from '@/hooks/useNodeLibrary';

/**
 * SSOT-aligned GroupContent editor
 *
 * Regular:
 *   { kind:'Group', path, label?, children: string[], x_ui?, x_meta? }
 *
 * Collection (template with exactly 1 instance in builder):
 *   { kind:'Group', path, label?, collection:{
 *       min:int, max:int, default_instances:int,
 *       allow_add:boolean, allow_remove:boolean, allow_reorder:boolean,
 *       label_template?: string  // may contain #{i}
 *     },
 *     instances: [{ i:1, idx?:number, label?:I18nText, children: string[] }],
 *     x_ui?, x_meta?
 *   }
 *
 * Notes:
 * - Builder enforces exactly ONE instance when in collection mode.
 * - Job builder will replicate that instance (not this screen).
 * - Children are selected from node-library list (id + name), not typed.
 * - Debug logs prefix: [GroupBuilder]
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
  i: number;                 // ALWAYS 1 in builder collection mode
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
  instances: GroupInstance[]; // builder enforces length === 1
  x_ui?: { arrangeable?: boolean };
  x_meta?: { description?: I18nText };
};

type GroupContent = GroupRegular | GroupCollection;

interface GroupContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ---------------- utils ---------------- */

function isCollectionGroup(c: GroupContent): c is GroupCollection {
  return !!(c as any)?.collection && Array.isArray((c as any)?.instances);
}

function normalize(content: GroupContent): GroupContent {
  const basePath = content.path?.trim() || 'group';

  if (isCollectionGroup(content)) {
    // ENFORCE: exactly one instance in builder
    const first = (content.instances && content.instances[0]) || { i: 1, children: [] as string[] } as GroupInstance;

    const only: GroupInstance = {
      i: 1,
      idx: first.idx,
      label: first.label && typeof first.label === 'object'
        ? { fallback: first.label.fallback ?? '', key: first.label.key }
        : undefined,
      children: Array.isArray(first.children) ? first.children : [],
    };

    const col = content.collection || {};
    const out: GroupCollection = {
      kind: 'Group',
      path: basePath,
      label: content.label && typeof content.label === 'object'
        ? { fallback: content.label.fallback ?? '', key: content.label.key }
        : undefined,
      collection: {
        min: numOrUndef(col.min),
        max: numOrUndef(col.max),
        default_instances: numOrUndef(col.default_instances),
        allow_add: boolOrUndef(col.allow_add),
        allow_remove: boolOrUndef(col.allow_remove),
        allow_reorder: boolOrUndef(col.allow_reorder),
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
    label: content.label && typeof content.label === 'object'
      ? { fallback: content.label.fallback ?? '', key: content.label.key }
      : undefined,
    children: Array.isArray((content as any).children) ? (content as any).children : [],
    x_ui: content.x_ui,
    x_meta: content.x_meta,
  };
  return out;
}

const numOrUndef = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v));
const boolOrUndef = (v: any) => (typeof v === 'boolean' ? v : v ? true : undefined);
const strOrUndef = (v: any) => (v && String(v).trim().length ? String(v) : undefined);

/** Accept legacy-ish shapes and convert to SSOT */
function migrateLegacy(raw: any): GroupContent {
  console.debug('[GroupBuilder] 🧪 migrateLegacy input:', raw);

  if (raw && raw.kind === 'Group') {
    const normalized = normalize(raw as GroupContent);
    console.debug('[GroupBuilder] ✅ already Group; normalized:', normalized);
    return normalized;
  }

  // Fallback minimal
  const minimal: GroupRegular = {
    kind: 'Group',
    path: (raw?.path ?? 'group') as string,
    label: raw?.label && typeof raw.label === 'object'
      ? { fallback: raw.label.fallback ?? '', key: raw.label.key }
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

  // Node options from library (for children selection)
  const { entries, fetchEntries } = useNodeLibrary();
  useEffect(() => { fetchEntries().catch(() => void 0); }, [fetchEntries]);
  const nodeOptions = useMemo(
    () => (entries || []).map(e => ({ id: e.id, label: e.name ? `${e.name} • ${e.id}` : e.id })),
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

  /* --------- handlers (top) --------- */

  const updatePath = (p: string) => {
    const safe = p?.trim() || 'group';
    emit(prev => ({ ...prev, path: safe }));
    console.debug('[GroupBuilder] 🧭 path →', safe);
  };

  const updateLabel = (field: 'fallback' | 'key', val: string) => {
    emit(prev => {
      const label = { ...(prev as any).label } as I18nText;
      if (field === 'fallback') label.fallback = val;
      else label.key = val || undefined;
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
      const desc: I18nText = {
        fallback: field === 'fallback' ? val : ((prev as any)?.x_meta?.description?.fallback ?? ''),
        key: field === 'key' ? (val || undefined) : ((prev as any)?.x_meta?.description?.key)
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
            max: undefined,
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

  /* --------- children pickers (select from list) --------- */

  const addChildRowRegular = () => {
    if (isCollectionGroup(state)) return;
    emit(prev => ({ ...(prev as GroupRegular), children: [...(prev as GroupRegular).children, '' ] }));
    console.debug('[GroupBuilder] ➕ add child row (regular)');
  };

  const setChildRegular = (row: number, nodeId: string) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const ch = [...(prev as GroupRegular).children];
      ch[row] = nodeId;
      return { ...(prev as GroupRegular), children: ch };
    });
  };

  const removeChildRegular = (row: number) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const ch = [...(prev as GroupRegular).children];
      ch.splice(row, 1);
      return { ...(prev as GroupRegular), children: ch };
    });
    console.debug('[GroupBuilder] 🗑️ remove child row (regular) idx', row);
  };

  // Collection: template single instance (i=1)
  const ensureCollection = (): GroupCollection => {
    if (isCollectionGroup(state)) return state as GroupCollection;
    // Shouldn't happen when in collection mode, but guard anyway
    return {
      kind: 'Group',
      path: state.path,
      label: (state as any).label,
      collection: { min: 1, default_instances: 1, allow_add: true, allow_remove: true, allow_reorder: true },
      instances: [{ i: 1, children: [] }],
      x_ui: (state as any).x_ui,
      x_meta: (state as any).x_meta,
    };
  };

  const setCollectionField = <K extends keyof GroupCollection['collection']>(k: K, v: GroupCollection['collection'][K]) => {
    emit(prev => {
      const pc = isCollectionGroup(prev) ? prev as GroupCollection : ensureCollection();
      return { ...pc, collection: { ...pc.collection, [k]: v } };
    });
  };

  const setChildInstance = (row: number, nodeId: string) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0]; // template
      const children = [...ins.children];
      children[row] = nodeId;
      const nextIns = [{ ...ins, i: 1, children }];
      return { ...pc, instances: nextIns };
    });
  };

  const addChildRowInstance = () => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0] || { i: 1, children: [] as string[] };
      const nextIns = [{ ...ins, i: 1, children: [...ins.children, ''] }];
      console.debug('[GroupBuilder] ➕ add child row (collection template)');
      return { ...pc, instances: nextIns };
    });
  };

  const removeChildRowInstance = (row: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const ins = pc.instances[0];
      const children = [...ins.children];
      children.splice(row, 1);
      const nextIns = [{ ...ins, i: 1, children }];
      console.debug('[GroupBuilder] 🗑️ remove child row (collection template) idx', row);
      return { ...pc, instances: nextIns };
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
        key: field === 'key' ? (value || undefined) : ins.label?.key
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
          <p className="text-sm text-muted-foreground">
            SSOT-aligned. Regular or Collection (template with exactly one instance).
          </p>
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
                <Button
                  type="button"
                  variant={mode === 'regular' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => toggleMode('regular')}
                >
                  Regular
                </Button>
                <Button
                  type="button"
                  variant={mode === 'collection' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => toggleMode('collection')}
                >
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

        {/* Regular children (select from list) */}
        {mode === 'regular' && !isCollectionGroup(state) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4" /> Children (node library)</CardTitle>
              <Button variant="secondary" size="sm" onClick={addChildRowRegular}>
                <Plus className="w-4 h-4 mr-1" /> Add child
              </Button>
            </CardHeader>
            <CardContent>
              {state.children.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3">
                  No children yet. Add nodes from your library.
                </div>
              ) : (
                <div className="space-y-3">
                  {state.children.map((cid, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto] gap-2">
                      <Select
                        value={cid || ''}
                        onValueChange={(v) => setChildRegular(idx, v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select a node…" /></SelectTrigger>
                        <SelectContent>
                          {nodeOptions.map(o => (
                            <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeChildRegular(idx)} aria-label={`Remove child ${idx + 1}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Collection: collection props + single template instance */}
        {mode === 'collection' && isCollectionGroup(state) && (
          <>
            {/* Collection properties (from SSOT) */}
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
                    <span className="text-sm text-muted-foreground">Can add instances in job builder</span>
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
                    <span className="text-sm text-muted-foreground">Can remove instances in job builder</span>
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
                    <span className="text-sm text-muted-foreground">Drag to reorder instances</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label>Label template</Label>
                  <Input
                    value={state.collection.label_template ?? ''}
                    onChange={(e) => setCollectionField('label_template', e.target.value || undefined)}
                    placeholder="e.g., 'Shot #{i}'"
                  />
                  <p className="text-[11px] text-muted-foreground">Supports <code>#{'{i}'}</code> for the 1-based instance number.</p>
                </div>
              </CardContent>
            </Card>

            {/* Single template instance (i = 1) */}
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

                {/* Children of the template instance */}
                <div className="md:col-span-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Children (node library)</Label>
                    <Button variant="secondary" size="sm" onClick={addChildRowInstance}>
                      <Plus className="w-4 h-4 mr-1" /> Add child
                    </Button>
                  </div>

                  {(state.instances[0]?.children?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground border rounded-md p-3">
                      No children yet for this template instance. Add nodes from your library.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {state.instances[0].children.map((cid, cidx) => (
                        <div key={cidx} className="grid grid-cols-[1fr_auto] gap-2">
                          <Select
                            value={cid || ''}
                            onValueChange={(v) => setChildInstance(cidx, v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Select a node…" /></SelectTrigger>
                            <SelectContent>
                              {nodeOptions.map(o => (
                                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => removeChildRowInstance(cidx)} aria-label={`Remove child ${cidx + 1}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
