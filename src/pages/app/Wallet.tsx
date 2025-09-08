import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  Package, 
  Calendar, 
  TrendingUp, 
  Download,
  RefreshCw,
  Crown,
  Star,
  Zap,
  Building2,
  Settings,
  Plus,
  Minus,
  Check,
  Wallet as WalletIcon
} from 'lucide-react';
import { RTLWrapper } from '@/components/ui/rtl-wrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCommerceTracking } from '@/hooks/useAnalytics';
import { useUserCredits } from '@/hooks/useUserCredits';
import { usePayments, type CreditPackage, type SubscriptionPlan } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { SetupStripeProducts } from '@/components/SetupStripeProducts';

const Wallet = () => {
  const [customCredits, setCustomCredits] = useState(50);
  const [promoCode, setPromoCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPurchase, trackViewItem, trackPurchaseStarted } = useCommerceTracking();
  const { credits, transactions, loading: creditsLoading, refresh: refreshCredits } = useUserCredits();
  const { 
    loading: paymentLoading,
    packageLoading,
    subscriptionLoading,
    createCheckout, 
    createSubscription, 
    openCustomerPortal, 
    downloadInvoice 
  } = usePayments();
  const { currency, formatPrice, getPrice, loading: currencyLoading } = useCurrency();
  
  const isRTL = language === 'ar';

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    // Check URL parameters for success/cancel messages
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const creditsAmount = urlParams.get('credits');
    const subscription = urlParams.get('subscription');

    if (success === 'true') {
      if (subscription === 'true') {
        toast({
          title: isRTL ? 'تم تفعيل الاشتراك!' : 'Subscription Activated!',
          description: isRTL ? 'اشتراكك الآن نشط.' : 'Your subscription is now active.',
        });
      } else {
        toast({
          title: isRTL ? 'تم الدفع بنجاح!' : 'Payment Successful!',
          description: isRTL ? 
            `تم إضافة ${creditsAmount} رصيد إلى حسابك.` : 
            `${creditsAmount} credits have been added to your account.`,
        });
      }
      
      // Refresh credits after successful payment
      refreshCredits();
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (canceled === 'true') {
      toast({
        title: isRTL ? 'تم إلغاء الدفع' : 'Payment Canceled',
        description: isRTL ? 'لم يتم خصم أي مبلغ من حسابك.' : 'No charge was made to your account.',
        variant: 'destructive'
      });
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, navigate, toast, isRTL, refreshCredits]);

  // Fetch credit packages and subscription plans
  useEffect(() => {
    const fetchPackagesAndPlans = async () => {
      try {
        const [packagesResult, plansResult] = await Promise.all([
          supabase.from('credit_packages').select('*').eq('active', true),
          supabase.from('subscription_plans').select('*').eq('active', true)
        ]);

        if (packagesResult.data) setCreditPackages(packagesResult.data);
        if (plansResult.data) setSubscriptionPlans(plansResult.data);
      } catch (error) {
        console.error('Error fetching packages and plans:', error);
      }
    };

    fetchPackagesAndPlans();
  }, []);

  const handleCreditsChange = (value: number[]) => {
    setCustomCredits(value[0]);
  };

  const handlePresetClick = (amount: number) => {
    setCustomCredits(amount);
  };

  const handlePackagePurchase = (pkg: CreditPackage) => {
    trackViewItem(pkg.name, pkg.credits, getPrice(pkg));
    createCheckout({
      packageId: pkg.id,
      currency: currency,
    });
  };

  const handleCustomPurchase = () => {
    if (customCredits < 10) {
      toast({
        title: "Minimum Credits",
        description: "Minimum purchase is 10 credits",
        variant: "destructive"
      });
      return;
    }

    createCheckout({
      credits: customCredits,
      currency: currency,
      customAmount: true
    });
  };

  const handleSubscriptionPurchase = (plan: SubscriptionPlan) => {
    if (!selectedPlan) {
      setSelectedPlan(plan.id);
    }
    createSubscription(plan.id, currency);
  };

  if (creditsLoading || currencyLoading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <WalletIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {isRTL ? 'المحفظة' : 'Wallet'}
              </h1>
            </div>
          </div>

          {/* Currency Display */}
          <div className="mb-6">
            <Badge variant="outline" className="text-primary border-primary">
              {currency} - {currency === 'AED' ? 'UAE Dirham' : currency === 'SAR' ? 'Saudi Riyal' : 'US Dollar'}
            </Badge>
          </div>

          {/* Balance Card */}
          <div className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className={`flex items-center justify-between text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    {isRTL ? 'الرصيد الحالي' : 'Current Balance'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshCredits}
                    disabled={creditsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${creditsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-2">
                  {credits.toLocaleString()} {isRTL ? 'رصيد' : 'Credits'}
                </div>
                <p className="text-muted-foreground text-sm">
                  {isRTL ? 'الرصيد لا ينتهي' : 'Credits never expire'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Setup Required Notice */}
          <div className="mb-8">
            <SetupStripeProducts />
          </div>

          {/* Purchase Card */}
          <div className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  {isRTL ? 'شراء رصيد' : 'Purchase Credits'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="packages" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="packages">{isRTL ? 'الباقات' : 'Packages'}</TabsTrigger>
                    <TabsTrigger value="custom">{isRTL ? 'مخصص' : 'Custom'}</TabsTrigger>
                    <TabsTrigger value="subscription">{isRTL ? 'الاشتراك' : 'Subscription'}</TabsTrigger>
                  </TabsList>
                  
                  {/* Credit Packages Tab */}
                  <TabsContent value="packages" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {creditPackages.map((pkg) => (
                        <Card 
                          key={pkg.id}
                          className="border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handlePackagePurchase(pkg)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between">
                              <span>{pkg.name}</span>
                              <Package className="w-5 h-5 text-primary" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-primary mb-2">
                              {pkg.credits} Credits
                            </div>
                            <div className="text-xl font-semibold text-foreground">
                              {formatPrice(getPrice(pkg))}
                            </div>
                            <Button 
                              className="w-full mt-4" 
                              disabled={packageLoading === pkg.id}
                            >
                              {packageLoading === pkg.id ? <LoadingSpinner /> : (isRTL ? 'شراء الآن' : 'Buy Now')}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Custom Credits Tab */}
                  <TabsContent value="custom" className="space-y-6 mt-6">
                    <div>
                      <Label className="text-foreground font-medium mb-4 block">
                        {isRTL ? 'كم عدد الرصيد المطلوب؟ (الحد الأدنى 10)' : 'How many credits? (Minimum 10)'}
                      </Label>
                      
                      {/* Preset buttons */}
                      <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {[50, 100, 200, 400].map((amount) => (
                          <Button
                            key={amount}
                            variant={customCredits === amount ? "default" : "outline"}
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
                          value={[customCredits]}
                          onValueChange={handleCreditsChange}
                          min={10}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                        <Input
                          type="number"
                          value={customCredits}
                          onChange={(e) => setCustomCredits(Math.max(10, parseInt(e.target.value) || 10))}
                          min={10}
                          max={1000}
                          step={10}
                          className="w-32"
                        />
                      </div>
                    </div>

                    {/* Price calculation */}
                    <div className="text-xl font-semibold text-foreground">
                      {isRTL ? 'المجموع:' : 'Total:'} {formatPrice(customCredits * (currency === 'USD' ? 0.27 : 1))}
                    </div>

                    {/* Checkout button */}
                    <Button
                      onClick={handleCustomPurchase}
                      className="bg-gradient-auth hover:opacity-90 text-white border-0 w-full sm:w-auto"
                      size="lg"
                      disabled={paymentLoading || customCredits < 10}
                    >
                      {paymentLoading ? <LoadingSpinner /> : (isRTL ? 'الدفع بـ Stripe' : 'Pay with Stripe')}
                    </Button>
                  </TabsContent>

                  {/* Subscription Tab */}
                  <TabsContent value="subscription" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {subscriptionPlans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={`border-2 transition-colors cursor-pointer ${
                            selectedPlan === plan.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                {plan.name === 'Pro Weekly' && <Star className="w-5 h-5 text-primary" />}
                                {plan.name === 'Studio Weekly' && <Crown className="w-5 h-5 text-primary" />}
                                {plan.name === 'Creator Weekly' && <Zap className="w-5 h-5 text-primary" />}
                                {plan.name}
                              </span>
                              {selectedPlan === plan.id && <Check className="w-5 h-5 text-primary" />}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 mb-4">
                              <div className="text-2xl font-bold text-primary">
                                {plan.credits_per_week} Credits/Week
                              </div>
                              <div className="text-xl font-semibold text-foreground">
                                {formatPrice(getPrice(plan))}/week
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Saves {Math.round((1 - getPrice(plan) / plan.credits_per_week) * 100)}% vs one-time
                              </div>
                            </div>
                             <Button 
                              className="w-full" 
                              onClick={() => handleSubscriptionPurchase(plan)}
                              disabled={subscriptionLoading === plan.id}
                            >
                              {subscriptionLoading === plan.id ? <LoadingSpinner /> : (isRTL ? 'اشترك الآن' : 'Subscribe Now')}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Customer Portal Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={openCustomerPortal}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {isRTL ? 'إدارة الاشتراك' : 'Manage Subscription'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                {isRTL ? 'سجل المعاملات' : 'Transaction History'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshCredits}
                  disabled={creditsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${creditsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">{isRTL ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className="text-foreground">{isRTL ? 'الرصيد' : 'Credits'}</TableHead>
                      <TableHead className="text-foreground">{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className="text-foreground">{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-foreground">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-foreground font-medium">
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {transaction.credits_amount > 0 ? (
                              <Plus className="w-4 h-4 text-green-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-red-500" />
                            )}
                            {transaction.type === 'purchase' ? 
                              (isRTL ? 'شراء' : 'Purchase') :
                              transaction.type === 'subscription_credit' ?
                              (isRTL ? 'اشتراك' : 'Subscription') :
                              (isRTL ? 'استهلاك' : 'Usage')
                            }
                          </div>
                        </TableCell>
                        <TableCell className={`font-medium ${
                          transaction.credits_amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {transaction.amount_paid ? 
                            `${transaction.amount_paid} ${transaction.currency}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {transaction.amount_paid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoice(transaction.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isRTL ? 'لا توجد معاملات بعد' : 'No transactions yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Wallet;