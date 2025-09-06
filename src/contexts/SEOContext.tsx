import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

interface SEOContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  pageDescription: string;
  setPageDescription: (description: string) => void;
  pageImage: string;
  setPageImage: (image: string) => void;
  pageUrl: string;
  setPageUrl: (url: string) => void;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

// Default SEO content in both languages
const defaultSEO = {
  en: {
    title: 'Rawi App — Cinematic AI Generator',
    description: 'Transform your photos into cinematic masterpieces with AI. Create movie trailers, teasers, and stunning visuals. Try free today!',
    keywords: 'AI photo editor, cinematic photos, movie trailer maker, AI video generator, photo to video, cinematic AI',
  },
  ar: {
    title: 'تطبيق راوي — مولد سينمائي بالذكاء الاصطناعي',
    description: 'حوّل صورك إلى تحف سينمائية بالذكاء الاصطناعي. أنشئ مقاطع دعائية وإعلانات وصور مذهلة. جرب مجاناً اليوم!',
    keywords: 'محرر صور بالذكاء الاصطناعي، صور سينمائية، صانع إعلانات الأفلام، مولد فيديو بالذكاء الاصطناعي، صورة إلى فيديو، ذكاء اصطناعي سينمائي',
  }
};

export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [pageImage, setPageImage] = useState('/brand/og-default.jpg');
  const [pageUrl, setPageUrl] = useState('');

  // Update document title and meta tags when values change
  useEffect(() => {
    const defaultTitle = defaultSEO[language].title;
    const finalTitle = pageTitle ? `${pageTitle} | ${defaultTitle}` : defaultTitle;
    const finalDescription = pageDescription || defaultSEO[language].description;
    
    // Update document title
    document.title = finalTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = finalDescription;
      document.head.appendChild(meta);
    }
    
    // Update keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', defaultSEO[language].keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = defaultSEO[language].keywords;
      document.head.appendChild(meta);
    }
    
    // Update Open Graph tags
    const updateOrCreateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };
    
    const currentUrl = pageUrl || window.location.href;
    const imageUrl = pageImage.startsWith('/') ? `${window.location.origin}${pageImage}` : pageImage;
    
    updateOrCreateOGTag('og:title', finalTitle);
    updateOrCreateOGTag('og:description', finalDescription);
    updateOrCreateOGTag('og:image', imageUrl);
    updateOrCreateOGTag('og:url', currentUrl);
    updateOrCreateOGTag('og:type', 'website');
    updateOrCreateOGTag('og:site_name', 'Rawi App');
    updateOrCreateOGTag('og:locale', language === 'ar' ? 'ar_AE' : 'en_US');
    
    // Twitter Card tags
    const updateOrCreateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };
    
    updateOrCreateTwitterTag('twitter:card', 'summary_large_image');
    updateOrCreateTwitterTag('twitter:site', '@rawi_app');
    updateOrCreateTwitterTag('twitter:title', finalTitle);
    updateOrCreateTwitterTag('twitter:description', finalDescription);
    updateOrCreateTwitterTag('twitter:image', imageUrl);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', currentUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', currentUrl);
      document.head.appendChild(canonical);
    }
    
    // Language alternates
    const updateOrCreateAlternate = (hreflang: string, href: string) => {
      let tag = document.querySelector(`link[hreflang="${hreflang}"]`);
      if (tag) {
        tag.setAttribute('href', href);
      } else {
        tag = document.createElement('link');
        tag.setAttribute('rel', 'alternate');
        tag.setAttribute('hreflang', hreflang);
        tag.setAttribute('href', href);
        document.head.appendChild(tag);
      }
    };
    
    const baseUrl = window.location.origin + window.location.pathname;
    updateOrCreateAlternate('en', `${baseUrl}?lang=en`);
    updateOrCreateAlternate('ar', `${baseUrl}?lang=ar`);
    updateOrCreateAlternate('x-default', baseUrl);
    
  }, [pageTitle, pageDescription, pageImage, pageUrl, language]);

  const value: SEOContextType = {
    pageTitle,
    setPageTitle,
    pageDescription,
    setPageDescription,
    pageImage,
    setPageImage,
    pageUrl,
    setPageUrl,
  };

  return (
    <SEOContext.Provider value={value}>
      {children}
    </SEOContext.Provider>
  );
};

export const useSEO = (): SEOContextType => {
  const context = useContext(SEOContext);
  if (context === undefined) {
    throw new Error('useSEO must be used within a SEOProvider');
  }
  return context;
};