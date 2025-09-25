import React, { useState } from 'react';
import NodeRenderer from '@/components/renderers/NodeRenderer';
import { useNodeEditor } from '@/hooks/useNodeEditor';

// Mock nodes for demonstration
const mockNodes = [
  {
    id: '1',
    idx: 1,
    path: 'root.character_setup',
    node_type: 'form' as const,
    content: {
      label: { fallback: 'Character Setup' },
      items: [
        { kind: 'FieldItem', ref: 'character_name', value: '', idx: 1 }
      ]
    },
    generate_n8n_id: 'gen-123',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    job_id: 'mock-job-id',
    dependencies: [],
    removable: true,
    arrangeable: true
  }
];

export default function NodeRendererPage() {
  const { editingNodeId, setEditingNodeId } = useNodeEditor();
  const [nodes] = useState(mockNodes);

  return (
    <div className="container mx-auto p-6">
      
      <h1 className="text-3xl font-bold mb-6">Node Renderer Demo</h1>
      
      <div className="space-y-6">
        {nodes.map(node => (
          <NodeRenderer
            key={node.id}
            node={node}
            onUpdate={async () => {}}
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
  );
}