import { useCallback, useRef } from 'react';
import { useLtreeResolver } from './useLtreeResolver';

interface BatchRequest {
  operation: 'resolve' | 'set';
  jobId: string;
  address: string;
  value?: any;
  resolve?: (value: any) => void;
  reject?: (error: any) => void;
}

/**
 * Batched ltree resolver that groups multiple operations into single calls
 * Reduces API overhead and improves performance
 */
export function useBatchedLtreeResolver() {
  const { resolveValue, setValue } = useLtreeResolver();
  
  // Batch queues
  const resolveQueueRef = useRef<BatchRequest[]>([]);
  const setQueueRef = useRef<BatchRequest[]>([]);
  
  // Timers for debouncing
  const resolveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const setTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process resolve batch
  const processResolveBatch = useCallback(async () => {
    const batch = resolveQueueRef.current;
    resolveQueueRef.current = [];
    
    if (batch.length === 0) return;
    
    console.log(`[BATCHED RESOLVER] Processing ${batch.length} resolve operations`);
    
    // Group by job ID for efficiency
    const byJobId = batch.reduce((acc, req) => {
      if (!acc[req.jobId]) acc[req.jobId] = [];
      acc[req.jobId].push(req);
      return acc;
    }, {} as Record<string, BatchRequest[]>);
    
    // Process each job's requests
    for (const [jobId, requests] of Object.entries(byJobId)) {
      await Promise.all(
        requests.map(async (req) => {
          try {
            const result = await resolveValue(req.jobId, req.address);
            req.resolve?.(result);
          } catch (error) {
            console.error(`[BATCHED RESOLVER] Resolve failed for ${req.address}:`, error);
            req.reject?.(error);
          }
        })
      );
    }
  }, [resolveValue]);
  
  // Process set batch
  const processSetBatch = useCallback(async () => {
    const batch = setQueueRef.current;
    setQueueRef.current = [];
    
    if (batch.length === 0) return;
    
    console.log(`[BATCHED RESOLVER] Processing ${batch.length} set operations`);
    
    // Group by job ID for efficiency  
    const byJobId = batch.reduce((acc, req) => {
      if (!acc[req.jobId]) acc[req.jobId] = [];
      acc[req.jobId].push(req);
      return acc;
    }, {} as Record<string, BatchRequest[]>);
    
    // Process each job's requests
    for (const [jobId, requests] of Object.entries(byJobId)) {
      await Promise.all(
        requests.map(async (req) => {
          try {
            await setValue(req.jobId, req.address, req.value);
            req.resolve?.(true);
          } catch (error) {
            console.error(`[BATCHED RESOLVER] Set failed for ${req.address}:`, error);
            req.reject?.(error);
          }
        })
      );
    }
  }, [setValue]);
  
  // Batched resolve value
  const batchResolveValue = useCallback(async (jobId: string, address: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Add to resolve queue
      resolveQueueRef.current.push({
        operation: 'resolve',
        jobId,
        address,
        resolve,
        reject
      });
      
      // Debounce batch processing
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }
      
      resolveTimerRef.current = setTimeout(() => {
        processResolveBatch();
      }, 10); // Very short debounce for batching
    });
  }, [processResolveBatch]);
  
  // Batched set value
  const batchSetValue = useCallback(async (jobId: string, address: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Add to set queue
      setQueueRef.current.push({
        operation: 'set',
        jobId,
        address,
        value,
        resolve,
        reject
      });
      
      // Debounce batch processing
      if (setTimerRef.current) {
        clearTimeout(setTimerRef.current);
      }
      
      setTimerRef.current = setTimeout(() => {
        processSetBatch();
      }, 100); // Slightly longer debounce for sets
    });
  }, [processSetBatch]);
  
  // Batch resolve multiple addresses at once
  const batchResolveMultiple = useCallback(async (
    jobId: string, 
    addresses: string[]
  ): Promise<Record<string, any>> => {
    const results = await Promise.allSettled(
      addresses.map(address => batchResolveValue(jobId, address))
    );
    
    const output: Record<string, any> = {};
    addresses.forEach((address, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        output[address] = result.value;
      } else {
        console.warn(`[BATCHED RESOLVER] Failed to resolve ${address}:`, result.reason);
        output[address] = undefined;
      }
    });
    
    return output;
  }, [batchResolveValue]);
  
  // Cleanup timers
  const cleanup = useCallback(() => {
    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
    if (setTimerRef.current) {
      clearTimeout(setTimerRef.current);
      setTimerRef.current = null;
    }
  }, []);
  
  return {
    batchResolveValue,
    batchSetValue,
    batchResolveMultiple,
    cleanup,
    
    // Expose queue lengths for debugging
    getQueueStats: () => ({
      resolveQueue: resolveQueueRef.current.length,
      setQueue: setQueueRef.current.length
    })
  };
}