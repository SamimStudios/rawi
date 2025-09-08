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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Wallet</h1>
            <p className="text-muted-foreground">Manage your credits and subscriptions</p>
          </div>

          {/* Balance Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Balance</span>
                <Badge variant="outline">{currency}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {credits.toLocaleString()} Credits
              </div>
              <p className="text-muted-foreground">
                Credits never expire
              </p>
            </CardContent>
          </Card>

          {/* Purchase Options */}
          <Tabs defaultValue="packages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">🔹 One-Time Credit Packs</TabsTrigger>
              <TabsTrigger value="subscription">🔹 Subscriptions (Weekly)</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-4">
              {/* Discount Rules Display */}
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">Discount Rules:</h4>
                  <div className="text-sm space-y-1">
                    <p>• 0–49 cr → 0% off ({formatPrice(1.00)}/cr)</p>
                    <p>• 50–99 cr → 10% off ({formatPrice(0.90)}/cr)</p>
                    <p>• 100–249 cr → 20% off ({formatPrice(0.80)}/cr)</p>
                    <p>• 250+ cr → 30% off ({formatPrice(0.70)}/cr)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Predefined Packages */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {creditPackages.map((pkg) => {
                  const pricing = calculateDynamicPrice(pkg.credits, currency);
                  return (
                    <Card key={pkg.id} className="relative hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pkg.credits} Credits</CardTitle>
                        {pricing.discountPercent > 0 && (
                          <Badge variant="secondary" className="w-fit">
                            {pricing.discountPercent}% off
                          </Badge>
                        )}
                        <CardDescription>
                          {formatPrice(pricing.totalPrice)} • {formatPrice(pricing.perCreditRate)}/cr
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          onClick={() => handlePackagePurchase(pkg.id)}
                          disabled={packageLoading === pkg.id}
                          className="w-full"
                        >
                          {packageLoading === pkg.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Buy Now
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Custom Amount Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Amount</CardTitle>
                  <CardDescription>
                    Choose exactly how many credits you need (minimum 10)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Slider
                      id="credits"
                      min={10}
                      max={1000}
                      step={5}
                      value={[customCredits]}
                      onValueChange={(value) => setCustomCredits(value[0])}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>10 credits</span>
                      <span>1000 credits</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-input">Or enter exact amount</Label>
                    <Input
                      id="custom-input"
                      type="number"
                      min={10}
                      max={1000}
                      value={customCredits}
                      onChange={(e) => setCustomCredits(Math.max(10, parseInt(e.target.value) || 10))}
                      placeholder="Enter credits"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    {(() => {
                      const pricing = calculateDynamicPrice(customCredits, currency);
                      return (
                        <div>
                          <p className="text-sm font-medium">Order Summary</p>
                          <p className="text-lg font-bold">
                            {customCredits} credits = {formatPrice(pricing.totalPrice)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rate: {formatPrice(pricing.perCreditRate)}/cr
                            {pricing.discountPercent > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {pricing.discountPercent}% off
                              </Badge>
                            )}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <Button
                    onClick={handleCustomPurchase}
                    disabled={loading || customCredits < 10}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Purchase {customCredits} Credits
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              {/* Subscription Benefits Display */}
              <Card className="bg-gradient-to-r from-secondary/10 to-primary/10">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">📈 Always ~10% cheaper than one-time packs!</h4>
                  <div className="text-sm space-y-1">
                    <p>• Weekly auto-renewal with higher discounts (up to 40%)</p>
                    <p>• Same 20cr entry point for accessibility</p>
                    <p>• Cancel anytime through customer portal</p>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={openCustomerPortal}
                  className="mb-4"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Subscriptions
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {subscriptionPlans.map((plan) => {
                  // Calculate equivalent one-time rate for comparison
                  const oneTimePricing = calculateDynamicPrice(plan.credits_per_week, currency);
                  const subscriptionPrice = getPrice(plan);
                  const perCreditRate = subscriptionPrice / plan.credits_per_week;
                  const savingsPercent = Math.round((1 - (perCreditRate / oneTimePricing.perCreditRate)) * 100);
                  
                  return (
                    <Card key={plan.id} className="relative hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant="secondary" className="w-fit mb-2">
                          {savingsPercent}% cheaper than one-time
                        </Badge>
                        <CardDescription>
                          {formatPrice(subscriptionPrice)}/week • {plan.credits_per_week} credits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Per credit: {formatPrice(perCreditRate)} (vs {formatPrice(oneTimePricing.perCreditRate)} one-time)
                        </div>
                        <Button
                          onClick={() => handleSubscription(plan.id)}
                          disabled={subscriptionLoading === plan.id}
                          className="w-full"
                        >
                          {subscriptionLoading === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Subscribe Now'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your recent credit purchases and subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="capitalize">
                          {transaction.type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.credits_amount > 0 ? "default" : "secondary"}>
                            {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.amount_paid ? (
                            formatPrice(transaction.amount_paid, transaction.currency as any)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {transaction.amount_paid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoice(transaction.id)}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Invoice
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Wallet;