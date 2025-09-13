import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { DynamicWidget } from './DynamicWidget';
import { useNodeDefinition } from '@/hooks/useNodeDefinition';
import { useFieldRegistry } from '@/hooks/useFieldRegistry';
import { useFieldItem, FieldItem } from '@/hooks/useFieldItem';
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
  const fieldItems = (nodeDefinition?.content_template as FieldItem[]) || [];
  
  // Use field item processor hook
  const {
    extractedFieldIds,
    groupedFieldItems,
    getFieldRegistryEntry,
    mapFormDataToStructure,
    getFormDefaults
  } = useFieldItem({ 
    fieldItems, 
    fieldRegistry: [] // Will be populated once we fetch the data
  });

  // Fetch field registry entries based on extracted field IDs
  const { fields, getFieldById, loading: fieldsLoading, error: fieldsError } = useFieldRegistry(extractedFieldIds);

  // Update field item processor with fetched field registry
  const {
    groupedFieldItems: finalGroupedFieldItems,
    mapFormDataToStructure: finalMapFormData,
    getFormDefaults: finalGetFormDefaults
  } = useFieldItem({ 
    fieldItems, 
    fieldRegistry: fields
  });

  // Initialize form with defaults from field registry
  const formDefaults = finalGetFormDefaults();
  const methods = useForm({
    defaultValues: { ...formDefaults, ...initialData }
  });

  const handleSubmit = (formData: any) => {
    try {
      const mappedData = finalMapFormData(formData);
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
        {Object.entries(finalGroupedFieldItems).map(([groupName, groupFields]) => (
          <Card key={groupName} className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl capitalize">
                {groupName === 'default' ? 'Basic Information' : groupName.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupFields.map((item) => {
                const fieldDef = getFieldRegistryEntry(item);
                
                if (!fieldDef) {
                  return (
                    <div key={item.ref} className="p-4 border border-dashed border-muted rounded">
                      <p className="text-sm text-muted-foreground">
                        Field definition not found: {item.ref}
                      </p>
                    </div>
                  );
                }

                // Skip hidden fields
                if (item.hierarchy === 'hidden') return null;

                const baseFieldId = item.ref.split('.').pop()!;
                
                return (
                  <DynamicWidget
                    key={item.ref}
                    field={fieldDef}
                    name={baseFieldId}
                    label={item.label}
                    required={item.hierarchy === 'important'}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={submitLoading}
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