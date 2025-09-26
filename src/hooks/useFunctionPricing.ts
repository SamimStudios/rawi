import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserCredits } from '@/hooks/useUserCredits';

interface FunctionPricing {
  [key: string]: number;
}

interface UseFunctionPricingResult {
  pricing: FunctionPricing;
  loading: boolean;
  error: string | null;
  getPrice: (functionId: string) => number;
  canAfford: (functionId: string) => boolean;
  getPriceInfo: (functionId: string) => { price: number; canAfford: boolean };
}

export function useFunctionPricing(): UseFunctionPricingResult {
  const [pricing, setPricing] = useState<FunctionPricing>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { credits } = useUserCredits();

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);

      let pricingMap: FunctionPricing = {};

      // Use the list-n8n-functions edge function which includes price
      try {
        const { data: edgeFunctions, error: edgeError } = await supabase.functions.invoke('list-n8n-functions');
        
        if (edgeError) throw edgeError;
        
        edgeFunctions?.data?.forEach((func: any) => {
          if (func.price !== null && func.price !== undefined) {
            pricingMap[func.id] = func.price;
            pricingMap[func.name] = func.price;
          }
        });
        
        console.log('Fetched pricing from edge function:', pricingMap);
      } catch (edgeErr) {
        console.error('Edge function failed, using fallback pricing:', edgeErr);
        
        // Fallback to hardcoded pricing for development
        pricingMap = {
          'generate_movie_info': 0.05,
          'validate_edits': 0.05
        };
      }

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

  const canAfford = (functionId: string): boolean => {
    const price = getPrice(functionId);
    return credits >= price;
  };

  const getPriceInfo = (functionId: string): { price: number; canAfford: boolean } => {
    const price = getPrice(functionId);
    return {
      price,
      canAfford: credits >= price
    };
  };

  return {
    pricing,
    loading,
    error,
    getPrice,
    canAfford,
    getPriceInfo
  };
}