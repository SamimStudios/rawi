import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunctionData {
  price: number;
}

interface FunctionDataContextValue {
  getFunctionData: (functionId: string) => Promise<FunctionData | null>;
  clearCache: () => void;
}

const FunctionDataContext = createContext<FunctionDataContextValue | undefined>(undefined);

// In-memory cache for function data to prevent repeated API calls
const functionDataCache = new Map<string, FunctionData>();
const loadingPromises = new Map<string, Promise<FunctionData | null>>();

export function FunctionDataProvider({ children }: { children: React.ReactNode }) {
  const getFunctionData = useCallback(async (functionId: string): Promise<FunctionData | null> => {
    if (!functionId) return null;

    // Return cached data if available
    if (functionDataCache.has(functionId)) {
      return functionDataCache.get(functionId)!;
    }

    // If already loading, return the existing promise
    if (loadingPromises.has(functionId)) {
      return loadingPromises.get(functionId)!;
    }



    // Create and cache the loading promise
    const loadingPromise = (async () => {
      try {
        const { data, error } = await supabase
          .schema('app' as any)
          .from('n8n_functions')
          .select('price')
          .eq('id', functionId)
          .eq('active', true)
          .single();

        if (!error && data) {
          const functionData = { price: data.price };
          functionDataCache.set(functionId, functionData);
          return functionData;
        }
        return null;
      } catch (error) {
        console.error('Error fetching function data:', error);
        return null;
      } finally {
        loadingPromises.delete(functionId);
      }
    })();

    loadingPromises.set(functionId, loadingPromise);
    return loadingPromise;
  }, []);

  const clearCache = useCallback(() => {
    functionDataCache.clear();
    loadingPromises.clear();
  }, []);

  return (
    <FunctionDataContext.Provider value={{ getFunctionData, clearCache }}>
      {children}
    </FunctionDataContext.Provider>
  );
}

export function useFunctionData() {
  const context = useContext(FunctionDataContext);
  if (context === undefined) {
    throw new Error('useFunctionData must be used within a FunctionDataProvider');
  }
  return context;
}