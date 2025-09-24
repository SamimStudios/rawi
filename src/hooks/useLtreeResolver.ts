import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LtreeOperation {
  operation: 'resolve' | 'set' | 'exists' | 'list_children';
  job_id: string;
  address: string;
  value?: any;
}

export function useLtreeResolver() {
  const callResolver = useCallback(async ({ operation, job_id, address, value }: LtreeOperation) => {
    const { data, error } = await supabase.functions.invoke('ltree-resolver', {
      body: { operation, job_id, address, value }
    });

    if (error) {
      console.error('LTree resolver error:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'LTree operation failed');
    }

    return data.data;
  }, []);

  const resolveValue = useCallback(async (jobId: string, address: string) => {
    return callResolver({ operation: 'resolve', job_id: jobId, address });
  }, [callResolver]);

  const setValue = useCallback(async (jobId: string, address: string, value: any) => {
    return callResolver({ operation: 'set', job_id: jobId, address, value });
  }, [callResolver]);

  const exists = useCallback(async (jobId: string, address: string): Promise<boolean> => {
    const result = await callResolver({ operation: 'exists', job_id: jobId, address });
    return result.exists;
  }, [callResolver]);

  return {
    resolveValue,
    setValue,
    exists
  };
}