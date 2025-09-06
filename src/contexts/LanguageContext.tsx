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