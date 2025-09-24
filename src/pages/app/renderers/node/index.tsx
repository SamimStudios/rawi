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
  
  const [jobId, setJobId] = useState('');
  const [mode, setMode] = useState<'idle' | 'edit'>('idle');
  const [mockDependenciesUnmet, setMockDependenciesUnmet] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<'form' | 'media' | 'group'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [realNodes, setRealNodes] = useState<any[]>([]);
  const [useRealData, setUseRealData] = useState(false);

  const currentNodes = useRealData ? realNodes : [MOCK_NODES.find(n => n.node_type === selectedNodeType)!];

  const loadRealNodes = async () => {
    if (!jobId.trim()) {
      toast({
        title: "Job ID required",
        description: "Please enter a job ID to load real nodes",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement real node loading from Supabase
      // const nodes = await fetchJobNodes(jobId);
      // setRealNodes(nodes);
      setRealNodes(MOCK_NODES); // Fallback to mock data for now
      setUseRealData(true);
      
      toast({
        title: "Nodes loaded",
        description: `Loaded ${MOCK_NODES.length} nodes for job ${jobId}`,
      });
    } catch (error) {
      toast({
        title: "Load failed",
        description: "Failed to load nodes. Using mock data.",
        variant: "destructive"
      });
      setRealNodes(MOCK_NODES);
      setUseRealData(false);
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Job Loading */}
          <div className="space-y-3">
            <Label>Load Real Job Data</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter job ID (UUID)"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={loadRealNodes}
                disabled={isLoading || !jobId.trim()}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Load Nodes
              </Button>
            </div>
            {useRealData && (
              <Badge variant="secondary">
                Using real data: {realNodes.length} nodes loaded
              </Badge>
            )}
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