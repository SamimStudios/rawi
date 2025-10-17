-- Migration: Populate translations from LanguageContext
-- This migration inserts all ~700+ translation keys with English and Arabic values

-- Helper function to insert translation with both language values
CREATE OR REPLACE FUNCTION insert_translation(
  p_key TEXT,
  p_category TEXT,
  p_en TEXT,
  p_ar TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_translation_id UUID;
BEGIN
  -- Insert or get translation key
  INSERT INTO public.translations (key, category, description)
  VALUES (p_key, p_category, p_description)
  ON CONFLICT (key) DO NOTHING
  RETURNING id INTO v_translation_id;
  
  -- If it was a conflict, get the existing ID
  IF v_translation_id IS NULL THEN
    SELECT id INTO v_translation_id FROM public.translations WHERE key = p_key;
  END IF;
  
  -- Insert English value
  INSERT INTO public.translation_values (translation_id, language, value)
  VALUES (v_translation_id, 'en', p_en)
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
  
  -- Insert Arabic value
  INSERT INTO public.translation_values (translation_id, language, value)
  VALUES (v_translation_id, 'ar', p_ar)
  ON CONFLICT (translation_id, language) DO UPDATE SET value = EXCLUDED.value;
END;
$$ LANGUAGE plpgsql;

-- Navigation & Header (8 keys)
SELECT insert_translation('templates', 'navigation', 'Templates', 'القوالب');
SELECT insert_translation('tryFree', 'navigation', 'Try Free', 'جرب مجاناً');
SELECT insert_translation('help', 'navigation', 'Help', 'مساعدة');
SELECT insert_translation('signIn', 'auth', 'Sign In', 'تسجيل الدخول');
SELECT insert_translation('signUp', 'auth', 'Sign Up', 'إنشاء حساب');
SELECT insert_translation('signOut', 'auth', 'Sign Out', 'تسجيل الخروج');
SELECT insert_translation('dashboard', 'navigation', 'Dashboard', 'لوحة التحكم');

-- Legal Pages (6 keys)
SELECT insert_translation('terms', 'legal', 'Terms', 'الشروط');
SELECT insert_translation('privacy', 'legal', 'Privacy', 'الخصوصية');
SELECT insert_translation('consent', 'legal', 'Consent', 'الموافقة');
SELECT insert_translation('termsConditions', 'legal', 'Terms & Conditions', 'الشروط والأحكام');
SELECT insert_translation('privacyPolicy', 'legal', 'Privacy Policy', 'سياسة الخصوصية');
SELECT insert_translation('consentIpPolicy', 'legal', 'Consent & IP Policy', 'سياسة الموافقة والملكية الفكرية');

-- Main Content (5 keys)
SELECT insert_translation('heroHeadline', 'general', 'Turn your photos into cinematic moments.', 'حوّل صورك إلى لحظات سينمائية.');
SELECT insert_translation('heroSubtext', 'general', 'Try a teaser for free. Upgrade to generate full trailers.', 'جرب إعلان قصير مجاناً. قم بالترقية لإنشاء عروض كاملة.');
SELECT insert_translation('tryFreeButton', 'general', 'Try Free', 'جرب مجاناً');
SELECT insert_translation('getStarted', 'general', 'Get Started', 'ابدأ الآن');
SELECT insert_translation('alreadyHaveAccount', 'auth', 'Already have an account?', 'هل لديك حساب بالفعل؟');

-- Dashboard (12 keys)
SELECT insert_translation('welcomeUser', 'dashboard', 'Welcome', 'مرحباً');
SELECT insert_translation('walletBalance', 'wallet', 'Wallet Balance', 'رصيد المحفظة');
SELECT insert_translation('credits', 'wallet', 'Credits', 'رصيد');
SELECT insert_translation('quickLinks', 'dashboard', 'Quick Links', 'روابط سريعة');
SELECT insert_translation('browseTemplates', 'dashboard', 'Browse Templates', 'تصفح القوالب');
SELECT insert_translation('myHistory', 'dashboard', 'My History', 'تاريخي');
SELECT insert_translation('buyCredits', 'wallet', 'Buy Credits', 'شراء رصيد');
SELECT insert_translation('recentJobsPlaceholder', 'jobs', 'Your recent jobs will appear here.', 'ستظهر أعمالك الأخيرة هنا.');
SELECT insert_translation('wallet', 'wallet', 'Wallet', 'المحفظة');
SELECT insert_translation('viewTransactions', 'transactions', 'View Transactions', 'عرض المعاملات');
SELECT insert_translation('creditsExpiry', 'wallet', 'Credits expire after 90 days.', 'الرصيد ينتهي بعد 90 يوم.');
SELECT insert_translation('settings', 'settings', 'Settings', 'الإعدادات');

-- Form Fields (4 keys)
SELECT insert_translation('name', 'forms', 'Name', 'الاسم');
SELECT insert_translation('language', 'forms', 'Language', 'اللغة');
SELECT insert_translation('accountConnections', 'settings', 'Account Connections', 'روابط الحساب');
SELECT insert_translation('save', 'ui', 'Save', 'حفظ');

-- History & Jobs (10 keys)
SELECT insert_translation('title', 'jobs', 'Title', 'العنوان');
SELECT insert_translation('date', 'general', 'Date', 'التاريخ');
SELECT insert_translation('status', 'jobs', 'Status', 'الحالة');
SELECT insert_translation('result', 'jobs', 'Result', 'النتيجة');
SELECT insert_translation('statusQueued', 'jobs', 'Queued', 'في قائمة الانتظار');
SELECT insert_translation('statusRunning', 'jobs', 'Running', 'قيد التشغيل');
SELECT insert_translation('statusSuccess', 'jobs', 'Success', 'نجح');
SELECT insert_translation('statusFailed', 'jobs', 'Failed', 'فشل');
SELECT insert_translation('viewResult', 'jobs', 'View Result', 'عرض النتيجة');

-- Job Status (8 keys)
SELECT insert_translation('generationStatus', 'jobs', 'Generation Status', 'حالة الإنشاء');
SELECT insert_translation('jobId', 'jobs', 'Job ID', 'رقم العملية');
SELECT insert_translation('templateName', 'jobs', 'Template', 'القالب');
SELECT insert_translation('statusQueuedDesc', 'jobs', 'Queued — waiting for a worker', 'في قائمة الانتظار — بانتظار عامل');
SELECT insert_translation('statusRunningDesc', 'jobs', 'Generating — this may take a moment', 'جارٍ التوليد — قد يستغرق بعض الوقت');
SELECT insert_translation('statusSuccessDesc', 'jobs', 'Completed — open result', 'اكتمل — افتح النتيجة');
SELECT insert_translation('statusFailedDesc', 'jobs', 'Failed — please try again or contact support', 'فشل — يرجى المحاولة مجددًا أو التواصل مع الدعم');
SELECT insert_translation('openResult', 'results', 'Open Result', 'افتح النتيجة');
SELECT insert_translation('tryAgain', 'ui', 'Try Again', 'حاول مجددًا');
SELECT insert_translation('guestNote', 'guest', 'Guest preview only. Sign up to save and download.', 'معاينة الضيوف فقط. سجّل للحفظ والتحميل.');
SELECT insert_translation('autoRefreshing', 'jobs', 'Auto-refreshing status…', 'تحديث الحالة تلقائيًا…');

-- Results (14 keys)
SELECT insert_translation('yourResult', 'results', 'Your Result', 'نتيجتك');
SELECT insert_translation('untitled', 'general', 'Untitled', 'بلا عنوان');
SELECT insert_translation('duration', 'results', 'Duration', 'المدة');
SELECT insert_translation('guestRibbon', 'guest', 'Guest preview — Watermarked. Sign up to save & download.', 'معاينة ضيف — مدموغة. سجّل للحفظ والتحميل.');
SELECT insert_translation('download', 'results', 'Download', 'تحميل');
SELECT insert_translation('shareLink', 'results', 'Share Link', 'مشاركة الرابط');
SELECT insert_translation('regenerate', 'results', 'Regenerate', 'إعادة إنشاء');
SELECT insert_translation('makeVariation', 'results', 'Make Variation', 'صنع تباين');
SELECT insert_translation('template', 'general', 'Template', 'القالب');
SELECT insert_translation('submittedDate', 'jobs', 'Submitted', 'تم الإرسال');
SELECT insert_translation('creditsSpent', 'wallet', 'Credits Spent', 'الرصيد المستهلك');
SELECT insert_translation('resultNotes', 'results', 'If something looks off, re-run or visit Help.', 'إذا كان هناك خطأ، أعد التشغيل أو زر المساعدة.');
SELECT insert_translation('relatedOutputs', 'results', 'Related Outputs', 'مخرجات ذات صلة');
SELECT insert_translation('linkCopied', 'ui', 'Link copied to clipboard!', 'تم نسخ الرابط!');

-- Transactions (11 keys)
SELECT insert_translation('transactionType', 'transactions', 'Type', 'النوع');
SELECT insert_translation('transactionAmount', 'transactions', 'Amount', 'المبلغ');
SELECT insert_translation('transactionDate', 'transactions', 'Date', 'التاريخ');
SELECT insert_translation('purchase', 'transactions', 'Purchase', 'شراء');
SELECT insert_translation('generation', 'transactions', 'Generation', 'إنتاج');
SELECT insert_translation('transactionHistory', 'transactions', 'Transaction History', 'تاريخ المعاملات');
SELECT insert_translation('teaser', 'general', 'Teaser', 'إعلان قصير');
SELECT insert_translation('trailer', 'general', 'Trailer', 'عرض مقطورة');
SELECT insert_translation('poster', 'general', 'Poster', 'بوستر');
SELECT insert_translation('subscriptionMonthly', 'wallet', 'Subscription (Monthly)', 'اشتراك (شهري)');

-- Wallet Purchase Flow (15 keys)
SELECT insert_translation('oneTime', 'wallet', 'One-time', 'دفع لمرة واحدة');
SELECT insert_translation('subscription', 'wallet', 'Subscription', 'اشتراك');
SELECT insert_translation('monthly', 'wallet', 'Monthly', 'شهري');
SELECT insert_translation('weekly', 'wallet', 'Weekly', 'أسبوعي');
SELECT insert_translation('howManyCredits', 'wallet', 'How many credits do you need?', 'كم رصيدًا تحتاج؟');
SELECT insert_translation('total', 'wallet', 'Total', 'الإجمالي');
SELECT insert_translation('payWithStripe', 'wallet', 'Pay with Stripe', 'ادفع عبر سترايب');
SELECT insert_translation('startSubscription', 'wallet', 'Start Subscription', 'ابدأ الاشتراك');
SELECT insert_translation('manageBilling', 'wallet', 'Manage billing', 'إدارة الفواتير');
SELECT insert_translation('promoCode', 'wallet', 'Promo code', 'رمز ترويجي');
SELECT insert_translation('currentBalance', 'wallet', 'Current Balance', 'الرصيد الحالي');
SELECT insert_translation('creditsExpireIn90', 'wallet', 'Credits expire in 90 days', 'الرصيد ينتهي خلال ٩٠ يومًا');
SELECT insert_translation('light', 'wallet', 'Light', 'خفيف');
SELECT insert_translation('standard', 'wallet', 'Standard', 'قياسي');
SELECT insert_translation('pro', 'wallet', 'Pro', 'احترافي');
SELECT insert_translation('studio', 'wallet', 'Studio', 'استوديو');
SELECT insert_translation('billedEach', 'wallet', 'Billed each', 'يُحاسب كل');
SELECT insert_translation('securePayment', 'wallet', 'Secure payment via Stripe', 'دفع آمن عبر سترايب');

-- Error Pages (10 keys)
SELECT insert_translation('pageNotFound', 'errors', 'Page Not Found', 'الصفحة غير موجودة');
SELECT insert_translation('pageNotFoundMessage', 'errors', 'The page you''re looking for doesn''t exist or has been moved.', 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.');
SELECT insert_translation('serverError', 'errors', 'Server Error', 'خطأ في الخادم');
SELECT insert_translation('serverErrorMessage', 'errors', 'Something went wrong on our end. We''re working to fix it.', 'حدث خطأ من جانبنا. نعمل على إصلاحه.');
SELECT insert_translation('goHome', 'navigation', 'Go Home', 'العودة للرئيسية');
SELECT insert_translation('goBack', 'navigation', 'Go Back', 'العودة');
SELECT insert_translation('needHelp', 'help', 'Need help?', 'تحتاج مساعدة؟');
SELECT insert_translation('visitHelpCenter', 'help', 'Visit Help Center', 'زر مركز المساعدة');
SELECT insert_translation('persistentError', 'errors', 'If this error persists:', 'إذا استمر هذا الخطأ:');
SELECT insert_translation('contactSupport', 'help', 'Contact Support', 'تواصل مع الدعم');

-- Help & Support (3 keys)
SELECT insert_translation('helpPageTitle', 'help', 'Help & Support', 'المساعدة والدعم');
SELECT insert_translation('helpPageSubtitle', 'help', 'Get help and support for using Rawi App''s cinematic photo editing tools.', 'احصل على المساعدة والدعم لاستخدام أدوات تحرير الصور السينمائية في تطبيق راوي.');
SELECT insert_translation('faqTitle', 'help', 'Frequently Asked Questions', 'الأسئلة الشائعة');

-- Success/Error Messages (6 keys)
SELECT insert_translation('regenerateConfirmation', 'ui', 'Are you sure you want to regenerate this section? This will overwrite existing data.', 'هل أنت متأكد من إعادة إنشاء هذا القسم؟ سيتم استبدال البيانات الحالية.');
SELECT insert_translation('paymentSuccessful', 'wallet', 'Payment successful — credits added.', 'تم الدفع بنجاح — تم إضافة الرصيد.');
SELECT insert_translation('paymentCanceled', 'wallet', 'Payment canceled.', 'تم إلغاء الدفع.');
SELECT insert_translation('subscriptionActive', 'wallet', 'Subscription active.', 'الاشتراك نشط.');
SELECT insert_translation('subscriptionCheckoutCanceled', 'wallet', 'Subscription checkout canceled.', 'تم إلغاء عملية الاشتراك.');
SELECT insert_translation('demoSaved', 'ui', 'Settings saved successfully!', 'تم حفظ الإعدادات بنجاح!');

-- Legal Content (2 keys)
SELECT insert_translation('legalPlaceholder', 'legal', 'This is a placeholder for legal content. Please consult with legal professionals to create appropriate content for your jurisdiction.', 'هذا نص تجريبي للمحتوى القانوني. يرجى استشارة المتخصصين القانونيين لإنشاء محتوى مناسب لولايتك القضائية.');
SELECT insert_translation('consentLogNote', 'legal', 'Last accepted: Consent & IP v1.0', 'آخر قبول: سياسة الموافقة والملكية الفكرية الإصدار ١.٠');

-- Terms & Conditions (16 keys)
SELECT insert_translation('termsAcceptance', 'legal', 'Acceptance and Agreement', 'القبول والاتفاق');
SELECT insert_translation('termsAcceptanceContent', 'legal', 'By accessing or using Rawi App ("the Service"), operated by ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻘﺔ ﺣﺮة (SAMIM STUDIOS L.L.C-FZ), you agree to be bound by these Terms and Conditions. You must be at least 13 years of age to use this Service. If you are under 18, you must have parental consent. By using the Service, you represent that you have the legal authority to enter into this agreement.', 'باستخدام تطبيق راوي ("الخدمة")، المُشغل من قِبل ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة (SAMIM STUDIOS L.L.C-FZ)، فإنك توافق على الالتزام بهذه الشروط والأحكام. يجب أن يكون عمرك ١٣ عامًا على الأقل لاستخدام هذه الخدمة. إذا كان عمرك أقل من ١٨ عامًا، يجب الحصول على موافقة الوالدين. باستخدام الخدمة، تؤكد أن لديك السلطة القانونية لإبرام هذه الاتفاقية.');
SELECT insert_translation('termsCredits', 'legal', 'Credits System and Payments', 'نظام الرصيد والمدفوعات');
SELECT insert_translation('termsCreditsContent', 'legal', 'All content generation requires credits purchased through our payment system. Credits expire 90 days after purchase and are non-transferable. Payment processing is handled by Stripe. All fees are non-refundable except as outlined in our Refund Policy. SAMIM STUDIOS L.L.C-FZ reserves the right to modify pricing with 30 days notice.', 'جميع عمليات إنشاء المحتوى تتطلب رصيدًا يتم شراؤه عبر نظام الدفع لدينا. ينتهي الرصيد بعد ٩٠ يومًا من الشراء وغير قابل للتحويل. تتم معالجة المدفوعات عبر سترايب. جميع الرسوم غير قابلة للاسترداد باستثناء ما هو مذكور في سياسة الاسترداد. تحتفظ ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بالحق في تعديل الأسعار مع إشعار مدته ٣٠ يومًا.');
SELECT insert_translation('termsOwnership', 'legal', 'Content Ownership and Rights', 'ملكية المحتوى والحقوق');
SELECT insert_translation('termsOwnershipContent', 'legal', 'You retain ownership of all content you upload. You must have legal rights to all uploaded materials and warrant that uploads do not infringe third-party rights. You may not upload celebrity likenesses, copyrighted materials, or content depicting minors without explicit consent. Generated outputs are licensed to you for personal and commercial use, subject to these Terms.', 'تحتفظ بملكية جميع المحتويات التي ترفعها. يجب أن تملك الحقوق القانونية لجميع المواد المرفوعة وتضمن عدم انتهاك حقوق الأطراف الثالثة. لا يجوز رفع صور المشاهير أو المواد المحمية بحقوق الطبع أو محتوى يصور القاصرين دون موافقة صريحة. المخرجات المُولدة مرخصة لك للاستخدام الشخصي والتجاري وفقًا لهذه الشروط.');
SELECT insert_translation('termsIpConsent', 'legal', 'Consent to IP Terms and Processing', 'الموافقة على شروط الملكية الفكرية والمعالجة');
SELECT insert_translation('termsIpConsentContent', 'legal', 'By using our services, you explicitly consent to our intellectual property terms and content processing policies. You acknowledge that you have read, understood, and agree to our Consent & IP Policy. You consent to the processing of your uploaded content for AI generation purposes and agree that generated outputs will be owned by you under the licensing terms specified herein.', 'باستخدام خدماتنا، توافق صراحة على شروط الملكية الفكرية وسياسات معالجة المحتوى الخاصة بنا. تقر بأنك قرأت وفهمت ووافقت على سياسة الموافقة والملكية الفكرية. توافق على معالجة المحتوى المرفوع لأغراض توليد الذكاء الاصطناعي وتوافق على أن المخرجات المُولدة ستكون مملوكة لك وفق شروط الترخيص المحددة هنا.');
SELECT insert_translation('termsProhibited', 'legal', 'Prohibited Uses and Conduct', 'الاستخدامات والسلوكيات المحظورة');
SELECT insert_translation('termsProhibitedContent', 'legal', 'You may not use the Service to create illegal, harmful, defamatory, or adult content. Prohibited activities include reverse engineering, attempting to access unauthorized areas, distributing malware, or overloading our systems. SAMIM STUDIOS L.L.C-FZ reserves the right to suspend accounts for violations without notice.', 'لا يجوز استخدام الخدمة لإنشاء محتوى غير قانوني أو ضار أو تشهيري أو للبالغين. تشمل الأنشطة المحظورة الهندسة العكسية ومحاولة الوصول لمناطق غير مصرح بها وتوزيع البرمجيات الخبيثة أو إرهاق أنظمتنا. تحتفظ ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة بالحق في تعليق الحسابات للمخالفات دون إشعار.');
SELECT insert_translation('termsAvailability', 'legal', 'Service Availability and Modifications', 'توفر الخدمة والتعديلات');
SELECT insert_translation('termsAvailabilityContent', 'legal', 'SAMIM STUDIOS L.L.C-FZ strives for 99% uptime but does not guarantee uninterrupted service. We may modify, suspend, or discontinue features with reasonable notice. Scheduled maintenance will be announced in advance when possible. We are not liable for service interruptions or data loss.', 'تسعى ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة لتحقيق ٩٩٪ وقت تشغيل لكن لا تضمن خدمة متواصلة. قد نعدل أو نوقف أو نتوقف عن الميزات مع إشعار معقول. سيتم الإعلان عن الصيانة المجدولة مسبقًا عند الإمكان. لسنا مسؤولين عن انقطاع الخدمة أو فقدان البيانات.');
SELECT insert_translation('termsLiability', 'legal', 'Limitation of Liability and Disclaimers', 'حدود المسؤولية وإخلاء المسؤولية');
SELECT insert_translation('termsLiabilityContent', 'legal', 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES BY SAMIM STUDIOS L.L.C-FZ. WE DISCLAIM ALL LIABILITY FOR INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR LIABILITY IS LIMITED TO THE AMOUNT PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM. THIS LIMITATION APPLIES TO THE FULLEST EXTENT PERMITTED BY LAW.', 'تُقدم الخدمة "كما هي" دون ضمانات من قِبل ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة. نتبرأ من جميع المسؤوليات عن الأضرار غير المباشرة أو التبعية أو العقابية. مسؤوليتنا محدودة بالمبلغ المدفوع للخدمة في ال١٢ شهرًا السابقة للمطالبة. يطبق هذا التحديد بأقصى مدى يسمح به القانون.');
SELECT insert_translation('termsLaw', 'legal', 'Governing Law and Dispute Resolution', 'القانون الحاكم وحل النزاعات');
SELECT insert_translation('termsLawContent', 'legal', 'These Terms are governed by UAE Federal Law. Disputes will be resolved through binding arbitration in Abu Dhabi under ADCCAC rules, except for intellectual property claims which may be brought in UAE courts. The prevailing party is entitled to reasonable attorney fees.', 'تخضع هذه الشروط للقانون الاتحادي الإماراتي. ستُحل النزاعات عبر التحكيم الملزم في أبوظبي وفق قواعد مركز أبوظبي للتوفيق والتحكيم التجاري، باستثناء مطالبات الملكية الفكرية التي يمكن رفعها في محاكم الإمارات. الطرف الرابح يستحق أتعاب محاماة معقولة.');
SELECT insert_translation('termsChanges', 'legal', 'Modifications to Terms', 'تعديلات الشروط');
SELECT insert_translation('termsChangesContent', 'legal', 'SAMIM STUDIOS L.L.C-FZ may update these Terms periodically. Material changes will be posted with 30 days notice. Continued use after changes constitutes acceptance. If you disagree with modifications, you must discontinue use of the Service.', 'قد تحدث ﺻﻤﻴﻢ ﺳﺘﻮدﻳﻮز ش.ذ.م.م-ﻣﻨﻄﻘﺔ ﺣﺮة هذه الشروط دوريًا. سيتم نشر التغييرات الجوهرية مع إشعار ٣٠ يومًا. الاستمرار في الاستخدام بعد التغييرات يشكل قبولاً. إذا كنت لا توافق على التعديلات، يجب التوقف عن استخدام الخدمة.');

-- Clean up helper function after migration
DROP FUNCTION IF EXISTS insert_translation(TEXT, TEXT, TEXT, TEXT, TEXT);