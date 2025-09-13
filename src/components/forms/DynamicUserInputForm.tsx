import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { DynamicWidget } from './DynamicWidget';
import { useNodeDefinition } from '@/hooks/useNodeDefinition';
import { useFieldRegistry } from '@/hooks/useFieldRegistry';
import { useToast } from '@/hooks/use-toast';

interface DynamicUserInputFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}

interface FieldItem {
  ref: string;
  value?: any;
  editable?: 'none' | 'simple' | 'n8n';
  hierarchy?: 'important' | 'default' | 'small' | 'hidden';
  removable?: boolean;
  label?: string;
  group?: string;
}

export const DynamicUserInputForm: React.FC<DynamicUserInputFormProps> = ({
  onSubmit,
  loading: submitLoading = false,
  initialData = {}
}) => {
  const { toast } = useToast();
  
  // Fetch the node definition for user input form
  const { nodeDefinition, loading: nodeLoading, error: nodeError } = useNodeDefinition('root.user_input.form');
  
  // Extract field references from node definition
  const fieldRefs = useMemo(() => {
    if (!nodeDefinition?.content_template) return [];
    
    return (nodeDefinition.content_template as FieldItem[])
      .map(item => {
        // Extract base field ID from dotted references
        // e.g., "lead.character_name" -> "character_name"
        // e.g., "supporting.character_gender" -> "character_gender"
        // e.g., "size" -> "size"
        const parts = item.ref.split('.');
        return parts[parts.length - 1];
      })
      .filter((ref, index, arr) => arr.indexOf(ref) === index); // Remove duplicates
  }, [nodeDefinition]);

  // Fetch field registry entries
  const { fields, getFieldById, loading: fieldsLoading, error: fieldsError } = useFieldRegistry(fieldRefs);

  // Initialize form
  const methods = useForm({
    defaultValues: initialData
  });

  // Group fields by their group property
  const groupedFields = useMemo(() => {
    if (!nodeDefinition?.content_template || !fields.length) return {};
    
    const groups: Record<string, FieldItem[]> = {};
    
    (nodeDefinition.content_template as FieldItem[]).forEach(item => {
      const group = item.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    return groups;
  }, [nodeDefinition, fields]);

  // Map field references to their paths for form submission
  const mapFormDataToUserInput = (formData: any) => {
    const userInput: any = {};
    
    if (!nodeDefinition?.content_template) return userInput;
    
    (nodeDefinition.content_template as FieldItem[]).forEach(item => {
      const parts = item.ref.split('.');
      const baseFieldId = parts[parts.length - 1];
      const value = formData[baseFieldId];
      
      if (value !== undefined) {
        if (parts.length === 1) {
          // Simple field (e.g., "size", "language", "genres")
          userInput[parts[0]] = value;
        } else if (parts.length === 2) {
          // Nested field (e.g., "lead.character_name", "supporting.character_gender")
          const [category, field] = parts;
          if (!userInput[category]) userInput[category] = {};
          userInput[category][field] = value;
        }
      }
    });
    
    return userInput;
  };

  const handleSubmit = (formData: any) => {
    try {
      const mappedData = mapFormDataToUserInput(formData);
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
        {Object.entries(groupedFields).map(([groupName, groupFields]) => (
          <Card key={groupName} className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl capitalize">
                {groupName === 'default' ? 'Basic Information' : groupName.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupFields.map((item) => {
                const baseFieldId = item.ref.split('.').pop()!;
                const fieldDef = getFieldById(baseFieldId);
                
                if (!fieldDef) {
                  return (
                    <div key={item.ref} className="p-4 border border-dashed border-muted rounded">
                      <p className="text-sm text-muted-foreground">
                        Field definition not found: {baseFieldId}
                      </p>
                    </div>
                  );
                }

                // Skip hidden fields
                if (item.hierarchy === 'hidden') return null;

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