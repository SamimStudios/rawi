import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCommerceTracking } from "@/hooks/useAnalytics";
import { useUserCredits } from "@/hooks/useUserCredits";
import { usePayments } from "@/hooks/usePayments";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, Download, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CreditPackage, SubscriptionPlan } from "@/hooks/usePayments";

// Dynamic pricing calculation helper
const calculateDynamicPrice = (credits: number, currency: string) => {
  let baseRate;
  
  // Base rates per credit
  switch (currency) {
    case "AED":
    case "SAR":
      baseRate = 1.00;
      break;
    case "USD":
      baseRate = 0.27;
      break;
    default:
      baseRate = 1.00;
  }

  // Apply discount tiers
  let discountRate = 0;
  if (credits >= 250) {
    discountRate = 0.30; // 30% off
  } else if (credits >= 100) {
    discountRate = 0.20; // 20% off
  } else if (credits >= 50) {
    discountRate = 0.10; // 10% off
  }
  // 0-49 credits = 0% off

  const discountedRate = baseRate * (1 - discountRate);
  const totalPrice = credits * discountedRate;
  
  return {
    totalPrice,
    perCreditRate: discountedRate,
    discountPercent: Math.round(discountRate * 100)
  };
};

const Wallet = () => {
  const [customCredits, setCustomCredits] = useState(50);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackPurchase, trackViewItem } = useCommerceTracking();
  const { credits, transactions, loading: creditsLoading, refresh: refreshCredits } = useUserCredits();
  const { 
    loading,
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
      navigate('/auth/sign-in');
      return;
    }
  }, [user, navigate]);

  // Show success message when returning from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Payment Successful!',
        description: 'Credits will be added to your account within minutes.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (canceled === 'true') {
      toast({
        title: 'Payment Canceled',
        description: 'No charge was made to your account.',
        variant: 'destructive'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

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

  const handlePackagePurchase = async (packageId: string) => {
    try {
      const { data, error } = await createCheckout({
        packageId,
        currency: currency,
      });

      if (error) throw error;

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the checkout session',
        variant: 'destructive'
      });
    }
  };

  const handleCustomPurchase = async () => {
    if (customCredits < 10) {
      toast({
        title: 'Minimum Credits',
        description: 'Minimum purchase is 10 credits',
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await createCheckout({
        credits: customCredits,
        currency: currency,
        customAmount: true
      });

      if (error) throw error;

      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the checkout session',
        variant: 'destructive'
      });
    }
  };

  const handleSubscription = async (planId: string) => {
    try {
      const { data, error } = await createSubscription(planId, currency);
      if (error) throw error;

      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the subscription',
        variant: 'destructive'
      });
    }
  };

  if (creditsLoading || currencyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section with Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 mb-8 p-8 md:p-12">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {credits.toFixed(2)} {t('walletCredits')}
                </h1>
                <p className="text-lg text-muted-foreground mb-1">{t('walletCurrentBalance')}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background/50">{currency}</Badge>
                  <span className="text-sm text-muted-foreground">• {t('walletCreditsNeverExpire')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={openCustomerPortal} variant="outline" size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('wallet.manageSubscriptions')}
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Purchase Options */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="packages" className="text-base">One-Time Purchase</TabsTrigger>
            <TabsTrigger value="subscription" className="text-base">Weekly Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-8">
            {/* Popular Packages */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Popular Packages</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {creditPackages.map((pkg) => {
                  const pricing = calculateDynamicPrice(pkg.credits, currency);
                  return (
                    <Card 
                      key={pkg.id} 
                      className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group"
                    >
                      {pricing.discountPercent > 0 && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            Save {pricing.discountPercent}%
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="text-5xl font-bold text-primary mb-2">{pkg.credits}</div>
                        <CardTitle className="text-lg text-muted-foreground">Credits</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{formatPrice(pricing.totalPrice)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(pricing.perCreditRate)} per credit
                          </p>
                        </div>
                        <Button
                          onClick={() => handlePackagePurchase(pkg.id)}
                          disabled={packageLoading === pkg.id}
                          className="w-full h-11 group-hover:scale-105 transition-transform"
                        >
                          {packageLoading === pkg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Purchase
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount */}
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-2xl">Custom Amount</CardTitle>
                <CardDescription className="text-base">
                  Choose exactly how many credits you need (minimum 10)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Credits</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={10}
                        max={1000}
                        value={customCredits}
                        onChange={(e) => setCustomCredits(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-28 text-center text-lg font-bold"
                      />
                    </div>
                  </div>
                  <Slider
                    min={10}
                    max={1000}
                    step={5}
                    value={[customCredits]}
                    onValueChange={(value) => setCustomCredits(value[0])}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>10 credits</span>
                    <span>1,000 credits</span>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 space-y-3">
                  {(() => {
                    const pricing = calculateDynamicPrice(customCredits, currency);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Amount</span>
                          <span className="text-3xl font-bold">{formatPrice(pricing.totalPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rate per credit</span>
                          <span className="font-medium">{formatPrice(pricing.perCreditRate)}</span>
                        </div>
                        {pricing.discountPercent > 0 && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            {pricing.discountPercent}% Discount Applied
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>

                <Button
                  onClick={handleCustomPurchase}
                  disabled={loading || customCredits < 10}
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Purchase {customCredits} Credits
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Discount Tiers */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-xl">Volume Discounts</CardTitle>
                <CardDescription>Save more when you buy more credits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-muted-foreground">0%</div>
                    <div className="text-sm text-muted-foreground">10-49 credits</div>
                    <div className="text-xs font-medium">{formatPrice(1.00)}/credit</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-amber-600">10%</div>
                    <div className="text-sm text-muted-foreground">50-99 credits</div>
                    <div className="text-xs font-medium">{formatPrice(0.90)}/credit</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-orange-600">20%</div>
                    <div className="text-sm text-muted-foreground">100-249 credits</div>
                    <div className="text-xs font-medium">{formatPrice(0.80)}/credit</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-red-600">30%</div>
                    <div className="text-sm text-muted-foreground">250+ credits</div>
                    <div className="text-xs font-medium">{formatPrice(0.70)}/credit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-8">
            {/* Subscription Benefits */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">Why Subscribe?</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Best Value</div>
                      <div className="text-sm text-muted-foreground">Lower cost per credit than one-time purchases</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Auto-Renewal</div>
                      <div className="text-sm text-muted-foreground">Never run out of credits</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Flexible</div>
                      <div className="text-sm text-muted-foreground">Cancel anytime, no commitment</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Weekly Plans</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {subscriptionPlans.map((plan) => {
                  const oneTimePricing = calculateDynamicPrice(plan.credits_per_week, currency);
                  const subscriptionPrice = getPrice(plan);
                  const perCreditRate = subscriptionPrice / plan.credits_per_week;
                  const savingsPercent = Math.round((1 - (perCreditRate / oneTimePricing.perCreditRate)) * 100);
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          Save {savingsPercent}%
                        </Badge>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                        <div className="text-4xl font-bold text-primary mb-2">
                          {plan.credits_per_week}
                        </div>
                        <div className="text-sm text-muted-foreground">credits per week</div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{formatPrice(subscriptionPrice)}</span>
                            <span className="text-muted-foreground">/week</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(perCreditRate)} per credit
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">One-time rate:</span>
                            <span className="line-through">{formatPrice(oneTimePricing.perCreditRate)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-green-600">
                            <span>Subscription rate:</span>
                            <span>{formatPrice(perCreditRate)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSubscription(plan.id)}
                          disabled={subscriptionLoading === plan.id}
                          className="w-full h-11 group-hover:scale-105 transition-transform"
                        >
                          {subscriptionLoading === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Subscribe Now'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl">Transaction History</CardTitle>
            <CardDescription>
              View your recent credit purchases and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your purchase history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.credits_amount > 0 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {transaction.credits_amount > 0 ? '+' : '-'}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">
                          {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount.toFixed(2)} credits
                        </div>
                        {transaction.amount_paid && (
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(transaction.amount_paid, transaction.currency as any)}
                          </div>
                        )}
                      </div>
                      {transaction.amount_paid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(transaction.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Wallet;