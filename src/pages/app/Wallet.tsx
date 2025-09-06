import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useCommerceTracking } from '@/hooks/useAnalytics';
import { featureFlags, getConfig } from '@/config/app';
import { Wallet as WalletIcon, CreditCard, Plus, Minus, Check } from 'lucide-react';

const Wallet = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { trackPurchaseStarted, trackCreditsPurchased, trackSubscriptionStarted } = useCommerceTracking();
  
  // Purchase state
  const [credits, setCredits] = useState(100);
  const [promoCode, setPromoCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [selectedInterval, setSelectedInterval] = useState('monthly');
  
  // Get feature flags from centralized config
  const WEEKLY_SUBS_ENABLED = featureFlags.WEEKLY_SUBS_ENABLED;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  // Handle URL parameters for success/error messages
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast({
        title: t('paymentSuccessful'),
        variant: 'default',
      });
    } else if (searchParams.get('canceled') === '1') {
      toast({
        title: t('paymentCanceled'),
        variant: 'destructive',
      });
    } else if (searchParams.get('sub_success') === '1') {
      toast({
        title: t('subscriptionActive'),
        variant: 'default',
      });
    } else if (searchParams.get('sub_canceled') === '1') {
      toast({
        title: t('subscriptionCheckoutCanceled'),
        variant: 'destructive',
      });
    }
  }, [searchParams, t, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock transaction data with new entries
  const transactions = [
    {
      id: '1',
      type: 'purchase',
      amount: 150,
      date: '2025-09-01',
      description: t('purchase'),
      currency: 'AED'
    },
    {
      id: '2',
      type: 'generation',
      amount: -24,
      date: '2025-09-02',
      description: `${t('generation')} — ${t('teaser')}`,
      currency: ''
    },
    {
      id: '3',
      type: 'generation',
      amount: -66,
      date: '2025-09-03',
      description: `${t('generation')} — ${t('trailer')}`,
      currency: ''
    },
    {
      id: '4',
      type: 'subscription',
      amount: 350,
      date: '2025-09-04',
      description: t('subscriptionMonthly'),
      currency: 'AED'
    },
    {
      id: '5',
      type: 'generation',
      amount: -12,
      date: '2025-09-05',
      description: `${t('generation')} — ${t('poster')}`,
      currency: ''
    }
  ];

  // Subscription plans
  const plans = [
    { key: 'light', name: t('light'), credits: 70, price: 60 },
    { key: 'standard', name: t('standard'), credits: 150, price: 120 },
    { key: 'pro', name: t('pro'), credits: 350, price: 280 },
    { key: 'studio', name: t('studio'), credits: 800, price: 640 }
  ];

  const handleCreditsChange = (value: number[]) => {
    setCredits(value[0]);
  };

  const handlePresetClick = (amount: number) => {
    setCredits(amount);
  };

  const handleOneTimeCheckout = async () => {
    try {
      // Track purchase initiation
      trackPurchaseStarted('one-time-credits', credits, 'AED');
      
      // Use configured API base URL
      const apiUrl = `${getConfig('API_BASE')}/credits/checkout`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'one_time',
          credits,
          currency: 'AED',
          success_url: `${window.location.origin}/app/wallet?success=1`,
          cancel_url: `${window.location.origin}/app/wallet?canceled=1`
        })
      });
      
      const data = await response.json();
      // Open checkout URL in new tab
      window.open(data.checkout_url || '#stripe-placeholder', '_blank');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error starting checkout',
        variant: 'destructive',
      });
    }
  };

  const handleSubscriptionCheckout = async () => {
    try {
      const selectedPlanData = plans.find(p => p.key === selectedPlan);
      if (selectedPlanData) {
        // Track subscription initiation
        trackSubscriptionStarted(selectedPlan, selectedInterval, selectedPlanData.price);
      }
      
      // Use configured API base URL
      const apiUrl = `${getConfig('API_BASE')}/credits/checkout`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'subscription',
          interval: selectedInterval,
          plan_key: selectedPlan,
          success_url: `${window.location.origin}/app/wallet?sub_success=1`,
          cancel_url: `${window.location.origin}/app/wallet?sub_canceled=1`
        })
      });
      
      const data = await response.json();
      // Open checkout URL in new tab
      window.open(data.checkout_url || '#stripe-placeholder', '_blank');
    } catch (error) {
      console.error('Subscription checkout error:', error);
      toast({
        title: 'Error starting subscription',
        variant: 'destructive',
      });
    }
  };

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <WalletIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t('wallet')}
              </h1>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CreditCard className="w-6 h-6 text-primary" />
                  {t('currentBalance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-2">
                  120 {t('credits')}
                </div>
                <p className="text-muted-foreground text-sm">
                  {t('creditsExpireIn90')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Card */}
          <div className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('buyCredits')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="one-time" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="one-time">{t('oneTime')}</TabsTrigger>
                    <TabsTrigger value="subscription">{t('subscription')}</TabsTrigger>
                  </TabsList>
                  
                  {/* One-time Purchase Tab */}
                  <TabsContent value="one-time" className="space-y-6 mt-6">
                    <div>
                      <label className="text-foreground font-medium mb-4 block">
                        {t('howManyCredits')}
                      </label>
                      
                      {/* Preset buttons */}
                      <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {[50, 100, 200, 400].map((amount) => (
                          <Button
                            key={amount}
                            variant={credits === amount ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetClick(amount)}
                            className="text-sm"
                          >
                            {amount}
                          </Button>
                        ))}
                      </div>

                      {/* Slider and Input */}
                      <div className="space-y-4">
                        <Slider
                          value={[credits]}
                          onValueChange={handleCreditsChange}
                          min={10}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                        <Input
                          type="number"
                          value={credits}
                          onChange={(e) => setCredits(parseInt(e.target.value) || 10)}
                          min={10}
                          max={1000}
                          step={10}
                          className="w-32"
                        />
                      </div>
                    </div>

                    {/* Price calculation */}
                    <div className="text-xl font-semibold text-foreground">
                      {t('total')}: {credits} AED
                    </div>

                    {/* Promo code - conditional rendering based on feature flag */}
                    {featureFlags.PROMO_CODES_ENABLED && (
                      <div>
                        <Input
                          placeholder={t('promoCode')}
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full max-w-xs"
                        />
                      </div>
                    )}

                    {/* Checkout button */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleOneTimeCheckout}
                        className="bg-gradient-auth hover:opacity-90 text-white border-0 w-full sm:w-auto"
                        size="lg"
                      >
                        {t('payWithStripe')}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {t('securePayment')}
                      </p>
                    </div>
                  </TabsContent>

                  {/* Subscription Tab */}
                  <TabsContent value="subscription" className="space-y-6 mt-6">
                    {/* Interval selector */}
                    <div>
                      <label className="text-foreground font-medium mb-3 block">
                        {t('billedEach')}
                      </label>
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button
                          variant={selectedInterval === 'monthly' ? "default" : "outline"}
                          onClick={() => setSelectedInterval('monthly')}
                          size="sm"
                        >
                          {t('monthly')}
                        </Button>
                        {WEEKLY_SUBS_ENABLED && (
                          <Button
                            variant={selectedInterval === 'weekly' ? "default" : "outline"}
                            onClick={() => setSelectedInterval('weekly')}
                            size="sm"
                          >
                            {t('weekly')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Plan selector */}
                    <div>
                      <label className="text-foreground font-medium mb-3 block">
                        Plan Size
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans.map((plan) => (
                          <Card
                            key={plan.key}
                            className={`cursor-pointer border-2 transition-colors ${
                              selectedPlan === plan.key
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedPlan(plan.key)}
                          >
                            <CardContent className="p-4 text-center">
                              <div className={`flex items-center justify-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                                {selectedPlan === plan.key && (
                                  <Check className="w-4 h-4 text-primary ml-2" />
                                )}
                              </div>
                              <p className="text-2xl font-bold text-primary">{plan.credits}</p>
                              <p className="text-sm text-muted-foreground">{t('credits')}</p>
                              <p className="text-lg font-semibold text-foreground mt-2">
                                {plan.price} AED
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Subscription checkout */}
                    <div className="space-y-4">
                      <div className="text-lg text-foreground">
                        {t('billedEach')} {selectedInterval === 'monthly' ? t('monthly') : t('weekly')}
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          onClick={handleSubscriptionCheckout}
                          className="bg-gradient-auth hover:opacity-90 text-white border-0 w-full sm:w-auto"
                          size="lg"
                        >
                          {t('startSubscription')}
                        </Button>
                        <div className={`flex gap-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <a
                            href="/app/billing"
                            className="text-primary hover:underline"
                          >
                            {t('manageBilling')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('transactionHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">{t('transactionType')}</TableHead>
                    <TableHead className="text-foreground">{t('transactionAmount')}</TableHead>
                    <TableHead className="text-foreground">{t('transactionDate')}</TableHead>
                    <TableHead className="text-foreground">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-foreground font-medium">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {transaction.amount > 0 ? (
                            <Plus className="w-4 h-4 text-green-500" />
                          ) : (
                            <Minus className="w-4 h-4 text-red-500" />
                          )}
                          {transaction.type === 'purchase' || transaction.type === 'subscription'
                            ? t('purchase')
                            : t('generation')}
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount)} 
                        {transaction.currency && ` ${transaction.currency}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Wallet;