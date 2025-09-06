import React, { createContext, useContext, useEffect, useState } from 'react';
import { config, featureFlags } from '@/config/app';

interface AnalyticsContextType {
  isEnabled: boolean;
  hasConsented: boolean;
  enableAnalytics: () => void;
  disableAnalytics: () => void;
  trackEvent: (eventName: string, props?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

const CONSENT_KEY = 'rawi_analytics_consent';
const PLAUSIBLE_DOMAIN = 'rawiapp.io'; // Placeholder domain

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Check for existing consent
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === 'true') {
      setHasConsented(true);
      initializePlausible();
    }
  }, []);

  const initializePlausible = () => {
    if (!featureFlags.ADVANCED_ANALYTICS_ENABLED && !config.IS_DEVELOPMENT) {
      return;
    }

    // Initialize Plausible script
    if (!document.querySelector('script[data-domain]')) {
      const script = document.createElement('script');
      script.defer = true;
      script.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
      script.src = 'https://plausible.io/js/script.js';
      
      script.onload = () => {
        setIsEnabled(true);
        console.log('[Analytics] Plausible initialized');
      };
      
      script.onerror = () => {
        console.warn('[Analytics] Failed to load Plausible');
      };
      
      document.head.appendChild(script);
    } else {
      setIsEnabled(true);
    }
  };

  const enableAnalytics = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsented(true);
    initializePlausible();
  };

  const disableAnalytics = () => {
    localStorage.setItem(CONSENT_KEY, 'false');
    setHasConsented(false);
    setIsEnabled(false);
    
    // Remove Plausible script if it exists
    const script = document.querySelector('script[data-domain]');
    if (script) {
      script.remove();
    }
  };

  const trackEvent = (eventName: string, props?: Record<string, any>) => {
    if (!isEnabled || !hasConsented) return;
    
    // Use Plausible's global function if available
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(eventName, { props });
    } else {
      console.log('[Analytics] Event tracked:', eventName, props);
    }
  };

  const value: AnalyticsContextType = {
    isEnabled,
    hasConsented,
    enableAnalytics,
    disableAnalytics,
    trackEvent,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Hook for easy event tracking
export const useTrackEvent = () => {
  const { trackEvent } = useAnalytics();
  return trackEvent;
};