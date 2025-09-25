import { useState, useCallback, useRef, useEffect } from 'react';
import { useFields, type FieldEntry } from './useFields';

interface CacheEntry {
  entry: FieldEntry | null;
  timestamp: number;
  loading: boolean;
}

/**
 * Cached field registry that reduces redundant API calls
 */
export function useFieldRegistryCache() {
  const { getEntry } = useFields();
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  
  // Cache TTL (5 minutes)
  const CACHE_TTL = 5 * 60 * 1000;
  
  // Check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL;
  }, []);
  
  // Get field entry with caching
  const getCachedEntry = useCallback(async (fieldRef: string): Promise<FieldEntry | null> => {
    // Check cache first
    const cached = cacheRef.current.get(fieldRef);
    if (cached && isCacheValid(cached) && !cached.loading) {
      console.log(`[FIELD CACHE] Cache hit for ${fieldRef}`);
      return cached.entry;
    }
    
    // Check if already loading
    if (cached?.loading) {
      console.log(`[FIELD CACHE] Already loading ${fieldRef}, waiting...`);
      // Wait for existing request to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const current = cacheRef.current.get(fieldRef);
          if (current && !current.loading) {
            clearInterval(checkInterval);
            resolve(current.entry);
          }
        }, 50);
      });
    }
    
    // Set loading state
    cacheRef.current.set(fieldRef, {
      entry: null,
      timestamp: Date.now(),
      loading: true
    });
    
    setLoadingFields(prev => new Set(prev).add(fieldRef));
    
    try {
      console.log(`[FIELD CACHE] Fetching ${fieldRef} from registry`);
      const entry = await getEntry(fieldRef);
      
      // Cache the result
      cacheRef.current.set(fieldRef, {
        entry,
        timestamp: Date.now(),
        loading: false
      });
      
      setLoadingFields(prev => {
        const updated = new Set(prev);
        updated.delete(fieldRef);
        return updated;
      });
      
      return entry;
      
    } catch (error) {
      console.error(`[FIELD CACHE] Failed to fetch ${fieldRef}:`, error);
      
      // Cache the error as null
      cacheRef.current.set(fieldRef, {
        entry: null,
        timestamp: Date.now(),
        loading: false
      });
      
      setLoadingFields(prev => {
        const updated = new Set(prev);
        updated.delete(fieldRef);
        return updated;
      });
      
      return null;
    }
  }, [getEntry, isCacheValid]);
  
  // Batch get multiple field entries
  const getCachedEntries = useCallback(async (
    fieldRefs: string[]
  ): Promise<Record<string, FieldEntry | null>> => {
    console.log(`[FIELD CACHE] Batch fetching ${fieldRefs.length} field entries`);
    
    const results = await Promise.allSettled(
      fieldRefs.map(ref => getCachedEntry(ref))
    );
    
    const output: Record<string, FieldEntry | null> = {};
    fieldRefs.forEach((ref, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        output[ref] = result.value;
      } else {
        console.warn(`[FIELD CACHE] Failed to get ${ref}:`, result.reason);
        output[ref] = null;
      }
    });
    
    return output;
  }, [getCachedEntry]);
  
  // Preload field entries
  const preloadEntries = useCallback(async (fieldRefs: string[]) => {
    const uncached = fieldRefs.filter(ref => {
      const cached = cacheRef.current.get(ref);
      return !cached || !isCacheValid(cached);
    });
    
    if (uncached.length > 0) {
      console.log(`[FIELD CACHE] Preloading ${uncached.length} uncached entries`);
      await getCachedEntries(uncached);
    }
  }, [getCachedEntries, isCacheValid]);
  
  // Clear cache
  const clearCache = useCallback(() => {
    console.log('[FIELD CACHE] Clearing cache');
    cacheRef.current.clear();
    setLoadingFields(new Set());
  }, []);
  
  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    let valid = 0;
    let expired = 0;
    let loading = 0;
    
    cache.forEach((entry) => {
      if (entry.loading) {
        loading++;
      } else if (now - entry.timestamp < CACHE_TTL) {
        valid++;
      } else {
        expired++;
      }
    });
    
    return {
      total: cache.size,
      valid,
      expired,
      loading,
      loadingFields: Array.from(loadingFields)
    };
  }, [loadingFields]);
  
  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const cache = cacheRef.current;
      const now = Date.now();
      const toDelete: string[] = [];
      
      cache.forEach((entry, key) => {
        if (!entry.loading && now - entry.timestamp >= CACHE_TTL) {
          toDelete.push(key);
        }
      });
      
      if (toDelete.length > 0) {
        console.log(`[FIELD CACHE] Cleaning up ${toDelete.length} expired entries`);
        toDelete.forEach(key => cache.delete(key));
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  return {
    getCachedEntry,
    getCachedEntries,
    preloadEntries,
    clearCache,
    getCacheStats,
    isLoading: (fieldRef: string) => loadingFields.has(fieldRef)
  };
}