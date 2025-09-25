/**
 * Field path resolver for ltree addresses
 * Properly finds field locations in nested JSON structures
 */

export interface FieldPath {
  jsonPath: string;
  fieldRef: string;
  parentPath?: string;
  isInCollection?: boolean;
  instanceId?: string;
}

/**
 * Recursively finds all field paths in a content structure
 */
export function findFieldPaths(content: any, basePath = 'content'): Map<string, FieldPath> {
  const fieldPaths = new Map<string, FieldPath>();
  
  function traverse(obj: any, currentPath: string, parentPath?: string) {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        traverse(item, `${currentPath}.${index}`, currentPath);
      });
      return;
    }
    
    // Check if this is a FieldItem
    if (obj.kind === 'FieldItem' && obj.ref) {
      fieldPaths.set(obj.ref, {
        jsonPath: `${currentPath}.value`,
        fieldRef: obj.ref,
        parentPath
      });
    }
    
    // Check if this is a collection with instances
    if (obj.kind === 'CollectionSectionItem' && obj.instances) {
      obj.instances.forEach((instance: any, instanceIndex: number) => {
        if (instance.children) {
          const instancePath = `${currentPath}.instances.${instanceIndex}`;
          traverseChildren(instance.children, `${instancePath}.children`, instancePath, instance.instance_id);
        }
      });
    }
    
    // Traverse children for sections and other containers
    if (obj.children) {
      traverseChildren(obj.children, `${currentPath}.children`, currentPath);
    }
    
    // Traverse items for top-level content
    if (obj.items) {
      traverseChildren(obj.items, `${currentPath}.items`, currentPath);
    }
    
    // Traverse other object properties
    Object.entries(obj).forEach(([key, value]) => {
      if (key !== 'children' && key !== 'items' && key !== 'instances') {
        traverse(value, `${currentPath}.${key}`, currentPath);
      }
    });
  }
  
  function traverseChildren(children: any[], path: string, parentPath: string, instanceId?: string) {
    children.forEach((child, index) => {
      const childPath = `${path}.${index}`;
      
      if (child.kind === 'FieldItem' && child.ref) {
        fieldPaths.set(child.ref, {
          jsonPath: `${childPath}.value`,
          fieldRef: child.ref,
          parentPath,
          isInCollection: !!instanceId,
          instanceId
        });
      }
      
      traverse(child, childPath, parentPath);
    });
  }
  
  traverse(content, basePath);
  return fieldPaths;
}

/**
 * Creates a unique field address based on its actual location
 */
export function createFieldAddress(nodePath: string, fieldPath: FieldPath): string {
  return `${nodePath}#${fieldPath.jsonPath}`;
}

/**
 * Gets the field address for a specific field reference
 */
export function getFieldAddress(nodePath: string, content: any, fieldRef: string): string | null {
  const fieldPaths = findFieldPaths(content);
  const fieldPath = fieldPaths.get(fieldRef);
  
  if (!fieldPath) {
    console.warn(`Field ${fieldRef} not found in content structure`);
    return null;
  }
  
  return createFieldAddress(nodePath, fieldPath);
}

/**
 * Validates that field addresses are unique
 */
export function validateFieldAddresses(content: any): { valid: boolean; duplicates: string[] } {
  const fieldPaths = findFieldPaths(content);
  const addresses = new Map<string, string[]>();
  
  fieldPaths.forEach((path, ref) => {
    const address = path.jsonPath;
    if (!addresses.has(address)) {
      addresses.set(address, []);
    }
    addresses.get(address)!.push(ref);
  });
  
  const duplicates: string[] = [];
  addresses.forEach((refs, address) => {
    if (refs.length > 1) {
      duplicates.push(`${address}: ${refs.join(', ')}`);
    }
  });
  
  return {
    valid: duplicates.length === 0,
    duplicates
  };
}