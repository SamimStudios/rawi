import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Check, AlertCircle } from 'lucide-react';

export const SetupStripeProducts = () => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-stripe-products');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stripe products have been created successfully",
      });
      setCompleted(true);
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Error",
        description: "Failed to create Stripe products. Check the console for details.",
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
            Stripe Products Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">
            All Stripe products and prices have been created successfully. 
            You can now process payments!
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
          Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-yellow-600 mb-4">
          Stripe products need to be created before payments can be processed.
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
          {loading ? 'Creating Products...' : 'Setup Stripe Products'}
        </Button>
      </CardContent>
    </Card>
  );
};