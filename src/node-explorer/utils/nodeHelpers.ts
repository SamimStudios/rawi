import { Node } from '../types/node';

export function formatNodePath(path: string): string {
  return path.split('.').join(' › ');
}

export function getNodeTypeIcon(nodeType: string): string {
  switch (nodeType) {
    case 'group':
      return '📁';
    case 'form':
      return '📋';
    case 'media':
      return '🎬';
    default:
      return '📄';
  }
}

export function getNodeTypeColor(nodeType: string): string {
  switch (nodeType) {
    case 'group':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'form':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'media':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function extractPathSegments(path: string): string[] {
  return path.split('.').filter(Boolean);
}

export function calculatePathDepth(path: string): number {
  return extractPathSegments(path).length;
}

export function isChildPath(parentPath: string, childPath: string): boolean {
  return childPath.startsWith(parentPath + '.') && childPath !== parentPath;
}

export function isDescendantPath(ancestorPath: string, descendantPath: string): boolean {
  return descendantPath.startsWith(ancestorPath + '.') && descendantPath !== ancestorPath;
}

export function getRelativeDepth(basePath: string, targetPath: string): number {
  if (!isDescendantPath(basePath, targetPath)) {
    return -1;
  }
  
  const baseDepth = calculatePathDepth(basePath);
  const targetDepth = calculatePathDepth(targetPath);
  
  return targetDepth - baseDepth;
}

export function sortNodesByPath(nodes: Node[]): Node[] {
  return [...nodes].sort((a, b) => a.path.localeCompare(b.path));
}

export function groupNodesByParent(nodes: Node[]): Record<string, Node[]> {
  return nodes.reduce((acc, node) => {
    const parentId = node.parent_id || 'root';
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(node);
    return acc;
  }, {} as Record<string, Node[]>);
}