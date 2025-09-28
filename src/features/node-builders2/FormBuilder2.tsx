import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* =========================================================================
   SSOT (lean) — Form only
   -------------------------------------------------------------------------
   - Library saves template-only: NO instances[].
   - kind: "FormContent", version: "v2-items", items: FormItem[]
   - FormItem is FieldItem | SectionItem
   - FieldItem/SectionItem may have optional `collection` (runtime repeats).
   - SectionItem must have EXACTLY ONE of: children[] OR collection.
   ========================================================================= */

type Importance = "low" | "normal" | "high";

type CollectionConfig = {
  min?: number;
  max?: number;
  default_instances?: number;
  allow_add?: boolean;
  allow_remove?: boolean;
  allow_reorder?: boolean;
  label_template?: string;
};

type FieldItem = {
  kind: "FieldItem";
  idx?: number;
  path: string;
  ref: string; // comes from app.field_registry.id
  required?: boolean;
  editable?: boolean;
  importance?: Importance;
  ui?: any;
  collection?: CollectionConfig; // optional – if present, runtime will create instances[]
};

type SectionItem = {
  kind: "SectionItem";
  idx?: number;
  path: string;
  label?: any;
  required?: boolean;
  // SSOT: exactly one of the following in the LIBRARY template
  children?: FormItem[];
  collection?: CollectionConfig; // if present, children MUST be undefined
};

type FormItem = FieldItem | SectionItem;

export type FormContent = {
  kind: "FormContent";
  version: "v2-items";
  items: FormItem[];
};

/* =========================================================================
   Sanitizer (template-only): remove any stray instances, normalize version
   ========================================================================= */
function sanitizeFormForLibrary(input: any): FormContent {
  const strip = (item: any): FormItem => {
    if (!item || typeof item !== "object") return item as FormItem;

    if (item.kind === "FieldItem") {
      const { instances, ...rest } = item as any;
      return rest as FieldItem;
    }

    if (item.kind === "SectionItem") {
      const { instances, children, ...rest } = item as any;
      if (rest.collection) {
        // collection section → children must be undefined in library
        return { ...(rest as SectionItem), collection: { ...(rest as SectionItem).collection } };
      }
      return { ...(rest as SectionItem), children: (children || []).map(strip) };
    }

    // Fallback (shouldn’t happen)
    return item as FormItem;
  };

  const items = Array.isArray(input?.items) ? input.items.map(strip) : [];
  return { kind: "FormContent", version: "v2-items", items };
}

/* =========================================================================
   Minimal validator to catch SSOT shape errors early (human-friendly)
   ========================================================================= */
function validateTemplate(content: FormContent): { ok: boolean; why?: string } {
  if (!content || content.kind !== "FormContent") return { ok: false, why: "FormContent.kind must be 'FormContent'" };
  if (content.version !== "v2-items") return { ok: false, why: "FormContent.version must be 'v2-items'" };
  if (!Array.isArray(content.items)) return { ok: false, why: "FormContent.items must be an array" };

  const walk = (items: FormItem[], path = "items"): { ok: boolean; why?: string } => {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const here = `${path}[${i}]`;
      if (!it || typeof it !== "object" || !("kind" in it)) return { ok: false, why: `${here} missing kind` };

      if (it.kind === "FieldItem") {
        if (!it.path) return { ok: false, why: `${here}.path is required` };
        if (!it.ref) return { ok: false, why: `${here}.ref is required` };
        continue;
      }

      if (it.kind === "SectionItem") {
        if (!it.path) return { ok: false, why: `${here}.path is required` };
        const hasChildren = Array.isArray(it.children);
        const hasCollection = !!it.collection;
        if (Number(hasChildren) + Number(hasCollection) !== 1) {
          return { ok: false, why: `${here} must have exactly ONE of children[] or collection` };
        }
        if (hasChildren) {
          const r = walk(it.children!, `${here}.children`);
          if (!r.ok) return r;
        }
        continue;
      }

      return { ok: false, why: `${here}.kind '${(it as any).kind}' not allowed` };
    }
    return { ok: true };
  };

  return walk(content.items);
}

/* =========================================================================
   UI — Lean Form Builder
   - Pulls `ref` options from app.field_registry
   - Lets you add Field/Section
   - Section toggles between children-mode and collection-mode (SSOT XOR)
   - Calls onChange with sanitized template (template-only)
   ========================================================================= */

type Props = {
  value?: FormContent | null;          // current template (optional)
  onChange: (content: FormContent) => void; // emits sanitized, SSOT-valid template
};

type FieldRegistryRow = { id: string; title?: string | null; datatype?: string | null };

export default function FormBuilder2({ value, onChange }: Props) {
  const [items, setItems] = useState<FormItem[]>(value?.items ?? []);
  const [registry, setRegistry] = useState<FieldRegistryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch ref options from app.field_registry
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        // @ts-ignore
        .schema("app" as any)
        .from("field_registry")
        .select("id,title,datatype")
        .order("id", { ascending: true });
      if (error) {
        console.error("field_registry fetch error:", error);
        setRegistry([]);
      } else {
        setRegistry((data as any) ?? []);
      }
    })();
  }, []);

  // Bind external value updates (optional)
  useEffect(() => {
    if (value?.items) setItems(value.items);
  }, [value?.items]);

  const commit = () => {
    const sanitized = sanitizeFormForLibrary({ items });
    const valid = validateTemplate(sanitized);
    setError(valid.ok ? null : valid.why ?? "Invalid form template");
    onChange(sanitized);
  };

  const addItem = (kind: FormItem["kind"]) => {
    const nextIdx = (items.at(-1)?.idx ?? 0) + 1;
    if (kind === "FieldItem") {
      const refDefault = registry[0]?.id ?? "ref";
      const next: FieldItem = {
        kind: "FieldItem",
        idx: nextIdx,
        path: `field_${nextIdx}`,
        ref: refDefault,
        editable: true,
        required: false,
        importance: "normal",
      };
      setItems([...items, next]);
    } else {
      const next: SectionItem = {
        kind: "SectionItem",
        idx: nextIdx,
        path: `section_${nextIdx}`,
        label: { fallback: `Section ${nextIdx}` },
        required: false,
        children: [], // default to children-mode
      };
      setItems([...items, next]);
    }
    // no immediate commit to allow user to edit before validation errors show
  };

  const removeItem = (idx: number) => {
    const arr = items.slice();
    arr.splice(idx, 1);
    setItems(arr);
    commit();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className="btn" onClick={() => addItem("FieldItem")}>+ Field</button>
        <button className="btn" onClick={() => addItem("SectionItem")}>+ Section</button>
        <button className="btn" onClick={commit}>Apply</button>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="border rounded p-3 space-y-2">
        {items.length === 0 && <div className="text-sm opacity-70">No items yet.</div>}
        {items.map((it, i) => (
          <div key={i} className="border rounded p-2">
            <div className="flex items-center justify-between">
              <strong>{it.kind}</strong>
              <button className="btn" onClick={() => removeItem(i)}>✕</button>
            </div>

            {it.kind === "FieldItem" ? (
              <FieldEditor
                item={it}
                registry={registry}
                onChange={(upd) => { const arr = items.slice(); arr[i] = upd; setItems(arr); }}
                onCommit={commit}
              />
            ) : (
              <SectionEditor
                item={it as SectionItem}
                registry={registry}
                onChange={(upd) => { const arr = items.slice(); arr[i] = upd; setItems(arr); }}
                onCommit={commit}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ Field Editor ============================ */

function FieldEditor({
  item, onChange, onCommit, registry,
}: {
  item: FieldItem;
  onChange: (it: FieldItem) => void;
  onCommit: () => void;
  registry: FieldRegistryRow[];
}) {
  const hasCollection = !!item.collection;

  return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      <input
        className="input"
        placeholder="path"
        value={item.path}
        onChange={(e) => onChange({ ...item, path: e.target.value })}
        onBlur={onCommit}
      />

      <select
        className="select"
        value={item.ref}
        onChange={(e) => { onChange({ ...item, ref: e.target.value }); onCommit(); }}
      >
        {registry.map((r) => (
          <option key={r.id} value={r.id}>
            {r.id}{r.title ? ` — ${r.title}` : ""}{r.datatype ? ` [${r.datatype}]` : ""}
          </option>
        ))}
      </select>

      <select
        className="select"
        value={item.importance ?? "normal"}
        onChange={(e) => { onChange({ ...item, importance: e.target.value as any }); onCommit(); }}
      >
        <option value="low">low</option>
        <option value="normal">normal</option>
        <option value="high">high</option>
      </select>

      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={!!item.required}
          onChange={(e) => { onChange({ ...item, required: e.target.checked }); onCommit(); }}
        />
        required
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={!!item.editable}
          onChange={(e) => { onChange({ ...item, editable: e.target.checked }); onCommit(); }}
        />
        editable
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={hasCollection}
          onChange={(e) => {
            onChange({ ...item, collection: e.target.checked ? {} : undefined });
            onCommit();
          }}
        />
        collection
      </label>

      {hasCollection && (
        <CollectionEditor
          cfg={item.collection!}
          onChange={(cfg) => onChange({ ...item, collection: cfg })}
          onCommit={onCommit}
          cols={3}
        />
      )}
    </div>
  );
}

/* ============================ Section Editor ============================ */

function SectionEditor({
  item, onChange, onCommit, registry,
}: {
  item: SectionItem;
  onChange: (it: SectionItem) => void;
  onCommit: () => void;
  registry: FieldRegistryRow[];
}) {
  const isCollection = !!item.collection;

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <input
          className="input"
          placeholder="path"
          value={item.path}
          onChange={(e) => onChange({ ...item, path: e.target.value })}
          onBlur={onCommit}
        />
        <input
          className="input"
          placeholder="label (fallback)"
          value={item.label?.fallback ?? ""}
          onChange={(e) => onChange({ ...item, label: e.target.value ? { fallback: e.target.value } : undefined })}
          onBlur={onCommit}
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!item.required}
            onChange={(e) => { onChange({ ...item, required: e.target.checked }); onCommit(); }}
          />
          required
        </label>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={isCollection}
            onChange={(e) => {
              if (e.target.checked) onChange({ ...item, collection: {}, children: undefined });
              else onChange({ ...item, collection: undefined, children: item.children ?? [] });
              onCommit();
            }}
          />
          collection
        </label>
      </div>

      {/* children-mode (single section) */}
      {!isCollection && (
        <div className="border rounded p-2">
          <div className="flex items-center justify-between">
            <strong>Children</strong>
            <div className="flex gap-2">
              <button className="btn" onClick={() => onChange({
                ...item,
                children: [ ...(item.children ?? []), defaultFieldChild((item.children?.at(-1)?.idx ?? 0) + 1) ],
              })}>
                + Field
              </button>
              <button className="btn" onClick={() => onChange({
                ...item,
                children: [ ...(item.children ?? []), defaultSectionChild((item.children?.at(-1)?.idx ?? 0) + 1) ],
              })}>
                + Section
              </button>
            </div>
          </div>

          {(item.children ?? []).map((child, ci) => (
            <div key={ci} className="mt-2 ml-2 border rounded p-2">
              {child.kind === "FieldItem" ? (
                <FieldEditor
                  item={child as FieldItem}
                  registry={registry}
                  onChange={(upd) => {
                    const arr = (item.children ?? []).slice();
                    arr[ci] = upd;
                    onChange({ ...item, children: arr });
                  }}
                  onCommit={onCommit}
                />
              ) : (
                <SectionEditor
                  item={child as SectionItem}
                  registry={registry}
                  onChange={(upd) => {
                    const arr = (item.children ?? []).slice();
                    arr[ci] = upd;
                    onChange({ ...item, children: arr });
                  }}
                  onCommit={onCommit}
                />
              )}
              <div className="mt-2">
                <button
                  className="btn"
                  onClick={() => {
                    const arr = (item.children ?? []).slice();
                    arr.splice(ci, 1);
                    onChange({ ...item, children: arr });
                    onCommit();
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* collection-mode */}
      {isCollection && (
        <CollectionEditor
          cfg={item.collection!}
          onChange={(cfg) => onChange({ ...item, collection: cfg })}
          onCommit={onCommit}
          cols={3}
        />
      )}
    </div>
  );
}

/* ============================ Shared: Collection editor ============================ */

function CollectionEditor({
  cfg, onChange, onCommit, cols = 3,
}: {
  cfg: CollectionConfig;
  onChange: (c: CollectionConfig) => void;
  onCommit: () => void;
  cols?: number;
}) {
  return (
    <div className={`border rounded p-2 grid grid-cols-${cols} gap-2`}>
      <NumberInput label="default_instances" value={cfg.default_instances} onChange={(v) => { onChange({ ...cfg, default_instances: v }); onCommit(); }} />
      <NumberInput label="min" value={cfg.min} onChange={(v) => { onChange({ ...cfg, min: v }); onCommit(); }} />
      <NumberInput label="max" value={cfg.max} onChange={(v) => { onChange({ ...cfg, max: v }); onCommit(); }} />
      <div className={`col-span-${cols}`}>
        <input
          className="input w-full"
          placeholder="label_template (optional, e.g. 'Instance #{i}')"
          value={cfg.label_template ?? ""}
          onChange={(e) => onChange({ ...cfg, label_template: e.target.value || undefined })}
          onBlur={onCommit}
        />
      </div>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={!!cfg.allow_add} onChange={(e) => { onChange({ ...cfg, allow_add: e.target.checked }); onCommit(); }} />
        allow_add
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={!!cfg.allow_remove} onChange={(e) => { onChange({ ...cfg, allow_remove: e.target.checked }); onCommit(); }} />
        allow_remove
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={!!cfg.allow_reorder} onChange={(e) => { onChange({ ...cfg, allow_reorder: e.target.checked }); onCommit(); }} />
        allow_reorder
      </label>
    </div>
  );
}

function NumberInput({ label, value, onChange }:{ label: string; value?: number; onChange: (v: number | undefined)=>void; }) {
  return (
    <input
      className="input"
      type="number"
      placeholder={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
    />
  );
}

/* ============================ Defaults for quick children ============================ */

function defaultFieldChild(idx: number): FieldItem {
  return {
    kind: "FieldItem",
    idx,
    path: `field_${idx}`,
    ref: "ref",          // will be editable; builder top-level registry also applies
    editable: true,
    required: false,
    importance: "normal",
  };
}

function defaultSectionChild(idx: number): SectionItem {
  return {
    kind: "SectionItem",
    idx,
    path: `section_${idx}`,
    label: { fallback: `Section ${idx}` },
    required: false,
    children: [],
  };
}
