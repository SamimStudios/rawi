import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface I18nText {
  fallback: string;
  key?: string;
}

interface GroupContent {
  kind: 'Group';
  idx: number;
  path: string;
  label: I18nText;
  description?: I18nText;
  arrangeable: boolean;
  children: string[]; // Array of node paths/references
}

interface GroupContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

interface LibraryNode {
  id: string;
  node_type: string;
  active: boolean;
  version: number;
}

export function GroupContentEditor({ content, onChange }: GroupContentEditorProps) {
  const [groupContent, setGroupContent] = useState<GroupContent>({
    kind: 'Group',
    idx: 1,
    path: 'group',
    label: { fallback: 'Group' },
    arrangeable: false,
    children: []
  });
  const [availableNodes, setAvailableNodes] = useState<LibraryNode[]>([]);

  useEffect(() => {
    console.log('GroupContentEditor: Loading content', content);
    
    // Initialize from existing content structure
    if (content && typeof content === 'object' && Object.keys(content).length > 0) {
      setGroupContent({
        kind: content.kind || 'Group',
        idx: content.idx || 1,
        path: content.path || 'group',
        label: content.label || { fallback: 'Group' },
        description: content.description,
        arrangeable: content.arrangeable || false,
        children: content.children || []
      });
    }
  }, [content]);

  useEffect(() => {
    // Fetch available nodes from library
    const fetchNodes = async () => {
      try {
        console.log('GroupContentEditor: Fetching available library nodes');
        const { data, error } = await supabase
          .schema('app' as any)
          .from('node_library')
          .select('id, node_type, active, version')
          .eq('active', true)
          .order('node_type', { ascending: true });
        
        if (error) {
          console.error('GroupContentEditor: Error fetching nodes:', error);
          throw error;
        }
        
        console.log('GroupContentEditor: Fetched nodes:', data?.length || 0);
        setAvailableNodes(data || []);
      } catch (error) {
        console.error('GroupContentEditor: Failed to fetch library nodes:', error);
      }
    };

    fetchNodes();
  }, []);

  useEffect(() => {
    // Update parent content when group content changes
    console.log('GroupContentEditor: Updating parent content', groupContent);
    onChange(groupContent);
  }, [groupContent, onChange]);

  const addChildNode = (nodeId: string) => {
    if (!groupContent.children.includes(nodeId)) {
      setGroupContent(prev => ({
        ...prev,
        children: [...prev.children, nodeId]
      }));
    }
  };

  const removeChildNode = (index: number) => {
    setGroupContent(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateGroupContent = (updates: Partial<GroupContent>) => {
    setGroupContent(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Group Node Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure this group node to contain other library nodes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Group Path</Label>
              <Input
                value={groupContent.path}
                onChange={(e) => updateGroupContent({ path: e.target.value })}
                placeholder="group_path"
              />
            </div>
            <div className="space-y-2">
              <Label>Index</Label>
              <Input
                type="number"
                value={groupContent.idx}
                onChange={(e) => updateGroupContent({ idx: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Label (Fallback Text)</Label>
            <Input
              value={groupContent.label.fallback}
              onChange={(e) => updateGroupContent({
                label: { ...groupContent.label, fallback: e.target.value }
              })}
              placeholder="Group Label"
            />
          </div>

          <div className="space-y-2">
            <Label>Translation Key (Optional)</Label>
            <Input
              value={groupContent.label.key || ''}
              onChange={(e) => updateGroupContent({
                label: { ...groupContent.label, key: e.target.value }
              })}
              placeholder="translations.group.label"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={groupContent.description?.fallback || ''}
              onChange={(e) => updateGroupContent({
                description: { fallback: e.target.value }
              })}
              placeholder="Group description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={groupContent.arrangeable}
              onCheckedChange={(checked) => updateGroupContent({ arrangeable: checked })}
            />
            <Label className="text-xs">Arrangeable (children can be reordered)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Child Nodes</CardTitle>
            <Badge variant="secondary">{groupContent.children.length} nodes</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Node from Library</Label>
            <Select onValueChange={addChildNode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a node to add" />
              </SelectTrigger>
              <SelectContent>
                {availableNodes
                  .filter(node => !groupContent.children.includes(node.id))
                  .map(node => (
                    <SelectItem key={node.id} value={node.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{node.node_type}</Badge>
                        <span>{node.id}</span>
                        <span className="text-xs text-muted-foreground">v{node.version}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {groupContent.children.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <Layers className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No Child Nodes</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Select nodes from the library to include in this group
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupContent.children.map((childId, index) => {
                const node = availableNodes.find(n => n.id === childId);
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{node?.node_type || 'unknown'}</Badge>
                          <span className="font-medium">{childId}</span>
                          {node && (
                            <span className="text-xs text-muted-foreground">v{node.version}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => removeChildNode(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Debug Info:</strong> Group content: {groupContent.kind}, Children: {groupContent.children.length}, Available nodes: {availableNodes.length}
      </div>
    </div>
  );
}