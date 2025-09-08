import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Reward {
  id: string;
  name: string;
  description: string;
  reward_type: string;
  credits_amount: number;
  active: boolean;
  conditions: any;
  created_at: string;
  updated_at: string;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRewards = async () => {
    if (!user) {
      setRewards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rewards information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardType: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('handle-rewards', {
        body: {
          rewardType,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Reward Claimed!",
          description: `You received ${data.creditsAwarded} credits from ${data.rewardName}`,
        });
        return true;
      } else {
        // Silent fail for already claimed rewards
        return false;
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive"
      });
      return false;
    }
  };

  // Auto-claim signup bonus for new users
  const autoClaimSignupBonus = async () => {
    if (!user) return;
    
    // Wait a moment to ensure user is fully authenticated
    setTimeout(async () => {
      await claimReward('signup_bonus');
    }, 2000);
  };

  useEffect(() => {
    fetchRewards();
  }, [user]);

  return {
    rewards,
    loading,
    claimReward,
    autoClaimSignupBonus,
    refresh: fetchRewards,
  };
};