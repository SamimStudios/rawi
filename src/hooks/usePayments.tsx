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
  const [packageLoading, setPackageLoading] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null);
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
      return { data: null, error: new Error("Authentication required") };
    }

    if (options.packageId) {
      setPackageLoading(options.packageId);
    } else {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: options
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
      return { data: null, error: error as Error };
    } finally {
      if (options.packageId) {
        setPackageLoading(null);
      } else {
        setLoading(false);
      }
    }
  };

  const createSubscription = async (planId: string, currency: string = 'AED') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive"
      });
      return { data: null, error: new Error("Authentication required") };
    }

    setSubscriptionLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planId, currency }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription",
        variant: "destructive"
      });
      return { data: null, error: error as Error };
    } finally {
      setSubscriptionLoading(null);
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
      // First try to get the invoice URL from the transaction metadata
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('metadata')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      let invoiceUrl = null;
      
      // Check if we have the PDF URL stored in metadata
      const metadata = transaction?.metadata as Record<string, any> | null;
      if (metadata?.invoice_pdf_url) {
        invoiceUrl = metadata.invoice_pdf_url;
        console.log('Using stored invoice PDF URL:', invoiceUrl);
        
        // Open the Stripe invoice/receipt URL in a new tab
        window.open(invoiceUrl, '_blank');
        toast({
          title: "Invoice Opened",
          description: "Your invoice has been opened in a new tab."
        });
        return;
      }
      
      // Fallback to generate-invoice function if no stored URL
      console.log('No stored PDF URL found, calling generate-invoice function');
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { 
          userId: user?.id,
          transactionId 
        }
      });

      if (error) throw error;

      if (data.invoiceUrl) {
        // Open Stripe invoice/receipt in new tab
        window.open(data.invoiceUrl, '_blank');
        
        toast({
          title: "Invoice Opened",
          description: `Invoice ${data.invoiceNumber} opened in new tab`,
        });
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to open invoice",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    packageLoading,
    subscriptionLoading,
    createCheckout,
    createSubscription,
    checkPaymentStatus,
    openCustomerPortal,
    downloadInvoice,
  };
};