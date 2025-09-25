import { supabase } from '@/integrations/supabase/client';
import type { 
  JobID, 
  HybridAddr, 
  ParsedHybridAddr, 
  HybridAddrOptions, 
  SetValueOptions, 
  PayloadOptions,
  RpcError,
  AddressValidation
} from './types';
import { interpolateJSON } from './interpolate';

/**
 * Service layer for hybrid address operations
 * Makes direct RPC calls to the app schema functions
 */
export class HybridAddrService {
  
  /**
   * Parse a hybrid address into ltree path and json keys
   */
  static async parseAddress(address: HybridAddr): Promise<ParsedHybridAddr> {
    try {
      const { data, error } = await (supabase as any).schema('app').rpc('parse_hybrid_addr', {
        _addr: address
      });

      if (error) throw this.createRpcError(error);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Failed to parse address: ${address}`);
      }

      const result = data[0];
      return {
        ltreePath: result.ltree_path,
        jsonKeys: result.json_keys || []
      };
    } catch (error) {
      throw this.handleError(error, `parseAddress(${address})`);
    }
  }

  /**
   * Get value at hybrid address
   */
  static async getItemAt({ jobId, address }: HybridAddrOptions): Promise<any> {
    try {
      const { data, error } = await (supabase as any).schema('app').rpc('json_resolve_by_path', {
        p_job_id: jobId,
        p_address: address
      });

      if (error) throw this.createRpcError(error);
      
      return data;
    } catch (error) {
      throw this.handleError(error, `getItemAt(${jobId}, ${address})`);
    }
  }

  /**
   * Set value at hybrid address
   */
  static async setItemAt({ jobId, address, value }: SetValueOptions): Promise<any> {
    try {
      const { data, error } = await (supabase as any).schema('app').rpc('json_set_by_path', {
        p_job_id: jobId,
        p_address: address,
        p_value: JSON.stringify(value)
      });

      if (error) throw this.createRpcError(error);
      
      return data;
    } catch (error) {
      throw this.handleError(error, `setItemAt(${jobId}, ${address})`);
    }
  }

  /**
   * Push interpolated payload to target address
   */
  static async pushPayload({ 
    jobId, 
    targetAddr, 
    payload, 
    context = {} 
  }: PayloadOptions): Promise<any> {
    try {
      // Interpolate the payload with context
      const interpolatedPayload = interpolateJSON(payload, {
        job: { id: jobId },
        ...context
      });

      // Push to target address
      return await this.setItemAt({
        jobId,
        address: targetAddr,
        value: interpolatedPayload
      });
    } catch (error) {
      throw this.handleError(error, `pushPayload(${jobId}, ${targetAddr})`);
    }
  }

  /**
   * Validate hybrid address format
   */
  static validateAddress(address: HybridAddr): AddressValidation {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Address must be a non-empty string' };
    }

    // Check for valid characters (ltree allows alphanumeric, underscore, dot, hash)
    const validPattern = /^[a-zA-Z0-9_.]+(#[a-zA-Z0-9_.]+)?$/;
    if (!validPattern.test(address)) {
      return { 
        isValid: false, 
        error: 'Address contains invalid characters. Use only letters, numbers, underscores, dots, and hash.' 
      };
    }

    // Parse the address
    const hashPos = address.indexOf('#');
    let ltreePath: string;
    let jsonKeys: string[] = [];

    if (hashPos === -1) {
      // Pure ltree path
      ltreePath = address;
    } else {
      // Split ltree and json parts
      ltreePath = address.substring(0, hashPos);
      const jsonPath = address.substring(hashPos + 1);
      jsonKeys = jsonPath.split('.');
    }

    // Validate ltree path (must start with letter/underscore, segments separated by dots)
    const ltreePattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
    if (!ltreePattern.test(ltreePath)) {
      return { 
        isValid: false, 
        error: 'Invalid ltree path format. Each segment must start with letter/underscore.' 
      };
    }

    // Validate json keys (must be valid identifiers)
    for (const key of jsonKeys) {
      if (!key || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        return { 
          isValid: false, 
          error: `Invalid JSON key: ${key}. Keys must be valid identifiers.` 
        };
      }
    }

    return { 
      isValid: true, 
      parsed: { ltreePath, jsonKeys } 
    };
  }

  /**
   * Check if address exists for a job
   */
  static async addressExists(jobId: JobID, address: HybridAddr): Promise<boolean> {
    try {
      await this.getItemAt({ jobId, address });
      return true;
    } catch (error) {
      // If it's a "not found" error, return false
      if (error instanceof Error && error.message.includes('Node not found')) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all instances in a collection
   */
  static async getCollectionInstances(
    jobId: JobID, 
    collectionPath: string
  ): Promise<Array<{ id: string; path: string; data: any }>> {
    try {
      // This would require additional RPC functions to implement properly
      // For now, return empty array as placeholder
      console.warn('getCollectionInstances not yet implemented');
      return [];
    } catch (error) {
      throw this.handleError(error, `getCollectionInstances(${jobId}, ${collectionPath})`);
    }
  }

  /**
   * Create RPC error from Supabase error
   */
  private static createRpcError(error: any): RpcError {
    const rpcError = new Error(error.message || 'RPC call failed') as RpcError;
    rpcError.code = error.code;
    rpcError.details = error.details;
    rpcError.hint = error.hint;
    return rpcError;
  }

  /**
   * Handle and format errors consistently
   */
  private static handleError(error: any, context: string): Error {
    console.error(`HybridAddrService.${context}:`, error);
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(`${context}: ${String(error)}`);
  }
}

// Export commonly used functions as standalone
export const { 
  parseAddress,
  getItemAt, 
  setItemAt, 
  pushPayload,
  validateAddress,
  addressExists
} = HybridAddrService;