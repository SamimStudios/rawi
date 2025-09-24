import React from 'react';
import { JobNode } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FieldRenderer from './FieldRenderer';

interface NodeRendererProps {
  node: JobNode;
  onUpdate: (content: any) => void;
}

export default function NodeRenderer({ node, onUpdate }: NodeRendererProps) {
  const renderFormNode = () => {
    if (!node.content?.fields || !Array.isArray(node.content.fields)) {
      return <p className="text-muted-foreground">No fields defined for this form node.</p>;
    }

    return (
      <div className="space-y-4">
        {node.content.fields.map((field: any, index: number) => (
          <FieldRenderer
            key={field.id || index}
            field={field}
            value={null} // TODO: Extract from node.content properly
            onChange={(value) => {
              // TODO: Implement field value update
              console.log('Field updated:', field.id, value);
              onUpdate(node.content);
            }}
          />
        ))}
      </div>
    );
  };

  const renderMediaNode = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Media node content:</p>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(node.content, null, 2)}
        </pre>
      </div>
    );
  };

  const renderGroupNode = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Group node - contains child nodes at path: {node.path}.*
        </p>
      </div>
    );
  };

  const getNodeStatusColor = () => {
    switch (node.validation_status) {
      case 'valid': return 'bg-green-500';
      case 'invalid': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{node.path}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Type: {node.node_type} • Library: {node.library_id}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`${getNodeStatusColor()} text-white border-0`}
            >
              {node.validation_status || 'pending'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {node.node_type === 'form' && renderFormNode()}
        {node.node_type === 'media' && renderMediaNode()}
        {node.node_type === 'group' && renderGroupNode()}
      </CardContent>
    </Card>
  );
}