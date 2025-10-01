import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJobs, Job, JobNode } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NodeRenderer from '@/components/renderers/NodeRenderer';
import { useNodeEditor } from '@/hooks/useNodeEditor';

export default function JobEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJob, fetchJobNodes, jobNodes, loading, checkJobReady, getJobGenerationInput, updateJobNode } = useJobs();
  const { toast } = useToast();
  const { editingNodeId, setEditingNodeId } = useNodeEditor();
  
  const [job, setJob] = useState<Job | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [generationInput, setGenerationInput] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
      fetchJobNodes(id);
    }
  }, [id]);

  const loadJob = async () => {
    if (!id) return;
    
    const jobData = await getJob(id);
    if (jobData) {
      setJob(jobData);
      checkReadiness();
    } else {
      toast({
        title: "Error",
        description: "Job not found",
        variant: "destructive",
      });
      navigate('/app/templates');
    }
  };

  const checkReadiness = async () => {
    if (!id) return;
    
    const ready = await checkJobReady(id);
    setIsReady(ready);
    
    if (ready) {
      const input = await getJobGenerationInput(id);
      setGenerationInput(input);
    }
  };

  const handleNodeUpdate = useCallback(async (nodeId: string, content: any): Promise<void> => {
    await updateJobNode(nodeId, content);
    // Refresh job readiness after any node update
    await checkReadiness();
  }, [updateJobNode, checkReadiness]);

  const groupNodesByPath = (nodes: JobNode[]) => {
    // Only show TOP-LEVEL nodes: direct children of root; treat null/empty/undefined parent as no parent
    const isDirectRootChild = (addr?: string) => !!addr && /^root\.[^.]+$/.test(addr);
    const hasNoParent = (p?: string | null) => p === null || p === '' || typeof p === 'undefined';
    const topLevelNodes = nodes.filter(node => hasNoParent(node.parent_addr) && isDirectRootChild(node.addr));
    console.debug('[JobEditor] top-level filter', { total: nodes.length, top: topLevelNodes.length, parentSamples: Array.from(new Set(nodes.map(n => (n.parent_addr ?? '(null)')))).slice(0,10) });
    
    const grouped: Record<string, JobNode[]> = {};
    
    topLevelNodes.forEach(node => {
      const parts = node.addr?.split('.') || [];
      const rootPath = parts[0] || 'root';
      if (!grouped[rootPath]) {
        grouped[rootPath] = [];
      }
      grouped[rootPath].push(node);
    });
    
    // Sort nodes within each group by idx, then by address for consistent ordering
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (a.idx !== undefined && b.idx !== undefined && a.idx !== b.idx) {
          return a.idx - b.idx;
        }
        return (a.addr || '').localeCompare(b.addr || '');
      });
    });
    
    return grouped;
  };

  if (loading || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading job...</span>
        </div>
      </div>
    );
  }

  const groupedNodes = groupNodesByPath(jobNodes);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/app/templates')}
              className="mb-2 -ml-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Templates</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                {job.job_name || 'Unnamed Job'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Template: {job.template}</span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">Status:</span>
                  <Badge variant={
                    job.status === 'completed' ? 'default' : 
                    job.status === 'failed' ? 'destructive' : 'secondary'
                  }>{job.status}</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {isReady ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Ready for Generation</span>
                <span className="sm:hidden">Ready</span>
              </Badge>
            ) : (
              <Badge variant="outline">
                <AlertCircle className="w-4 h-4 mr-1" />
                Incomplete
              </Badge>
            )}
            
            <Button disabled={!isReady} className="w-full sm:w-auto">
              <Play className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Node Sections */}
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(groupedNodes as Record<string, JobNode[]>).map(([rootPath, nodes]) => (
          <div key={rootPath} className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold capitalize border-b pb-2">
              {rootPath.replace('_', ' ')}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {nodes.map(node => (
                <NodeRenderer
                  key={node.id}
                  node={node}
                  onUpdate={async (content) => {
                    await handleNodeUpdate(node.id, content);
                  }}
                  mode={editingNodeId === node.id ? 'edit' : 'idle'}
                  onModeChange={(mode) => {
                    if (mode === 'edit') {
                      setEditingNodeId(node.id);
                    } else {
                      setEditingNodeId(null);
                    }
                  }}
                  showPath={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {jobNodes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No nodes found for this job.</p>
        </div>
      )}

      {/* Debug: Generation Input */}
      {generationInput && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Generation Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(generationInput, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}