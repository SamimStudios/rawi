// src/pages/app/build/node/components/GroupContentEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layers, FolderTree } from 'lucide-react';

/**
 * SSOT-aligned GroupContent editor (per ai_scenes_node_contracts)
 *
 * Regular Group:
 *   { kind:'Group', path:string, label?:I18nText, children:string[], x_ui?:{ arrangeable?:boolean }, x_meta?:{ description?:I18nText } }
 *
 * Collection Group:
 *   { kind:'Group', path:string, label?:I18nText, collection:{}, instances:[
 *       { i:1..N, idx?:number, label?:I18nText, children:string[] }
 *     ],
 *     x_ui?:..., x_meta?:...
 *   }
 *
 * Notes:
 *  - We keep `description` and `arrangeable` as namespaced extensions: x_meta.description, x_ui.arrangeable
 *  - Auto reindex `instances[i].i = 1..N`
 *  - Always emit strict SSOT shape
 *  - Verbose console logs with [GroupBuilder]
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
  i: number;                 // 1..N ordinal (auto)
  idx?: number;              // optional display/index
  label?: I18nText;
  children: string[];
};

type GroupCollection = {
  kind: 'Group';
  path: string;
  label?: I18nText;
  collection: Record<string, any>;
  instances: GroupInstance[];
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
    // Reindex i, ensure arrays
    const reindexed = (content.instances || []).map((ins, idx) => ({
      i: idx + 1,
      idx: ins.idx,
      label: ins.label && typeof ins.label === 'object'
        ? { fallback: ins.label.fallback ?? '', key: ins.label.key }
        : undefined,
      children: Array.isArray(ins.children) ? ins.children : [],
    }));
    const out: GroupCollection = {
      kind: 'Group',
      path: basePath,
      label: content.label && typeof content.label === 'object'
        ? { fallback: content.label.fallback ?? '', key: content.label.key }
        : undefined,
      collection: typeof content.collection === 'object' && content.collection ? content.collection : {},
      instances: reindexed,
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

/** Accept legacy-ish shapes and convert to SSOT */
function migrateLegacy(raw: any): GroupContent {
  console.debug('[GroupBuilder] 🧪 migrateLegacy input:', raw);

  // Already SSOT-ish
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
      const desc: I18nText = { fallback: field === 'fallback' ? val : ((prev as any)?.x_meta?.description?.fallback ?? ''), key: field === 'key' ? (val || undefined) : ((prev as any)?.x_meta?.description?.key) };
      const x_meta = { ...(prev as any).x_meta, description: desc };
      return { ...prev, x_meta };
    });
  };

  const toggleMode = (newMode: 'regular' | 'collection') => {
    setMode(newMode);
    emit(prev => {
      if (newMode === 'collection') {
        console.debug('[GroupBuilder] 🔁 mode regular → collection');
        const firstChildren = !isCollectionGroup(prev) ? (prev.children || []) : [];
        const instances: GroupInstance[] = [
          { i: 1, children: firstChildren.length ? [...firstChildren] : [] }
        ];
        const col: GroupCollection = {
          kind: 'Group',
          path: prev.path,
          label: (prev as any).label,
          collection: {},
          instances,
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

  /* --------- handlers (regular) --------- */

  const addChildRegular = () => {
    if (isCollectionGroup(state)) return;
    emit(prev => ({ ...(prev as GroupRegular), children: [...(prev as GroupRegular).children, ''] }));
    console.debug('[GroupBuilder] ➕ add child (regular)');
  };

  const updateChildRegular = (idx: number, value: string) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const children = [...(prev as GroupRegular).children];
      children[idx] = value;
      return { ...(prev as GroupRegular), children };
    });
  };

  const removeChildRegular = (idx: number) => {
    if (isCollectionGroup(state)) return;
    emit(prev => {
      const children = [...(prev as GroupRegular).children];
      children.splice(idx, 1);
      return { ...(prev as GroupRegular), children };
    });
    console.debug('[GroupBuilder] 🗑️ remove child (regular) idx', idx);
  };

  /* --------- handlers (collection) --------- */

  const addInstance = () => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const nextI = (pc.instances?.length || 0) + 1;
      const instances = [...pc.instances, { i: nextI, children: [] }];
      console.debug('[GroupBuilder] ➕ add instance → i', nextI);
      return { ...pc, instances };
    });
  };

  const removeInstance = (iValue: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const filtered = pc.instances.filter(ins => ins.i !== iValue);
      const reindexed = filtered.map((ins, idx) => ({ ...ins, i: idx + 1 }));
      console.debug('[GroupBuilder] 🗑️ remove instance i', iValue, '→ reindex to', reindexed.length);
      return { ...pc, instances: reindexed };
    });
  };

  const updateInstanceIdx = (iValue: number, idxVal?: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const instances = pc.instances.map(ins => ins.i === iValue ? { ...ins, idx: idxVal } : ins);
      return { ...pc, instances };
    });
  };

  const updateInstanceLabel = (iValue: number, field: 'fallback' | 'key', value: string) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const instances = pc.instances.map(ins => {
        if (ins.i !== iValue) return ins;
        const label: I18nText = {
          fallback: field === 'fallback' ? value : (ins.label?.fallback ?? ''),
          key: field === 'key' ? (value || undefined) : ins.label?.key
        };
        return { ...ins, label };
      });
      return { ...pc, instances };
    });
  };

  const addChildInstance = (iValue: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const instances = pc.instances.map(ins => ins.i === iValue ? { ...ins, children: [...ins.children, ''] } : ins);
      console.debug('[GroupBuilder] ➕ add child (instance i)', iValue);
      return { ...pc, instances };
    });
  };

  const updateChildInstance = (iValue: number, idx: number, val: string) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const instances = pc.instances.map(ins => {
        if (ins.i !== iValue) return ins;
        const children = [...ins.children];
        children[idx] = val;
        return { ...ins, children };
      });
      return { ...pc, instances };
    });
  };

  const removeChildInstance = (iValue: number, idx: number) => {
    if (!isCollectionGroup(state)) return;
    emit(prev => {
      const pc = prev as GroupCollection;
      const instances = pc.instances.map(ins => {
        if (ins.i !== iValue) return ins;
        const children = [...ins.children];
        children.splice(idx, 1);
        return { ...ins, children };
      });
      console.debug('[GroupBuilder] 🗑️ remove child (instance i)', iValue, 'idx', idx);
      return { ...pc, instances };
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Group Configuration</h3>
          <p className="text-sm text-muted-foreground">
            SSOT-aligned. Switch between a single group or a collection of instances.
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
              <p className="text-[11px] text-muted-foreground">Optional; displayed label.</p>
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
                <span className="text-sm text-muted-foreground">Allow drag-reorder in UI (not part of SSOT)</span>
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

        {/* Regular children */}
        {mode === 'regular' && !isCollectionGroup(state) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Layers className="w-4 h-4" /> Children (node ids)</CardTitle>
              <Button variant="secondary" size="sm" onClick={addChildRegular}>
                <Plus className="w-4 h-4 mr-1" /> Add child
              </Button>
            </CardHeader>
            <CardContent>
              {state.children.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3">
                  No children yet. Add node IDs (e.g., UUIDs) that belong to this group.
                </div>
              ) : (
                <div className="space-y-3">
                  {state.children.map((cid, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        value={cid}
                        onChange={(e) => updateChildRegular(idx, e.target.value)}
                        placeholder="node-id (string)"
                      />
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

        {/* Collection instances */}
        {mode === 'collection' && isCollectionGroup(state) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Instances</CardTitle>
              <Button variant="secondary" size="sm" onClick={addInstance}>
                <Plus className="w-4 h-4 mr-1" /> Add instance
              </Button>
            </CardHeader>
            <CardContent>
              {state.instances.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3">
                  No instances yet. Add at least one instance to this collection group.
                </div>
              ) : (
                <div className="space-y-4">
                  {state.instances.map((ins) => (
                    <Card key={ins.i} className="border">
                      <CardHeader className="flex flex-row items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">i{ins.i}</Badge>
                          <span className="text-xs text-muted-foreground">ordinal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => removeInstance(ins.i)} variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Instance idx (optional)</Label>
                          <Input
                            type="number"
                            value={ins.idx ?? ''}
                            onChange={(e) => updateInstanceIdx(ins.i, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            placeholder="e.g., 1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Label (fallback)</Label>
                          <Input
                            value={ins.label?.fallback ?? ''}
                            onChange={(e) => updateInstanceLabel(ins.i, 'fallback', e.target.value)}
                            placeholder="e.g., Shot A"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Label (i18n key)</Label>
                          <Input
                            value={ins.label?.key ?? ''}
                            onChange={(e) => updateInstanceLabel(ins.i, 'key', e.target.value)}
                            placeholder="app.groups.scene.shot_a"
                          />
                        </div>

                        {/* Children of instance */}
                        <div className="md:col-span-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Children (node ids)</Label>
                            <Button variant="secondary" size="sm" onClick={() => addChildInstance(ins.i)}>
                              <Plus className="w-4 h-4 mr-1" /> Add child
                            </Button>
                          </div>

                          {ins.children.length === 0 ? (
                            <div className="text-sm text-muted-foreground border rounded-md p-3">
                              No children yet for this instance. Add node IDs (strings).
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {ins.children.map((cid, cidx) => (
                                <div key={cidx} className="grid grid-cols-[1fr_auto] gap-2">
                                  <Input
                                    value={cid}
                                    onChange={(e) => updateChildInstance(ins.i, cidx, e.target.value)}
                                    placeholder="node-id (string)"
                                  />
                                  <Button variant="ghost" size="icon" onClick={() => removeChildInstance(ins.i, cidx)} aria-label={`Remove child ${cidx + 1}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
