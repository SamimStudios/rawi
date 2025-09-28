import React, { useState } from "react";
import MediaBuilder2 from "./MediaBuilder2";
import GroupBuilder2 from "./GroupBuilder2";
import FormBuilder2 from "./FormBuilder2";
import { useNodeLibrary2 } from "./useNodeLibrary2";

export default function NodeLibraryBuilder2() {
  const { save, saving } = useNodeLibrary2();

  const [id, setId] = useState("lib_newnode");
  const [nodeType, setNodeType] = useState<"media"|"group"|"form">("media");
  const [content, setContent] = useState<any>(null);

  const handleSave = async () => {
    await save({ id, node_type: nodeType, content });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Node Library Builder (v2)</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label>Library Node ID</label>
              <input className="input w-full" value={id} onChange={e => setId(e.target.value)} />
              <div className="text-xs opacity-70">Will be saved as <code>lib_*</code> if missing prefix.</div>
            </div>
            <div>
              <label>Node Type</label>
              <select className="select w-full" value={nodeType} onChange={e => setNodeType(e.target.value as any)}>
                <option value="media">Media</option>
                <option value="group">Group</option>
                <option value="form">Form</option>
              </select>
            </div>
          </div>

          <div className="border rounded p-4">
            {nodeType === "media" && <MediaBuilder2 initial={content} onChange={setContent} />}
            {nodeType === "group" && <GroupBuilder2 initial={content} onChange={setContent} />}
            {nodeType === "form"  && <FormBuilder2  initial={content} onChange={setContent} />}
          </div>
        </div>

        <div className="space-y-3">
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">Preview (JSON)</div>
            <pre className="text-xs overflow-auto max-h-[420px]">{JSON.stringify({ id, node_type: nodeType, content }, null, 2)}</pre>
          </div>
          <button className="btn w-full" disabled={saving || !content} onClick={handleSave}>
            {saving ? "Saving…" : "Save to Library"}
          </button>
        </div>
      </div>
    </div>
  );
}
