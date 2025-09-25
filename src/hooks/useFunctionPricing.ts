import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunctionPricing {
  [key: string]: number;
}

interface UseFunctionPricingResult {
  pricing: FunctionPricing;
  loading: boolean;
  error: string | null;
  getPrice: (functionId: string) => number;
}

export function useFunctionPricing(): UseFunctionPricingResult {
  const [pricing, setPricing] = useState<FunctionPricing>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .rpc('get_function_pricing');

      if (queryError) {
        throw queryError;
      }

      // Convert to pricing map
      const pricingMap: FunctionPricing = {};
      data?.forEach((func: any) => {
        pricingMap[func.id] = func.price_in_credits || 0;
      });

      setPricing(pricingMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch function pricing');
      console.error('Error fetching function pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (functionId: string): number => {
    return pricing[functionId] || 0;
  };

  return {
    pricing,
    loading,
    error,
    getPrice
  };
}