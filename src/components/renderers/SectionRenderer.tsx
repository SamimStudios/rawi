// src/components/renderers/SectionRenderer.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, GripVertical, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobNode } from '@/hooks/useJobs';

const DBG = true; // TEMP: always log on Lovable (no process.env)
const dlog = (...a: any[]) => { if (DBG) console.debug('[RENDER:Section]', ...a); };
const dwarn = (...a: any[]) => console.warn('[RENDER:Section]', ...a);

export type SectionContract = {
  path: string;                 // SSOT: section key
  title?: string;
  children: string[];           // field refs
  // SSOT collection block (optional)
  collection?: {
    min?: number;
    max?: number;
    default_instances?: number; // if instances not present, fall back to this
    allow_add?: boolean;
    allow_remove?: boolean;
    allow_reorder?: boolean;
    label_template?: string;    // e.g., "Character #{i}"
  };
  // If your backend hydrates instances, you can pass their array to hint count
  instances?: unknown[] | null;
};

type Props = {
  node: JobNode;
  section: SectionContract;
  /** Field renderer provided by parent (NodeRenderer / FormItemRenderer) */
  renderField: (args: { fieldRef: string; sectionPath: string; instanceNum?: number }) => React.ReactNode;
  /** Optional: Section-scoped Save (NodeRenderer can filter drafts by prefix) */
  onSaveSection?: (sectionPath: string) => Promise<void>;
  /** Optional: Section-scoped Reset (NodeRenderer can clear drafts by prefix) */
  onResetSection?: (sectionPath: string) => Promise<void>;
  /** Optional: hooks to persist instance structure (future DB migration) */
  onAddInstance?: (sectionPath: string) => Promise<void> | void;
  onRemoveInstance?: (sectionPath: string, index: number) => Promise<void> | void; // 1-based
  onReorderInstance?: (sectionPath: string, from: number, to: number) => Promise<void> | void; // 1-based
};

export function SectionRenderer({
  node,
  section,
  renderField,
  onSaveSection,
  onResetSection,
  onAddInstance,
  onRemoveInstance,
  onReorderInstance
}: Props) {
  const isCollection = !!section.collection;
  const min = section.collection?.min ?? 0;
  const max = section.collection?.max ?? Number.POSITIVE_INFINITY;
  const allowAdd = section.collection?.allow_add ?? true;
  const allowRemove = section.collection?.allow_remove ?? true;
  const allowReorder = section.collection?.allow_reorder ?? true;

  // Server-hinted count: prefer actual instances array length, fallback to default_instances, then 1
  const serverCount = useMemo(() => {
    if (!isCollection) return 0;
    if (Array.isArray(section.instances)) return section.instances.length;
    const def = section.collection?.default_instances;
    if (typeof def === 'number' && def > 0) return def;
    return Math.max(0, min); // if min>0 ensure we show at least min
  }, [isCollection, section.instances, section.collection?.default_instances, min]);

  // Local UI count mirrors serverCount, but lets user add/remove before persistence
  const [uiCount, setUiCount] = useState<number>(serverCount);
  useEffect(() => setUiCount(serverCount), [serverCount, section.path]);

  // Collapsible
  const [open, setOpen] = useState(true);

  useEffect(() => {
    dlog('mount', {
      node: node.addr,
      sectionPath: section.path,
      isCollection,
      serverCount,
      uiCount,
      min,
      max,
      allowAdd,
      allowRemove,
      allowReorder
    });
  }, [node.addr, section.path, isCollection, serverCount, uiCount, min, max, allowAdd, allowRemove, allowReorder]);

  // --- Instance actions (UI-first, optional persistence hooks) ---
  const addInstance = useCallback(async () => {
    if (!isCollection) return;
    if (!allowAdd) return;
    if (uiCount >= max) return;
    const next = uiCount + 1;
    dlog('instance:add', { sectionPath: section.path, before: uiCount, after: next });
    setUiCount(next);
    try {
      await onAddInstance?.(section.path);
    } catch (e) {
      dwarn('onAddInstance failed; reverting UI count', e);
      setUiCount(uiCount); // rollback
    }
  }, [isCollection, allowAdd, uiCount, max, section.path, onAddInstance]);

  const removeInstance = useCallback(async (i: number) => {
    if (!isCollection) return;
    if (!allowRemove) return;
    if (uiCount <= min) return;
    dlog('instance:remove', { sectionPath: section.path, index: i });
    const next = Math.max(min, uiCount - 1);
    setUiCount(next);
    try {
      await onRemoveInstance?.(section.path, i);
    } catch (e) {
      dwarn('onRemoveInstance failed; reverting UI count', e);
      setUiCount(uiCount); // rollback
    }
  }, [isCollection, allowRemove, uiCount, min, section.path, onRemoveInstance]);

  const reorderInstance = useCallback(async (from: number, to: number) => {
    if (!isCollection) return;
    if (!allowReorder) return;
    if (from === to) return;
    dlog('instance:reorder', { sectionPath: section.path, from, to });
    try {
      await onReorderInstance?.(section.path, from, to);
    } catch (e) {
      dwarn('onReorderInstance failed; ignoring for now', e);
    }
  }, [isCollection, allowReorder, section.path, onReorderInstance]);

  // --- Save / Reset per-section (NodeRenderer can filter drafts by prefix) ---
  const handleSave = useCallback(async () => {
    if (!onSaveSection) return;
    dlog('save:start', { sectionPath: section.path });
    await onSaveSection(section.path);
    dlog('save:done', { sectionPath: section.path });
  }, [onSaveSection, section.path]);

  const handleReset = useCallback(async () => {
    if (!onResetSection) return;
    dlog('reset:start', { sectionPath: section.path });
    await onResetSection(section.path);
    // After reset, reflect any server changes
    setUiCount(serverCount);
    dlog('reset:done', { sectionPath: section.path, uiCount });
  }, [onResetSection, section.path, serverCount, uiCount]);

  // --- Render ---
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-left"
          onClick={() => setOpen(o => !o)}
          type="button"
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium">{section.title ?? section.path}</span>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </div>

      {!open ? null : (
        <>
          {/* Non-collection: simple children render */}
          {!isCollection && (
            <div className="mt-3 space-y-3">
              {section.children?.map((fieldRef) => {
                dlog('render:child', { node: node.addr, sectionPath: section.path, fieldRef });
                return (
                  <div key={fieldRef}>
                    {renderField({ fieldRef, sectionPath: section.path })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Collection: instances i1..iN — UI reflects uiCount (serverCount fallback) */}
          {isCollection && (
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={addInstance} disabled={!allowAdd || uiCount >= max}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <div className="text-xs text-muted-foreground">
                  Showing {uiCount} {uiCount === 1 ? 'instance' : 'instances'}{Number.isFinite(max) ? ` (max ${max})` : ''}
                </div>
              </div>

              {Array.from({ length: uiCount }).map((_, idx) => {
                const i = idx + 1; // 1-based for .instances.iN
                const label =
                  section.collection?.label_template
                    ? section.collection.label_template.replace('#{i}', String(i))
                    : `Instance ${i}`;

                dlog('render:instance', { node: node.addr, sectionPath: section.path, i, label });

                return (
                  <div key={`inst-${i}`} className="rounded-md border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          title="Drag to reorder"
                          disabled={!allowReorder}
                          onClick={() => reorderInstance(i, i)} // hook placeholder
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remove"
                          onClick={() => removeInstance(i)}
                          disabled={!allowRemove || uiCount <= min}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {section.children?.map((fieldRef) => {
                        dlog('render:instance.field', { node: node.addr, sectionPath: section.path, i, fieldRef });
                        return (
                          <div key={`${i}:${fieldRef}`}>
                            {renderField({ fieldRef, sectionPath: section.path, instanceNum: i })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default SectionRenderer;

