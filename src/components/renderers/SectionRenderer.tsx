// src/components/renderers/SectionRenderer.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, GripVertical, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { FieldHybridRenderer } from '@/components/renderers/FieldHybridRenderer';

// logging always on (Lovable preview — no process.env)
const DBG = true;
const dlog = (...a: any[]) => { if (DBG) console.debug('[RENDER:Section]', ...a); };
const dwarn = (...a: any[]) => console.warn('[RENDER:Section]', ...a);

// Build SSOT address for section paths that can be nested (e.g. "characters.lead")
// If instanceNum is provided, insert ".instances.iN" right after the **first** section.
function buildNestedSectionFieldAddr(nodeAddr: string, sectionPath: string, fieldRef: string, instanceNum?: number) {
  const segs = sectionPath.split('.').filter(Boolean);
  if (!segs.length) throw new Error('Empty sectionPath');

  let json = `content.items.${segs[0]}`;
  if (typeof instanceNum === 'number') {
    json += `.instances.i${instanceNum}`;
  }
  // chain nested children: .children.lead.children.supporting...
  for (let i = 1; i < segs.length; i++) {
    json += `.children.${segs[i]}`;
  }
  json += `.children.${fieldRef}.value`;
  return `${nodeAddr}#${json}`;
}


/** Field-like child (may come as string or object) */
type FieldItemLike = string | {
  kind?: string;            // 'FieldItem' (optional)
  ref?: string;
  fieldRef?: string;
  field_ref?: string;
  key?: string;
  name?: string;
  id?: string;
  path?: string;            // sometimes "section.field"
};

/** Section-like child (subsection) */
type SectionItemLike = {
  kind?: string;            // 'SectionItem' (preferred)
  path: string;             // subsection key (e.g., 'lead')
  title?: string;
  children?: Array<FieldItemLike | SectionItemLike>;
  collection?: {
    min?: number;
    max?: number;
    default_instances?: number;
    allow_add?: boolean;
    allow_remove?: boolean;
    allow_reorder?: boolean;
    label_template?: string;
  };
  instances?: unknown[] | null;
};

export type SectionContract = {
  path: string;                 // SSOT: section key, can be nested: "characters.lead"
  title?: string;
  /** children can be field refs OR nested sections */
  children: Array<FieldItemLike | SectionItemLike>;
  collection?: SectionItemLike['collection'];
  instances?: unknown[] | null;
};

type Props = {
  node: any; // keep loose to avoid type import mismatches
  section: SectionContract;

  /** Optional custom field renderer. If omitted, we fallback to FieldHybridRenderer. */
  renderField?: (args: { fieldRef: string; sectionPath: string; instanceNum?: number }) => React.ReactNode;

  /** Optional: Section-scoped Save (parent filters drafts by prefix addr#content.items.<sectionPath>) */
  onSaveSection?: (sectionPath: string) => Promise<void>;

  /** Optional: Section-scoped Reset (parent clears drafts by same prefix) */
  onResetSection?: (sectionPath: string) => Promise<void>;

  /** Optional: hooks to persist instance structure (future DB migration) */
  onAddInstance?: (sectionPath: string) => Promise<void> | void;
  onRemoveInstance?: (sectionPath: string, index: number) => Promise<void> | void; // 1-based
  onReorderInstance?: (sectionPath: string, from: number, to: number) => Promise<void> | void; // 1-based

  /** If this section is being rendered inside a parent collection instance, carry the instanceNum down */
  inheritedInstanceNum?: number;
};

// ----------------- helpers -----------------
function isSectionLike(x: any): x is SectionItemLike {
  return !!x && typeof x === 'object' && (
    x.kind === 'SectionItem' ||
    (typeof x.path === 'string' && Array.isArray(x.children))
  );
}

function normalizeFieldRef(child: any, sectionPath?: string): string | null {
  if (typeof child === 'string') return child;
  if (!child || typeof child !== 'object') return null;

  // Prefer explicit field keys
  if (typeof child.ref === 'string') return child.ref;
  if (typeof child.fieldRef === 'string') return child.fieldRef;
  if (typeof child.field_ref === 'string') return child.field_ref;

  // Generic fallbacks
  if (typeof child.key === 'string') return child.key;
  if (typeof child.name === 'string') return child.name;
  if (typeof child.id === 'string') return child.id;

  // Last-resort: derive from "path"
  if (typeof child.path === 'string') {
    const segs = child.path.split('.').filter(Boolean);
    const last = segs[segs.length - 1];
    if (last && last !== sectionPath) return last;
  }
  return null;
}

function mergePath(parentPath: string, childPath: string) {
  return parentPath ? `${parentPath}.${childPath}` : childPath;
}

// ----------------- component -----------------
export function SectionRenderer({
  node,
  section,
  renderField,
  onSaveSection,
  onResetSection,
  onAddInstance,
  onRemoveInstance,
  onReorderInstance,
  inheritedInstanceNum
}: Props) {
  const isCollection = !!section.collection;
  const min = section.collection?.min ?? 0;
  const max = section.collection?.max ?? Number.POSITIVE_INFINITY;
  const allowAdd = section.collection?.allow_add ?? true;
  const allowRemove = section.collection?.allow_remove ?? true;
  const allowReorder = section.collection?.allow_reorder ?? true;

  // Prefer server-provided instances length; else default_instances; else ensure >= min
  const serverCount = useMemo(() => {
    if (!isCollection) return 0;
    if (Array.isArray(section.instances)) return section.instances.length;
    const def = section.collection?.default_instances;
    if (typeof def === 'number' && def > 0) return def;
    return Math.max(0, min);
  }, [isCollection, section.instances, section.collection?.default_instances, min]);

  // Local UI count (user can add/remove before persistence)
  const [uiCount, setUiCount] = useState<number>(serverCount);
  useEffect(() => setUiCount(serverCount), [serverCount, section.path]);

  // Collapse/expand
  const [open, setOpen] = useState(true);

  useEffect(() => {
    dlog('mount', {
      node: node?.addr,
      sectionPath: section.path,
      isCollection,
      serverCount,
      uiCount,
      min,
      max,
      allowAdd,
      allowRemove,
      allowReorder,
      inheritedInstanceNum
    });
  }, [node?.addr, section.path, isCollection, serverCount, uiCount, min, max, allowAdd, allowRemove, allowReorder, inheritedInstanceNum]);

  // Safe fallback if parent didn't pass renderField
  const safeRenderField = React.useCallback(
    (args: { fieldRef: string; sectionPath: string; instanceNum?: number }) => {
      if (typeof renderField === 'function') return renderField(args);
      dlog('fallback:renderField', { node: node?.addr, ...args });
      return (
        <FieldHybridRenderer
          node={node}
          fieldRef={args.fieldRef}
          sectionPath={args.sectionPath}
          instanceNum={args.instanceNum}
          editable={true}
          mode="edit"
        />
      );
    },
    [renderField, node]
  );

  // Render a list of children (fields and/or subsections) with an optional instance context
  const renderChildren = useCallback((children: SectionContract['children'], sectionPath: string, instanceCtx?: number) => {
    return children?.map((child, idx) => {
      // Nested subsection: recurse
      if (isSectionLike(child)) {
        const nestedPath = mergePath(sectionPath, child.path);
        const nestedSection: SectionContract = {
          path: nestedPath,
          title: child.title ?? child.path,
          children: child.children ?? [],
          collection: child.collection,
          instances: child.instances ?? null
        };
        dlog('render:subsection', { node: node?.addr, sectionPath, nestedPath, instanceCtx });
        return (
          <div key={`subsec-${nestedPath}-${idx}`} className="mt-3">
            <SectionRenderer
              node={node}
              section={nestedSection}
              renderField={renderField}
              onSaveSection={onSaveSection}
              onResetSection={onResetSection}
              onAddInstance={onAddInstance}
              onRemoveInstance={onRemoveInstance}
              onReorderInstance={onReorderInstance}
              inheritedInstanceNum={instanceCtx}
            />
          </div>
        );
      }

      // Field-like: normalize and render
      const fieldRef = normalizeFieldRef(child, sectionPath);
      if (!fieldRef) {
        dlog('render:field:skip (cannot normalize fieldRef)', { node: node?.addr, sectionPath, child });
        return (
          <div key={`badfield-${idx}`} className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Failed to resolve fieldRef for child in section “{sectionPath}”. Check SSOT/contract.
          </div>
        );
      }

      dlog('render:field', { node: node?.addr, sectionPath, instanceCtx, fieldRef });
      return (
        <div key={`${sectionPath}:${instanceCtx ?? 0}:${fieldRef}`}>
          {safeRenderField({ fieldRef, sectionPath, instanceNum: instanceCtx })}
        </div>
      );
    });
  }, [node, safeRenderField, renderField, onSaveSection, onResetSection, onAddInstance, onRemoveInstance, onReorderInstance]);

  // --- Instance actions (UI-first; optional persistence hooks) ---
  const addInstance = useCallback(async () => {
    if (!isCollection || !allowAdd || uiCount >= max) return;
    const next = uiCount + 1;
    dlog('instance:add', { sectionPath: section.path, before: uiCount, after: next });
    setUiCount(next);
    try {
      await onAddInstance?.(section.path);
    } catch (e) {
      dwarn('onAddInstance failed; reverting UI count', e);
      setUiCount(uiCount);
    }
  }, [isCollection, allowAdd, uiCount, max, section.path, onAddInstance]);

  const removeInstance = useCallback(async (i: number) => {
    if (!isCollection || !allowRemove || uiCount <= min) return;
    dlog('instance:remove', { sectionPath: section.path, index: i });
    const next = Math.max(min, uiCount - 1);
    setUiCount(next);
    try {
      await onRemoveInstance?.(section.path, i);
    } catch (e) {
      dwarn('onRemoveInstance failed; reverting UI count', e);
      setUiCount(uiCount);
    }
  }, [isCollection, allowRemove, uiCount, min, section.path, onRemoveInstance]);

  const reorderInstance = useCallback(async (from: number, to: number) => {
    if (!isCollection || !allowReorder || from === to) return;
    dlog('instance:reorder', { sectionPath: section.path, from, to });
    try {
      await onReorderInstance?.(section.path, from, to);
    } catch (e) {
      dwarn('onReorderInstance failed; ignoring for now', e);
    }
  }, [isCollection, allowReorder, section.path, onReorderInstance]);

  // --- Save / Reset per-section (parent wires the draft filtering by prefix) ---
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
    setUiCount(serverCount); // reflect server after reset
    dlog('reset:done', { sectionPath: section.path, uiCount: serverCount });
  }, [onResetSection, section.path, serverCount]);

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
          {/* Non-collection: simple children render (with possible nested subsections) */}
          {!isCollection && (
            <div className="mt-3 space-y-3">
              {renderChildren(section.children, section.path, inheritedInstanceNum)}
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

                dlog('render:instance', { node: node?.addr, sectionPath: section.path, i, label });

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
                          onClick={() => reorderInstance(i, i)} // placeholder (wire real DnD later)
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
                      {renderChildren(section.children, section.path, i)}
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
