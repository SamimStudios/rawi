import { useMemo } from 'react';
import { JobNode } from '@/hooks/useJobs';

interface UseDependenciesReturn {
  isBlocked: boolean;
  unmetDependencies: string[];
  canGenerate: boolean;
  canValidate: boolean;
}

export function useDependencies(
  node: JobNode,
  allNodes?: JobNode[]
): UseDependenciesReturn {
  return useMemo(() => {
    // Parse dependencies from node (simplified - assumes dependencies are node paths)
    const dependencies = Array.isArray(node.dependencies) 
      ? node.dependencies.map(dep => typeof dep === 'string' ? dep : (dep as any)?.path || dep)
      : [];

    if (dependencies.length === 0) {
      return {
        isBlocked: false,
        unmetDependencies: [],
        canGenerate: true,
        canValidate: true
      };
    }

    // For now, we'll simulate dependency checking
    // In a real implementation, this would check the actual dependency nodes
    const unmetDependencies: string[] = [];
    
    // Simplified dependency check - assumes all dependencies are met for demo
    // In real implementation, you would:
    // 1. Find each dependency node in allNodes
    // 2. Check if that node is "complete" based on its type
    // 3. Form nodes: all required fields have values
    // 4. Media nodes: has at least one version
    // 5. Group nodes: all children are complete

    dependencies.forEach(depPath => {
      // Simulate some dependencies being unmet for demo purposes
      if (depPath.includes('missing')) {
        unmetDependencies.push(depPath);
      }
    });

    const isBlocked = unmetDependencies.length > 0;

    return {
      isBlocked,
      unmetDependencies,
      canGenerate: !isBlocked,
      canValidate: !isBlocked
    };
  }, [node.dependencies, allNodes]);
}

// Utility function to check if a node is complete
export function isNodeComplete(node: JobNode): boolean {
  switch (node.node_type) {
    case 'form':
      if (!node.content?.items) return false;
      
      // Check if all required fields have values
      return node.content.items.every((item: any) => {
        if (item.kind !== 'FieldItem') return true;
        if (!item.rules?.required) return true;
        
        const value = item.value;
        return value !== null && 
               value !== undefined && 
               value !== '' && 
               (!Array.isArray(value) || value.length > 0);
      });

    case 'media':
      // Media node is complete if it has at least one version
      return node.content?.versions && 
             Array.isArray(node.content.versions) && 
             node.content.versions.length > 0;

    case 'group':
      // Group node completion depends on its children
      // This would need to be implemented with the full node tree
      return true;

    default:
      return false;
  }
}