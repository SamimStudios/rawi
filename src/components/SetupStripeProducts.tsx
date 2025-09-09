import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const SetupStripeProducts = () => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-stripe-products');

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('stripeSetupSuccess'),
      });
      setCompleted(true);
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: t('error'),
        description: t('stripeSetupError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            {t('stripeProductsCreated')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">
            {t('stripeSetupSuccess')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          {t('setupRequired')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-600 mb-4">
          {t('stripeSetupDescription')}
        </p>
        <Button 
          onClick={handleSetup}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {loading ? t('creatingProducts') : t('setupStripeProducts')}
        </Button>
      </CardContent>
    </Card>
  );
};