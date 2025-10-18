import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { usePayments } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Coins, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  credits_per_week: number;
  price_aed: number;
  price_sar: number;
  price_usd: number;
  active: boolean;
}

export default function Usage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { credits, loading: creditsLoading, refresh: refreshCredits } = useUserCredits();
  const { subscription, isFree, expiresAt, loading: subLoading } = useUserSubscription();
  const { createCheckout } = usePayments();
  const { currency, formatPrice, getPrice, currencies } = useCurrency();
  const { toast } = useToast();
  const isRTL = language === 'ar';

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [topUpAmounts] = useState([50, 100, 250, 500]);
  const [customCredits, setCustomCredits] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    fetchSubscriptionPlans();
  }, [user, navigate]);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('credits_per_week');

      if (error) throw error;

      const plansWithFree: SubscriptionPlan[] = [
        {
          id: 'free',
          name: t('usage.freePlan') || 'Free Plan',
          credits_per_week: 0,
          price_aed: 0,
          price_sar: 0,
          price_usd: 0,
          active: true,
        },
        ...(data || []),
      ];

      setSubscriptionPlans(plansWithFree);

      if (subscription?.subscription_plan_id) {
        setSelectedPlanId(subscription.subscription_plan_id);
      } else {
        setSelectedPlanId('free');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId || selectedPlanId === 'free') return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { 
          planId: selectedPlanId,
          currency: currency
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (credits: number) => {
    setLoading(true);
    try {
      const { data, error } = await createCheckout({ 
        credits, 
        currency,
        customAmount: true 
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDynamicPrice = (credits: number) => {
    const basePrice = credits * 0.5;
    let discount = 0;
    
    if (credits >= 500) discount = 0.3;
    else if (credits >= 250) discount = 0.2;
    else if (credits >= 100) discount = 0.1;

    const finalPrice = basePrice * (1 - discount);
    return {
      price: finalPrice,
      perCredit: finalPrice / credits,
      discount: Math.round(discount * 100),
    };
  };

  const totalCredits = (credits.plan_credits || 0) + (credits.topup_credits || 0);
  const planCredits = credits.plan_credits || 0;
  const topupCredits = credits.topup_credits || 0;
  const planPercentage = totalCredits > 0 ? (planCredits / totalCredits) * 100 : 0;

  const currentPlanId = subscription?.subscription_plan_id || 'free';

  if (creditsLoading || subLoading) {
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

      {/* Usage Card */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-3xl font-bold">
                <Coins className="h-8 w-8 text-amber-500" />
                {totalCredits.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('usage.currentBalance')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/user/billing')}>
                <CreditCard className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t('usage.viewBilling')}
              </Button>
            </div>
          </div>

          {/* Plan Credits Progress */}
          {planCredits > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('usage.planCredits')}</span>
                <span className="text-muted-foreground">
                  {planCredits.toFixed(2)} {t('usage.creditsRemaining')}
                </span>
              </div>
              <Progress value={planPercentage} className="h-2" />
              {expiresAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {t('usage.expiresOn')}: {format(expiresAt, 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Top-up Credits */}
          {topupCredits > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('usage.topUpCredits')}</span>
                <span className="text-muted-foreground">{topupCredits.toFixed(2)}</span>
              </div>
              <Progress value={100} className="h-2 bg-secondary" />
              <p className="text-xs text-muted-foreground">{t('usage.neverExpires')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('usage.subscriptionPlans')}</h2>
        <Card className="p-6">
          <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <div className="space-y-3">
              {subscriptionPlans.map((plan, index) => {
                const isCurrent = plan.id === currentPlanId;
                const isRecommended = index === 1; // Second plan (after free)
                const price = plan.id === 'free' ? 0 : getPrice({
                  price_aed: plan.price_aed,
                  price_sar: plan.price_sar,
                  price_usd: plan.price_usd,
                });

                return (
                  <div key={plan.id}>
                    <Label
                      htmlFor={plan.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all",
                        selectedPlanId === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                        isCurrent && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{plan.name}</span>
                            {isCurrent && (
                              <Badge variant="default" className="text-xs">
                                {t('usage.currentPlan')}
                              </Badge>
                            )}
                            {isRecommended && !isCurrent && (
                              <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                {t('usage.recommended')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.credits_per_week} {t('usage.creditsUsed')} {t('usage.perWeek')}
                          </p>
                        </div>
                      </div>
                      <div className={cn("text-right", isRTL && "text-left")}>
                        <div className="font-bold text-lg">
                          {plan.id === 'free' ? 'FREE' : formatPrice(price, currency)}
                        </div>
                        {plan.id !== 'free' && (
                          <p className="text-xs text-muted-foreground">{t('usage.perWeek')}</p>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
          
          <div className="mt-6">
            <Button
              onClick={handleSubscribe}
              disabled={loading || selectedPlanId === 'free' || selectedPlanId === currentPlanId}
              className="w-full"
            >
              {selectedPlanId === currentPlanId
                ? t('usage.currentPlan')
                : selectedPlanId === 'free'
                ? t('usage.selectPlan')
                : t('usage.upgradePlan')}
            </Button>
          </div>
        </Card>
      </div>

      {/* One-Time Top-Up */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t('usage.oneTimeTopUp')}</h2>
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {topUpAmounts.map((amount) => {
              const pricing = calculateDynamicPrice(amount);
              const price = pricing.price * (currency === 'SAR' ? 3.75 : currency === 'AED' ? 3.67 : 1);
              
              return (
                <Button
                  key={amount}
                  variant="outline"
                  className="w-full min-w-0 whitespace-normal h-auto flex-col items-stretch text-left p-3 md:p-4 gap-0.5 md:gap-1 min-h-[100px]"
                  onClick={() => handleTopUp(amount)}
                  disabled={loading}
                >
                  <span className="text-base md:text-lg font-bold">{amount}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">credits</span>
                  <span className="text-xs md:text-sm font-semibold mt-1 md:mt-2 break-words w-full">
                    {formatPrice(price, currency)}
                  </span>
                  {pricing.discount > 0 && (
                    <Badge variant="secondary" className="text-[10px] md:text-xs mt-0.5 md:mt-1">
                      {pricing.discount}% off
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom amount"
              value={customCredits}
              onChange={(e) => setCustomCredits(e.target.value)}
              min="1"
            />
            <Button
              onClick={() => handleTopUp(parseInt(customCredits))}
              disabled={loading || !customCredits || parseInt(customCredits) < 1}
            >
              {t('usage.topUpNow')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
