// src/pages/app/build/template/TemplateBuilder.tsx
// Version-aware Template Builder with auto-seeded group children (regular + collection).

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useTemplates,
  type TemplateRow,
  type TemplateNodeRow,
  type LibraryRow,
  type NodeType
} from '@/hooks/useTemplates';

const ROOT = 'root';
const joinAddr = (parentAddr: string | null, path: string) =>
  parentAddr ? `${parentAddr}.${path}` : `${ROOT}.${path}`;

export default function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const {
    fetchTemplateById,
    fetchTemplateNodes,
    loadLibraryIndex,
    ensureGroupAnchors,
    saveTemplateNodes,
    normalizeNodesForSave,
    isValidPathLabel
  } = useTemplates();

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [nodes, setNodes] = useState<TemplateNodeRow[]>([]);
  const [libIndex, setLibIndex] = useState<Map<string, LibraryRow>>(new Map());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input controls (simple)
  const [newParentAddr, setNewParentAddr] = useState<string | null>(null);
  const [newPath, setNewPath] = useState('');
  const [newType, setNewType] = useState<NodeType>('form');
  const [newLibraryId, setNewLibraryId] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) throw new Error('No template id');
        await ensureGroupAnchors(); // idempotent

        const [tpl, libs] = await Promise.all([
          fetchTemplateById(id),
          loadLibraryIndex()
        ]);
        if (!mounted) return;
        if (!tpl) throw new Error(`Template ${id} not found`);

        setTemplate(tpl);
        setLibIndex(libs);

        const tnodes = await fetchTemplateNodes(tpl.id, tpl.current_version);
        if (!mounted) return;
        setNodes(tnodes);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const parentOptions = useMemo(() => {
    const roots = [{ label: '(root)', value: null as any }];
    const groupAddrs = nodes
      .filter(n => n.node_type === 'group')
      .map(n => {
        const addr = n.addr ?? joinAddr(n.parent_addr, n.path);
        return { label: addr, value: addr };
      });
    return [...roots, ...groupAddrs];
  }, [nodes]);

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    setError(null);
    try {
      // normalize sibling idx & pin version
      const normalized = normalizeNodesForSave(nodes, template.current_version)
        .map(n => ({
          ...n,
          template_id: template.id,             // <— ensure present
          version: template.current_version,    // <— ensure present
        }));
      await saveTemplateNodes(normalized);

      // reload fresh (to pull DB-generated addr)
      const fresh = await fetchTemplateNodes(template.id, template.current_version);
      setNodes(fresh);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  // ---- Adders

  function addSimpleNode() {
    if (!template) return;
    if (!newLibraryId) return setError('Select a library_id');
    if (!isValidPathLabel(newPath)) return setError('Path must be [a-z][a-z0-9_]*');

    const lib = libIndex.get(newLibraryId);
    if (!lib) return setError('Library not found');
    if (newType !== lib.node_type) return setError(`Type mismatch: ${newType} vs library ${lib.node_type}`);

    const row: TemplateNodeRow = {
      template_id: template.id,
      version: template.current_version,
      idx: 999999, // temp; fixed on save
      node_type: newType,
      path: newPath,
      parent_addr: newParentAddr,
      library_id: lib.id,
      removable: true
    };
    setNodes(prev => [...prev, row]);
    setError(null);
  }

  function seedGroupNodes(params: {
    templateId: string;
    version: number;
    parentAddr: string | null;
    groupPath: string;
    groupLibrary: LibraryRow;
    libIndex: Map<string, LibraryRow>;
  }): TemplateNodeRow[] {
    const { templateId, version, parentAddr, groupPath, groupLibrary, libIndex } = params;
    if (!isValidPathLabel(groupPath)) throw new Error(`Invalid path: ${groupPath}`);

    const rows: TemplateNodeRow[] = [];

    // 1) the group itself
    rows.push({
      template_id: templateId,
      version,
      idx: 999999,
      node_type: 'group',
      path: groupPath,
      parent_addr: parentAddr,
      library_id: groupLibrary.id,
      arrangeable: true,
      removable: false
    });

    const groupAddr = parentAddr ? `${parentAddr}.${groupPath}` : `${ROOT}.${groupPath}`;
    const content = groupLibrary.content || {};

    // REGULAR group -> children[]
    if (Array.isArray(content.children)) {
      const children = [...content.children].sort((a: any, b: any) => (a.idx ?? 1) - (b.idx ?? 1));
      for (const kid of children) {
        const childPath: string = kid.path;
        if (!isValidPathLabel(childPath)) throw new Error(`Invalid child path: ${childPath}`);
        const childLib = libIndex.get(kid.library_id);
        if (!childLib) throw new Error(`Missing library: ${kid.library_id}`);
        rows.push({
          template_id: templateId,
          version,
          idx: 999999,
          node_type: childLib.node_type,
          path: childPath,
          parent_addr: groupAddr,
          library_id: childLib.id,
          removable: true
        });
      }
      return rows;
    }

    // COLLECTION group -> collection + instances { children[] }
    if (content.collection && content.instances && Array.isArray(content.instances.children)) {
      const N = Number.isFinite(+content.collection.default_instances) && +content.collection.default_instances > 0
        ? +content.collection.default_instances
        : 1;

      const instChildren = [...content.instances.children].sort((a: any, b: any) => (a.idx ?? 1) - (b.idx ?? 1));

      // 2) 'instances' anchor under group
      rows.push({
        template_id: templateId,
        version,
        idx: 999999,
        node_type: 'group',
        path: 'instances',
        parent_addr: groupAddr,
        library_id: 'lib_group_instances_anchor',
        arrangeable: false,
        removable: false
      });

      const instancesAddr = `${groupAddr}.instances`;

      for (let i = 1; i <= N; i++) {
        const iPath = `i${i}`;

        // 3) each iN under instances
        rows.push({
          template_id: templateId,
          version,
          idx: 999999,
          node_type: 'group',
          path: iPath,
          parent_addr: instancesAddr,
          library_id: 'lib_group_instance_anchor',
          arrangeable: true,
          removable: true
        });

        const iAddr = `${instancesAddr}.${iPath}`;

        // 4) children under each iN
        for (const kid of instChildren) {
          const childPath: string = kid.path;
          if (!isValidPathLabel(childPath)) throw new Error(`Invalid child path: ${childPath}`);
          const childLib = libIndex.get(kid.library_id);
          if (!childLib) throw new Error(`Missing library: ${kid.library_id}`);
          rows.push({
            template_id: templateId,
            version,
            idx: 999999,
            node_type: childLib.node_type,
            path: childPath,
            parent_addr: iAddr,
            library_id: childLib.id,
            removable: true
          });
        }
      }
    }

    return rows;
  }

  function addGroupNode() {
    if (!template) return;
    if (!newLibraryId) return setError('Select a library_id');
    if (!isValidPathLabel(newPath)) return setError('Path must be [a-z][a-z0-9_]*');

    const lib = libIndex.get(newLibraryId);
    if (!lib) return setError('Library not found');
    if (lib.node_type !== 'group') return setError('Selected library is not a group');

    try {
      const seeded = seedGroupNodes({
        templateId: template.id,
        version: template.current_version,
        parentAddr: newParentAddr,
        groupPath: newPath,
        groupLibrary: lib,
        libIndex
      });
      setNodes(prev => [...prev, ...seeded]);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  // ---- UI

  function NodeRow({ n }: { n: TemplateNodeRow }) {
    const addr = n.addr ?? joinAddr(n.parent_addr, n.path);
    return (
      <tr>
        <td style={{ whiteSpace: 'nowrap' }}>{n.idx}</td>
        <td>{n.node_type}</td>
        <td><code>{n.path}</code></td>
        <td style={{ fontFamily: 'monospace' }}>{n.parent_addr ?? 'NULL'}</td>
        <td style={{ fontFamily: 'monospace' }}>{addr}</td>
        <td><code>{n.library_id}</code></td>
      </tr>
    );
  }

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: 'crimson' }}>Error: {error}</div>;
  if (!template) return <div style={{ padding: 16 }}>Template not found</div>;

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <header>
        <h2 style={{ margin: 0 }}>{template.name}</h2>
        <div style={{ color: '#888' }}>
          id: <code>{template.id}</code> • version: <b>{template.current_version}</b> • category: {template.category}
        </div>
      </header>

      <section style={{ display: 'grid', gap: 8, border: '1px solid #222', padding: 12, borderRadius: 8 }}>
        <h3 style={{ margin: 0 }}>Add node</h3>

        <label>
          Parent:
          <select
            value={newParentAddr ?? ''}
            onChange={(e) => setNewParentAddr(e.target.value || null)}
            style={{ marginLeft: 8 }}
          >
            {parentOptions.map(opt => (
              <option key={opt.label + String(opt.value)} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Path:
          <input
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="single_label"
            style={{ marginLeft: 8 }}
          />
        </label>

        <label>
          Type:
          <select value={newType} onChange={(e) => setNewType(e.target.value as NodeType)} style={{ marginLeft: 8 }}>
            <option value="form">form</option>
            <option value="media">media</option>
            <option value="group">group</option>
          </select>
        </label>

        <label>
          Library:
          <select value={newLibraryId} onChange={(e) => setNewLibraryId(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">-- select --</option>
            {Array.from(libIndex.values()).map(lib => (
              <option key={lib.id} value={lib.id}>
                {lib.id} ({lib.node_type})
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={newType === 'group' ? addGroupNode : addSimpleNode}>
            Add {newType}
          </button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>

      <section>
        <h3 style={{ margin: '8px 0' }}>Nodes ({nodes.length})</h3>
        <table cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>idx</th>
              <th>type</th>
              <th>path</th>
              <th>parent_addr</th>
              <th>addr</th>
              <th>library_id</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(n => (
              <NodeRow key={(n.addr ?? joinAddr(n.parent_addr, n.path)) + ':' + n.idx} n={n} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
