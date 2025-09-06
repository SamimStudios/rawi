import { config, getConfig, type Config } from '@/config/app';

/**
 * Custom hook for accessing application configuration
 * Provides a centralized way to access environment variables and app settings
 */
export const useConfig = () => {
  return {
    // All configuration values
    config,
    
    // Helper function to get config values safely
    get: getConfig,
    
    // Individual config accessors for convenience
    stripePublicKey: config.STRIPE_PUBLIC_KEY,
    apiBase: config.API_BASE,
    analyticsId: config.ANALYTICS_ID,
    appName: config.APP_NAME,
    appDescription: config.APP_DESCRIPTION,
    isDevelopment: config.IS_DEVELOPMENT,
    isProduction: config.IS_PRODUCTION,
  };
};

/**
 * Type-safe config value getter
 */
export const useConfigValue = <T extends keyof Config>(key: T): Config[T] => {
  return getConfig(key);
};