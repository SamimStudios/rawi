import React, { useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { ResolvedWidget } from './ResolvedWidget';
import { useNodeDefinition } from '@/hooks/useNodeDefinition';
import { useFieldRegistry } from '@/hooks/useFieldRegistry';
import { useFieldResolver, FieldItem } from '@/hooks/useFieldResolver';
import { useToast } from '@/hooks/use-toast';

interface DynamicUserInputFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}


export const DynamicUserInputForm: React.FC<DynamicUserInputFormProps> = ({
  onSubmit,
  loading: submitLoading = false,
  initialData = {}
}) => {
  const { toast } = useToast();
  
  // Fetch the node definition for user input form
  const { nodeDefinition, loading: nodeLoading, error: nodeError } = useNodeDefinition('root.user_input.form');
  
  // Get field items from node definition
  const fieldItems: FieldItem[] = useMemo(() => {
    if (!nodeDefinition?.content_template) return [];
    
    // Transform from old format to new format
    return (nodeDefinition.content_template as any[]).map(item => ({
      schema_ref_id: item.ref?.split('.').pop() || item.ref,
      required: item.hierarchy === 'important',
      value: item.value,
      group: item.group
    }));
  }, [nodeDefinition]);

  // Extract field IDs for registry lookup
  const extractedFieldIds = useMemo(() => {
    return fieldItems.map(item => item.schema_ref_id).filter((id, index, arr) => arr.indexOf(id) === index);
  }, [fieldItems]);

  // Fetch field registry entries
  const { fields, loading: fieldsLoading, error: fieldsError } = useFieldRegistry(extractedFieldIds);

  // Initialize form
  const methods = useForm({
    defaultValues: initialData
  });

  // Use field resolver (only resolve once, not on every form change)
  const { groupedFields, summary } = useFieldResolver({
    fieldItems,
    fieldRegistry: fields,
    currentValues: {}, // Don't pass current values to prevent re-renders
    editMode: {
      has_editables: true,
      validation: { mode: 'lenient' }
    },
    locale: 'en'
  });

  const handleSubmit = (formData: any) => {
    try {
      // Map form data to structured format based on field groups
      const mappedData: any = {};
      
      fieldItems.forEach(item => {
        const value = formData[item.schema_ref_id];
        if (value !== undefined) {
          if (item.group) {
            const parts = item.group.split('.');
            let current = mappedData;
            for (let i = 0; i < parts.length; i++) {
              if (!current[parts[i]]) current[parts[i]] = {};
              current = current[parts[i]];
            }
            current[item.schema_ref_id] = value;
          } else {
            mappedData[item.schema_ref_id] = value;
          }
        }
      });
      
      onSubmit(mappedData);
    } catch (error) {
      toast({
        title: "Form Error",
        description: "Failed to process form data",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (nodeLoading || fieldsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (nodeError || fieldsError) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <h3 className="text-lg font-semibold mb-2">Configuration Error</h3>
            <p>{nodeError || fieldsError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No configuration found
  if (!nodeDefinition) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">No Form Configuration</h3>
            <p>User input form configuration not found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-8">
        {summary.blockingErrors.length > 0 && (
          <Card className="max-w-2xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive">
                <h3 className="font-semibold mb-2">Please fix the following issues:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {summary.blockingErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedFields).map(([groupName, groupFields]) => (
          <Card key={groupName} className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl capitalize">
                {groupName === 'default' ? 'Basic Information' : groupName.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupFields.map((field) => (
                <ResolvedWidget
                  key={field.id}
                  field={field}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={submitLoading || !summary.isValid}
            className="min-w-[200px]"
          >
            {submitLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Storyboard'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};