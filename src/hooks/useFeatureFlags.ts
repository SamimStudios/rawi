import { featureFlags, isFeatureEnabled, type FeatureFlags } from '@/config/app';

/**
 * Custom hook for accessing feature flags throughout the application
 * Provides a centralized way to check feature availability
 */
export const useFeatureFlags = () => {
  return {
    // All feature flags
    flags: featureFlags,
    
    // Helper function to check if a feature is enabled
    isEnabled: isFeatureEnabled,
    
    // Individual feature flag accessors for convenience
    weeklySubsEnabled: featureFlags.WEEKLY_SUBS_ENABLED,
    advancedAnalyticsEnabled: featureFlags.ADVANCED_ANALYTICS_ENABLED,
    betaFeaturesEnabled: featureFlags.BETA_FEATURES_ENABLED,
    promoCodesEnabled: featureFlags.PROMO_CODES_ENABLED,
    guestCheckoutEnabled: featureFlags.GUEST_CHECKOUT_ENABLED,
    darkModeToggleEnabled: featureFlags.DARK_MODE_TOGGLE_ENABLED,
    rtlSupportEnabled: featureFlags.RTL_SUPPORT_ENABLED,
  };
};

/**
 * Type-safe feature flag checker
 */
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  return isFeatureEnabled(flag);
};