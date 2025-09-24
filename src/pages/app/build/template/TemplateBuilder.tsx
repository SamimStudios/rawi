import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, ArrowLeft, Plus, Trash2, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTemplates, type Template, type TemplateNode } from '@/hooks/useTemplates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TreeNode extends TemplateNode {
  children: TreeNode[];
  level: number;
}

export default function TemplateBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    templates, 
    templateNodes, 
    nodeLibrary, 
    loading, 
    saveTemplate, 
    saveTemplateNodes, 
    fetchTemplates,
    fetchTemplateNodes,
    fetchNodeLibrary
  } = useTemplates();

  const [template, setTemplate] = useState<Template>({
    id: '',
    name: '',
    category: 'cinematic_trailer',
    active: true,
    current_version: 1,
    meta: {},
  });

  const [nodes, setNodes] = useState<TemplateNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [isSaving, setIsSaving] = useState(false);
  const [addNodeDialogOpen, setAddNodeDialogOpen] = useState(false);
  const [selectedParentAddr, setSelectedParentAddr] = useState<string>('root');

  useEffect(() => {
    fetchTemplates();
    fetchNodeLibrary();
  }, [fetchTemplates, fetchNodeLibrary]);

  useEffect(() => {
    if (id && templates.length > 0) {
      const existingTemplate = templates.find(t => t.id === id);
      if (existingTemplate) {
        setTemplate(existingTemplate);
        fetchTemplateNodes(id, existingTemplate.current_version);
      } else {
        toast({
          title: "Template not found",
          description: "The requested template was not found.",
          variant: "destructive",
        });
        navigate('/app/build/template');
      }
    }
  }, [id, templates, navigate, toast, fetchTemplateNodes]);

  useEffect(() => {
    setNodes(templateNodes);
  }, [templateNodes]);

  const buildNodeTree = useCallback((nodes: TemplateNode[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    
    // Initialize nodes
    nodes.forEach(node => {
      nodeMap.set(node.addr, { ...node, children: [], level: 0 });
    });
    
    const tree: TreeNode[] = [];
    
    // Build hierarchy
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.addr)!;
      
      if (!node.parent_addr) {
        // Root level node
        treeNode.level = 0;
        tree.push(treeNode);
      } else {
        // Child node
        const parent = nodeMap.get(node.parent_addr);
        if (parent) {
          treeNode.level = parent.level + 1;
          parent.children.push(treeNode);
        }
      }
    });
    
    // Sort children by idx
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => a.idx - b.idx);
      node.children.forEach(sortChildren);
    };
    
    tree.forEach(sortChildren);
    tree.sort((a, b) => a.idx - b.idx);
    
    return tree;
  }, []);

  const flattenTree = useCallback((tree: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    
    const traverse = (node: TreeNode) => {
      result.push(node);
      if (expandedNodes.has(node.addr)) {
        node.children.forEach(traverse);
      }
    };
    
    tree.forEach(traverse);
    return result;
  }, [expandedNodes]);

  const handleSave = async () => {
    console.log('🔄 handleSave called');
    console.log('📝 Current template data:', template);
    console.log('🌳 Current nodes:', nodes);
    
    if (!template.id.trim() || !template.name.trim()) {
      console.warn('⚠️ Validation failed - missing required fields');
      toast({
        title: "Validation Error",
        description: "Template ID and name are required",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(template.id)) {
      console.warn('⚠️ Validation failed - invalid template ID format');
      toast({
        title: "Validation Error",
        description: "Template ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Validation passed, starting save process...');
    setIsSaving(true);

    try {
      console.log('🚀 Calling saveTemplate...');
      const templateSuccess = await saveTemplate(template);
      console.log('📊 saveTemplate result:', templateSuccess);
      
      if (!templateSuccess) {
        console.error('❌ Template save failed, aborting');
        return;
      }

      console.log('🚀 Calling saveTemplateNodes...');
      const nodesSuccess = await saveTemplateNodes(nodes);
      console.log('📊 saveTemplateNodes result:', nodesSuccess);
      
      if (!nodesSuccess) {
        console.error('❌ Template nodes save failed, aborting');
        return;
      }

      console.log('✅ Both saves successful, navigating back...');
      navigate('/app/build/template');
    } catch (error) {
      console.error('❌ Unexpected error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpanded = (addr: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(addr)) {
        next.delete(addr);
      } else {
        next.add(addr);
      }
      return next;
    });
  };

  const addNode = (libraryId: string, parentAddr: string, path: string) => {
    const libraryNode = nodeLibrary.find(n => n.id === libraryId);
    if (!libraryNode) return;

    const newAddr = parentAddr === 'root' ? `root.${path}` : `${parentAddr}.${path}`;
    
    // Check if address already exists
    if (nodes.some(n => n.addr === newAddr)) {
      toast({
        title: "Error",
        description: "A node with this path already exists at this level",
        variant: "destructive",
      });
      return;
    }

    // Find siblings to determine idx
    const siblings = nodes.filter(n => n.parent_addr === (parentAddr === 'root' ? null : parentAddr));
    const maxIdx = siblings.length > 0 ? Math.max(...siblings.map(s => s.idx)) : 0;

    const newNode: TemplateNode = {
      template_id: template.id,
      version: template.current_version,
      addr: newAddr,
      idx: maxIdx + 1,
      node_type: libraryNode.node_type,
      path,
      parent_addr: parentAddr === 'root' ? null : parentAddr,
      library_id: libraryId,
      dependencies: [],
      arrangeable: false,
      removable: true,
      content_override: null,
      payload_validate_override: null,
      payload_generate_override: null,
      validate_n8n_id_override: null,
      generate_n8n_id_override: null,
    };

    setNodes(prev => [...prev, newNode]);
    setExpandedNodes(prev => new Set([...prev, parentAddr]));
    setAddNodeDialogOpen(false);
  };

  const removeNode = (addr: string) => {
    // Remove node and all its children
    setNodes(prev => prev.filter(n => !n.addr.startsWith(addr)));
  };

  const tree = buildNodeTree(nodes);
  const flatTree = flattenTree(tree);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/build/template">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {id ? 'Edit' : 'Create'} Template
          </h1>
          <p className="text-muted-foreground">
            Configure a reusable template for your application
          </p>
        </div>
      </div>

      {/* Template Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Template Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Template ID *</Label>
              <Input
                id="id"
                value={template.id}
                onChange={(e) => setTemplate(prev => ({ ...prev, id: e.target.value }))}
                placeholder="my_template_id"
                disabled={!!id}
              />
              <p className="text-xs text-muted-foreground">
                Must start with lowercase letter, use only lowercase letters, numbers, and underscores
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Template"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={template.category} 
                onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic_trailer">Cinematic Trailer</SelectItem>
                  <SelectItem value="promotional_video">Promotional Video</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="number"
                min="1"
                value={template.current_version}
                onChange={(e) => setTemplate(prev => ({ ...prev, current_version: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-7">
              <Switch
                id="active"
                checked={template.active}
                onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Structure */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Structure</CardTitle>
            <Dialog open={addNodeDialogOpen} onOpenChange={setAddNodeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedParentAddr('root')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Node
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Node</DialogTitle>
                  <DialogDescription>
                    Select a node from the library to add to your template.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Library Node</Label>
                    <Select onValueChange={(libraryId) => {
                      const path = prompt('Enter node path (e.g., "user_input", "characters"):');
                      if (path && /^[a-z][a-z0-9_]*$/.test(path)) {
                        addNode(libraryId, selectedParentAddr, path);
                      } else if (path) {
                        toast({
                          title: "Invalid Path",
                          description: "Path must start with lowercase letter and contain only lowercase letters, numbers, and underscores",
                          variant: "destructive",
                        });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a library node..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nodeLibrary.map(node => (
                          <SelectItem key={node.id} value={node.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {node.node_type}
                              </Badge>
                              {node.id}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flatTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No nodes added yet. Click "Add Node" to get started.
              </div>
            ) : (
              flatTree.map(node => (
                <div key={node.addr} className="flex items-center gap-2 py-2 px-3 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-1" style={{ marginLeft: `${node.level * 20}px` }}>
                    {node.children.length > 0 ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(node.addr)}
                      >
                        {expandedNodes.has(node.addr) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6" />
                    )}
                    
                    {node.node_type === 'group' ? (
                      <Folder className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-medium">{node.path}</span>
                    <Badge variant="outline" className="text-xs">
                      {node.node_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({node.library_id})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedParentAddr(node.addr);
                        setAddNodeDialogOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    {node.removable && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Node</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{node.path}" and all its children?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeNode(node.addr)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
        
        <Button variant="outline" asChild>
          <Link to="/app/build/template">
            Cancel
          </Link>
        </Button>
      </div>
    </div>
  );
}