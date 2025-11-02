import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useUserCredits } from '@/hooks/useUserCredits';
import { usePayments } from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  credits_per_week: number;
  price_aed: number;
  price_sar: number;
  price_usd: number;
  active: boolean;
}

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'subscribe' | 'topup';
}

export default function CreditsModal({ open, onOpenChange, defaultTab = 'subscribe' }: CreditsModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currency, formatPrice, getPrice } = useCurrency();
  const { subscription } = useUserSubscription();
  const { credits: userCredits, loading: creditsLoading } = useUserCredits();
  const { createCheckout, createSubscription, openCustomerPortal } = usePayments();
  const { toast } = useToast();

  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab, open]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [topUpAmounts] = useState([50, 100, 250, 500]);
  const [customCredits, setCustomCredits] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchSubscriptionPlans();
  }, [open]);

  useEffect(() => {
    if (subscription?.subscription_plan_id) {
      setSelectedPlanId(subscription.subscription_plan_id);
    } else {
      setSelectedPlanId('free');
    }
  }, [subscription]);

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
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubscribe = async (planId?: string) => {
    const targetPlanId = planId || selectedPlanId;
    if (!targetPlanId || targetPlanId === 'free') return;
    setLoading(true);
    try {
      const { data, error } = await createSubscription(targetPlanId, currency);
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create subscription', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (credits: number) => {
    setLoading(true);
    try {
      const { data, error } = await createCheckout({ credits, currency, customAmount: true });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create checkout session', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const planCreditsMax = subscription?.plan?.credits_per_week || 0;
  const planCreditsRemaining = userCredits?.plan_credits || 0;
  const progressPercentage = planCreditsMax > 0 ? (planCreditsRemaining / planCreditsMax) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('usage.title') || 'Credits & Plans'}</DialogTitle>
        </DialogHeader>

        {/* Credits Overview */}
        {creditsLoading ? (
          <Card className="p-6 mb-6 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ) : (
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-background">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              {t('usage.availableCredits') || 'Available Credits'}
            </h3>
            
            <div className="space-y-5">
              {/* Plan Credits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('usage.planCredits') || 'Plan Credits'} ({t('usage.thisWeek') || 'this week'})</span>
                  <span className="text-sm font-bold">
                    {planCreditsRemaining.toFixed(1)} / {planCreditsMax} {t('usage.creditsUsed') || 'credits'}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              {/* Extra Credits */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t('usage.extraCredits') || 'Extra Credits'}</span>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {(userCredits?.topup_credits || 0).toFixed(1)}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              {t('usage.consumptionOrder') || 'Credits are consumed from your weekly plan first, then from extra credits'}
            </p>
          </Card>
        )}

        <Tabs value={tab} onValueChange={(value) => setTab(value as 'subscribe' | 'topup')} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="subscribe" className="text-base">{t('usage.subscriptionPlans')}</TabsTrigger>
            <TabsTrigger value="topup" className="text-base">{t('usage.oneTimeTopUp')}</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribe" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {subscriptionPlans.map((plan, index) => {
                const isCurrent = plan.id === (subscription?.subscription_plan_id || 'free');
                const isRecommended = index === 1;
                const price = plan.id === 'free' ? 0 : getPrice({
                  price_aed: plan.price_aed,
                  price_sar: plan.price_sar,
                  price_usd: plan.price_usd,
                });

                return (
                  <Card 
                    key={plan.id} 
                    className={cn(
                      "p-6 flex flex-col transition-all hover:shadow-lg relative",
                      isCurrent && "border-primary bg-primary/5",
                      isRecommended && !isCurrent && "border-amber-500/50"
                    )}
                  >
                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          {t('usage.currentPlan')}
                        </Badge>
                      )}
                      {isRecommended && !isCurrent && (
                        <Badge className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                          {t('usage.recommended')}
                        </Badge>
                      )}
                    </div>

                    {/* Plan Details */}
                    <div className="flex-1 mb-4">
                      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          {plan.id === 'free' ? 'FREE' : formatPrice(price, currency)}
                        </div>
                        {plan.id !== 'free' && (
                          <p className="text-sm text-muted-foreground">{t('usage.perWeek')}</p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{plan.credits_per_week}</span> {t('usage.creditsUsed')} {t('usage.perWeek')}
                      </p>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => {
                        if (plan.id !== 'free' && plan.id !== (subscription?.subscription_plan_id || 'free')) {
                          setSelectedPlanId(plan.id);
                          handleSubscribe();
                        }
                      }}
                      disabled={loading || isCurrent || plan.id === 'free'}
                      className="w-full"
                      variant={isCurrent ? "outline" : "default"}
                    >
                      {isCurrent 
                        ? t('usage.currentPlan')
                        : plan.id === 'free'
                        ? t('usage.freePlan')
                        : t('usage.selectPlan')}
                    </Button>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={() => {
                onOpenChange(false);
                navigate('/user/usage');
              }}>
                {t('usage.manage') || 'Manage'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="topup" className="mt-0">
            <div className="space-y-6">
              {/* Predefined Amounts */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Quick Top-Up
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {topUpAmounts.map((amount) => (
                    <Card
                      key={amount}
                      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                      onClick={() => handleTopUp(amount)}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          {amount}
                        </div>
                        <div className="text-sm text-muted-foreground">credits</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Custom Amount
                </h3>
                <Card className="p-6">
                  <div className="flex gap-3">
                    <Input 
                      type="number" 
                      placeholder={t('usage.custom') || 'Enter custom amount'} 
                      value={customCredits} 
                      onChange={(e) => setCustomCredits(e.target.value)} 
                      min="1"
                      className="text-lg"
                    />
                    <Button 
                      onClick={() => handleTopUp(parseInt(customCredits))} 
                      disabled={loading || !customCredits || parseInt(customCredits) < 1}
                      className="px-8"
                      size="lg"
                    >
                      {t('usage.topUpNow')}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
