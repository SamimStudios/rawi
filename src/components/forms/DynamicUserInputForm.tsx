import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useNodeDefinition } from '@/hooks/useNodeDefinitionMock';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicFormField } from './DynamicFormField';
import { Skeleton } from '@/components/ui/skeleton';
import { startCase } from 'lodash';

interface DynamicUserInputFormProps {
  jobId?: string | null;
}

export function DynamicUserInputForm({ jobId }: DynamicUserInputFormProps) {
  const { user } = useAuth();
  const { sessionId } = useGuestSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useNodeDefinition();
  
  // Fetch existing job data if jobId is provided
  const { data: existingJob } = jobId ? useJobData(jobId) : { data: null };
  
  const form = useForm<Record<string, any>>({
    defaultValues: {}
  });

  // Create grouped fields
  const groupedFields = useMemo(() => {
    if (!data) return {};
    
    const groups: Record<string, typeof data.fieldItems> = {};
    data.fieldItems.forEach(item => {
      const group = item.group || 'General';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    return groups;
  }, [data]);

  // Initialize form values
  useEffect(() => {
    if (!data) return;

    const initialValues: Record<string, any> = {};
    
    data.fieldItems.forEach(item => {
      const registry = data.registryMap[item.ref];
      
      // Priority: existing job data > item.value > registry.default_value
      let value;
      
      if (existingJob?.user_input) {
        // Map from nested user_input structure back to flat form
        value = getValueFromUserInput(item.ref, existingJob.user_input);
      }
      
      if (value === undefined) {
        value = item.value;
      }
      
      if (value === undefined && registry?.default_value !== undefined) {
        value = registry.default_value;
      }
      
      initialValues[item.ref] = value;
    });

    form.reset(initialValues);
  }, [data, existingJob, form]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (formValues: Record<string, any>) => {
      const userInput = mapToUserInput(formValues);
      
      if (!jobId) {
        // Create new job
        const insertData: any = {
          user_input: userInput,
          user_input_updated_at: new Date().toISOString()
        };
        
        if (user) {
          insertData.user_id = user.id;
        } else if (sessionId) {
          insertData.session_id = sessionId;
        }
        
        const { data: newJob, error } = await supabase
          .from('storyboard_jobs')
          .insert(insertData)
          .select('id')
          .single();
          
        if (error) throw error;
        return newJob;
      } else {
        // Update existing job
        let query = supabase
          .from('storyboard_jobs')
          .update({
            user_input: userInput,
            user_input_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        if (!user && sessionId) {
          query = query.eq('session_id', sessionId);
        }
        
        const { error } = await query;
        if (error) throw error;
        return { id: jobId };
      }
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: jobId ? 'Form updated successfully!' : 'Form submitted successfully!',
      });
      
      if (!jobId && result?.id) {
        navigate(`/user-input?job_id=${result.id}`);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['storyboard-job'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save form: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Reset to defaults
  const resetToDefaults = () => {
    if (!data) return;
    
    const defaultValues: Record<string, any> = {};
    data.fieldItems.forEach(item => {
      const registry = data.registryMap[item.ref];
      defaultValues[item.ref] = item.value ?? registry?.default_value;
    });
    
    form.reset(defaultValues);
    toast({
      title: 'Reset',
      description: 'Form has been reset to default values'
    });
  };

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Form</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const onSubmit = (values: Record<string, any>) => {
    submitMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.definition.title}</CardTitle>
        {data.definition.description && (
          <CardDescription>{data.definition.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName} className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  {groupName}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.map((item) => {
                    const registry = data.registryMap[item.ref];
                    if (!registry) {
                      return (
                        <div key={item.ref} className="space-y-2">
                          <div className="text-sm text-destructive">
                            Unknown field: {item.ref}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <DynamicFormField
                        key={item.ref}
                        fieldItem={item}
                        registry={registry}
                        control={form.control}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetToDefaults}
                disabled={submitMutation.isPending}
              >
                Reset to Defaults
              </Button>
              
              <Button
                type="submit"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Saving...' : jobId ? 'Update' : 'Submit'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getValueFromUserInput(ref: string, userInput: any): any {
  // Handle dotted refs like 'lead.character_name' -> characters.lead.base.name
  if (ref.includes('.')) {
    const [category, field] = ref.split('.');
    if (category === 'lead' || category === 'supporting') {
      return userInput.characters?.[category]?.base?.[field.replace('character_', '')];
    }
  }
  
  // Handle direct refs
  return userInput[ref];
}

function mapToUserInput(formValues: Record<string, any>): any {
  const result: any = {
    characters: {
      lead: { base: {} },
      supporting: { base: {} }
    }
  };
  
  Object.entries(formValues).forEach(([ref, value]) => {
    if (ref.includes('.')) {
      const [category, field] = ref.split('.');
      if (category === 'lead' || category === 'supporting') {
        const mappedField = field.replace('character_', '');
        result.characters[category].base[mappedField] = value;
      }
    } else {
      result[ref] = value;
    }
  });
  
  return result;
}

function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-8">
        {[1, 2, 3].map((group) => (
          <div key={group} className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import useJobData from existing hook
function useJobData(jobId: string) {
  return useQuery({
    queryKey: ['storyboard-job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storyboard_jobs')
        .select('id, user_input')
        .eq('id', jobId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!jobId
  });
}