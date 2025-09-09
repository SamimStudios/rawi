import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAnalytics, usePageTracking, useCommerceTracking } from '@/hooks/useAnalytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3, Cookie, Activity, ShoppingCart } from 'lucide-react';

const AnalyticsDemo = () => {
  const { isEnabled, hasConsented, enableAnalytics, disableAnalytics, trackEvent } = useAnalytics();
  const { trackPageView, trackFeatureUsage, trackUserAction } = usePageTracking();
  const { trackPurchaseStarted, trackCreditsPurchased } = useCommerceTracking();
  const { t } = useLanguage();

  const [customEvent, setCustomEvent] = useState('');
  const [customProps, setCustomProps] = useState('');
  const [eventCount, setEventCount] = useState(0);

  const handleCustomEvent = () => {
    try {
      const props = customProps ? JSON.parse(customProps) : undefined;
      trackEvent(customEvent || 'Custom Event', props);
      setEventCount(prev => prev + 1);
    } catch (error) {
      console.error('Invalid JSON in properties:', error);
    }
  };

  const handleTestEvents = () => {
    trackPageView('Analytics Demo');
    trackFeatureUsage('Analytics Testing');
    trackUserAction('Test Button Click');
    trackPurchaseStarted('premium-plan', 299, 'AED');
    trackCreditsPurchased(100, 100, 'AED');
    setEventCount(prev => prev + 5);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Analytics & Cookie Consent Demo
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Lightweight analytics integration with Plausible and cookie consent management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analytics Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Analytics Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">User Consent</span>
                  <Badge variant={hasConsented ? "default" : "secondary"}>
                    {hasConsented ? "Given" : "Not Given"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Plausible Status</span>
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {isEnabled ? "Loaded" : "Not Loaded"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Domain</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded-[var(--radius)]">
                    rawiapp.io
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Events Tracked</span>
                  <Badge variant="outline">
                    {eventCount}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={enableAnalytics}
                    disabled={hasConsented}
                  >
                    Enable Analytics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disableAnalytics}
                    disabled={!hasConsented}
                  >
                    Disable Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cookie Consent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-primary" />
                  Cookie Consent Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Features</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• RTL (Arabic) language support</li>
                    <li>• Persistent consent storage</li>
                    <li>• Privacy Policy integration</li>
                    <li>• Dismissible with X button</li>
                    <li>• Auto-hides after consent</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Implementation</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Fixed position at bottom</li>
                    <li>• Plausible analytics integration</li>
                    <li>• LocalStorage for persistence</li>
                    <li>• Responsive design</li>
                  </ul>
                </div>

                <div className="p-3 bg-muted rounded-[var(--radius)] text-sm">
                  <strong>Banner Text:</strong><br />
                  "We use cookies to improve Rawi. By using the site you agree to our Privacy Policy."
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Tracking */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Event Tracking Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Predefined Events</h4>
                  <Button 
                    onClick={handleTestEvents}
                    disabled={!hasConsented}
                    variant="primary"
                    className="w-full"
                  >
                    Fire Test Events (5)
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Page View: Analytics Demo</p>
                    <p>• Feature Used: Analytics Testing</p>
                    <p>• User Action: Test Button Click</p>
                    <p>• Purchase Started: premium-plan (299 AED)</p>
                    <p>• Credits Purchased: 100 credits (100 AED)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Custom Event</h4>
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event Name</Label>
                    <Input
                      id="event-name"
                      placeholder={t('customEventName')}
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-props">Properties (JSON)</Label>
                    <Input
                      id="event-props"
                      placeholder='{"key": "value"}'
                      value={customProps}
                      onChange={(e) => setCustomProps(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCustomEvent}
                    disabled={!hasConsented}
                    variant="outline"
                    className="w-full"
                  >
                    Track Custom Event
                  </Button>
                </div>
              </div>

              {!hasConsented && (
                <div className="p-4 bg-accent/10 rounded-[var(--radius)] text-center">
                  <p className="text-sm text-muted-foreground">
                    Please accept cookies to test event tracking functionality.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Implementation Details */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Implementation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Analytics Context</h4>
                  <pre className="text-xs overflow-x-auto p-3 bg-muted rounded-[var(--radius)]">
{`// Usage
import { useAnalytics } from '@/hooks/useAnalytics';

const { 
  isEnabled, 
  hasConsented, 
  trackEvent 
} = useAnalytics();

// Track events
trackEvent('Button Click', { 
  button: 'subscribe',
  plan: 'premium' 
});`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Commerce Tracking</h4>
                  <pre className="text-xs overflow-x-auto p-3 bg-muted rounded-[var(--radius)]">
{`// Usage
import { useCommerceTracking } from '@/hooks/useAnalytics';

const { 
  trackPurchaseStarted,
  trackCreditsPurchased 
} = useCommerceTracking();

// E-commerce events
trackPurchaseStarted('pro-plan', 299, 'AED');
trackCreditsPurchased(100, 100, 'AED');`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDemo;