// App Configuration
// These environment variables should be set in your deployment environment
export const config = {
  // Stripe configuration
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder',
  
  // API configuration  
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api',
  
  // Analytics configuration
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID || 'GA_PLACEHOLDER_ID',
  
  // App metadata
  APP_NAME: 'Rawi App',
  APP_DESCRIPTION: 'Cinematic AI Generator',
  
  // Environment
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Feature Flags
// These control the availability of features across the application
export const featureFlags = {
  // Subscription features
  WEEKLY_SUBS_ENABLED: false,
  
  // Experimental features  
  ADVANCED_ANALYTICS_ENABLED: false,
  BETA_FEATURES_ENABLED: false,
  
  // Payment features
  PROMO_CODES_ENABLED: true,
  GUEST_CHECKOUT_ENABLED: true,
  
  // UI features
  DARK_MODE_TOGGLE_ENABLED: true,
  RTL_SUPPORT_ENABLED: true,
} as const;

// Type definitions for better TypeScript support
export type Config = typeof config;
export type FeatureFlags = typeof featureFlags;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags[flag];
};

// Helper function to get config value safely
export const getConfig = <T extends keyof Config>(key: T): Config[T] => {
  return config[key];
};