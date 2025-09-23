import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface I18nText {
  fallback: string;
  key?: string;
}

interface CollectionInstance {
  instance_id: number;
  path: string;
  children: string[];
}

interface CollectionContent {
  kind: 'CollectionNode';
  idx: number;
  label: I18nText;
  description?: I18nText;
  path: string;
  arrangeable: boolean;
  min_instances: number;
  max_instances: number;
  instances: CollectionInstance[];
}

interface CollectionContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function CollectionContentEditor({ content, onChange }: CollectionContentEditorProps) {
  const [collectionContent, setCollectionContent] = useState<CollectionContent>({
    kind: 'CollectionNode',
    idx: 1,
    label: { fallback: 'Collection' },
    path: '',
    arrangeable: false,
    min_instances: 1,
    max_instances: 10,
    instances: []
  });

  useEffect(() => {
    // Initialize from content
    if (content.kind === 'CollectionNode') {
      setCollectionContent({
        kind: 'CollectionNode',
        idx: content.idx || 1,
        label: content.label || { fallback: 'Collection' },
        description: content.description,
        path: content.path || '',
        arrangeable: content.arrangeable || false,
        min_instances: content.min_instances || 1,
        max_instances: content.max_instances || 10,
        instances: content.instances || []
      });
    }
  }, [content]);

  useEffect(() => {
    // Update parent content when collection content changes
    onChange(collectionContent);
  }, [collectionContent, onChange]);

  const addInstance = () => {
    const newInstanceId = Math.max(0, ...collectionContent.instances.map(inst => inst.instance_id)) + 1;
    const newInstance: CollectionInstance = {
      instance_id: newInstanceId,
      path: `${collectionContent.path}#i${newInstanceId}`,
      children: []
    };
    
    setCollectionContent(prev => ({
      ...prev,
      instances: [...prev.instances, newInstance]
    }));
  };

  const updateInstance = (index: number, updates: Partial<CollectionInstance>) => {
    setCollectionContent(prev => ({
      ...prev,
      instances: prev.instances.map((instance, i) => 
        i === index ? { ...instance, ...updates } : instance
      )
    }));
  };

  const removeInstance = (index: number) => {
    setCollectionContent(prev => ({
      ...prev,
      instances: prev.instances.filter((_, i) => i !== index)
    }));
  };

  const addChildToInstance = (instanceIndex: number) => {
    const instance = collectionContent.instances[instanceIndex];
    const newChildId = `child_${instance.children.length + 1}`;
    
    updateInstance(instanceIndex, {
      children: [...instance.children, newChildId]
    });
  };

  const updateInstanceChild = (instanceIndex: number, childIndex: number, childId: string) => {
    const instance = collectionContent.instances[instanceIndex];
    const updatedChildren = instance.children.map((child, i) => 
      i === childIndex ? childId : child
    );
    updateInstance(instanceIndex, { children: updatedChildren });
  };

  const removeInstanceChild = (instanceIndex: number, childIndex: number) => {
    const instance = collectionContent.instances[instanceIndex];
    const updatedChildren = instance.children.filter((_, i) => i !== childIndex);
    updateInstance(instanceIndex, { children: updatedChildren });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Collection Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure a repeatable collection of nodes with instances
          </p>
        </div>

        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Path</Label>
                <Input
                  value={collectionContent.path}
                  onChange={(e) => setCollectionContent(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="collection_path"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Index</Label>
                <Input
                  type="number"
                  min="1"
                  value={collectionContent.idx}
                  onChange={(e) => setCollectionContent(prev => ({ ...prev, idx: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label Fallback</Label>
                <Input
                  value={collectionContent.label.fallback}
                  onChange={(e) => setCollectionContent(prev => ({
                    ...prev,
                    label: { ...prev.label, fallback: e.target.value }
                  }))}
                  placeholder="Collection Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Label Key</Label>
                <Input
                  value={collectionContent.label.key || ''}
                  onChange={(e) => setCollectionContent(prev => ({
                    ...prev,
                    label: { ...prev.label, key: e.target.value }
                  }))}
                  placeholder="translation.key"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={collectionContent.description?.fallback || ''}
                onChange={(e) => setCollectionContent(prev => ({
                  ...prev,
                  description: { fallback: e.target.value }
                }))}
                placeholder="Collection description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Instances</Label>
                <Input
                  type="number"
                  min="0"
                  value={collectionContent.min_instances}
                  onChange={(e) => setCollectionContent(prev => ({ 
                    ...prev, 
                    min_instances: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Instances</Label>
                <Input
                  type="number"
                  min="1"
                  value={collectionContent.max_instances}
                  onChange={(e) => setCollectionContent(prev => ({ 
                    ...prev, 
                    max_instances: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-7">
                <Switch
                  checked={collectionContent.arrangeable}
                  onCheckedChange={(checked) => setCollectionContent(prev => ({ ...prev, arrangeable: checked }))}
                />
                <Label className="text-xs">Arrangeable</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instances */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Collection Instances</CardTitle>
              <Button 
                onClick={addInstance} 
                variant="outline" 
                size="sm"
                disabled={collectionContent.instances.length >= collectionContent.max_instances}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Instance
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {collectionContent.instances.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-4">No instances configured</p>
                <Button onClick={addInstance} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Instance
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {collectionContent.instances.map((instance, index) => (
                  <Card key={instance.instance_id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-medium">Instance #{instance.instance_id}</h4>
                          <Badge variant="outline">{instance.path}</Badge>
                        </div>
                        <Button
                          onClick={() => removeInstance(index)}
                          variant="ghost"
                          size="sm"
                          disabled={collectionContent.instances.length <= collectionContent.min_instances}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Child Nodes</Label>
                          <Button
                            onClick={() => addChildToInstance(index)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Child
                          </Button>
                        </div>

                        {instance.children.length === 0 ? (
                          <div className="text-center py-4 border border-dashed rounded-sm">
                            <p className="text-xs text-muted-foreground mb-2">No child nodes</p>
                            <Button
                              onClick={() => addChildToInstance(index)}
                              variant="ghost"
                              size="sm"
                            >
                              Add Child Node
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {instance.children.map((child, childIndex) => (
                              <div key={childIndex} className="flex items-center gap-2">
                                <Input
                                  value={child}
                                  onChange={(e) => updateInstanceChild(index, childIndex, e.target.value)}
                                  placeholder="node_reference"
                                  className="text-sm"
                                />
                                <Button
                                  onClick={() => removeInstanceChild(index, childIndex)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}