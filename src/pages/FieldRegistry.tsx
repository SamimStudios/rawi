import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DynamicFieldRenderer } from '@/components/field-registry/DynamicFieldRenderer';
import { FieldCard } from '@/components/field-registry/FieldCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldRegistry {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options: any;
  rules: any;
  ui: any;
  default_value: any;
  version: number;
  created_at: string;
  updated_at: string;
  resolvedOptions?: any[];
}

export default function FieldRegistry() {
  const [fields, setFields] = useState<FieldRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const fetchFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('field-registry-api');
      
      if (invokeError) {
        throw new Error(`Failed to fetch fields: ${invokeError.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setFields(data?.fields || []);
    } catch (err: any) {
      console.error('Error fetching fields:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load field registry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();

    // Set up real-time subscription
    const channel = supabase
      .channel('field-registry-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'field_registry'
        },
        (payload) => {
          console.log('Field registry change:', payload);
          fetchFields(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Field Registry</h1>
        <p className="text-muted-foreground mt-2">
          Dynamic field system with real-time updates. Total fields: {fields.length}
        </p>
      </div>

      <div className="grid gap-6">
        {fields.map((field) => (
          <FieldCard 
            key={field.id} 
            field={field} 
            formValues={formValues}
            onFieldChange={updateFieldValue}
          />
        ))}
      </div>

      {fields.length === 0 && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <p className="text-muted-foreground">No fields found in registry</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}