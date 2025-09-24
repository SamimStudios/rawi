import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useJobs } from '@/hooks/useJobs';
import SystematicNodeRenderer from '@/components/renderers/SystematicNodeRenderer';
import { supabase } from '@/integrations/supabase/client';

const MOCK_NODES = [
  {
    id: 'mock-form-1',
    job_id: 'mock-job',
    node_type: 'form' as const,
    path: 'setup.basic_info',
    library_id: 'basic_form',
    dependencies: [],
    arrangeable: false,
    removable: false,
    content: {
      label: { fallback: 'Basic Information', key: 'setup.basic_info.label' },
      description: { fallback: 'Enter basic project details' },
      items: [
        {
          kind: 'SectionItem',
          ref: 'project_details',
          path: 'setup.basic_info.project_details',
          label: { fallback: 'Project Details' },
          collapsed: false,
          hidden: false
        },
        {
          kind: 'FieldItem',
          ref: 'project_name',
          path: 'setup.basic_info.project_name',
          widget: 'text',
          datatype: 'text',
          ui: {
            label: { fallback: 'Project Name' },
            placeholder: { fallback: 'Enter project name' }
          },
          rules: { required: true, maxLength: 100 },
          value: ''
        },
        {
          kind: 'FieldItem',
          ref: 'description',
          path: 'setup.basic_info.description',
          widget: 'textarea',
          datatype: 'text',
          ui: {
            label: { fallback: 'Description' },
            placeholder: { fallback: 'Describe your project' }
          },
          rules: { maxLength: 500 },
          value: ''
        },
        {
          kind: 'FieldItem',
          ref: 'category',
          path: 'setup.basic_info.category',
          widget: 'select',
          datatype: 'text',
          ui: {
            label: { fallback: 'Category' },
            placeholder: { fallback: 'Select category' }
          },
          options: {
            values: [
              { value: 'cinematic', label: { fallback: 'Cinematic Trailer' } },
              { value: 'commercial', label: { fallback: 'Commercial' } },
              { value: 'educational', label: { fallback: 'Educational' } }
            ]
          },
          value: ''
        }
      ]
    },
    updated_at: new Date().toISOString(),
    user_data: { updated_at: new Date().toISOString() }
  },
  {
    id: 'mock-media-1',
    job_id: 'mock-job',
    node_type: 'media' as const,
    path: 'assets.background_music',
    library_id: 'audio_asset',
    dependencies: ['setup.basic_info'],
    arrangeable: false,
    removable: true,
    content: {
      label: { fallback: 'Background Music', key: 'assets.background_music.label' },
      description: { fallback: 'Upload or generate background music' },
      kind: 'MediaContent',
      versions: []
    },
    updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user_data: null
  },
  {
    id: 'mock-group-1',
    job_id: 'mock-job',
    node_type: 'group' as const,
    path: 'characters',
    library_id: 'character_group',
    dependencies: [],
    arrangeable: true,
    removable: false,
    content: {
      label: { fallback: 'Characters', key: 'characters.label' },
      description: { fallback: 'Define your story characters' },
      collection: { min: 1, max: 5 }
    },
    updated_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    user_data: { updated_at: new Date(Date.now() - 1800000).toISOString() } // 30 min ago
  }
];

export default function NodeRendererPreview() {
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const { updateJobNode } = useJobs();
  
  const [mode, setMode] = useState<'idle' | 'edit'>('idle');
  const [mockDependenciesUnmet, setMockDependenciesUnmet] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<'form' | 'media' | 'group'>('form');
  const [isLoading, setIsLoading] = useState(true);
  const [realNodes, setRealNodes] = useState<any[]>([]);
  const [useRealData, setUseRealData] = useState(true);

  const currentNodes = useRealData ? realNodes : [MOCK_NODES.find(n => n.node_type === selectedNodeType)!];

  useEffect(() => {
    const loadAllNodes = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, simulate loading time and show mock data
        // In production, this would fetch from app.nodes table
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setRealNodes(MOCK_NODES);
        toast({
          title: "Demo data loaded",
          description: `Showing ${MOCK_NODES.length} sample nodes (would be from app.nodes table)`,
        });
      } catch (error) {
        console.error('Error loading nodes:', error);
        setRealNodes(MOCK_NODES);
        setUseRealData(false);
        toast({
          title: "Using fallback data",
          description: "Showing sample nodes for preview",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAllNodes();
  }, [toast]);

  const handleNodeUpdate = async (nodeId: string, content: any) => {
    console.log('Updating node:', nodeId, content);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (useRealData) {
      try {
        await updateJobNode(nodeId, content);
        toast({
          title: "Node updated",
          description: "Changes saved successfully",
        });
      } catch (error) {
        throw new Error('Failed to update node in database');
      }
    } else {
      // Update mock data
      const nodeIndex = currentNodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        currentNodes[nodeIndex] = { 
          ...currentNodes[nodeIndex], 
          content,
          user_data: { updated_at: new Date().toISOString() }
        };
      }
      
      toast({
        title: "Mock node updated",
        description: "Changes saved to mock data",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Node Renderer Preview</h1>
        <p className="text-muted-foreground mt-2">
          Test and preview the SystematicNodeRenderer component with various node types and configurations.
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Database Status */}
          <div className="space-y-3">
            <Label>Database Status</Label>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Badge variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading nodes...
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Showing {realNodes.length} sample nodes (simulating app.nodes table data)
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Mode Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Display Mode</Label>
              <Select value={mode} onValueChange={(value: 'idle' | 'edit') => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Idle (Display)</SelectItem>
                  <SelectItem value="edit">Edit (Interactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!useRealData && (
              <div className="space-y-2">
                <Label>Mock Node Type</Label>
                <Select value={selectedNodeType} onValueChange={(value: 'form' | 'media' | 'group') => setSelectedNodeType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form">Form Node</SelectItem>
                    <SelectItem value="media">Media Node</SelectItem>
                    <SelectItem value="group">Group Node</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mock Dependencies</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="deps-unmet"
                  checked={mockDependenciesUnmet}
                  onCheckedChange={setMockDependenciesUnmet}
                />
                <Label htmlFor="deps-unmet" className="text-sm">
                  Simulate unmet dependencies
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nodeData = JSON.stringify(currentNodes[0], null, 2);
                navigator.clipboard.writeText(nodeData);
                toast({ title: "Copied to clipboard", description: "Node data copied" });
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Node Data
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode(mode === 'idle' ? 'edit' : 'idle')}
            >
              Toggle Mode ({mode})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Node Renderers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Node Renderers</h2>
        
        {currentNodes.map((node) => {
          // Modify dependencies for testing if mock flag is set
          const testNode = mockDependenciesUnmet
            ? { ...node, dependencies: ['missing.dependency', 'another.missing'] }
            : node;

          return (
            <SystematicNodeRenderer
              key={node.id}
              node={testNode}
              onUpdate={handleNodeUpdate}
              mode={mode}
              onModeChange={setMode}
            />
          );
        })}
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Current Configuration:</Label>
              <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-auto">
                {JSON.stringify({
                  mode,
                  language,
                  mockDependenciesUnmet,
                  selectedNodeType: !useRealData ? selectedNodeType : undefined,
                  useRealData,
                  nodesCount: currentNodes.length
                }, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}