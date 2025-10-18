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
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">{t('usage.title')}</h1>

      {/* Credits Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{t('usage.credits')}</h2>
          </div>
          <div className="text-3xl font-bold">
            {credits?.credits?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary mb-3">
          {credits && credits.credits > 0 && (
            <>
              {/* Plan Credits Layer */}
              {credits.plan_credits > 0 && (
                <div
                  className="absolute h-full bg-primary transition-all"
                  style={{ width: `${(credits.plan_credits / credits.credits) * 100}%` }}
                />
              )}
              {/* Top-up Credits Layer */}
              {credits.topup_credits > 0 && (
                <div
                  className="absolute h-full bg-accent transition-all"
                  style={{ 
                    left: `${(credits.plan_credits / credits.credits) * 100}%`,
                    width: `${(credits.topup_credits / credits.credits) * 100}%` 
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Credit Status Text */}
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <span className="text-muted-foreground">
            {credits && credits.plan_credits > 0 
              ? t('usage.usingPlanCredits') || 'Using plan credits'
              : credits && credits.topup_credits > 0
              ? t('usage.usingTopUpCredits') || 'Using top-up credits'
              : t('usage.noCreditsRemaining') || 'No credits remaining'}
          </span>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span>{t('usage.planCredits')}: {credits?.plan_credits?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span>{t('usage.topUpCredits')}: {credits?.topup_credits?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button onClick={() => openModal('subscribe')} className="flex-1">
          {subscription?.subscription_plan_id ? t('usage.changePlan') : t('usage.subscribeToPlan')}
        </Button>
        <Button onClick={() => openModal('topup')} variant="outline" className="flex-1">
          {t('usage.topUp')}
        </Button>
      </div>

      {/* Payment Method */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">{t('billing.paymentMethod')}</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <CreditCard className="h-12 w-12 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t('billing.noPaymentMethod')}
              </p>
            </div>
          </div>
          <Button onClick={handleManageStripe} variant="outline" className="w-full sm:w-auto">
            <ExternalLink className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('billing.manageInStripe')}
          </Button>
        </div>
      </Card>

      {/* Current Subscription */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">{t('billing.currentSubscription')}</h2>
        <div className="space-y-4">
          {subscription?.subscription_plan_id ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('billing.currentPlan')}</span>
                  <span className="font-bold">{subscription.plan?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('billing.billingCycle')}</span>
                  <span>{t('billing.weekly')}</span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('billing.nextBilling')}</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('billing.status')}</span>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status === 'active' ? t('billing.active') : t('billing.canceled')}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleManageStripe}
                className="w-full sm:w-auto"
              >
                {subscription.cancel_at_period_end
                  ? t('billing.reactivateSubscription')
                  : t('billing.cancelSubscription')}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">{t('usage.freePlan')}</p>
          )}
        </div>
      </Card>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('billing.transactionHistory')}</h2>
        <Card>
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
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('billing.noTransactions')}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className={cn(isRTL ? "text-left" : "text-right")}>
                        <span className={cn(transaction.credits_amount > 0 ? "text-green-600" : "text-red-600")}>
                          {transaction.credits_amount > 0 ? '+' : ''}
                          {transaction.credits_amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className={cn(isRTL ? "text-left" : "text-right")}>
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
