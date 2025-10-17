-- Add Wallet page translation keys
INSERT INTO translations (key, category) VALUES ('wallet.paymentSuccessful', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Payment Successful!' FROM translations WHERE key = 'wallet.paymentSuccessful' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'تم الدفع بنجاح!' FROM translations WHERE key = 'wallet.paymentSuccessful' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.creditsWillBeAdded', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Credits will be added to your account within minutes.' FROM translations WHERE key = 'wallet.creditsWillBeAdded' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'سيتم إضافة الأرصدة إلى حسابك خلال دقائق.' FROM translations WHERE key = 'wallet.creditsWillBeAdded' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.paymentCanceled', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Payment Canceled' FROM translations WHERE key = 'wallet.paymentCanceled' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'تم إلغاء الدفع' FROM translations WHERE key = 'wallet.paymentCanceled' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.noChargeWasMade', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'No charge was made to your account.' FROM translations WHERE key = 'wallet.noChargeWasMade' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'لم يتم تحصيل أي مبلغ من حسابك.' FROM translations WHERE key = 'wallet.noChargeWasMade' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.checkoutError', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'An error occurred while creating the checkout session' FROM translations WHERE key = 'wallet.checkoutError' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'حدث خطأ أثناء إنشاء جلسة الدفع' FROM translations WHERE key = 'wallet.checkoutError' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.minimumCredits', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Minimum Credits' FROM translations WHERE key = 'wallet.minimumCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'الحد الأدنى للأرصدة' FROM translations WHERE key = 'wallet.minimumCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.minimumPurchaseIs10', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Minimum purchase is 10 credits' FROM translations WHERE key = 'wallet.minimumPurchaseIs10' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'الحد الأدنى للشراء هو 10 أرصدة' FROM translations WHERE key = 'wallet.minimumPurchaseIs10' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.subscriptionError', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'An error occurred while creating the subscription' FROM translations WHERE key = 'wallet.subscriptionError' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'حدث خطأ أثناء إنشاء الاشتراك' FROM translations WHERE key = 'wallet.subscriptionError' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.oneTimePurchase', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'One-Time Purchase' FROM translations WHERE key = 'wallet.oneTimePurchase' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'شراء لمرة واحدة' FROM translations WHERE key = 'wallet.oneTimePurchase' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.weeklyPlans', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Weekly Plans' FROM translations WHERE key = 'wallet.weeklyPlans' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'خطط أسبوعية' FROM translations WHERE key = 'wallet.weeklyPlans' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.popularPackages', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Popular Packages' FROM translations WHERE key = 'wallet.popularPackages' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'الباقات الشائعة' FROM translations WHERE key = 'wallet.popularPackages' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.save', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Save' FROM translations WHERE key = 'wallet.save' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'وفر' FROM translations WHERE key = 'wallet.save' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.credits', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Credits' FROM translations WHERE key = 'wallet.credits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'أرصدة' FROM translations WHERE key = 'wallet.credits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.perCredit', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'per credit' FROM translations WHERE key = 'wallet.perCredit' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'لكل رصيد' FROM translations WHERE key = 'wallet.perCredit' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.purchase', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Purchase' FROM translations WHERE key = 'wallet.purchase' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'شراء' FROM translations WHERE key = 'wallet.purchase' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.customAmount', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Custom Amount' FROM translations WHERE key = 'wallet.customAmount' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'مبلغ مخصص' FROM translations WHERE key = 'wallet.customAmount' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.chooseExactly', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Choose exactly how many credits you need (minimum 10)' FROM translations WHERE key = 'wallet.chooseExactly' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'اختر بالضبط عدد الأرصدة التي تحتاجها (الحد الأدنى 10)' FROM translations WHERE key = 'wallet.chooseExactly' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.minCredits', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '10 credits' FROM translations WHERE key = 'wallet.minCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '10 أرصدة' FROM translations WHERE key = 'wallet.minCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.maxCredits', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '1,000 credits' FROM translations WHERE key = 'wallet.maxCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '1,000 رصيد' FROM translations WHERE key = 'wallet.maxCredits' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.totalAmount', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Total Amount' FROM translations WHERE key = 'wallet.totalAmount' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'المبلغ الإجمالي' FROM translations WHERE key = 'wallet.totalAmount' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.ratePerCredit', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Rate per credit' FROM translations WHERE key = 'wallet.ratePerCredit' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'السعر لكل رصيد' FROM translations WHERE key = 'wallet.ratePerCredit' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.discountApplied', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Discount Applied' FROM translations WHERE key = 'wallet.discountApplied' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'تم تطبيق خصم' FROM translations WHERE key = 'wallet.discountApplied' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.volumeDiscounts', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Volume Discounts' FROM translations WHERE key = 'wallet.volumeDiscounts' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'خصومات الكمية' FROM translations WHERE key = 'wallet.volumeDiscounts' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.saveMoreBuyMore', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Save more when you buy more credits' FROM translations WHERE key = 'wallet.saveMoreBuyMore' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'وفر أكثر عند شراء المزيد من الأرصدة' FROM translations WHERE key = 'wallet.saveMoreBuyMore' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.tier1', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '10-49 credits' FROM translations WHERE key = 'wallet.tier1' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '10-49 رصيد' FROM translations WHERE key = 'wallet.tier1' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.tier2', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '50-99 credits' FROM translations WHERE key = 'wallet.tier2' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '50-99 رصيد' FROM translations WHERE key = 'wallet.tier2' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.tier3', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '100-249 credits' FROM translations WHERE key = 'wallet.tier3' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '100-249 رصيد' FROM translations WHERE key = 'wallet.tier3' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.tier4', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '250+ credits' FROM translations WHERE key = 'wallet.tier4' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '250+ رصيد' FROM translations WHERE key = 'wallet.tier4' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.perCreditShort', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '/credit' FROM translations WHERE key = 'wallet.perCreditShort' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '/رصيد' FROM translations WHERE key = 'wallet.perCreditShort' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.whySubscribe', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Why Subscribe?' FROM translations WHERE key = 'wallet.whySubscribe' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'لماذا الاشتراك؟' FROM translations WHERE key = 'wallet.whySubscribe' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.bestValue', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Best Value' FROM translations WHERE key = 'wallet.bestValue' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'أفضل قيمة' FROM translations WHERE key = 'wallet.bestValue' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.lowerCost', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Lower cost per credit than one-time purchases' FROM translations WHERE key = 'wallet.lowerCost' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'تكلفة أقل لكل رصيد من الشراء لمرة واحدة' FROM translations WHERE key = 'wallet.lowerCost' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.autoRenewal', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Auto-Renewal' FROM translations WHERE key = 'wallet.autoRenewal' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'تجديد تلقائي' FROM translations WHERE key = 'wallet.autoRenewal' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.neverRunOut', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Never run out of credits' FROM translations WHERE key = 'wallet.neverRunOut' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'لن تنفد الأرصدة أبدًا' FROM translations WHERE key = 'wallet.neverRunOut' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.flexible', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Flexible' FROM translations WHERE key = 'wallet.flexible' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'مرن' FROM translations WHERE key = 'wallet.flexible' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.cancelAnytime', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Cancel anytime, no commitment' FROM translations WHERE key = 'wallet.cancelAnytime' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'إلغاء في أي وقت، بدون التزام' FROM translations WHERE key = 'wallet.cancelAnytime' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.creditsPerWeek', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'credits per week' FROM translations WHERE key = 'wallet.creditsPerWeek' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'أرصدة أسبوعيًا' FROM translations WHERE key = 'wallet.creditsPerWeek' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.perWeek', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', '/week' FROM translations WHERE key = 'wallet.perWeek' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', '/أسبوع' FROM translations WHERE key = 'wallet.perWeek' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.oneTimeRate', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'One-time rate' FROM translations WHERE key = 'wallet.oneTimeRate' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'سعر الشراء لمرة واحدة' FROM translations WHERE key = 'wallet.oneTimeRate' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.subscriptionRate', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Subscription rate' FROM translations WHERE key = 'wallet.subscriptionRate' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'سعر الاشتراك' FROM translations WHERE key = 'wallet.subscriptionRate' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.subscribeNow', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Subscribe Now' FROM translations WHERE key = 'wallet.subscribeNow' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'اشترك الآن' FROM translations WHERE key = 'wallet.subscribeNow' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.transactionHistory', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Transaction History' FROM translations WHERE key = 'wallet.transactionHistory' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'سجل المعاملات' FROM translations WHERE key = 'wallet.transactionHistory' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.viewRecentPurchases', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'View your recent credit purchases and usage' FROM translations WHERE key = 'wallet.viewRecentPurchases' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'عرض مشترياتك واستخدامك الحديث للأرصدة' FROM translations WHERE key = 'wallet.viewRecentPurchases' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.noTransactions', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'No transactions yet' FROM translations WHERE key = 'wallet.noTransactions' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'لا توجد معاملات بعد' FROM translations WHERE key = 'wallet.noTransactions' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO translations (key, category) VALUES ('wallet.purchaseHistoryAppear', 'wallet') ON CONFLICT (key) DO NOTHING;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'en', 'Your purchase history will appear here' FROM translations WHERE key = 'wallet.purchaseHistoryAppear' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translation_values (translation_id, language, value) 
  SELECT id, 'ar', 'سيظهر سجل مشترياتك هنا' FROM translations WHERE key = 'wallet.purchaseHistoryAppear' 
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;