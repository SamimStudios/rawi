import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RTLFlex, RTLWrapper } from "@/components/ui/rtl-wrapper";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCommerceTracking } from "@/hooks/useAnalytics";
import { useUserCredits } from "@/hooks/useUserCredits";
import { usePayments } from "@/hooks/usePayments";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2, Download, ExternalLink, Check, Minus, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CreditPackage, SubscriptionPlan } from "@/hooks/usePayments";

// Dynamic pricing calculation helper
const calculateDynamicPrice = (credits: number, currency: string) => {
  let baseRate;
  
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

  let discountRate = 0;
  if (credits >= 250) {
    discountRate = 0.30;
  } else if (credits >= 100) {
    discountRate = 0.20;
  } else if (credits >= 50) {
    discountRate = 0.10;
  }

  const discountedRate = baseRate * (1 - discountRate);
  const totalPrice = credits * discountedRate;
  
  return {
    totalPrice,
    perCreditRate: discountedRate,
    discountPercent: Math.round(discountRate * 100)
  };
};

const Wallet = () => {
  const [topUpAmount, setTopUpAmount] = useState<string>("50");
  const [customCredits, setCustomCredits] = useState(50);
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success === 'true') {
      toast({
        title: t('wallet.paymentSuccessful'),
        description: t('wallet.creditsWillBeAdded'),
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (canceled === 'true') {
      toast({
        title: t('wallet.paymentCanceled'),
        description: t('wallet.noChargeWasMade'),
        variant: 'destructive'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('active', true)
          .order('credits_per_week', { ascending: true });

        // Add free plan if not in database
        const allPlans = data || [];
        const hasFree = allPlans.some(p => p.credits_per_week === 0);
        
        if (!hasFree) {
          allPlans.unshift({
            id: 'free-plan',
            name: 'Free Plan',
            credits_per_week: 0,
            price_aed: 0,
            price_sar: 0,
            price_usd: 0,
            active: true,
            created_at: new Date().toISOString(),
            stripe_price_id_aed: '',
            stripe_price_id_sar: '',
            stripe_price_id_usd: '',
            updated_at: new Date().toISOString()
          });
        }

        setSubscriptionPlans(allPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    };

    fetchPlans();
  }, []);

  const handleCustomPurchase = async () => {
    const credits = topUpAmount === "custom" ? customCredits : parseInt(topUpAmount);
    
    if (credits < 10) {
      toast({
        title: t('wallet.minimumCredits'),
        description: t('wallet.minimumPurchaseIs10'),
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await createCheckout({
        credits,
        currency: currency,
        customAmount: true
      });

      if (error) throw error;
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('common.error'),
        description: t('wallet.checkoutError'),
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
        title: t('common.error'),
        description: t('wallet.subscriptionError'),
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

  const topUpPricing = calculateDynamicPrice(
    topUpAmount === "custom" ? customCredits : parseInt(topUpAmount),
    currency
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 mb-6 md:mb-8 p-6 md:p-12">
          <div className="relative z-10">
            <RTLWrapper className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {credits.toFixed(2)} {t('walletCredits')}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-1">{t('walletCurrentBalance')}</p>
                <RTLFlex reverse className="items-center gap-2">
                  <Badge variant="outline" className="bg-background/50">{currency}</Badge>
                  <span className="text-xs md:text-sm text-muted-foreground">• {t('walletCreditsNeverExpire')}</span>
                </RTLFlex>
              </div>
              <div className="flex gap-3">
                <Button onClick={openCustomerPortal} variant="outline" size="lg" className="w-full md:w-auto">
                  <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('wallet.manageSubscriptions')}
                </Button>
              </div>
            </RTLWrapper>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Subscription Plans Section */}
        <div className="mb-8 md:mb-12">
          <RTLWrapper className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('wallet.selectPlan')}</h2>
            <p className="text-muted-foreground">{t('wallet.chooseTheBestPlan')}</p>
          </RTLWrapper>

          <Card className="border-2">
            <CardContent className="p-4 md:p-6">
              <RadioGroup defaultValue={subscriptionPlans[0]?.id} className="space-y-3">
                {subscriptionPlans.map((plan, index) => {
                  const isFree = plan.credits_per_week === 0;
                  const isRecommended = index === 2 && !isFree;
                  const price = currency === 'AED' ? plan.price_aed : currency === 'SAR' ? plan.price_sar : plan.price_usd;

                  return (
                    <Label
                      key={plan.id}
                      htmlFor={`plan-${plan.id}`}
                      className="relative cursor-pointer block"
                    >
                      <div className={`border-2 rounded-xl p-4 md:p-5 transition-all ${
                        isRecommended
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}>
                        <RTLFlex reverse className="items-start justify-between gap-4">
                          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                            <RadioGroupItem 
                              value={plan.id} 
                              id={`plan-${plan.id}`}
                              className="mt-1 flex-shrink-0"
                              disabled={isFree}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-base md:text-lg">{plan.name}</h3>
                                {isRecommended && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                                    {t('wallet.recommendedPlan')}
                                  </Badge>
                                )}
                              </div>
                              
                              {isFree ? (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {t('wallet.basicAccess')}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {plan.credits_per_week} {t('wallet.creditsPerWeek')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {isFree ? (
                              <div className="text-lg md:text-xl font-bold text-primary">
                                {t('wallet.freePlan')}
                              </div>
                            ) : (
                              <>
                                <div className="text-xl md:text-2xl font-bold">
                                  {formatPrice(price)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  /{t('wallet.week')}
                                </div>
                              </>
                            )}
                          </div>
                        </RTLFlex>
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>

              <div className="mt-6 pt-6 border-t">
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-sm text-muted-foreground">{t('wallet.whatIncluded')}</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{t('wallet.neverExpire')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{t('wallet.prioritySupport')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{t('wallet.cancelAnytime')}</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    const selectedPlan = subscriptionPlans.find(p => p.credits_per_week > 0);
                    if (selectedPlan) handleSubscription(selectedPlan.id);
                  }}
                  disabled={subscriptionLoading !== null}
                  size="lg"
                  className="w-full"
                >
                  {subscriptionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('wallet.getStarted')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* One-Time Top-Up Section */}
        <Card className="mb-8 md:mb-12 border-2">
          <CardHeader>
            <RTLFlex reverse className="items-start justify-between">
              <div>
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  {t('wallet.topUpCredits')}
                </CardTitle>
                <CardDescription className="mt-2">
                  {t('wallet.availableForAll')}
                </CardDescription>
              </div>
            </RTLFlex>
          </CardHeader>

          <CardContent className="space-y-6">
            <RadioGroup value={topUpAmount} onValueChange={setTopUpAmount}>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {/* Preset Options */}
                {[
                  { credits: 50, label: "50" },
                  { credits: 100, label: "100" },
                  { credits: 250, label: "250" }
                ].map((option) => {
                  const pricing = calculateDynamicPrice(option.credits, currency);
                  return (
                    <Label
                      key={option.credits}
                      htmlFor={option.label}
                      className="relative cursor-pointer"
                    >
                      <div className={`border-2 rounded-lg p-4 transition-all ${
                        topUpAmount === option.label
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}>
                        <RTLFlex reverse className="items-start justify-between mb-2">
                          <RadioGroupItem value={option.label} id={option.label} />
                          {pricing.discountPercent > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {t('wallet.save')} {pricing.discountPercent}%
                            </Badge>
                          )}
                        </RTLFlex>
                        <div className="font-semibold text-lg">{option.credits} {t('wallet.credits')}</div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {formatPrice(pricing.totalPrice)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatPrice(pricing.perCreditRate)} {t('wallet.perCredit')}
                        </div>
                      </div>
                    </Label>
                  );
                })}
              </div>

              {/* Custom Amount Option */}
              <div className="pt-4 border-t">
                <Label htmlFor="custom" className="cursor-pointer">
                  <div className={`border-2 rounded-lg p-6 transition-all ${
                    topUpAmount === "custom"
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}>
                    <RTLFlex reverse className="items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <span className="font-semibold text-lg">{t('wallet.customOption')}</span>
                      </div>
                    </RTLFlex>

                    {topUpAmount === "custom" && (
                      <div className="space-y-4">
                        <RTLFlex reverse className="items-center justify-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              setCustomCredits(Math.max(10, customCredits - 10));
                            }}
                            disabled={customCredits <= 10}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            min={10}
                            max={1000}
                            value={customCredits}
                            onChange={(e) => setCustomCredits(Math.max(10, parseInt(e.target.value) || 10))}
                            className="w-32 text-center text-xl font-bold"
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              setCustomCredits(Math.min(1000, customCredits + 10));
                            }}
                            disabled={customCredits >= 1000}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </RTLFlex>

                        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-2">
                          <RTLFlex reverse className="items-center justify-between">
                            <span className="text-muted-foreground">{t('wallet.totalAmount')}</span>
                            <span className="text-2xl font-bold">{formatPrice(topUpPricing.totalPrice)}</span>
                          </RTLFlex>
                          <RTLFlex reverse className="items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('wallet.ratePerCredit')}</span>
                            <span className="font-medium">{formatPrice(topUpPricing.perCreditRate)}</span>
                          </RTLFlex>
                          {topUpPricing.discountPercent > 0 && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                              {topUpPricing.discountPercent}% {t('wallet.discountApplied')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Button
              onClick={handleCustomPurchase}
              disabled={loading}
              size="lg"
              className="w-full h-12 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('wallet.purchase')} {' '}
                  {topUpAmount === "custom" ? customCredits : topUpAmount} {' '}
                  {t('wallet.credits')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">{t('wallet.transactionHistory')}</CardTitle>
            <CardDescription>{t('wallet.recentTransactions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('wallet.date')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('wallet.type')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('wallet.credits')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('wallet.amount')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('wallet.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {t('wallet.noTransactions')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap">{transaction.type}</TableCell>
                          <TableCell className={`whitespace-nowrap ${
                            transaction.credits_amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.credits_amount >= 0 ? '+' : ''}{transaction.credits_amount}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transaction.amount_paid
                              ? `${transaction.currency} ${transaction.amount_paid}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.type === 'purchase' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadInvoice(transaction.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Wallet;