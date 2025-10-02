import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  useTemplates,
  type TemplateRow,
  type TemplateNodeRow,
  type LibraryRow,
  type NodeType
} from '@/hooks/useTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, ArrowLeft, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
// add this near the imports
const appDb = (supabase as any).schema('app');


// -------------------- helpers --------------------
const ROOT = 'root';
const LTREE_RE = /^root(\.[a-z0-9_]+)*$/;
const isValidAddr = (a: string) => LTREE_RE.test(a);
const joinAddr = (parentAddr: string | null, path: string) =>
  parentAddr ? `${parentAddr}.${path}` : `${ROOT}.${path}`;

type UINode = TemplateNodeRow & {
  dependencies?: string[];
  addr?: string; // preview for unsaved nodes
};

function wouldCreateCycle(allNodes: UINode[], fromAddr: string, toAddr: string): boolean {
  if (fromAddr === toAddr) return true;
  const edges = new Map<string, string[]>();
  for (const n of allNodes) {
    const a = n.addr ?? joinAddr(n.parent_addr ?? null, n.path);
    edges.set(a, (n.dependencies ?? []) as string[]);
  }
  const list = edges.get(fromAddr) ?? [];
  list.push(toAddr);
  edges.set(fromAddr, list);

  const seen = new Set<string>();
  const stack = [toAddr];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === fromAddr) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const next = edges.get(cur) ?? [];
    for (const n of next) stack.push(n);
  }
  return false;
}

export default function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new' || location.pathname.endsWith('/new');
  const { toast } = useToast();
  const {
    fetchTemplateById,
    fetchTemplateNodes,
    loadLibraryIndex,
    ensureGroupAnchors,
    createTemplate,
    saveTemplateNodes,
    normalizeNodesForSave,
    isValidPathLabel
  } = useTemplates();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('content');

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [nodes, setNodes] = useState<UINode[]>([]);
  const [libIndex, setLibIndex] = useState<Map<string, LibraryRow>>(new Map());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------- Add Node controls -------
  const [newPath, setNewPath] = useState('');
  const [newType, setNewType] = useState<NodeType>('form');
  const [newLibraryId, setNewLibraryId] = useState('');
  const [newDepSelect, setNewDepSelect] = useState<string>('');
  const [newDeps, setNewDeps] = useState<string[]>([]);

  // ------- Edit Node modal -------
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UINode | null>(null);
  const [editDepSelect, setEditDepSelect] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isNew) {
          setLoading(false);
          return;
        }
        if (!id) throw new Error('No template id');
        await ensureGroupAnchors();

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

        const enriched = tnodes.map(n => ({
          ...n,
          dependencies: (n as any).dependencies ?? []
        })) as UINode[];

        setNodes(enriched);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // ---------------- dependency option builder ----------------
  const allNodesWithPreview = useMemo<UINode[]>(() => {
    return nodes.map(n => ({
      ...n,
      addr: n.addr ?? joinAddr(n.parent_addr, n.path),
      dependencies: n.dependencies ?? []
    }));
  }, [nodes]);

  const defaultInstancesForNode = (n: UINode) => {
    const lib = libIndex.get(n.library_id);
    if (!lib) return 0;
    const di = Number(lib?.content?.collection?.default_instances ?? 0);
    return Number.isFinite(di) && di > 0 ? di : 0;
  };

  const dependencyOptions = useMemo<{ value: string; label: string }[]>(() => {
    const opts: { value: string; label: string }[] = [];
    for (const n of allNodesWithPreview) {
      const base = n.addr ?? joinAddr(n.parent_addr, n.path);
      if (!isValidAddr(base)) continue;

      // root node
      opts.push({ value: base, label: base });

      // collection instances
      const di = defaultInstancesForNode(n);
      if (di > 0) {
        for (let i = 1; i <= di; i++) {
          const inst = `${base}.i${i}`;
          opts.push({ value: inst, label: inst });
        }
      }
    }
    const seen = new Set<string>();
    return opts.filter(o => (seen.has(o.value) ? false : (seen.add(o.value), true)));
  }, [allNodesWithPreview, libIndex]);

  async function handleCreateTemplate() {
    if (!newTemplateId.trim()) {
      toast({ title: 'Error', description: 'Template ID is required', variant: 'destructive' });
      return;
    }
    if (!newTemplateName.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const templateId = await createTemplate(newTemplateName.trim(), newTemplateCategory, newTemplateId.trim());
      toast({ title: 'Success', description: 'Template created successfully' });
      navigate(`/app/build/template/${templateId}`);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message ?? String(e), variant: 'destructive' });
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template) return;
    setSaving(true);
    setError(null);
    try {
      const normalized = normalizeNodesForSave(
        nodes.map(n => ({ ...n, dependencies: n.dependencies ?? [] })) as TemplateNodeRow[],
        template.current_version
      );
      await saveTemplateNodes(normalized);
      const fresh = await fetchTemplateNodes(template.id, template.current_version);
      setNodes(fresh.map(n => ({ ...n, dependencies: (n as any).dependencies ?? [] })));
      toast({ title: 'Success', description: 'Template nodes saved successfully' });
      setNewDeps([]);
      setNewDepSelect('');
    } catch (e: any) {
      setError(e.message ?? String(e));
      toast({ title: 'Error', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // ---------------- adders ----------------
  const addDepToNew = (depAddr: string) => {
    if (!newPath) {
      toast({ title: 'Add a path first', description: 'Set a path label before adding dependencies.' });
      return;
    }
    const selfAddr = joinAddr(null, newPath); // top-level current UI
    if (depAddr === selfAddr) {
      toast({ title: 'Invalid', description: 'Self-dependency is not allowed.', variant: 'destructive' });
      return;
    }
    if (wouldCreateCycle(allNodesWithPreview.concat([{
      path: newPath,
      parent_addr: null,
      addr: selfAddr,
      dependencies: newDeps,
    } as UINode]), selfAddr, depAddr)) {
      toast({ title: 'Cycle detected', description: 'This dependency creates a cycle.', variant: 'destructive' });
      return;
    }
    setNewDeps(prev => Array.from(new Set([...prev, depAddr])));
    setNewDepSelect('');
  };

  function addSimpleNode() {
    if (!template) return;
    if (!newLibraryId) return setError('Select a library_id');
    if (!isValidPathLabel(newPath)) return setError('Path must be [a-z][a-z0-9_]*');

    const lib = libIndex.get(newLibraryId);
    if (!lib) return setError('Library not found');
    if (newType !== lib.node_type) return setError(`Type mismatch: ${newType} vs library ${lib.node_type}`);

    const selfAddr = joinAddr(null, newPath);
    for (const dep of newDeps) {
      if (!isValidAddr(dep)) {
        return setError(`Invalid dependency address: ${dep}`);
      }
      if (wouldCreateCycle(allNodesWithPreview, selfAddr, dep)) {
        return setError(`Adding dependency "${dep}" would create a cycle`);
      }
    }

    const row: UINode = {
      template_id: template.id,
      version: template.current_version,
      idx: 999999,
      node_type: newType,
      path: newPath,
      parent_addr: null,
      library_id: lib.id,
      arrangeable: true,
      removable: true,
      dependencies: [...newDeps],
      addr: selfAddr
    };
    setNodes(prev => [...prev, row]);
    setError(null);
    setNewDeps([]);
    setNewDepSelect('');
  }

  function seedGroupNodes(params: {
    templateId: string;
    version: number;
    parentAddr: string | null;
    groupPath: string;
    groupLibrary: LibraryRow;
    libIndex: Map<string, LibraryRow>;
  }): UINode[] {
    const { templateId, version, parentAddr, groupPath, groupLibrary, libIndex } = params;
    if (!isValidPathLabel(groupPath)) throw new Error(`Invalid path: ${groupPath}`);

    const rows: UINode[] = [];

    // group root (dependencies from Add form apply to root only)
    const groupAddr = parentAddr ? `${parentAddr}.${groupPath}` : `${ROOT}.${groupPath}`;
    rows.push({
      template_id: templateId,
      version,
      idx: 999999,
      node_type: 'group',
      path: groupPath,
      parent_addr: parentAddr,
      library_id: groupLibrary.id,
      arrangeable: true,
      removable: false,
      dependencies: [...newDeps],
      addr: groupAddr
    });

    const content = groupLibrary.content || {};

    if (Array.isArray(content.children)) {
      const children = [...content.children].sort((a: any, b: any) => (a.idx ?? 1) - (b.idx ?? 1));
      for (const kid of children) {
        const childPath: string = kid.path;
        if (!isValidPathLabel(childPath)) throw new Error(`Invalid child path: ${childPath}`);
        const childLib = libIndex.get(kid.library_id);
        if (!childLib) throw new Error(`Missing library: ${kid.library_id}`);

        if (childLib.node_type === 'group') {
          const childRows = seedGroupNodes({
            templateId,
            version,
            parentAddr: groupAddr,
            groupPath: childPath,
            groupLibrary: childLib,
            libIndex
          });
          rows.push(...childRows);
        } else {
          const childAddr = `${groupAddr}.${childPath}`;
          rows.push({
            template_id: templateId,
            version,
            idx: 999999,
            node_type: childLib.node_type,
            path: childPath,
            parent_addr: groupAddr,
            library_id: childLib.id,
            removable: true,
            dependencies: [],
            addr: childAddr
          });
        }
      }
      return rows;
    }

    if (content.collection && content.instances && Array.isArray(content.instances)) {
      const N = Number.isFinite(+content.collection.default_instances) && +content.collection.default_instances > 0
        ? +content.collection.default_instances
        : 1;

      const instDef = content.instances.find((inst: any) => inst.i === 1);
      if (!instDef || !Array.isArray(instDef.children)) return rows;

      for (let i = 1; i <= N; i++) {
        const iPath = `i${i}`;
        const iAddr = `${groupAddr}.${iPath}`;

        rows.push({
          template_id: templateId,
          version,
          idx: 999999,
          node_type: 'group',
          path: iPath,
          parent_addr: groupAddr,
          library_id: 'lib_group_instance_anchor',
          arrangeable: true,
          removable: true,
          dependencies: [],
          addr: iAddr
        });

        for (const libraryId of instDef.children) {
          const childLib = libIndex.get(libraryId);
          if (!childLib) {
            throw new Error(`Missing library: ${libraryId}`);
          }
          const childPath = libraryId.replace(/^lib_/, '');
          if (!isValidPathLabel(childPath)) {
            throw new Error(`Invalid child path derived from library: ${childPath}`);
          }
          const childAddr = `${iAddr}.${childPath}`;

          if (childLib.node_type === 'group') {
            const childRows = seedGroupNodes({
              templateId,
              version,
              parentAddr: iAddr,
              groupPath: childPath,
              groupLibrary: childLib,
              libIndex
            });
            rows.push(...childRows);
          } else {
            rows.push({
              template_id: templateId,
              version,
              idx: 999999,
              node_type: childLib.node_type,
              path: childPath,
              parent_addr: iAddr,
              library_id: childLib.id,
              removable: true,
              dependencies: [],
              addr: childAddr
            });
          }
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

    const selfAddr = joinAddr(null, newPath);
    for (const dep of newDeps) {
      if (!isValidAddr(dep)) {
        return setError(`Invalid dependency address: ${dep}`);
      }
      if (wouldCreateCycle(allNodesWithPreview, selfAddr, dep)) {
        return setError(`Adding dependency "${dep}" would create a cycle`);
      }
    }

    try {
      const seeded = seedGroupNodes({
        templateId: template.id,
        version: template.current_version,
        parentAddr: null,
        groupPath: newPath,
        groupLibrary: lib,
        libIndex
      });
      setNodes(prev => [...prev, ...seeded]);
      setError(null);
      setNewDeps([]);
      setNewDepSelect('');
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  // ---------------- edit modal logic ----------------
  const openEdit = (row: UINode) => {
    const addr = row.addr ?? joinAddr(row.parent_addr, row.path);
    setEditing({
      ...row,
      addr,
      dependencies: row.dependencies ?? [],
    });
    setEditDepSelect('');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setEditDepSelect('');
  };

  const addDepToEdit = (depAddr: string) => {
    if (!editing) return;
    const selfAddr = editing.addr ?? joinAddr(editing.parent_addr, editing.path);
    if (depAddr === selfAddr) {
      toast({ title: 'Invalid', description: 'Self-dependency is not allowed.', variant: 'destructive' });
      return;
    }
    const previewNodes = allNodesWithPreview.map(n =>
      (n.addr ?? joinAddr(n.parent_addr, n.path)) === selfAddr
        ? { ...n, dependencies: Array.from(new Set([...(editing.dependencies ?? []), depAddr])) }
        : n
    );
    if (wouldCreateCycle(previewNodes, selfAddr, depAddr)) {
      toast({ title: 'Cycle detected', description: 'This dependency creates a cycle.', variant: 'destructive' });
      return;
    }
    setEditing(ed => ed ? { ...ed, dependencies: Array.from(new Set([...(ed.dependencies ?? []), depAddr])) } : ed);
    setEditDepSelect('');
  };

  const saveEdit = async () => {
    if (!editing || !template) return;
  
    const original = nodes.find(n =>
      (n.addr ?? joinAddr(n.parent_addr, n.path)) === (editing.addr ?? joinAddr(editing.parent_addr, editing.path))
    );
    const oldAddr = original ? (original.addr ?? joinAddr(original.parent_addr, original.path)) : editing.addr!;
    const newAddr = joinAddr(editing.parent_addr, editing.path);
  
    // 1) basic validation
    if (!isValidPathLabel(editing.path)) {
      toast({ title: 'Invalid path', description: 'Path must be [a-z][a-z0-9_]*', variant: 'destructive' });
      return;
    }
    for (const dep of editing.dependencies ?? []) {
      if (!/^root(\.[a-z0-9_]+)*$/.test(dep)) {
        toast({ title: 'Invalid dependency', description: dep, variant: 'destructive' });
        return;
      }
    }
  
    // 2) cycle check with preview
    const previewNodes = allNodesWithPreview.map(n =>
      (n.addr ?? joinAddr(n.parent_addr, n.path)) === oldAddr
        ? { ...n, dependencies: editing.dependencies ?? [], path: editing.path }
        : n
    );
    for (const dep of editing.dependencies ?? []) {
      if (wouldCreateCycle(previewNodes, newAddr, dep)) {
        toast({ title: 'Cycle detected', description: `Dependency "${dep}" creates a cycle.`, variant: 'destructive' });
        return;
      }
    }
  
    try {
      // 3) rename (server cascades parent_addr + dep refs)
      if (oldAddr !== newAddr) {
        const { error: e1 } = await appDb.rpc('tn_rename_label', {
          p_template_id: template.id,
          p_version: template.current_version,
          p_old_addr: oldAddr,
          p_new_label: editing.path,
        });
        if (e1) throw e1;
      }
  
      // 4) update dependencies — use .select().maybeSingle() to avoid the internal push/length bug
      const deps = Array.isArray(editing.dependencies) ? editing.dependencies : [];
      const { error: e2 } = await appDb
        .from('template_nodes')
        .update({ dependencies: deps })
        .eq('template_id', template.id)
        .eq('version', template.current_version)
        .eq('addr', newAddr)
        .select('addr')
        .maybeSingle(); // <= important
      if (e2) throw e2;
  
      // 5) reorder idx (contiguous)
      const newIdx = Math.max(1, Number.isFinite(+editing.idx) ? +editing.idx : 1);
      const { error: e3 } = await appDb.rpc('tn_set_idx', {
        p_template_id: template.id,
        p_version: template.current_version,
        p_addr: newAddr,
        p_new_idx: newIdx,
      });
      if (e3) throw e3;
  
      // 6) refresh
      const fresh = await fetchTemplateNodes(template.id, template.current_version);
      setNodes(fresh.map(n => ({ ...n, dependencies: (n as any).dependencies ?? [] })));
      toast({ title: 'Updated', description: 'Node updated successfully.' });
      setEditOpen(false);
      setEditing(null);
      setEditDepSelect('');
    } catch (e: any) {
      // if the client still trips, fall back to minimal returning (no response parsing) and retry once
      try {
        const deps = Array.isArray(editing?.dependencies) ? editing?.dependencies : [];
        const { error: eMin } = await appDb
          .from('template_nodes')
          .update({ dependencies: deps }, { returning: 'minimal' }) // <= no response body
          .eq('template_id', template!.id)
          .eq('version', template!.current_version)
          .eq('addr', newAddr);
        if (eMin) throw eMin;
  
        const fresh = await fetchTemplateNodes(template!.id, template!.current_version);
        setNodes(fresh.map(n => ({ ...n, dependencies: (n as any).dependencies ?? [] })));
        toast({ title: 'Updated', description: 'Node updated successfully.' });
        setEditOpen(false);
        setEditing(null);
        setEditDepSelect('');
      } catch (inner: any) {
        toast({ title: 'Error', description: inner?.message ?? String(inner), variant: 'destructive' });
      }
    }
  };


  // ---------------- UI ----------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    if (isNew) {
      return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>Enter a name and category for your new template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">Template ID</Label>
                <Input id="id" value={newTemplateId} onChange={(e) => setNewTemplateId(e.target.value)} placeholder="tpl_my_template" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="My Template" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={newTemplateCategory} onChange={(e) => setNewTemplateCategory(e.target.value)} placeholder="content" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => navigate('/app/build/template')}>Cancel</Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Enter a name and category for your new template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="My Template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  placeholder="content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => navigate('/app/build/template')}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/build/template')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <code className="bg-muted px-2 py-0.5 rounded">{template.id}</code>
              <span>•</span>
              <Badge variant="outline">v{template.current_version}</Badge>
              <span>•</span>
              <span className="capitalize">{template.category}</span>
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Node Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add Node</CardTitle>
          <CardDescription>
            Add a new node to the template structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Path</Label>
              <Input
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="single_label"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as NodeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Library</Label>
              <Select value={newLibraryId} onValueChange={setNewLibraryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select library" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(libIndex.values()).map(lib => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.id} ({lib.node_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dependencies picker (Add) */}
          <div className="space-y-2">
            <Label>Dependencies</Label>
            <div className="flex gap-2">
              <Select value={newDepSelect} onValueChange={setNewDepSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dependency address" />
                </SelectTrigger>
                <SelectContent>
                  {dependencyOptions
                    .filter(o => o.value !== (newPath ? joinAddr(null, newPath) : ''))
                    .map(opt => (
                      <SelectItem value={opt.value} key={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => newDepSelect && addDepToNew(newDepSelect)}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newDeps.length ? newDeps.map(dep => (
                <Badge key={dep} variant="secondary" className="gap-1">
                  <span className="font-mono text-xs">{dep}</span>
                  <button onClick={() => setNewDeps(prev => prev.filter(d => d !== dep))} aria-label="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )) : <span className="text-sm text-muted-foreground">No dependencies</span>}
            </div>
          </div>

          <Button onClick={newType === 'group' ? addGroupNode : addSimpleNode}>
            <Plus className="w-4 h-4 mr-2" />
            Add {newType}
          </Button>
        </CardContent>
      </Card>

      {/* Nodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Template Nodes ({nodes.length})</CardTitle>
          <CardDescription>
            Structure and hierarchy of template nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Idx</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Library ID</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No nodes yet. Add your first node above.
                    </TableCell>
                  </TableRow>
                ) : (
                  nodes.map(n => {
                    const addr = n.addr ?? joinAddr(n.parent_addr, n.path);
                    return (
                      <TableRow key={addr + ':' + n.idx}>
                        <TableCell className="font-medium">{n.idx}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {n.node_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-0.5 rounded">{n.path}</code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground">
                            {n.parent_addr ?? 'NULL'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-muted-foreground">{addr}</code>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{n.library_id}</code>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(n)} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>Update path label, idx, and dependencies</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Path label (last segment)</Label>
                  <Input
                    value={editing.path}
                    onChange={(e) => setEditing(ed => ed ? { ...ed, path: e.target.value } : ed)}
                    placeholder="single_label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Idx</Label>
                  <Input
                    type="number"
                    value={editing.idx}
                    onChange={(e) => setEditing(ed => ed ? { ...ed, idx: Math.max(1, Number(e.target.value || 1)) } : ed)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="flex gap-2">
                  <Select value={editDepSelect} onValueChange={setEditDepSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dependency address" />
                    </SelectTrigger>
                    <SelectContent>
                      {dependencyOptions
                        .filter(o => o.value !== (editing.addr ?? joinAddr(editing.parent_addr, editing.path)))
                        .map(opt => (
                          <SelectItem value={opt.value} key={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => editDepSelect && addDepToEdit(editDepSelect)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editing.dependencies ?? []).length ? (editing.dependencies ?? []).map(dep => (
                    <Badge key={dep} variant="secondary" className="gap-1">
                      <span className="font-mono text-xs">{dep}</span>
                      <button
                        onClick={() => setEditing(ed => ed ? { ...ed, dependencies: (ed.dependencies ?? []).filter(d => d !== dep) } : ed)}
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )) : <span className="text-sm text-muted-foreground">No dependencies</span>}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
