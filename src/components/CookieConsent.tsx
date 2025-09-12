import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { X, Cookie } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasConsented, enableAnalytics } = useAnalytics();
  const [isVisible, setIsVisible] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    // Show banner if user hasn't consented yet
    if (!hasConsented) {
      // Add a small delay to avoid flash on page load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasConsented]);

  const handleAccept = () => {
    enableAnalytics();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || hasConsented) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mobile-padding-sm p-2 sm:p-4 animate-fade-in">
      <Card className="max-w-4xl mx-auto card-enhanced shadow-glow backdrop-blur-xl">
        <div className={`mobile-padding p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          {/* Cookie Icon */}
          <div className="flex-shrink-0 hidden sm:block">
            <Cookie className="w-6 h-6 text-primary animate-float" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm sm:text-base text-foreground leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('cookieMessage')}
            </p>
          </div>

          {/* Action Buttons - Stacked on mobile, inline on desktop */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleAccept}
              className="whitespace-nowrap interactive-scale-small glow-primary"
            >
              {t('acceptCookies')}
            </Button>
            
            <Button
              variant="glass"
              size="sm"
              asChild
              className="whitespace-nowrap interactive-scale-small"
            >
              <Link to="/legal/privacy">
                {t('learnMore')}
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="w-8 h-8 interactive-scale-small sm:self-center"
              aria-label={t('dismiss')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;