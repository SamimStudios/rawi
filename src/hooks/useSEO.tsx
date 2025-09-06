import { useEffect } from 'react';
import { useSEO } from '@/contexts/SEOContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
  type?: 'website' | 'article' | 'product';
}

/**
 * Hook for setting SEO metadata for individual pages
 * Usage: useSEOConfig({ title: 'Page Title', description: 'Page description' })
 */
export const useSEOConfig = (config: SEOConfig) => {
  const { setPageTitle, setPageDescription, setPageImage, setPageUrl } = useSEO();
  const { t } = useLanguage();

  useEffect(() => {
    if (config.title) {
      setPageTitle(config.title);
    }
    
    if (config.description) {
      setPageDescription(config.description);
    }
    
    if (config.image) {
      setPageImage(config.image);
    }
    
    if (config.url) {
      setPageUrl(config.url);
    }

    // Cleanup function to reset SEO data when component unmounts
    return () => {
      setPageTitle('');
      setPageDescription('');
      setPageImage('/brand/og-default.jpg');
      setPageUrl('');
    };
  }, [config, setPageTitle, setPageDescription, setPageImage, setPageUrl]);
};

/**
 * Predefined SEO configs for common pages
 */
export const seoConfigs = {
  homepage: {
    en: {
      title: '',
      description: 'Transform your photos into cinematic masterpieces with AI. Create movie trailers, teasers, and stunning visuals. Try free today!',
    },
    ar: {
      title: '',
      description: 'حوّل صورك إلى تحف سينمائية بالذكاء الاصطناعي. أنشئ مقاطع دعائية وإعلانات وصور مذهلة. جرب مجاناً اليوم!',
    }
  },
  templates: {
    en: {
      title: 'AI Cinematic Templates',
      description: 'Browse our collection of AI-powered cinematic templates. Create trailers, teasers, and movie scenes from your photos.',
    },
    ar: {
      title: 'قوالب سينمائية بالذكاء الاصطناعي',
      description: 'تصفح مجموعتنا من القوالب السينمائية المدعومة بالذكاء الاصطناعي. أنشئ إعلانات ومقاطع وصور من صورك.',
    }
  },
  help: {
    en: {
      title: 'Help & Support',
      description: 'Get help with Rawi App. Find answers to common questions and learn how to create stunning cinematic content.',
    },
    ar: {
      title: 'المساعدة والدعم',
      description: 'احصل على المساعدة مع تطبيق راوي. اعثر على إجابات للأسئلة الشائعة وتعلم كيفية إنشاء محتوى سينمائي مذهل.',
    }
  },
  signIn: {
    en: {
      title: 'Sign In',
      description: 'Sign in to your Rawi App account to access premium features and save your cinematic creations.',
    },
    ar: {
      title: 'تسجيل الدخول',
      description: 'سجل دخولك إلى حساب راوي للوصول إلى الميزات المميزة وحفظ إبداعاتك السينمائية.',
    }
  },
  signUp: {
    en: {
      title: 'Sign Up',
      description: 'Create your Rawi App account and start transforming your photos into cinematic masterpieces.',
    },
    ar: {
      title: 'إنشاء حساب',
      description: 'أنشئ حسابك في راوي وابدأ بتحويل صورك إلى تحف سينمائية.',
    }
  },
  dashboard: {
    en: {
      title: 'Dashboard',
      description: 'Your Rawi App dashboard. Access your projects, credits, and create new cinematic content.',
    },
    ar: {
      title: 'لوحة التحكم',
      description: 'لوحة تحكم راوي الخاصة بك. ادخل إلى مشاريعك والرصيد وأنشئ محتوى سينمائي جديد.',
    }
  },
  wallet: {
    en: {
      title: 'Wallet',
      description: 'Manage your credits and purchase more to create unlimited cinematic content with Rawi App.',
    },
    ar: {
      title: 'المحفظة',
      description: 'أدر رصيدك واشتر المزيد لإنشاء محتوى سينمائي لا محدود مع راوي.',
    }
  },
  history: {
    en: {
      title: 'My History',
      description: 'View all your past cinematic creations and download or share your favorite projects.',
    },
    ar: {
      title: 'تاريخي',
      description: 'اعرض جميع إبداعاتك السينمائية السابقة وحمّل أو شارك مشاريعك المفضلة.',
    }
  },
  settings: {
    en: {
      title: 'Settings',
      description: 'Manage your Rawi App account settings, preferences, and connected accounts.',
    },
    ar: {
      title: 'الإعدادات',
      description: 'أدر إعدادات حساب راوي والتفضيلات والحسابات المتصلة.',
    }
  }
};