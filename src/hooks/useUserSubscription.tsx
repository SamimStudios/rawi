import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan?: {
    name: string;
    credits_per_week: number;
    price_aed: number;
    price_sar: number;
    price_usd: number;
  };
}

export const useUserSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(
            name,
            credits_per_week,
            price_aed,
            price_sar,
            price_usd
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isActive = subscription?.status === 'active';
  const isFree = !subscription || !subscription.subscription_plan_id;
  const expiresAt = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

  return {
    subscription,
    isActive,
    isFree,
    expiresAt,
    loading,
    refresh: fetchSubscription,
  };
};
