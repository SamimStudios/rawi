import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkspaceNode } from '@/types/workspace';
import { FileText, Image, Video, Folder, Box } from 'lucide-react';

interface NodeRendererProps {
  node: WorkspaceNode;
}

const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'form':
      return <FileText className="h-4 w-4" />;
    case 'media':
      return <Image className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'group':
      return <Folder className="h-4 w-4" />;
    default:
      return <Box className="h-4 w-4" />;
  }
};

const getNodeTypeColor = (nodeType: string) => {
  switch (nodeType) {
    case 'form':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'media':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'video':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'group':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export default function NodeRenderer({ node }: NodeRendererProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getNodeIcon(node.node_type)}
            <CardTitle className="text-sm">Node {node.path}</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={getNodeTypeColor(node.node_type)}
          >
            {node.node_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Content Preview */}
          {node.content && Object.keys(node.content).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Content</h4>
              <div className="bg-muted/50 rounded p-2 text-xs max-h-24 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(node.content, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Dependencies */}
          {node.dependencies && Array.isArray(node.dependencies) && node.dependencies.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Dependencies ({node.dependencies.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {node.dependencies.slice(0, 3).map((dep, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {typeof dep === 'string' ? dep : dep?.path || 'Unknown'}
                  </Badge>
                ))}
                {node.dependencies.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{node.dependencies.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Version {node.version}</span>
            <span>{node.removable ? 'Removable' : 'Fixed'}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            Updated: {new Date(node.updated_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}