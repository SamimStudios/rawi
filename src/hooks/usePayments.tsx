import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_aed: number;
  price_sar: number;
  price_usd: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  credits_per_week: number;
  price_aed: number;
  price_sar: number;
  price_usd: number;
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createCheckout = async (options: {
    credits?: number;
    currency?: string;
    packageId?: string;
    customAmount?: boolean;
  }) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: options
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string, currency: string = 'AED') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId, currency }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { sessionId }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Payment status check error:', error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Customer portal error:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  const downloadInvoice = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          userId: user?.id,
          transactionId 
        }
      });

      if (error) throw error;

      // Create and download PDF
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${data.invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${data.invoiceNumber} has been downloaded`,
      });
    } catch (error) {
      console.error('Invoice download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download invoice",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    createCheckout,
    createSubscription,
    checkPaymentStatus,
    openCustomerPortal,
    downloadInvoice,
  };
};