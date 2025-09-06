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
    faq1Question: 'How do I create a cinematic teaser?',
    faq1Answer: 'Upload your photos, select a template, and our AI will generate a cinematic teaser for you automatically.',
    faq2Question: 'Is the free trial really free?',
    faq2Answer: 'Yes! You can create and preview teasers for free. Upgrade to download and access premium features.',
    faq3Question: 'What file formats are supported?',
    faq3Answer: 'We support JPG, PNG, and other common image formats. Videos can be exported in MP4 format.',
    faq4Question: 'How do I contact support?',
    faq4Answer: 'You can reach our support team through the contact form or email us directly for assistance.',
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
    faq1Question: 'كيف أقوم بإنشاء إعلان سينمائي؟',
    faq1Answer: 'قم برفع صورك، اختر قالبًا، وسيقوم الذكاء الاصطناعي بإنشاء إعلان سينمائي لك تلقائيًا.',
    faq2Question: 'هل التجربة المجانية مجانية حقًا؟',
    faq2Answer: 'نعم! يمكنك إنشاء ومعاينة الإعلانات مجانًا. قم بالترقية للتحميل والوصول إلى الميزات المتميزة.',
    faq3Question: 'ما هي صيغ الملفات المدعومة؟',
    faq3Answer: 'ندعم صيغ JPG وPNG وصيغ الصور الشائعة الأخرى. يمكن تصدير الفيديوهات بصيغة MP4.',
    faq4Question: 'كيف أتواصل مع الدعم؟',
    faq4Answer: 'يمكنك التواصل مع فريق الدعم من خلال نموذج الاتصال أو مراسلتنا مباشرة للحصول على المساعدة.',
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