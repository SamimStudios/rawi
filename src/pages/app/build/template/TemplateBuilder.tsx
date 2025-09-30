import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Loader2, Save, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ROOT = 'root';
const joinAddr = (parentAddr: string | null, path: string) =>
  parentAddr ? `${parentAddr}.${path}` : `${ROOT}.${path}`;

export default function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('content');

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [nodes, setNodes] = useState<TemplateNodeRow[]>([]);
  const [libIndex, setLibIndex] = useState<Map<string, LibraryRow>>(new Map());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input controls (simple)
  const [newPath, setNewPath] = useState('');
  const [newType, setNewType] = useState<NodeType>('form');
  const [newLibraryId, setNewLibraryId] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (id === 'new') {
          setCreateDialogOpen(true);
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
        setNodes(tnodes);
      } catch (e: any) {
        setError(e.message ?? String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleCreateTemplate() {
    if (!newTemplateName.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const templateId = await createTemplate(newTemplateName.trim(), newTemplateCategory);
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
      const normalized = normalizeNodesForSave(nodes, template.current_version);
      await saveTemplateNodes(normalized);

      const fresh = await fetchTemplateNodes(template.id, template.current_version);
      setNodes(fresh);
      toast({ title: 'Success', description: 'Template nodes saved successfully' });
    } catch (e: any) {
      setError(e.message ?? String(e));
      toast({ title: 'Error', description: e.message ?? String(e), variant: 'destructive' });
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
      parent_addr: null, // All nodes added at root level
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
        parentAddr: null, // All nodes added at root level
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    if (id === 'new') {
      return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
              <CardDescription>Enter a name and category for your new template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

    // Fallback dialog (kept for compatibility)
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Idx</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Library ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No nodes yet. Add your first node above.
                    </TableCell>
                  </TableRow>
                ) : (
                  nodes.map(n => {
                    const addr = n.addr ?? joinAddr(n.parent_addr, n.path);
                    return (
                      <TableRow key={(n.addr ?? joinAddr(n.parent_addr, n.path)) + ':' + n.idx}>
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
