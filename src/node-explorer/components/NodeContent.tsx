import React from 'react';
import { Node } from '../types/node';
import { GroupRenderer } from './GroupRenderer';
import { FormRenderer } from './FormRenderer';
import { MediaRenderer } from './MediaRenderer';

interface NodeContentProps {
  node: Node;
  children?: Node[];
}

export function NodeContent({ node, children }: NodeContentProps) {
  switch (node.node_type) {
    case 'group':
      return <GroupRenderer node={node} children={children} />;
    
    case 'form':
      return <FormRenderer node={node} />;
    
    case 'media':
      return <MediaRenderer node={node} />;
    
    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p>Unknown node type: {node.node_type}</p>
          <pre className="mt-4 text-sm bg-muted/30 p-4 rounded-md">
            {JSON.stringify(node, null, 2)}
          </pre>
        </div>
      );
  }
}