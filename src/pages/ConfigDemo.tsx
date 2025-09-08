import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/hooks/useConfig';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings, Flag, Globe, CreditCard } from 'lucide-react';

const ConfigDemo = () => {
  const { config, get } = useConfig();
  const { flags, isEnabled } = useFeatureFlags();
  const { t } = useLanguage();

  const environmentVars = [
    { key: 'STRIPE_PUBLIC_KEY', value: config.STRIPE_PUBLIC_KEY, sensitive: true },
    { key: 'API_BASE', value: config.API_BASE, sensitive: false },
    { key: 'ANALYTICS_ID', value: config.ANALYTICS_ID, sensitive: true },
  ];

  const featureFlagsList = Object.entries(flags).map(([key, value]) => ({
    key,
    enabled: value,
    description: getFeatureDescription(key),
  }));

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                App Configuration & Feature Flags
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Centralized configuration management and feature flag system demonstration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Environment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Environment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {environmentVars.map((env) => (
                  <div key={env.key} className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{env.key}</span>
                      <Badge variant={env.sensitive ? "destructive" : "secondary"}>
                        {env.sensitive ? "Sensitive" : "Public"}
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted rounded-[var(--radius)] font-mono text-sm">
                      {env.sensitive ? maskSensitiveValue(env.value) : env.value}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-accent/10 rounded-[var(--radius)]">
                  <h4 className="font-semibold text-foreground mb-2">App Info</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {config.APP_NAME}</p>
                    <p><strong>Description:</strong> {config.APP_DESCRIPTION}</p>
                    <p><strong>Environment:</strong> {config.IS_DEVELOPMENT ? 'Development' : 'Production'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureFlagsList.map((flag) => (
                  <div key={flag.key} className="flex items-center justify-between p-3 border border-border rounded-[var(--radius)]">
                    <div>
                      <div className="font-medium text-foreground">{flag.key}</div>
                      <div className="text-sm text-muted-foreground">{flag.description}</div>
                    </div>
                    <Badge variant={flag.enabled ? "default" : "secondary"}>
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Usage Examples */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Usage Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Feature Flag Usage</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isEnabled('WEEKLY_SUBS_ENABLED') ? "default" : "secondary"}>
                      Weekly Subscriptions
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {isEnabled('WEEKLY_SUBS_ENABLED') ? 'Available in wallet' : 'Hidden from wallet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isEnabled('PROMO_CODES_ENABLED') ? "default" : "secondary"}>
                      Promo Codes
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {isEnabled('PROMO_CODES_ENABLED') ? 'Promo input shown' : 'Promo input hidden'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isEnabled('BETA_FEATURES_ENABLED') ? "default" : "secondary"}>
                      Beta Features
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {isEnabled('BETA_FEATURES_ENABLED') ? 'Beta menu visible' : 'Beta menu hidden'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Configuration Usage</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>API Calls:</strong> Using {get('API_BASE')} as base URL</p>
                  <p><strong>Stripe:</strong> Using {maskSensitiveValue(get('STRIPE_PUBLIC_KEY'))}</p>
                  <p><strong>Analytics:</strong> Tracking with {maskSensitiveValue(get('ANALYTICS_ID'))}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-[var(--radius)]">
                <h4 className="font-semibold text-foreground mb-2">Code Example</h4>
                <pre className="text-xs overflow-x-auto">
{`// Using feature flags
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
const { isEnabled } = useFeatureFlags();

// Conditional rendering
{isEnabled('WEEKLY_SUBS_ENABLED') && (
  <Button>Weekly Plan</Button>
)}

// Using configuration  
import { useConfig } from '@/hooks/useConfig';
const { get } = useConfig();

// API calls
fetch(get('API_BASE') + '/endpoint')`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

// Helper function to mask sensitive values
const maskSensitiveValue = (value: string): string => {
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
};

// Helper function to get feature descriptions
const getFeatureDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    WEEKLY_SUBS_ENABLED: 'Show weekly subscription options in wallet',
    ADVANCED_ANALYTICS_ENABLED: 'Enable advanced analytics features',
    BETA_FEATURES_ENABLED: 'Show experimental beta features',
    PROMO_CODES_ENABLED: 'Allow promo code input in checkout',
    GUEST_CHECKOUT_ENABLED: 'Allow checkout without registration',
    DARK_MODE_TOGGLE_ENABLED: 'Show dark mode toggle button',
    RTL_SUPPORT_ENABLED: 'Enable right-to-left language support',
  };
  return descriptions[key] || 'Feature flag configuration option';
};

export default ConfigDemo;