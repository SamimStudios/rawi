import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Centralized translations organized by category
const translations = {
  en: {
    // Navigation & Header
    templates: 'Templates',
    tryFree: 'Try Free',
    help: 'Help',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    dashboard: 'Dashboard',
    
    // Legal Pages
    terms: 'Terms',
    privacy: 'Privacy',
    consent: 'Consent',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    consentIpPolicy: 'Consent & IP Policy',
    
    // Main Content
    heroHeadline: 'Turn your photos into cinematic moments.',
    heroSubtext: 'Try a teaser for free. Upgrade to generate full trailers.',
    tryFreeButton: 'Try Free',
    
    // App Pages
    welcomeUser: 'Welcome',
    walletBalance: 'Wallet Balance',
    credits: 'Credits',
    quickLinks: 'Quick Links',
    browseTemplates: 'Browse Templates',
    myHistory: 'My History',
    buyCredits: 'Buy Credits',
    recentJobsPlaceholder: 'Your recent jobs will appear here.',
    wallet: 'Wallet',
    viewTransactions: 'View Transactions',
    creditsExpiry: 'Credits expire after 90 days.',
    settings: 'Settings',
    
    // Form Fields
    name: 'Name',
    language: 'Language',
    accountConnections: 'Account Connections',
    save: 'Save',
    
    // History & Jobs
    title: 'Title',
    date: 'Date',
    status: 'Status',
    result: 'Result',
    statusQueued: 'Queued',
    statusRunning: 'Running',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    viewResult: 'View Result',
    
    // Job Status
    generationStatus: 'Generation Status',
    jobId: 'Job ID',
    templateName: 'Template',
    statusQueuedDesc: 'Queued — waiting for a worker',
    statusRunningDesc: 'Generating — this may take a moment',
    statusSuccessDesc: 'Completed — open result',
    statusFailedDesc: 'Failed — please try again or contact support',
    openResult: 'Open Result',
    tryAgain: 'Try Again',
    guestNote: 'Guest preview only. Sign up to save and download.',
    autoRefreshing: 'Auto-refreshing status…',
    
    // Results
    yourResult: 'Your Result',
    untitled: 'Untitled',
    duration: 'Duration',
    guestRibbon: 'Guest preview — Watermarked. Sign up to save & download.',
    download: 'Download',
    shareLink: 'Share Link',
    regenerate: 'Regenerate',
    makeVariation: 'Make Variation',
    template: 'Template',
    submittedDate: 'Submitted',
    creditsSpent: 'Credits Spent',
    resultNotes: 'If something looks off, re-run or visit Help.',
    relatedOutputs: 'Related Outputs',
    linkCopied: 'Link copied to clipboard!',
    
    // Transactions
    transactionType: 'Type',
    transactionAmount: 'Amount',
    transactionDate: 'Date',
    purchase: 'Purchase',
    generation: 'Generation',
    transactionHistory: 'Transaction History',
    teaser: 'Teaser',
    trailer: 'Trailer',
    poster: 'Poster',
    subscriptionMonthly: 'Subscription (Monthly)',
    
    // Wallet Purchase Flow
    oneTime: 'One-time',
    subscription: 'Subscription',
    monthly: 'Monthly',
    weekly: 'Weekly',
    howManyCredits: 'How many credits do you need?',
    total: 'Total',
    payWithStripe: 'Pay with Stripe',
    startSubscription: 'Start Subscription',
    manageBilling: 'Manage billing',
    promoCode: 'Promo code',
    currentBalance: 'Current Balance',
    creditsExpireIn90: 'Credits expire in 90 days',
    light: 'Light',
    standard: 'Standard',
    pro: 'Pro',
    studio: 'Studio',
    billedEach: 'Billed each',
    securePayment: 'Secure payment via Stripe',
    
    // Error Pages
    pageNotFound: 'Page Not Found',
    pageNotFoundMessage: 'The page you\'re looking for doesn\'t exist or has been moved.',
    serverError: 'Server Error', 
    serverErrorMessage: 'Something went wrong on our end. We\'re working to fix it.',
    goHome: 'Go Home',
    goBack: 'Go Back',
    needHelp: 'Need help?',
    visitHelpCenter: 'Visit Help Center',
    persistentError: 'If this error persists:',
    contactSupport: 'Contact Support',
    
    // Help & Support
    helpPageTitle: 'Help & Support',
    helpPageSubtitle: 'Get help and support for using Rawi App\'s cinematic photo editing tools.',
    faqTitle: 'Frequently Asked Questions',
    
    // Success/Error Messages
    paymentSuccessful: 'Payment successful — credits added.',
    paymentCanceled: 'Payment canceled.',
    subscriptionActive: 'Subscription active.',
    subscriptionCheckoutCanceled: 'Subscription checkout canceled.',
    demoSaved: 'Settings saved successfully!',
    
    // Legal Content
    legalPlaceholder: 'This is a placeholder for legal content. Please consult with legal professionals to create appropriate content for your jurisdiction.',
    consentLogNote: 'Last accepted: Consent & IP v1.0',
    
    // Terms & Conditions
    termsAcceptance: 'Acceptance and Agreement',
    termsAcceptanceContent: 'By accessing or using Rawi App ("the Service"), you agree to be bound by these Terms and Conditions. You must be at least 13 years of age to use this Service. If you are under 18, you must have parental consent. By using the Service, you represent that you have the legal authority to enter into this agreement.',
    termsCredits: 'Credits System and Payments',
    termsCreditsContent: 'All content generation requires credits purchased through our payment system. Credits expire 90 days after purchase and are non-transferable. Payment processing is handled by Stripe. All fees are non-refundable except as outlined in our Refund Policy. We reserve the right to modify pricing with 30 days notice.',
    termsOwnership: 'Content Ownership and Rights',
    termsOwnershipContent: 'You retain ownership of all content you upload. You must have legal rights to all uploaded materials and warrant that uploads do not infringe third-party rights. You may not upload celebrity likenesses, copyrighted materials, or content depicting minors without explicit consent. Generated outputs are licensed to you for personal and commercial use, subject to these Terms.',
    termsProhibited: 'Prohibited Uses and Conduct',
    termsProhibitedContent: 'You may not use the Service to create illegal, harmful, defamatory, or adult content. Prohibited activities include reverse engineering, attempting to access unauthorized areas, distributing malware, or overloading our systems. We reserve the right to suspend accounts for violations without notice.',
    termsAvailability: 'Service Availability and Modifications',
    termsAvailabilityContent: 'We strive for 99% uptime but do not guarantee uninterrupted service. We may modify, suspend, or discontinue features with reasonable notice. Scheduled maintenance will be announced in advance when possible. We are not liable for service interruptions or data loss.',
    termsLiability: 'Limitation of Liability and Disclaimers',
    termsLiabilityContent: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. WE DISCLAIM ALL LIABILITY FOR INDIRECT, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR LIABILITY IS LIMITED TO THE AMOUNT PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM. THIS LIMITATION APPLIES TO THE FULLEST EXTENT PERMITTED BY LAW.',
    termsLaw: 'Governing Law and Dispute Resolution',
    termsLawContent: 'These Terms are governed by UAE Federal Law. Disputes will be resolved through binding arbitration in Abu Dhabi under ADCCAC rules, except for intellectual property claims which may be brought in UAE courts. The prevailing party is entitled to reasonable attorney fees.',
    termsChanges: 'Modifications to Terms',
    termsChangesContent: 'We may update these Terms periodically. Material changes will be posted with 30 days notice. Continued use after changes constitutes acceptance. If you disagree with modifications, you must discontinue use of the Service.',
    
    // Privacy Policy
    privacyData: 'Information We Collect',
    privacyDataContent: 'We collect account information (name, email, authentication provider), uploaded content (images, text, audio), generated outputs, usage analytics (pages viewed, features used, device information), payment information (processed by Stripe), and communication records with support.',
    privacyUse: 'How We Use Your Information',
    privacyUseContent: 'Your information is used to provide AI generation services, process payments, improve our algorithms and templates, provide customer support, prevent fraud and abuse, comply with legal obligations, and send service-related communications.',
    privacySharing: 'Information Sharing and Disclosure',
    privacySharingContent: 'We do not sell personal information. We may share data with AI service providers for processing, Stripe for payments, cloud storage providers for data hosting, legal authorities when required by law, and business successors in case of acquisition (with notice).',
    privacyStorage: 'Data Storage and Retention',
    privacyStorageContent: 'Guest content may be deleted after 7 days. User accounts and paid content are retained until account deletion. Backups may persist for up to 90 days after deletion. You may request data deletion at any time by contacting support.',
    privacySecurity: 'Data Security Measures',
    privacySecurityContent: 'We implement encryption in transit and at rest, secure authentication systems, regular security audits, access controls for staff, and incident response procedures. However, no system is completely secure. Users share responsibility for account security.',
    privacyRights: 'Your Privacy Rights',
    privacyRightsContent: 'You have the right to access, correct, or delete your personal information. You may request data portability or restrict processing. To exercise these rights, contact support@rawiapp.io. We will respond within 30 days.',
    privacyContact: 'Privacy Contact Information',
    privacyContactContent: 'For privacy-related inquiries, complaints, or requests: Email: support@rawiapp.io | Address: Rawi App DMCC, UAE | Phone: Available upon request through support channels.',
    
    // Consent & IP Policy
    consentProcess: 'Content Processing Consent',
    consentProcessContent: 'By uploading content, you grant Rawi App a non-exclusive license to process, modify, and generate derivatives using AI technologies. You confirm legal ownership or authorization for all uploaded materials. This consent is revocable by deleting your content.',
    consentUploads: 'Uploaded Content Rights',
    consentUploadsContent: 'You retain full intellectual property rights to uploaded content. You warrant that uploads do not violate third-party rights, including publicity, privacy, or copyright. Celebrity likenesses and copyrighted material require explicit authorization. Violating content will be removed.',
    consentOutputs: 'Generated Content Ownership',
    consentOutputsContent: 'You own the intellectual property rights to AI-generated outputs based on your inputs. These may be used for personal, commercial, or promotional purposes. Outputs cannot be used to train competing AI systems or create derivative generation tools.',
    consentRestrictions: 'Usage Restrictions and Compliance',
    consentRestrictionsContent: 'Generated content must comply with applicable laws and platform policies. Prohibited uses include creating misleading deepfakes, non-consensual intimate imagery, content promoting violence or hatred, or material violating intellectual property rights.',
    consentLiability: 'Content Liability and Enforcement',
    consentLiabilityContent: 'Users are solely responsible for their use of generated content. Rawi App reserves the right to remove content reported for abuse, copyright infringement, or policy violations. Repeat offenders may face account suspension or termination.',

    // Refund Policy
    refund: 'Refunds',
    refundPolicy: 'Refund Policy',
    refundGeneral: 'General Refund Terms',
    refundGeneralContent: 'All purchases are generally final and non-refundable. However, we provide refunds in specific circumstances as outlined below, in compliance with applicable consumer protection laws.',
    refundEligible: 'Eligible Refund Situations',
    refundEligibleContent: 'Refunds may be granted for: Technical failures preventing content generation after 48 hours, duplicate charges within 7 days, unauthorized payments reported within 30 days, or service unavailability exceeding 24 hours within 7 days of purchase.',
    refundProcess: 'Refund Request Process',
    refundProcessContent: 'To request a refund, contact support@rawiapp.io within 30 days with your transaction ID, detailed issue description, and supporting evidence. Requests are reviewed within 5 business days. Approved refunds are processed within 10 business days.',
    refundExclusions: 'Refund Exclusions',
    refundExclusionsContent: 'No refunds for: Successful content generation (regardless of satisfaction), credits used for any generation, expired credits, subscription fees after the first billing cycle, or purchases made more than 30 days ago.',
    refundSubscriptions: 'Subscription Cancellations',
    refundSubscriptionsContent: 'Subscriptions may be cancelled anytime with effect from the next billing cycle. No partial refunds for unused subscription periods. Cancellation must be requested at least 24 hours before renewal.',
    
    // FAQ
    faq1Question: 'What can I create with Rawi?',
    faq1Answer: 'Cinematic teasers, trailers, fight scenes (more templates coming).',
    faq2Question: 'Do I need to sign up?',
    faq2Answer: 'You can try one teaser free as a guest. To save/share, sign up.',
    faq3Question: 'How do credits work?',
    faq3Answer: 'Every generation costs credits. Buy packs. Credits expire in 90 days.',
    faq4Question: 'Why is my free teaser watermarked?',
    faq4Answer: 'Guest runs are watermarked. Paid runs are always clean.',
    faq5Question: 'My job failed, what now?',
    faq5Answer: 'Contact support to request a credit refund.',
    faq6Question: 'Can I use the generated video commercially?',
    faq6Answer: 'Yes, as long as you own the uploads and respect our Terms.',
    faq7Question: 'What languages are supported?',
    faq7Answer: 'English + Arabic. More coming soon.',
  },
  ar: {
    // Navigation & Header (Arabic)
    templates: 'القوالب',
    tryFree: 'جرب مجاناً',
    help: 'مساعدة',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    signOut: 'تسجيل الخروج',
    dashboard: 'لوحة التحكم',
    
    // Legal Pages (Arabic)
    terms: 'الشروط',
    privacy: 'الخصوصية',
    consent: 'الموافقة',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    consentIpPolicy: 'سياسة الموافقة والملكية الفكرية',
    
    // Main Content (Arabic)
    heroHeadline: 'حوّل صورك إلى لقطات سينمائية.',
    heroSubtext: 'جرّب إعلانًا قصيرًا مجانًا. طوّر لحفظ وتنزيل العروض الكاملة.',
    tryFreeButton: 'جرب مجاناً',
    
    // App Pages (Arabic)
    welcomeUser: 'مرحباً',
    walletBalance: 'رصيد المحفظة',
    credits: 'رصيد',
    quickLinks: 'روابط سريعة',
    browseTemplates: 'تصفح القوالب',
    myHistory: 'تاريخي',
    buyCredits: 'شراء رصيد',
    recentJobsPlaceholder: 'ستظهر وظائفك الأخيرة هنا.',
    wallet: 'المحفظة',
    viewTransactions: 'عرض المعاملات',
    creditsExpiry: 'ينتهي الرصيد بعد ٩٠ يوماً.',
    settings: 'الإعدادات',
    
    // Form Fields (Arabic)
    name: 'الاسم',
    language: 'اللغة',
    accountConnections: 'ربط الحسابات',
    save: 'حفظ',
    
    // History & Jobs (Arabic)
    title: 'العنوان',
    date: 'التاريخ',
    status: 'الحالة',
    result: 'النتيجة',
    statusQueued: 'في الانتظار',
    statusRunning: 'قيد التشغيل',
    statusSuccess: 'مكتمل',
    statusFailed: 'فشل',
    viewResult: 'عرض النتيجة',
    
    // Job Status (Arabic)
    generationStatus: 'حالة الإنشاء',
    jobId: 'رقم المهمة',
    templateName: 'القالب',
    statusQueuedDesc: 'بالانتظار — بانتظار المعالجة',
    statusRunningDesc: 'جاري الإنشاء — قد يستغرق لحظات',
    statusSuccessDesc: 'اكتمل — افتح النتيجة',
    statusFailedDesc: 'فشل — حاول مرة أخرى أو تواصل مع الدعم',
    openResult: 'افتح النتيجة',
    tryAgain: 'حاول مرة أخرى',
    guestNote: 'عرض للضيف فقط. سجّل لحفظ وتحميل النتيجة.',
    autoRefreshing: 'تحديث تلقائي للحالة…',
    
    // Results (Arabic)
    yourResult: 'نتيجتك',
    untitled: 'بدون عنوان',
    duration: 'المدة',
    guestRibbon: 'معاينة للضيف — مع علامة مائية. سجّل لحفظ وتحميل.',
    download: 'تحميل',
    shareLink: 'شارك الرابط',
    regenerate: 'أعد الإنشاء',
    makeVariation: 'اصنع نسخة',
    template: 'القالب',
    submittedDate: 'تاريخ الإرسال',
    creditsSpent: 'الرصيد المستهلك',
    resultNotes: 'إذا كان هناك خطأ، أعد التشغيل أو زر صفحة المساعدة.',
    relatedOutputs: 'مخرجات ذات صلة',
    linkCopied: 'تم نسخ الرابط!',
    
    // Transactions (Arabic)
    transactionType: 'النوع',
    transactionAmount: 'المبلغ',
    transactionDate: 'التاريخ',
    purchase: 'شراء',
    generation: 'إنتاج',
    transactionHistory: 'تاريخ المعاملات',
    teaser: 'إعلان قصير',
    trailer: 'عرض مقطورة',
    poster: 'بوستر',
    subscriptionMonthly: 'اشتراك (شهري)',
    
    // Wallet Purchase Flow (Arabic)
    oneTime: 'دفع لمرة واحدة',
    subscription: 'اشتراك',
    monthly: 'شهري',
    weekly: 'أسبوعي',
    howManyCredits: 'كم رصيدًا تحتاج؟',
    total: 'الإجمالي',
    payWithStripe: 'ادفع عبر سترايب',
    startSubscription: 'ابدأ الاشتراك',
    manageBilling: 'إدارة الفواتير',
    promoCode: 'رمز ترويجي',
    currentBalance: 'الرصيد الحالي',
    creditsExpireIn90: 'الرصيد ينتهي خلال ٩٠ يومًا',
    light: 'خفيف',
    standard: 'قياسي',
    pro: 'احترافي',
    studio: 'استوديو',
    billedEach: 'يُحاسب كل',
    securePayment: 'دفع آمن عبر سترايب',
    
    // Error Pages (Arabic)
    pageNotFound: 'الصفحة غير موجودة',
    pageNotFoundMessage: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    serverError: 'خطأ في الخادم',
    serverErrorMessage: 'حدث خطأ من جانبنا. نعمل على إصلاحه.',
    goHome: 'العودة للرئيسية',
    goBack: 'العودة',
    needHelp: 'تحتاج مساعدة؟',
    visitHelpCenter: 'زر مركز المساعدة',
    persistentError: 'إذا استمر هذا الخطأ:',
    contactSupport: 'تواصل مع الدعم',
    
    // Help & Support (Arabic)
    helpPageTitle: 'المساعدة والدعم',
    helpPageSubtitle: 'احصل على المساعدة والدعم لاستخدام أدوات تحرير الصور السينمائية في تطبيق راوي.',
    faqTitle: 'الأسئلة الشائعة',
    
    // Success/Error Messages (Arabic)
    paymentSuccessful: 'تم الدفع بنجاح — تم إضافة الرصيد.',
    paymentCanceled: 'تم إلغاء الدفع.',
    subscriptionActive: 'الاشتراك نشط.',
    subscriptionCheckoutCanceled: 'تم إلغاء عملية الاشتراك.',
    demoSaved: 'تم حفظ الإعدادات بنجاح!',
    
    // Legal Content (Arabic)
    legalPlaceholder: 'هذا نص تجريبي للمحتوى القانوني. يرجى استشارة المتخصصين القانونيين لإنشاء محتوى مناسب لولايتك القضائية.',
    consentLogNote: 'آخر قبول: سياسة الموافقة والملكية الفكرية الإصدار ١.٠',
    
    // Terms & Conditions (Arabic)
    termsAcceptance: 'القبول والاتفاق',
    termsAcceptanceContent: 'باستخدام تطبيق راوي ("الخدمة")، فإنك توافق على الالتزام بهذه الشروط والأحكام. يجب أن يكون عمرك ١٣ عامًا على الأقل لاستخدام هذه الخدمة. إذا كان عمرك أقل من ١٨ عامًا، يجب الحصول على موافقة الوالدين. باستخدام الخدمة، تؤكد أن لديك السلطة القانونية لإبرام هذه الاتفاقية.',
    termsCredits: 'نظام الرصيد والمدفوعات',
    termsCreditsContent: 'جميع عمليات إنشاء المحتوى تتطلب رصيدًا يتم شراؤه عبر نظام الدفع لدينا. ينتهي الرصيد بعد ٩٠ يومًا من الشراء وغير قابل للتحويل. تتم معالجة المدفوعات عبر سترايب. جميع الرسوم غير قابلة للاسترداد باستثناء ما هو مذكور في سياسة الاسترداد. نحتفظ بالحق في تعديل الأسعار مع إشعار مدته ٣٠ يومًا.',
    termsOwnership: 'ملكية المحتوى والحقوق',
    termsOwnershipContent: 'تحتفظ بملكية جميع المحتويات التي ترفعها. يجب أن تملك الحقوق القانونية لجميع المواد المرفوعة وتضمن عدم انتهاك حقوق الأطراف الثالثة. لا يجوز رفع صور المشاهير أو المواد المحمية بحقوق الطبع أو محتوى يصور القاصرين دون موافقة صريحة. المخرجات المُولدة مرخصة لك للاستخدام الشخصي والتجاري وفقًا لهذه الشروط.',
    termsProhibited: 'الاستخدامات والسلوكيات المحظورة',
    termsProhibitedContent: 'لا يجوز استخدام الخدمة لإنشاء محتوى غير قانوني أو ضار أو تشهيري أو للبالغين. تشمل الأنشطة المحظورة الهندسة العكسية ومحاولة الوصول لمناطق غير مصرح بها وتوزيع البرمجيات الخبيثة أو إرهاق أنظمتنا. نحتفظ بالحق في تعليق الحسابات للمخالفات دون إشعار.',
    termsAvailability: 'توفر الخدمة والتعديلات',
    termsAvailabilityContent: 'نسعى لتحقيق ٩٩٪ وقت تشغيل لكن لا نضمن خدمة متواصلة. قد نعدل أو نوقف أو نتوقف عن الميزات مع إشعار معقول. سيتم الإعلان عن الصيانة المجدولة مسبقًا عند الإمكان. لسنا مسؤولين عن انقطاع الخدمة أو فقدان البيانات.',
    termsLiability: 'حدود المسؤولية وإخلاء المسؤولية',
    termsLiabilityContent: 'تُقدم الخدمة "كما هي" دون ضمانات. نتبرأ من جميع المسؤوليات عن الأضرار غير المباشرة أو التبعية أو العقابية. مسؤوليتنا محدودة بالمبلغ المدفوع للخدمة في ال١٢ شهرًا السابقة للمطالبة. يطبق هذا التحديد بأقصى مدى يسمح به القانون.',
    termsLaw: 'القانون الحاكم وحل النزاعات',
    termsLawContent: 'تخضع هذه الشروط للقانون الاتحادي الإماراتي. ستُحل النزاعات عبر التحكيم الملزم في أبوظبي وفق قواعد مركز أبوظبي للتوفيق والتحكيم التجاري، باستثناء مطالبات الملكية الفكرية التي يمكن رفعها في محاكم الإمارات. الطرف الرابح يستحق أتعاب محاماة معقولة.',
    termsChanges: 'تعديلات الشروط',
    termsChangesContent: 'قد نحدث هذه الشروط دوريًا. سيتم نشر التغييرات الجوهرية مع إشعار ٣٠ يومًا. الاستمرار في الاستخدام بعد التغييرات يشكل قبولاً. إذا كنت لا توافق على التعديلات، يجب التوقف عن استخدام الخدمة.',
    
    // Privacy Policy (Arabic)  
    privacyData: 'المعلومات التي نجمعها',
     privacyDataContent: 'نجمع معلومات الحساب (الاسم، البريد الإلكتروني، مزود المصادقة)، المحتوى المرفوع (الصور، النصوص، الأصوات)، المخرجات المُولدة، تحليلات الاستخدام (الصفحات المُشاهدة، الميزات المستخدمة، معلومات الجهاز)، معلومات الدفع (تُعالج بواسطة سترايب)، وسجلات التواصل مع الدعم.',
    privacyUse: 'كيفية استخدام معلوماتك',
    privacyUseContent: 'تُستخدم معلوماتك لتوفير خدمات إنشاء الذكاء الاصطناعي، معالجة المدفوعات، تحسين الخوارزميات والقوالب، تقديم دعم العملاء، منع الاحتيال والإساءة، الامتثال للالتزامات القانونية، وإرسال إشعارات متعلقة بالخدمة.',
    privacySharing: 'مشاركة المعلومات والإفصاح عنها',
    privacySharingContent: 'لا نبيع المعلومات الشخصية. قد نشارك البيانات مع مزودي خدمات الذكاء الاصطناعي للمعالجة، سترايب للمدفوعات، مزودي التخزين السحابي لاستضافة البيانات، السلطات القانونية عند المطلوب قانونيًا، وخلفاء الأعمال في حالة الاستحواذ (مع الإشعار).',
    privacyStorage: 'تخزين البيانات والاحتفاظ بها',
    privacyStorageContent: 'قد يُحذف محتوى الضيوف بعد ٧ أيام. تُحتفظ بحسابات المستخدمين والمحتوى المدفوع حتى حذف الحساب. قد تستمر النسخ الاحتياطية لمدة ٩٠ يومًا بعد الحذف. يمكنك طلب حذف البيانات في أي وقت بالتواصل مع الدعم.',
    privacySecurity: 'إجراءات أمن البيانات',
    privacySecurityContent: 'نطبق التشفير أثناء النقل والتخزين، أنظمة مصادقة آمنة، تدقيق أمني منتظم، ضوابط وصول للموظفين، وإجراءات الاستجابة للحوادث. ومع ذلك، لا يوجد نظام آمن بنسبة ١٠٠٪. يتشارك المستخدمون مسؤولية أمان الحساب.',
    privacyRights: 'حقوق الخصوصية الخاصة بك',
    privacyRightsContent: 'لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يمكنك طلب نقل البيانات أو تقييد المعالجة. لممارسة هذه الحقوق، تواصل مع support@rawiapp.io. سنرد خلال ٣٠ يومًا.',
    privacyContact: 'معلومات التواصل للخصوصية',
    privacyContactContent: 'للاستفسارات أو الشكاوى أو الطلبات المتعلقة بالخصوصية: البريد الإلكتروني: support@rawiapp.io | العنوان: Rawi App DMCC، الإمارات العربية المتحدة | الهاتف: متاح عند الطلب عبر قنوات الدعم.',
    
    // Consent & IP Policy (Arabic)
    consentProcess: 'موافقة معالجة المحتوى',
    consentProcessContent: 'برفع المحتوى، تمنح تطبيق راوي ترخيصًا غير حصري لمعالجة وتعديل وإنشاء مشتقات باستخدام تقنيات الذكاء الاصطناعي. تؤكد الملكية القانونية أو التخويل لجميع المواد المرفوعة. هذه الموافقة قابلة للإلغاء بحذف المحتوى.',
    consentUploads: 'حقوق المحتوى المرفوع',
    consentUploadsContent: 'تحتفظ بحقوق الملكية الفكرية الكاملة للمحتوى المرفوع. تضمن عدم انتهاك المواد المرفوعة لحقوق الأطراف الثالثة، بما في ذلك حقوق الدعاية والخصوصية وحقوق الطبع والنشر. تتطلب صور المشاهير والمواد المحمية بحقوق الطبع تخويلاً صريحًا. سيُزال المحتوى المخالف.',
    consentOutputs: 'ملكية المحتوى المُولد',
    consentOutputsContent: 'تملك حقوق الملكية الفكرية للمخرجات المُولدة بالذكاء الاصطناعي المبنية على مدخلاتك. يمكن استخدامها لأغراض شخصية أو تجارية أو ترويجية. لا يمكن استخدام المخرجات لتدريب أنظمة ذكاء اصطناعي منافسة أو إنشاء أدوات توليد مشتقة.',
    consentRestrictions: 'قيود الاستخدام والامتثال',
    consentRestrictionsContent: 'يجب أن يمتثل المحتوى المُولد للقوانين المعمول بها وسياسات المنصة. تشمل الاستخدامات المحظورة إنشاء تزييف عميق مضلل، صور حميمية غير توافقية، محتوى يروج للعنف أو الكراهية، أو مواد تنتهك حقوق الملكية الفكرية.',
    consentLiability: 'مسؤولية المحتوى والإنفاذ',
    consentLiabilityContent: 'المستخدمون مسؤولون وحدهم عن استخدامهم للمحتوى المُولد. يحتفظ تطبيق راوي بالحق في إزالة المحتوى المُبلغ عنه للإساءة أو انتهاك حقوق الطبع أو مخالفة السياسات. قد يواجه المخالفون المتكررون تعليق الحساب أو الإنهاء.',

    // Refund Policy (Arabic)
    refund: 'الاستردادات',
    refundPolicy: 'سياسة الاسترداد',
    refundGeneral: 'شروط الاسترداد العامة',
    refundGeneralContent: 'جميع المشتريات نهائية وغير قابلة للاسترداد بشكل عام. ومع ذلك، نوفر استردادات في ظروف محددة كما هو مبين أدناه، امتثالاً لقوانين حماية المستهلك المعمول بها.',
    refundEligible: 'حالات الاسترداد المؤهلة',
    refundEligibleContent: 'قد تُمنح الاستردادات في: الإخفاقات التقنية التي تمنع إنشاء المحتوى بعد ٤٨ ساعة، الرسوم المكررة خلال ٧ أيام، المدفوعات غير المصرح بها المُبلغ عنها خلال ٣٠ يومًا، أو عدم توفر الخدمة لأكثر من ٢٤ ساعة خلال ٧ أيام من الشراء.',
    refundProcess: 'عملية طلب الاسترداد',
    refundProcessContent: 'لطلب استرداد، تواصل مع support@rawiapp.io خلال ٣٠ يومًا مع رقم المعاملة ووصف تفصيلي للمشكلة والأدلة الداعمة. تُراجع الطلبات خلال ٥ أيام عمل. تُعالج الاستردادات المعتمدة خلال ١٠ أيام عمل.',
    refundExclusions: 'استثناءات الاسترداد',
    refundExclusionsContent: 'لا استرداد في: إنشاء المحتوى الناجح (بغض النظر عن الرضا)، الرصيد المستخدم لأي إنشاء، الرصيد المنتهي الصلاحية، رسوم الاشتراك بعد دورة الفوترة الأولى، أو المشتريات التي تمت منذ أكثر من ٣٠ يومًا.',
    refundSubscriptions: 'إلغاء الاشتراكات',
    refundSubscriptionsContent: 'يمكن إلغاء الاشتراكات في أي وقت مع السريان من دورة الفوترة التالية. لا استردادات جزئية لفترات الاشتراك غير المستخدمة. يجب طلب الإلغاء قبل ٢٤ ساعة على الأقل من التجديد.',
    
    // FAQ (Arabic)
    faq1Question: 'ماذا يمكنني أن أنشئ باستخدام راوي؟',
    faq1Answer: 'إعلانات قصيرة، عروض سينمائية، مشاهد قتال (المزيد قريبًا).',
    faq2Question: 'هل يجب أن أسجّل؟',
    faq2Answer: 'يمكنك تجربة إعلان قصير واحد مجانًا كضيف. للحفظ والمشاركة، يجب التسجيل.',
    faq3Question: 'كيف يعمل الرصيد؟',
    faq3Answer: 'كل عملية تستهلك رصيد. يمكنك شراء باقات. الرصيد ينتهي بعد ٩٠ يوم.',
    faq4Question: 'لماذا الإعلان المجاني مدموغ؟',
    faq4Answer: 'التجارب المجانية دائمًا مدموغة. المدفوعة دائمًا نظيفة.',
    faq5Question: 'ماذا أفعل إذا فشلت العملية؟',
    faq5Answer: 'تواصل مع الدعم لطلب استرجاع الرصيد.',
    faq6Question: 'هل يمكنني استخدام الفيديو تجاريًا؟',
    faq6Answer: 'نعم، طالما أنك تملك الملفات المرفوعة وتحترم الشروط.',
    faq7Question: 'ما هي اللغات المدعومة؟',
    faq7Answer: 'العربية والإنجليزية. المزيد قريبًا.',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rawi-language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    }
    return 'en';
  });

  const isRTL = language === 'ar';

  // Update language and persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rawi-language', lang);
    }
  };

  // Update HTML attributes when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      
      // Update the title based on language
      if (language === 'ar') {
        document.title = 'تطبيق راوي - حوّل صورك إلى لقطات سينمائية';
      } else {
        document.title = 'Rawi App - Turn Your Photos Into Cinematic Moments';
      }
    }
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};