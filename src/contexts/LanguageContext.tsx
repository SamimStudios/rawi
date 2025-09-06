import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    templates: 'Templates',
    tryFree: 'Try Free',
    help: 'Help',
    signIn: 'Sign In',
    credits: 'credits',
    terms: 'Terms',
    privacy: 'Privacy',
    consent: 'Consent',
    heroHeadline: 'Turn your photos into cinematic moments.',
    heroSubtext: 'Try a teaser for free. Upgrade to generate full trailers.',
    tryFreeButton: 'Try Free',
    browseTemplates: 'Browse Templates',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    consentIpPolicy: 'Consent & IP Policy',
    legalPlaceholder: 'This is a placeholder for legal content. Please consult with legal professionals to create appropriate content for your jurisdiction.',
    helpPageTitle: 'Help & Support',
    helpPageSubtitle: 'Get help and support for using Rawi App\'s cinematic photo editing tools.',
    faqTitle: 'Frequently Asked Questions',
    // Terms & Conditions Content
    termsAcceptance: 'Acceptance',
    termsAcceptanceContent: 'By using Rawi App, you agree to these Terms. You must be 13+ years old.',
    termsCredits: 'Credits & Payments',
    termsCreditsContent: 'All generations cost credits. Credits expire after 90 days. Purchases are non-refundable except when legally required.',
    termsOwnership: 'Content Ownership',
    termsOwnershipContent: 'You own the rights to your uploads (photos, names, voices). You must not upload celebrity likenesses, copyrighted, or offensive material. Generated content is yours to use for personal or commercial purposes.',
    termsProhibited: 'Prohibited Use',
    termsProhibitedContent: 'No misuse (illegal, harmful, abusive, or hateful content). No attempts to reverse engineer or overload the service.',
    termsAvailability: 'Service Availability',
    termsAvailabilityContent: 'We may update, pause, or stop features at any time. We do not guarantee uninterrupted availability.',
    termsLiability: 'Liability',
    termsLiabilityContent: 'Rawi App is not liable for damages from use or inability to use the service. Use at your own risk.',
    termsLaw: 'Governing Law & Disputes',
    termsLawContent: 'These Terms are governed by the laws of the United Arab Emirates. Any disputes will be resolved in the courts of Abu Dhabi.',
    termsChanges: 'Changes',
    termsChangesContent: 'Terms may change; updates will be posted on this page.',
    // Privacy Policy Content
    privacyData: 'Data We Collect',
    privacyDataContent: 'Account info (name, email, sign-in provider). Uploaded images, text prompts, generated results. Usage data (pages visited, device, language).',
    privacyUse: 'How We Use Data',
    privacyUseContent: 'To provide generations (images, video, music). To improve service and templates. To prevent abuse and enforce Terms.',
    privacySharing: 'Sharing',
    privacySharingContent: 'We don\'t sell your data. We may share with providers (AI APIs, payment processors) only as needed.',
    privacyStorage: 'Storage & Retention',
    privacyStorageContent: 'Guest trial assets may be deleted after 7 days. Paid outputs stored until deleted by user. You can request deletion anytime.',
    privacySecurity: 'Security',
    privacySecurityContent: 'We use industry-standard encryption. No system is 100% secure; use at your own risk.',
    privacyContact: 'Contact',
    privacyContactContent: 'For privacy requests: support@rawiapp.io',
    // FAQ Content
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
    templates: 'القوالب',
    tryFree: 'جرب مجاناً',
    help: 'مساعدة',
    signIn: 'تسجيل الدخول',
    credits: 'رصيد',
    terms: 'الشروط',
    privacy: 'الخصوصية',
    consent: 'الموافقة',
    heroHeadline: 'حوّل صورك إلى لقطات سينمائية.',
    heroSubtext: 'جرّب إعلانًا قصيرًا مجانًا. طوّر لحفظ وتنزيل العروض الكاملة.',
    tryFreeButton: 'جرب مجاناً',
    browseTemplates: 'تصفح القوالب',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    consentIpPolicy: 'سياسة الموافقة والملكية الفكرية',
    legalPlaceholder: 'هذا نص تجريبي للمحتوى القانوني. يرجى استشارة المتخصصين القانونيين لإنشاء محتوى مناسب لولايتك القضائية.',
    helpPageTitle: 'المساعدة والدعم',
    helpPageSubtitle: 'احصل على المساعدة والدعم لاستخدام أدوات تحرير الصور السينمائية في تطبيق راوي.',
    faqTitle: 'الأسئلة الشائعة',
    // Terms & Conditions Content (Arabic)
    termsAcceptance: 'القبول',
    termsAcceptanceContent: 'باستخدامك لتطبيق راوي فأنت توافق على هذه الشروط. يجب أن يكون عمرك ١٣ سنة أو أكثر.',
    termsCredits: 'الرصيد والدفع',
    termsCreditsContent: 'كل عملية إنشاء تستهلك رصيد. الرصيد ينتهي بعد ٩٠ يوم. المشتريات غير قابلة للاسترجاع إلا إذا طلب القانون.',
    termsOwnership: 'ملكية المحتوى',
    termsOwnershipContent: 'أنت تملك حقوق الملفات التي ترفعها (صور، أسماء، أصوات). يمنع رفع صور المشاهير أو مواد محمية أو مسيئة. المحتوى الناتج ملك لك للاستخدام الشخصي أو التجاري.',
    termsProhibited: 'الاستخدام المحظور',
    termsProhibitedContent: 'يمنع الاستخدام غير القانوني أو المسيء أو المؤذي. يمنع محاولة فك أو تعطيل الخدمة.',
    termsAvailability: 'توفر الخدمة',
    termsAvailabilityContent: 'قد نقوم بتحديث أو إيقاف الميزات في أي وقت. لا نضمن التوفر المستمر للخدمة.',
    termsLiability: 'المسؤولية',
    termsLiabilityContent: 'تطبيق راوي غير مسؤول عن أي أضرار ناتجة عن الاستخدام أو التوقف. الاستخدام على مسؤوليتك الخاصة.',
    termsLaw: 'القانون والاختصاص',
    termsLawContent: 'تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة. أي نزاع يتم حله في محاكم أبوظبي.',
    termsChanges: 'التغييرات',
    termsChangesContent: 'قد يتم تعديل الشروط، وسيتم نشر التحديثات هنا.',
    // Privacy Policy Content (Arabic)
    privacyData: 'البيانات التي نجمعها',
    privacyDataContent: 'معلومات الحساب (اسم، بريد إلكتروني، مزود تسجيل). الصور والنصوص المرفوعة والنتائج الناتجة. بيانات الاستخدام (صفحات، جهاز، لغة).',
    privacyUse: 'كيفية استخدام البيانات',
    privacyUseContent: 'لتوفير الخدمة وإنشاء المحتوى. لتحسين القوالب والخدمة. لمنع الإساءة وتطبيق الشروط.',
    privacySharing: 'مشاركة البيانات',
    privacySharingContent: 'لا نقوم ببيع بياناتك. قد نشارك مع مزودي الخدمة (الذكاء الاصطناعي، الدفع) عند الحاجة فقط.',
    privacyStorage: 'التخزين والاحتفاظ',
    privacyStorageContent: 'ملفات التجربة المجانية قد تُحذف بعد ٧ أيام. الملفات المدفوعة تبقى حتى يقوم المستخدم بحذفها. يمكنك طلب الحذف في أي وقت.',
    privacySecurity: 'الأمان',
    privacySecurityContent: 'نستخدم تشفير بمعايير عالية. لا يوجد نظام آمن ١٠٠٪. الاستخدام على مسؤوليتك.',
    privacyContact: 'التواصل',
    privacyContactContent: 'لأي طلب خصوصية: support@rawiapp.io',
    // FAQ Content (Arabic)
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
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={language === 'ar' ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};