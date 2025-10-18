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
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { usePayments } from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const handleSubscribe = async () => {
    if (!selectedPlanId || selectedPlanId === 'free') return;
    setLoading(true);
    try {
      const { data, error } = await createSubscription(selectedPlanId, currency);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('usage.title') || 'Credits & Plans'}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as 'subscribe' | 'topup')} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="subscribe">{t('usage.subscriptionPlans')}</TabsTrigger>
            <TabsTrigger value="topup">{t('usage.oneTimeTopUp')}</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribe" className="mt-4">
            <Card className="p-4">
              <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <div className="space-y-3">
                  {subscriptionPlans.map((plan, index) => {
                    const isCurrent = plan.id === (subscription?.subscription_plan_id || 'free');
                    const isRecommended = index === 1;
                    const price = plan.id === 'free' ? 0 : getPrice({
                      price_aed: plan.price_aed,
                      price_sar: plan.price_sar,
                      price_usd: plan.price_usd,
                    });

                    return (
                      <div key={plan.id}>
                        <Label
                          htmlFor={plan.id}
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <RadioGroupItem value={plan.id} id={plan.id} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{plan.name}</span>
                                {isCurrent && (
                                  <Badge variant="default" className="text-xs">{t('usage.currentPlan')}</Badge>
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
                          <div className="text-right">
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
              <div className="mt-4">
                <Button onClick={handleSubscribe} disabled={loading || selectedPlanId === 'free' || selectedPlanId === (subscription?.subscription_plan_id || 'free')} className="w-full">
                  {selectedPlanId === (subscription?.subscription_plan_id || 'free')
                    ? t('usage.currentPlan')
                    : selectedPlanId === 'free'
                    ? t('usage.selectPlan')
                    : t('usage.upgradePlan')}
                </Button>
              </div>
              <div className="mt-2 flex justify-center">
                <Button variant="ghost" onClick={() => {
                  onOpenChange(false);
                  navigate('/user/usage');
                }}>
                  {t('usage.viewUsage') || 'View Usage'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="topup" className="mt-4">
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {topUpAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="w-full min-w-0 whitespace-normal h-auto flex-col items-stretch text-left p-3 md:p-4 gap-0.5 md:gap-1 min-h-[100px]"
                    onClick={() => handleTopUp(amount)}
                    disabled={loading}
                  >
                    <span className="text-base md:text-lg font-bold">{amount}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">credits</span>
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input type="number" placeholder={t('usage.custom') || 'Custom amount'} value={customCredits} onChange={(e) => setCustomCredits(e.target.value)} min="1" />
                <Button onClick={() => handleTopUp(parseInt(customCredits))} disabled={loading || !customCredits || parseInt(customCredits) < 1}>
                  {t('usage.topUpNow')}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
