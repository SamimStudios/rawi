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
  
      // Query the app schema directly (bypass typed client constraints)
      const { data, error: dbError } = await (supabase as any)
        .schema('app' as any)
        .from('n8n_functions')
        .select('id,name,price_in_credits,active')
        .eq('active', true);
  
      if (dbError) throw dbError;
  
      const pricingMap: FunctionPricing = {};
      const rows = (data ?? []) as Array<{
        id?: string;
        name?: string;
        price_in_credits?: number | string | null;
      }>;
  
      rows.forEach((row) => {
        const price = typeof row.price_in_credits === 'number'
          ? row.price_in_credits
          : Number(row.price_in_credits ?? 0);
        if (!Number.isNaN(price)) {
          if (row.id)   pricingMap[row.id] = price;   // lookup by id
          if (row.name) pricingMap[row.name] = price; // lookup by name
        }
      });
  
      setPricing(pricingMap);
      console.log('test pricing ashqar:', rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch function pricing');
      console.error('Error fetching function pricing:', err);
      setPricing({});
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