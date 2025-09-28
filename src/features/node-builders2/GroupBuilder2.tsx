import React, { useEffect, useState } from "react";
import { GroupContent } from "./ssot";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  initial?: any;
  onChange(content: any): void;
};

type LibItem = { id: string; node_type: string };

export default function GroupBuilder2({ initial, onChange }: Props) {
  const [path, setPath] = useState(initial?.path ?? "group");
  const [children, setChildren] = useState<string[]>(initial?.children ?? []);
  const [collection, setCollection] = useState<any>(initial?.collection ?? undefined);
  const [lib, setLib] = useState<LibItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.schema("app" as any).from("node_library").select("id,node_type").order("id");
      if (!error) setLib(data as any);
    })();
  }, []);

  const commit = () => {
    const content: GroupContent = {
      kind: "GroupContent",
      path,
      children,
      collection: collection && {
        min: Number.isFinite(collection.min) ? Number(collection.min) : undefined,
        max: Number.isFinite(collection.max) ? Number(collection.max) : undefined,
        default_instances: Number.isFinite(collection.default_instances) ? Number(collection.default_instances) : undefined,
        allow_add: !!collection.allow_add,
        allow_remove: !!collection.allow_remove,
        allow_reorder: !!collection.allow_reorder,
        label_template: collection.label_template || undefined,
      },
    };
    onChange(content);
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Group Path</label>
        <input className="input" value={path} onChange={e => setPath(e.target.value)} onBlur={commit}/>
      </div>

      <div className="border p-3 rounded space-y-2">
        <div className="flex items-center justify-between">
          <strong>Children (library nodes)</strong>
          <button className="btn" onClick={() => setChildren(c => [...c, ""])}>+ Add</button>
        </div>
        {children.map((cid, i) => (
          <div key={i} className="flex gap-2">
            <select className="select flex-1" value={cid} onChange={e => {
              const arr = [...children]; arr[i] = e.target.value; setChildren(arr); commit();
            }}>
              <option value="">— select —</option>
              {lib.map(item => <option key={item.id} value={item.id}>{item.id} ({item.node_type})</option>)}
            </select>
            <button className="btn" onClick={() => { setChildren(children.filter((_, k) => k !== i)); }}>✕</button>
          </div>
        ))}
      </div>

      <div className="border p-3 rounded space-y-2">
        <div className="flex items-center justify-between">
          <strong>Collection (optional)</strong>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!collection} onChange={e => setCollection(e.target.checked ? {} : undefined)} /> Enable</label>
          </div>
        </div>
        {collection && (
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="default_instances" type="number"
              value={collection.default_instances ?? ""} onChange={e => setCollection({ ...collection, default_instances: e.target.value === "" ? undefined : Number(e.target.value) })}/>
            <input className="input" placeholder="min" type="number"
              value={collection.min ?? ""} onChange={e => setCollection({ ...collection, min: e.target.value === "" ? undefined : Number(e.target.value) })}/>
            <input className="input" placeholder="max" type="number"
              value={collection.max ?? ""} onChange={e => setCollection({ ...collection, max: e.target.value === "" ? undefined : Number(e.target.value) })}/>
            <input className="input col-span-2" placeholder="label_template"
              value={collection.label_template ?? ""} onChange={e => setCollection({ ...collection, label_template: e.target.value || undefined })}/>
            <label className="flex items-center gap-1"><input type="checkbox" checked={!!collection.allow_add} onChange={e => setCollection({ ...collection, allow_add: e.target.checked })}/> allow_add</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={!!collection.allow_remove} onChange={e => setCollection({ ...collection, allow_remove: e.target.checked })}/> allow_remove</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={!!collection.allow_reorder} onChange={e => setCollection({ ...collection, allow_reorder: e.target.checked })}/> allow_reorder</label>
            <button className="btn col-span-2" onClick={commit}>Apply</button>
          </div>
        )}
      </div>
    </div>
  );
}
