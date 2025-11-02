import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Coins, TrendingUp, Zap, Calendar, CreditCard, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import CreditsModal from '@/components/payments/CreditsModal';

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  credits_amount: number;
  amount_paid: number | null;
  currency: string;
  description: string | null;
  stripe_session_id: string | null;
}

export default function Usage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { credits, loading: creditsLoading } = useUserCredits();
  const { subscription, loading: subLoading } = useUserSubscription();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const isRTL = language === 'ar';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'subscribe' | 'topup'>('subscribe');

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    fetchTransactions();
  }, [user, navigate]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageStripe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { transaction_id: transactionId },
      });

      if (error) throw error;
      if (data?.invoice_url) {
        window.open(data.invoice_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="default">Purchase</Badge>;
      case 'subscription':
        return <Badge variant="secondary">Subscription</Badge>;
      case 'consumption':
        return <Badge variant="outline">Usage</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const openModal = (tab: 'subscribe' | 'topup') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  if (creditsLoading || subLoading || loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">{t('usage.title')}</h1>

      {/* Current Subscription - Prominent Card at Top */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-primary/60">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {subscription?.subscription_plan_id 
                  ? subscription.plan?.name 
                  : t('usage.freePlan')}
              </h2>
              {subscription?.current_period_end && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('billing.renews')} {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                </p>
              )}
              {subscription?.subscription_plan_id && (
                <Badge variant="default" className="mt-2">
                  {subscription.status === 'active' ? t('billing.active') : t('billing.canceled')}
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={handleManageStripe} variant="outline" size="sm">
            <ExternalLink className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('billing.manageInStripe')}
          </Button>
        </div>
      </Card>

      {/* Credits Overview - Clean Number Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('usage.credits')}</h2>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {credits?.credits?.toFixed(1) || '0'}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {credits?.plan_credits?.toFixed(1) || '0'} {t('usage.planCredits').toLowerCase()} + {credits?.topup_credits?.toFixed(1) || '0'} {t('usage.topUpCredits').toLowerCase()}
          </p>
        </div>
      </Card>

      {/* Quick Actions - Card-Based Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
          onClick={() => openModal('subscribe')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                {subscription?.subscription_plan_id ? t('usage.changePlan') : t('usage.subscribeToPlan')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subscription?.subscription_plan_id 
                  ? 'Upgrade or change your subscription plan' 
                  : 'Get weekly credits automatically'}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
          onClick={() => openModal('topup')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Coins className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{t('usage.topUp')}</h3>
              <p className="text-sm text-muted-foreground">
                Purchase credits for immediate use
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold">{t('billing.transactionHistory')}</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('billing.date')}</TableHead>
                  <TableHead>{t('billing.type')}</TableHead>
                  <TableHead className={cn(isRTL ? "text-left" : "text-right")}>
                    {t('billing.credits')}
                  </TableHead>
                  <TableHead className={cn(isRTL ? "text-left" : "text-right")}>
                    {t('billing.amount')}
                  </TableHead>
                  <TableHead className={cn(isRTL ? "text-left" : "text-right")}>
                    {t('billing.invoice')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      {t('billing.noTransactions')}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className={cn(isRTL ? "text-left" : "text-right", "font-semibold")}>
                        <span className={cn(
                          transaction.credits_amount > 0 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        )}>
                          {transaction.credits_amount > 0 ? '+' : ''}
                          {transaction.credits_amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className={cn(isRTL ? "text-left" : "text-right", "font-medium")}>
                        {transaction.amount_paid ? (
                          formatPrice(transaction.amount_paid, transaction.currency as any)
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className={cn(isRTL ? "text-left" : "text-right")}>
                        {transaction.amount_paid && transaction.stripe_session_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(transaction.id)}
                            className="hover:bg-primary/10"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <CreditsModal open={modalOpen} onOpenChange={setModalOpen} defaultTab={modalTab} />
    </div>
  );
}
