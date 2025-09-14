import { useMemo } from 'react';
import { Node, BreadcrumbItem } from '../types/node';

export function useBreadcrumb(node: Node | null, ancestors: Node[] = []) {
  const breadcrumb = useMemo((): BreadcrumbItem[] => {
    if (!node) return [];

    // Build breadcrumb from ancestors + current node
    const allNodes = [...ancestors, node];
    
    return allNodes.map(n => ({
      id: n.id,
      path: n.path,
      node_type: n.node_type,
      title: getNodeTitle(n)
    }));
  }, [node, ancestors]);

  return breadcrumb;
}

function getNodeTitle(node: Node): string {
  // Extract meaningful title from node based on type
  switch (node.node_type) {
    case 'group':
      // Use last segment of path as title for groups
      return node.path.split('.').pop() || 'Group';
    
    case 'form':
      // Try to find a meaningful title from form content
      if (node.content && typeof node.content === 'object' && 'groups' in node.content) {
        const formContent = node.content as any;
        if (formContent.groups?.length > 0 && formContent.groups[0].title?.fallback) {
          return formContent.groups[0].title.fallback;
        }
      }
      return node.path.split('.').pop() || 'Form';
    
    case 'media':
      // Use media kind + version info
      if (node.content && typeof node.content === 'object' && 'kind' in node.content) {
        const mediaContent = node.content as any;
        return `${mediaContent.kind || 'Media'} v${mediaContent.current_v || 1}`;
      }
      return 'Media';
    
    default:
      return node.path.split('.').pop() || 'Node';
  }
}