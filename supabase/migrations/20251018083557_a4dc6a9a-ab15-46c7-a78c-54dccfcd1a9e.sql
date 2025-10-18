-- Create user subscriptions tracking table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" 
ON public.user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- System can manage subscriptions
CREATE POLICY "System can manage subscriptions" 
ON public.user_subscriptions FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER trigger_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- Add credit type tracking to user_credits
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS plan_credits NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS topup_credits NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_credits_expire_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing credits to topup_credits
UPDATE public.user_credits 
SET topup_credits = credits 
WHERE topup_credits = 0 AND credits > 0;

-- Add translation keys for Usage page
INSERT INTO public.translations (key, category, description) VALUES
('usage.title', 'usage', 'Usage page title'),
('usage.currentBalance', 'usage', 'Current balance label'),
('usage.planCredits', 'usage', 'Plan credits label'),
('usage.topUpCredits', 'usage', 'Top-up credits label'),
('usage.creditsUsed', 'usage', 'Credits used label'),
('usage.creditsRemaining', 'usage', 'Credits remaining label'),
('usage.expiresOn', 'usage', 'Expires on date'),
('usage.neverExpires', 'usage', 'Never expires label'),
('usage.renewsOn', 'usage', 'Renews on date'),
('usage.viewBilling', 'usage', 'View billing button'),
('usage.currentPlan', 'usage', 'Current plan badge'),
('usage.freePlan', 'usage', 'Free plan name'),
('usage.upgradePlan', 'usage', 'Upgrade plan button'),
('usage.topUpNow', 'usage', 'Top up now button'),
('usage.subscriptionPlans', 'usage', 'Subscription plans section title'),
('usage.oneTimeTopUp', 'usage', 'One-time top-up section title'),
('usage.perWeek', 'usage', 'Per week label'),
('usage.recommended', 'usage', 'Recommended badge'),
('usage.selectPlan', 'usage', 'Select plan button')
ON CONFLICT (key) DO NOTHING;

-- Add translation keys for Billing page
INSERT INTO public.translations (key, category, description) VALUES
('billing.title', 'billing', 'Billing page title'),
('billing.paymentMethod', 'billing', 'Payment method section'),
('billing.addPaymentMethod', 'billing', 'Add payment method button'),
('billing.updatePaymentMethod', 'billing', 'Update payment method button'),
('billing.manageInStripe', 'billing', 'Manage in Stripe portal button'),
('billing.currentPlan', 'billing', 'Current plan section'),
('billing.billingCycle', 'billing', 'Billing cycle label'),
('billing.nextBilling', 'billing', 'Next billing date'),
('billing.status', 'billing', 'Status label'),
('billing.active', 'billing', 'Active status'),
('billing.canceled', 'billing', 'Canceled status'),
('billing.cancelSubscription', 'billing', 'Cancel subscription button'),
('billing.reactivateSubscription', 'billing', 'Reactivate subscription button'),
('billing.transactionHistory', 'billing', 'Transaction history section'),
('billing.date', 'billing', 'Date column'),
('billing.type', 'billing', 'Type column'),
('billing.amount', 'billing', 'Amount column'),
('billing.credits', 'billing', 'Credits column'),
('billing.invoice', 'billing', 'Invoice column'),
('billing.downloadInvoice', 'billing', 'Download invoice button'),
('billing.noTransactions', 'billing', 'No transactions message'),
('billing.weekly', 'billing', 'Weekly billing cycle'),
('billing.monthly', 'billing', 'Monthly billing cycle'),
('billing.yearly', 'billing', 'Yearly billing cycle'),
('billing.noPaymentMethod', 'billing', 'No payment method message'),
('billing.currentSubscription', 'billing', 'Current subscription section')
ON CONFLICT (key) DO NOTHING;

-- Add Arabic translations for Usage
INSERT INTO public.translation_values (translation_id, language, value)
SELECT t.id, 'ar', 
  CASE t.key
    WHEN 'usage.title' THEN 'الاستخدام'
    WHEN 'usage.currentBalance' THEN 'الرصيد الحالي'
    WHEN 'usage.planCredits' THEN 'رصيد الخطة'
    WHEN 'usage.topUpCredits' THEN 'رصيد الشحن'
    WHEN 'usage.creditsUsed' THEN 'الرصيد المستخدم'
    WHEN 'usage.creditsRemaining' THEN 'الرصيد المتبقي'
    WHEN 'usage.expiresOn' THEN 'ينتهي في'
    WHEN 'usage.neverExpires' THEN 'لا ينتهي أبداً'
    WHEN 'usage.renewsOn' THEN 'يتجدد في'
    WHEN 'usage.viewBilling' THEN 'عرض الفواتير'
    WHEN 'usage.currentPlan' THEN 'الخطة الحالية'
    WHEN 'usage.freePlan' THEN 'خطة مجانية'
    WHEN 'usage.upgradePlan' THEN 'ترقية الخطة'
    WHEN 'usage.topUpNow' THEN 'شحن الآن'
    WHEN 'usage.subscriptionPlans' THEN 'خطط الاشتراك'
    WHEN 'usage.oneTimeTopUp' THEN 'الشحن لمرة واحدة'
    WHEN 'usage.perWeek' THEN 'أسبوعياً'
    WHEN 'usage.recommended' THEN 'موصى به'
    WHEN 'usage.selectPlan' THEN 'اختر الخطة'
  END
FROM public.translations t
WHERE t.key LIKE 'usage.%' AND t.category = 'usage'
ON CONFLICT DO NOTHING;

-- Add English translations for Usage
INSERT INTO public.translation_values (translation_id, language, value)
SELECT t.id, 'en', 
  CASE t.key
    WHEN 'usage.title' THEN 'Usage'
    WHEN 'usage.currentBalance' THEN 'Current Balance'
    WHEN 'usage.planCredits' THEN 'Plan Credits'
    WHEN 'usage.topUpCredits' THEN 'Top-Up Credits'
    WHEN 'usage.creditsUsed' THEN 'Credits Used'
    WHEN 'usage.creditsRemaining' THEN 'Credits Remaining'
    WHEN 'usage.expiresOn' THEN 'Expires on'
    WHEN 'usage.neverExpires' THEN 'Never expires'
    WHEN 'usage.renewsOn' THEN 'Renews on'
    WHEN 'usage.viewBilling' THEN 'View Billing'
    WHEN 'usage.currentPlan' THEN 'Current Plan'
    WHEN 'usage.freePlan' THEN 'Free Plan'
    WHEN 'usage.upgradePlan' THEN 'Upgrade Plan'
    WHEN 'usage.topUpNow' THEN 'Top Up Now'
    WHEN 'usage.subscriptionPlans' THEN 'Subscription Plans'
    WHEN 'usage.oneTimeTopUp' THEN 'One-Time Top-Up'
    WHEN 'usage.perWeek' THEN 'per week'
    WHEN 'usage.recommended' THEN 'Recommended'
    WHEN 'usage.selectPlan' THEN 'Select Plan'
  END
FROM public.translations t
WHERE t.key LIKE 'usage.%' AND t.category = 'usage'
ON CONFLICT DO NOTHING;

-- Add Arabic translations for Billing
INSERT INTO public.translation_values (translation_id, language, value)
SELECT t.id, 'ar', 
  CASE t.key
    WHEN 'billing.title' THEN 'الفواتير'
    WHEN 'billing.paymentMethod' THEN 'طريقة الدفع'
    WHEN 'billing.addPaymentMethod' THEN 'إضافة طريقة دفع'
    WHEN 'billing.updatePaymentMethod' THEN 'تحديث طريقة الدفع'
    WHEN 'billing.manageInStripe' THEN 'الإدارة في Stripe'
    WHEN 'billing.currentPlan' THEN 'الخطة الحالية'
    WHEN 'billing.billingCycle' THEN 'دورة الفوترة'
    WHEN 'billing.nextBilling' THEN 'الفوترة التالية'
    WHEN 'billing.status' THEN 'الحالة'
    WHEN 'billing.active' THEN 'نشط'
    WHEN 'billing.canceled' THEN 'ملغى'
    WHEN 'billing.cancelSubscription' THEN 'إلغاء الاشتراك'
    WHEN 'billing.reactivateSubscription' THEN 'إعادة تفعيل الاشتراك'
    WHEN 'billing.transactionHistory' THEN 'سجل المعاملات'
    WHEN 'billing.date' THEN 'التاريخ'
    WHEN 'billing.type' THEN 'النوع'
    WHEN 'billing.amount' THEN 'المبلغ'
    WHEN 'billing.credits' THEN 'الرصيد'
    WHEN 'billing.invoice' THEN 'الفاتورة'
    WHEN 'billing.downloadInvoice' THEN 'تحميل الفاتورة'
    WHEN 'billing.noTransactions' THEN 'لا توجد معاملات'
    WHEN 'billing.weekly' THEN 'أسبوعي'
    WHEN 'billing.monthly' THEN 'شهري'
    WHEN 'billing.yearly' THEN 'سنوي'
    WHEN 'billing.noPaymentMethod' THEN 'لم يتم إضافة طريقة دفع'
    WHEN 'billing.currentSubscription' THEN 'الاشتراك الحالي'
  END
FROM public.translations t
WHERE t.key LIKE 'billing.%' AND t.category = 'billing'
ON CONFLICT DO NOTHING;

-- Add English translations for Billing
INSERT INTO public.translation_values (translation_id, language, value)
SELECT t.id, 'en', 
  CASE t.key
    WHEN 'billing.title' THEN 'Billing'
    WHEN 'billing.paymentMethod' THEN 'Payment Method'
    WHEN 'billing.addPaymentMethod' THEN 'Add Payment Method'
    WHEN 'billing.updatePaymentMethod' THEN 'Update Payment Method'
    WHEN 'billing.manageInStripe' THEN 'Manage in Stripe'
    WHEN 'billing.currentPlan' THEN 'Current Plan'
    WHEN 'billing.billingCycle' THEN 'Billing Cycle'
    WHEN 'billing.nextBilling' THEN 'Next Billing Date'
    WHEN 'billing.status' THEN 'Status'
    WHEN 'billing.active' THEN 'Active'
    WHEN 'billing.canceled' THEN 'Canceled'
    WHEN 'billing.cancelSubscription' THEN 'Cancel Subscription'
    WHEN 'billing.reactivateSubscription' THEN 'Reactivate Subscription'
    WHEN 'billing.transactionHistory' THEN 'Transaction History'
    WHEN 'billing.date' THEN 'Date'
    WHEN 'billing.type' THEN 'Type'
    WHEN 'billing.amount' THEN 'Amount'
    WHEN 'billing.credits' THEN 'Credits'
    WHEN 'billing.invoice' THEN 'Invoice'
    WHEN 'billing.downloadInvoice' THEN 'Download Invoice'
    WHEN 'billing.noTransactions' THEN 'No transactions yet'
    WHEN 'billing.weekly' THEN 'Weekly'
    WHEN 'billing.monthly' THEN 'Monthly'
    WHEN 'billing.yearly' THEN 'Yearly'
    WHEN 'billing.noPaymentMethod' THEN 'No payment method added'
    WHEN 'billing.currentSubscription' THEN 'Current Subscription'
  END
FROM public.translations t
WHERE t.key LIKE 'billing.%' AND t.category = 'billing'
ON CONFLICT DO NOTHING;