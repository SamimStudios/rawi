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

    const pricingMap: FunctionPricing = {};

    // Read directly from app.n8n_functions (active only)
    const { data, error: dbError } = await supabase
      .schema('app') // ensure we’re querying the "app" schema
      .from('n8n_functions')
      .select('id,name,active,price_in_credits')
      .eq('active', true);

    if (dbError) throw dbError;

    (data ?? []).forEach((row: any) => {
      const raw = row?.price_in_credits;
      const price =
        typeof raw === 'number' ? raw : Number(raw ?? 0);
      if (!Number.isNaN(price)) {
        // allow lookup by either id or name
        if (row?.id) pricingMap[row.id] = price;
        if (row?.name) pricingMap[row.name] = price;
      }
    });

    setPricing(pricingMap);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to fetch function pricing');
    console.error('Error fetching function pricing:', err);
    setPricing({}); // no fallback map; show 0 when unknown
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