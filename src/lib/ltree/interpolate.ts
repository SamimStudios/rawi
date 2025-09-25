import type { InterpCtx } from './types';

/**
 * Interpolates template variables in JSON structures
 * Supports tokens like {{job.id}}, {{node.path}}, {{instance.id}}
 */
export function interpolateJSON(value: any, context: InterpCtx): any {
  if (typeof value === 'string') {
    return interpolateString(value, context);
  }
  
  if (Array.isArray(value)) {
    return value.map(item => interpolateJSON(item, context));
  }
  
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = interpolateJSON(val, context);
    }
    return result;
  }
  
  return value;
}

/**
 * Interpolates template variables in strings
 * Template format: {{path.to.value}}
 */
export function interpolateString(template: string, context: InterpCtx): string {
  if (!template || typeof template !== 'string') {
    return template;
  }
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Gets a nested value from an object using dot notation
 * Example: getNestedValue({job: {id: '123'}}, 'job.id') returns '123'
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Creates an interpolation context for common scenarios
 */
export function createContext(options: {
  jobId?: string;
  nodeId?: string;
  nodePath?: string;
  instanceId?: string;
  instanceIndex?: number;
  custom?: Record<string, any>;
}): InterpCtx {
  const context: InterpCtx = {};
  
  if (options.jobId) {
    context.job = { id: options.jobId };
  }
  
  if (options.nodeId || options.nodePath) {
    context.node = {
      ...(options.nodeId && { id: options.nodeId }),
      ...(options.nodePath && { path: options.nodePath }),
    };
  }
  
  if (options.instanceId !== undefined) {
    context.instance = {
      id: options.instanceId,
      path: options.instanceId, // Use instanceId as path fallback
      ...(options.instanceIndex !== undefined && { index: options.instanceIndex }),
    };
  }
  
  if (options.custom) {
    Object.assign(context, options.custom);
  }
  
  return context;
}

/**
 * Validates that a string contains interpolation tokens
 */
export function hasInterpolationTokens(str: string): boolean {
  return typeof str === 'string' && /\{\{[^}]+\}\}/.test(str);
}

/**
 * Extracts all interpolation tokens from a string
 */
export function extractTokens(str: string): string[] {
  if (typeof str !== 'string') return [];
  
  const matches = str.match(/\{\{([^}]+)\}\}/g);
  return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
}

/**
 * Instance-specific interpolation helpers
 */
export function interpolateInstancePath(
  basePath: string, 
  instanceId: string
): string {
  // Convert instances[3] to instances.i3 format
  const normalizedPath = basePath.replace(/\[(\d+)\]/g, '.i$1');
  
  if (normalizedPath.includes('instances') && !normalizedPath.includes('.i')) {
    return `${normalizedPath}.i${instanceId}`;
  }
  
  return normalizedPath;
}

/**
 * Converts bracket notation to dot notation for ltree compatibility
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\[(\d+)\]/g, '.i$1')  // array[0] -> array.i0
    .replace(/\[\"([^\"]+)\"\]/g, '.$1')  // obj["key"] -> obj.key
    .replace(/\[\'([^\']+)\'\]/g, '.$1')  // obj['key'] -> obj.key
    .replace(/^\./, '');  // remove leading dot
}