import React, { useState } from "react";
import { MediaContent } from "./ssot";

type Props = {
  initial?: any;
  onChange(content: any): void;
};

export default function MediaBuilder2({ initial, onChange }: Props) {
  const [path, setPath] = useState(initial?.path ?? "media");
  const [type, setType] = useState(initial?.type ?? "image");
  const [versions, setVersions] = useState<any[]>(initial?.versions ?? []);
  const [selected, setSelected] = useState<number | undefined>(initial?.selected_version_idx);

  const commit = () => {
    const payload: MediaContent = {
      kind: "MediaContent",
      path,
      type,
      versions: versions.length ? versions : undefined,
      selected_version_idx: selected,
    };
    onChange(payload);
  };

  return (
    <div className="space-y-3">
      <div>
        <label>Media Path</label>
        <input className="input" value={path} onChange={e => setPath(e.target.value)} onBlur={commit} />
      </div>
      <div>
        <label>Type</label>
        <select className="select" value={type} onChange={e => { setType(e.target.value); commit(); }}>
          <option>image</option><option>video</option><option>audio</option><option>file</option>
        </select>
      </div>

      <div className="border p-3 rounded">
        <div className="flex items-center justify-between">
          <strong>Versions</strong>
          <button className="btn" onClick={() => { setVersions(v => [...v, { kind: "MediaVersion", idx: (v.at(-1)?.idx ?? 0) + 1, uri: "" }]); }}>
            + Add
          </button>
        </div>
        {versions.length === 0 && <div className="text-sm opacity-70">Zero versions allowed. Renderer can show Generate.</div>}
        {versions.map((v, i) => (
          <div key={i} className="flex gap-2 items-center py-1">
            <span># {v.idx}</span>
            <input className="input flex-1" placeholder="URI (optional)" value={v.uri ?? ""} onChange={e => {
              const arr = [...versions]; arr[i] = { ...arr[i], uri: e.target.value }; setVersions(arr);
            }} />
            <button className="btn" onClick={() => { setSelected(v.idx); }}>Set Default</button>
            <button className="btn" onClick={() => { setVersions(versions.filter((_, k) => k !== i)); }}>✕</button>
          </div>
        ))}
        <div className="text-xs mt-2">Selected idx: {selected ?? "—"}</div>
        <button className="btn mt-2" onClick={commit}>Apply</button>
      </div>
    </div>
  );
}
