# App Configuration & Feature Flags

This directory contains the centralized configuration management system for the Rawi App.

## Files

- `app.ts` - Main configuration file with environment variables and feature flags
- `README.md` - This documentation file

## Configuration

### Environment Variables

The app uses the following environment variables (set them in your deployment environment):

```bash
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# API Configuration  
VITE_API_BASE=https://your-api-domain.com/api

# Analytics Configuration
VITE_ANALYTICS_ID=GA-XXXXXXXXX
```

### Feature Flags

Feature flags control the availability of features across the application:

| Flag | Default | Description |
|------|---------|-------------|
| `WEEKLY_SUBS_ENABLED` | `false` | Show weekly subscription options in wallet |
| `ADVANCED_ANALYTICS_ENABLED` | `false` | Enable advanced analytics features |
| `BETA_FEATURES_ENABLED` | `false` | Show experimental beta features |
| `PROMO_CODES_ENABLED` | `true` | Allow promo code input in checkout |
| `GUEST_CHECKOUT_ENABLED` | `true` | Allow checkout without registration |
| `DARK_MODE_TOGGLE_ENABLED` | `true` | Show dark mode toggle button |
| `RTL_SUPPORT_ENABLED` | `true` | Enable right-to-left language support |

## Usage

### Using Configuration Values

```typescript
import { useConfig } from '@/hooks/useConfig';

const MyComponent = () => {
  const { get, config } = useConfig();
  
  // Get individual values
  const apiBase = get('API_BASE');
  const stripeKey = config.STRIPE_PUBLIC_KEY;
  
  return <div>API Base: {apiBase}</div>;
};
```

### Using Feature Flags

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const MyComponent = () => {
  const { isEnabled, flags } = useFeatureFlags();
  
  return (
    <div>
      {isEnabled('WEEKLY_SUBS_ENABLED') && (
        <Button>Weekly Plan</Button>
      )}
      
      {flags.PROMO_CODES_ENABLED && (
        <Input placeholder="Promo Code" />
      )}
    </div>
  );
};
```

### Direct Imports

```typescript
import { config, featureFlags, isFeatureEnabled, getConfig } from '@/config/app';

// Direct access
const apiUrl = config.API_BASE + '/endpoint';
const weeklyEnabled = featureFlags.WEEKLY_SUBS_ENABLED;

// Using helper functions
const stripeKey = getConfig('STRIPE_PUBLIC_KEY');
const betaEnabled = isFeatureEnabled('BETA_FEATURES_ENABLED');
```

## Adding New Configuration

### Environment Variables

1. Add the variable to `app.ts`:
```typescript
export const config = {
  // ... existing config
  NEW_API_KEY: import.meta.env.VITE_NEW_API_KEY || 'default_value',
} as const;
```

2. Update the `Config` type automatically through TypeScript inference

3. Set the environment variable in your deployment

### Feature Flags

1. Add the flag to `app.ts`:
```typescript
export const featureFlags = {
  // ... existing flags
  NEW_FEATURE_ENABLED: false,
} as const;
```

2. Update the `FeatureFlags` type automatically through TypeScript inference

3. Use the flag in your components with `isFeatureEnabled('NEW_FEATURE_ENABLED')`

## Demo

Visit `/config-demo` to see a live demonstration of the configuration and feature flag system.
