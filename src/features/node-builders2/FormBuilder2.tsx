import React, { useState } from "react";
import { FormContent, FormItem } from "./ssot";

type Props = { initial?: any; onChange(content: any): void; };

function newField(idx: number): FormItem {
  return { kind: "FieldItem", idx, path: `field_${idx}`, ref: `ref_${idx}`, editable: true } as any;
}
function newSection(idx: number): FormItem {
  return { kind: "SectionItem", idx, path: `section_${idx}`, label: { fallback: `Section ${idx}` }, children: [] } as any;
}
function newCollectionField(idx: number): FormItem {
  return { kind: "CollectionFieldItem", idx, path: `cfield_${idx}`, ref: `ref_${idx}`, default_instances: 1, min_instances: 0, max_instances: 10 } as any;
}
function newCollectionSection(idx: number): FormItem {
  return { kind: "CollectionSection", idx, path: `csection_${idx}`, label: { fallback: `Collection Section ${idx}` }, default_instances: 1, min_instances: 0, max_instances: 10, children: [] } as any;
}

export default function FormBuilder2({ initial, onChange }: Props) {
  const [items, setItems] = useState<FormItem[]>(initial?.items ?? []);

  const commit = () => {
    const content: FormContent = { kind: "FormContent", version: "v2-items", items };
    onChange(content);
  };

  const add = (kind: FormItem["kind"]) => {
    const idx = (items.at(-1)?.idx ?? 0) + 1;
    const next =
      kind === "FieldItem" ? newField(idx) :
      kind === "SectionItem" ? newSection(idx) :
      kind === "CollectionFieldItem" ? newCollectionField(idx) :
      newCollectionSection(idx);
    setItems([...items, next]); commit();
  };

  const rm = (i: number) => { setItems(items.filter((_, k) => k !== i)); commit(); };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="btn" onClick={() => add("FieldItem")}>+ Field</button>
        <button className="btn" onClick={() => add("SectionItem")}>+ Section</button>
        <button className="btn" onClick={() => add("CollectionFieldItem")}>+ Collection Field</button>
        <button className="btn" onClick={() => add("CollectionSection")}>+ Collection Section</button>
      </div>

      <div className="border rounded p-3 space-y-2">
        {items.length === 0 && <div className="text-sm opacity-70">No items yet.</div>}
        {items.map((it, i) => (
          <div key={i} className="border p-2 rounded">
            <div className="flex items-center justify-between">
              <strong>{it.kind}</strong>
              <button className="btn" onClick={() => rm(i)}>✕</button>
            </div>

            {/* Shared: path/ref for fields */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input className="input" value={it.path} onChange={e => {
                const arr = [...items]; arr[i] = { ...arr[i], path: e.target.value }; setItems(arr);
              }} />
              {"ref" in it ? (
                <input className="input" placeholder="ref" value={(it as any).ref ?? ""} onChange={e => {
                  const arr = [...items]; (arr[i] as any).ref = e.target.value; setItems(arr);
                }} />
              ) : <div />}
            </div>

            {/* Type-specific */}
            {it.kind === "CollectionFieldItem" && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input className="input" type="number" placeholder="default_instances" value={(it as any).default_instances ?? 1}
                  onChange={e => { const arr = [...items]; (arr[i] as any).default_instances = Number(e.target.value || 0); setItems(arr);} }/>
                <input className="input" type="number" placeholder="min_instances" value={(it as any).min_instances ?? 0}
                  onChange={e => { const arr = [...items]; (arr[i] as any).min_instances = Number(e.target.value || 0); setItems(arr);} }/>
                <input className="input" type="number" placeholder="max_instances" value={(it as any).max_instances ?? 10}
                  onChange={e => { const arr = [...items]; (arr[i] as any).max_instances = Number(e.target.value || 0); setItems(arr);} }/>
              </div>
            )}

            {it.kind === "CollectionSection" && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input className="input" type="number" placeholder="default_instances" value={(it as any).default_instances ?? 1}
                  onChange={e => { const arr = [...items]; (arr[i] as any).default_instances = Number(e.target.value || 0); setItems(arr);} }/>
                <input className="input" type="number" placeholder="min_instances" value={(it as any).min_instances ?? 0}
                  onChange={e => { const arr = [...items]; (arr[i] as any).min_instances = Number(e.target.value || 0); setItems(arr);} }/>
                <input className="input" type="number" placeholder="max_instances" value={(it as any).max_instances ?? 10}
                  onChange={e => { const arr = [...items]; (arr[i] as any).max_instances = Number(e.target.value || 0); setItems(arr);} }/>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn" onClick={commit}>Apply</button>
    </div>
  );
}
