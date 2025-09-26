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

      // For now, return static pricing since we need to wait for types to update
      // TODO: Replace with actual database query once types are updated
      const staticPricing: FunctionPricing = {
        'generate_movie_info': 0.05,
        'validate_edits': 0.05
      };

      setPricing(staticPricing);
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