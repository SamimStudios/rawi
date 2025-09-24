import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage the global single edit mode guard for nodes.
 * Ensures only one node can be in edit mode at a time.
 */
export function useNodeEditor() {
  const { toast } = useToast();
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const startEditing = useCallback((nodeId: string) => {
    if (editingNodeId && editingNodeId !== nodeId) {
      toast({
        title: "Another node is being edited",
        description: "Please finish editing the current node first.",
        variant: "destructive",
      });
      return false;
    }
    setEditingNodeId(nodeId);
    return true;
  }, [editingNodeId, toast]);

  const stopEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const isEditing = useCallback((nodeId: string) => {
    return editingNodeId === nodeId;
  }, [editingNodeId]);

  const hasActiveEditor = useCallback(() => {
    return editingNodeId !== null;
  }, [editingNodeId]);

  return {
    editingNodeId,
    startEditing,
    stopEditing,
    isEditing,
    hasActiveEditor,
    setEditingNodeId
  };
}