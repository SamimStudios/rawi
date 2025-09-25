import { useState, useEffect, useCallback } from 'react';
import type { 
  JobID, 
  HybridAddr, 
  InterpCtx,
  UseHybridValueResult, 
  UsePayloadResult 
} from './types';
import { HybridAddrService } from './service';

/**
 * Hook for reading and writing values at hybrid addresses
 */
export function useHybridValue(
  jobId: JobID | null, 
  address: HybridAddr | null
): UseHybridValueResult {
  const [value, setValue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId || !address) {
      setValue(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await HybridAddrService.getItemAt({ jobId, address });
      setValue(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch value';
      setError(errorMessage);
      console.error('useHybridValue fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, address]);

  const updateValue = useCallback(async (newValue: any) => {
    if (!jobId || !address) {
      throw new Error('Job ID and address are required');
    }

    setLoading(true);
    setError(null);
    
    try {
      await HybridAddrService.setItemAt({ jobId, address, value: newValue });
      setValue(newValue);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update value';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId, address]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    value,
    setValue: updateValue,
    loading,
    error,
    refresh
  };
}

/**
 * Hook for pushing payloads with interpolation
 */
export function usePayload(
  jobId: JobID | null, 
  targetAddr: HybridAddr | null
): UsePayloadResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pushPayload = useCallback(async (
    payload: Record<string, any>, 
    context: InterpCtx = {}
  ) => {
    if (!jobId || !targetAddr) {
      throw new Error('Job ID and target address are required');
    }

    setLoading(true);
    setError(null);
    
    try {
      await HybridAddrService.pushPayload({
        jobId,
        targetAddr,
        payload,
        context
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to push payload';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId, targetAddr]);

  return {
    pushPayload,
    loading,
    error
  };
}

/**
 * Hook for validating hybrid addresses
 */
export function useAddressValidation(address: HybridAddr | null) {
  const [validation, setValidation] = useState({ isValid: true, error: null });

  useEffect(() => {
    if (!address) {
      setValidation({ isValid: true, error: null });
      return;
    }

    const result = HybridAddrService.validateAddress(address);
    setValidation({ 
      isValid: result.isValid, 
      error: result.error || null 
    });
  }, [address]);

  return validation;
}

/**
 * Hook for checking if an address exists
 */
export function useAddressExists(jobId: JobID | null, address: HybridAddr | null) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkExists = useCallback(async () => {
    if (!jobId || !address) {
      setExists(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await HybridAddrService.addressExists(jobId, address);
      setExists(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check address';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [jobId, address]);

  useEffect(() => {
    checkExists();
  }, [checkExists]);

  return { exists, loading, error, refresh: checkExists };
}

/**
 * Hook for collection operations (placeholder for future implementation)
 */
export function useCollection(jobId: JobID | null, collectionPath: string | null) {
  const [instances, setInstances] = useState<Array<{ id: string; path: string; data: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!jobId || !collectionPath) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await HybridAddrService.getCollectionInstances(jobId, collectionPath);
      setInstances(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collection';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [jobId, collectionPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    instances,
    loading,
    error,
    refresh,
    // Placeholder methods for future implementation
    addInstance: async () => { throw new Error('Not implemented yet'); },
    removeInstance: async () => { throw new Error('Not implemented yet'); },
    updateInstance: async () => { throw new Error('Not implemented yet'); }
  };
}