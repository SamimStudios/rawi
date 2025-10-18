import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserCredits {
  id: string;
  credits: number;
  plan_credits: number;
  topup_credits: number;
  plan_credits_expire_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  credits_amount: number;
  currency: string;
  amount_paid: number | null;
  description: string;
  created_at: string;
}

export const useUserCredits = () => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (creditsError) throw creditsError;

      setCredits(creditsData || { 
        id: '', 
        credits: 0,
        plan_credits: 0,
        topup_credits: 0,
        plan_credits_expire_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch credit information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const consumeCredits = async (amount: number, description: string = 'Credit consumption') => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('consume_credits', {
        p_user_id: user.id,
        p_credits: amount,
        p_description: description
      });

      if (error) throw error;

      if (data) {
        // Refresh credits after consumption
        await fetchCredits();
        return true;
      } else {
        toast({
          title: "Insufficient Credits",
          description: `You need ${amount.toFixed(2)} credits to perform this action`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error consuming credits:', error);
      toast({
        title: "Error",
        description: "Failed to consume credits",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCredits();

    // Set up real-time subscriptions for credits and transactions
    if (user) {
      const creditsChannel = supabase
        .channel('user-credits-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCredits();
          }
        )
        .subscribe();

      const transactionsChannel = supabase
        .channel('user-transactions-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCredits();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(creditsChannel);
        supabase.removeChannel(transactionsChannel);
      };
    }
  }, [user]);

  return {
    credits: credits || { 
      id: '', 
      credits: 0,
      plan_credits: 0,
      topup_credits: 0,
      plan_credits_expire_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    totalCredits: parseFloat((credits?.credits || 0).toFixed(2)),
    userCredits: credits,
    transactions,
    loading,
    refresh: fetchCredits,
    consumeCredits,
  };
};