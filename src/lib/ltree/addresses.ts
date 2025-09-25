/**
 * Ltree address building utilities for consistent data access
 */

export interface AddressBuilder {
  /** Base job path */
  readonly jobId: string;
  /** Node path in the tree */
  readonly nodePath: string;
}

/**
 * Creates standardized ltree addresses for job data access
 */
export class LtreeAddresses implements AddressBuilder {
  constructor(
    public readonly jobId: string,
    public readonly nodePath: string
  ) {}

  /**
   * Address for the entire node content
   */
  nodeContent(): string {
    return `${this.nodePath}#content`;
  }

  /**
   * Address for a specific field value
   */
  fieldValue(fieldRef: string): string {
    return `${this.nodePath}#content.items.${this.findFieldPath(fieldRef)}.value`;
  }

  /**
   * Address for field metadata (like validation state)
   */
  fieldMeta(fieldRef: string, metaKey: string): string {
    return `${this.nodePath}#content.items.${this.findFieldPath(fieldRef)}.${metaKey}`;
  }

  /**
   * Address for a collection instance
   */
  collectionInstance(collectionRef: string, instanceId: string): string {
    return `${this.nodePath}#content.items.${this.findCollectionPath(collectionRef)}.instances.${instanceId}`;
  }

  /**
   * Address for a field within a collection instance
   */
  collectionFieldValue(collectionRef: string, instanceId: string, fieldRef: string): string {
    return `${this.nodePath}#content.items.${this.findCollectionPath(collectionRef)}.instances.${instanceId}.children.${this.findFieldPath(fieldRef)}.value`;
  }

  /**
   * Address for section content
   */
  sectionContent(sectionRef: string): string {
    return `${this.nodePath}#content.items.${this.findSectionPath(sectionRef)}`;
  }

  /**
   * Address for nested field in section
   */
  sectionFieldValue(sectionRef: string, fieldRef: string): string {
    return `${this.nodePath}#content.items.${this.findSectionPath(sectionRef)}.children.${this.findFieldPath(fieldRef)}.value`;
  }

  /**
   * Address for node validation status
   */
  validationStatus(): string {
    return `${this.nodePath}#validation_status`;
  }

  /**
   * Address for node generation status  
   */
  generationStatus(): string {
    return `${this.nodePath}#generation_status`;
  }

  /**
   * Find the path to a field in the items structure
   * This would need content inspection for accurate paths
   */
  private findFieldPath(fieldRef: string): string {
    // For now, assume fields are at root level with their ref as key
    // In a real implementation, this would traverse the content structure
    return fieldRef;
  }

  /**
   * Find the path to a collection in the items structure
   */
  private findCollectionPath(collectionRef: string): string {
    return collectionRef;
  }

  /**
   * Find the path to a section in the items structure
   */
  private findSectionPath(sectionRef: string): string {
    return sectionRef;
  }
}

/**
 * Factory function to create address builder for a node
 */
export function createLtreeAddresses(jobId: string, nodePath: string): LtreeAddresses {
  return new LtreeAddresses(jobId, nodePath);
}

/**
 * Helper to parse ltree addresses back into components
 */
export function parseLtreeAddress(address: string): {
  ltreePath: string;
  jsonPath?: string;
} {
  const [ltreePath, jsonPath] = address.split('#');
  return { ltreePath, jsonPath };
}

/**
 * Validates if an address follows our standardized format
 */
export function isValidLtreeAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  const { ltreePath, jsonPath } = parseLtreeAddress(address);
  
  // Validate ltree path format
  if (!ltreePath || !/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/.test(ltreePath)) {
    return false;
  }
  
  // If JSON path exists, validate it
  if (jsonPath && !/^[a-zA-Z0-9_.]+$/.test(jsonPath)) {
    return false;
  }
  
  return true;
}

/**
 * Common address patterns for quick access
 */
export const AddressPatterns = {
  /** Pattern for field values: nodePath#content.items.{fieldRef}.value */
  FIELD_VALUE: (nodePath: string, fieldRef: string) => 
    `${nodePath}#content.items.${fieldRef}.value`,
    
  /** Pattern for node content: nodePath#content */
  NODE_CONTENT: (nodePath: string) => 
    `${nodePath}#content`,
    
  /** Pattern for validation status: nodePath#validation_status */
  VALIDATION_STATUS: (nodePath: string) => 
    `${nodePath}#validation_status`,
    
  /** Pattern for generation status: nodePath#generation_status */  
  GENERATION_STATUS: (nodePath: string) =>
    `${nodePath}#generation_status`
} as const;