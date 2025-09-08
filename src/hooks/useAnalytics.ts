import { useAnalytics as useAnalyticsContext, useTrackEvent } from '@/contexts/AnalyticsContext';

/**
 * Re-export analytics hooks for easier imports
 */
export const useAnalytics = useAnalyticsContext;
export { useTrackEvent };

/**
 * Predefined event tracking hooks for common actions
 */
export const usePageTracking = () => {
  const trackEvent = useTrackEvent();
  
  return {
    trackPageView: (pageName: string, properties?: Record<string, any>) => {
      trackEvent('Page View', { page: pageName, ...properties });
    },
    trackFeatureUsage: (featureName: string, properties?: Record<string, any>) => {
      trackEvent('Feature Used', { feature: featureName, ...properties });
    },
    trackUserAction: (actionName: string, properties?: Record<string, any>) => {
      trackEvent('User Action', { action: actionName, ...properties });
    },
  };
};

/**
 * Commerce event tracking
 */
export const useCommerceTracking = () => {
  const trackEvent = useTrackEvent();
  
  return {
    trackPurchaseStarted: (plan: string, amount: number, currency: string = 'AED') => {
      trackEvent('Purchase Started', { plan, amount, currency });
    },
    trackPurchaseCompleted: (plan: string, amount: number, currency: string = 'AED') => {
      trackEvent('Purchase Completed', { plan, amount, currency });
    },
    trackSubscriptionStarted: (plan: string, interval: string, amount: number) => {
      trackEvent('Subscription Started', { plan, interval, amount });
    },
    trackCreditsPurchased: (credits: number, amount: number, currency: string = 'AED') => {
      trackEvent('Credits Purchased', { credits, amount, currency });
    },
    trackPurchase: (item: string, credits: number, amount: number, currency: string = 'AED') => {
      trackEvent('Purchase', { item, credits, amount, currency });
    },
    trackViewItem: (item: string, credits: number, amount: number) => {
      trackEvent('View Item', { item, credits, amount });
    },
  };
};