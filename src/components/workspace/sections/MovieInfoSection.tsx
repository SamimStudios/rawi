import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Edit, Save, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MovieInfoSectionProps {
  data: any;
  isEditing: boolean;
  isGenerating: boolean;
  validation: any;
  onUpdate: (data: any) => void;
  onGenerate: () => void;
  onValidate?: (data: any) => void;
  generateFunctionId?: string;
  validateFunctionId?: string;
  onSetEditMode: (enabled: boolean) => void;
  isMobile: boolean;
}

export function MovieInfoSection({
  data,
  isEditing,
  isGenerating,
  validation,
  onUpdate,
  onGenerate,
  onValidate,
  generateFunctionId,
  validateFunctionId,
  onSetEditMode,
  isMobile
}: MovieInfoSectionProps) {
  const { t } = useLanguage();
  
  const [localData, setLocalData] = React.useState(data || {
    title: '',
    logline: '',
    world: '',
    look: ''
  });
  
  // Update local data when external data changes
  React.useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);
  
  const handleFieldChange = (field: string, value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    if (isEditing) {
      onUpdate(newData);
    }
  };
  
  const handleSave = () => {
    onUpdate(localData);
    onSetEditMode(false);
  };
  
  const handleCancel = () => {
    setLocalData(data || {});
    onSetEditMode(false);
  };
  
  const isComplete = localData.title && localData.logline && localData.world && localData.look;
  
  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete && !isEditing && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {t('sectionComplete') || 'Section Complete'}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetEditMode(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('edit')}
              </Button>
              {onValidate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onValidate(localData)}
                  className="flex items-center gap-2"
                  functionId={validateFunctionId}
                  showCredits
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('validate')}
                </Button>
              )}
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2"
                functionId={generateFunctionId}
                showCredits
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isGenerating ? t('generating') : t('generate')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('save')}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Form fields */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Movie Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            {t('movieTitle')} *
          </Label>
          <Input
            id="title"
            value={localData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder={t('enterMovieTitle') || 'Enter movie title...'}
            disabled={!isEditing}
            className={cn(
              !isEditing && "bg-muted/50 cursor-default",
              validation?.fields?.title === 'invalid' && "border-red-500"
            )}
          />
        </div>
        
        {/* Logline */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="logline" className="text-sm font-medium">
            {t('logline')} *
          </Label>
          <Textarea
            id="logline"
            value={localData.logline}
            onChange={(e) => handleFieldChange('logline', e.target.value)}
            placeholder={t('enterLogline') || 'Enter a compelling one-line summary...'}
            disabled={!isEditing}
            rows={3}
            className={cn(
              !isEditing && "bg-muted/50 cursor-default resize-none",
              validation?.fields?.logline === 'invalid' && "border-red-500"
            )}
          />
        </div>
        
        {/* World Description */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="world" className="text-sm font-medium">
            {t('world')} *
          </Label>
          <Textarea
            id="world"
            value={localData.world}
            onChange={(e) => handleFieldChange('world', e.target.value)}
            placeholder={t('describeWorld') || 'Describe the world and setting...'}
            disabled={!isEditing}
            rows={4}
            className={cn(
              !isEditing && "bg-muted/50 cursor-default resize-none",
              validation?.fields?.world === 'invalid' && "border-red-500"
            )}
          />
        </div>
        
        {/* Visual Style */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="look" className="text-sm font-medium">
            {t('visualStyle')} *
          </Label>
          <Textarea
            id="look"
            value={localData.look}
            onChange={(e) => handleFieldChange('look', e.target.value)}
            placeholder={t('describeVisualStyle') || 'Describe the visual style and mood...'}
            disabled={!isEditing}
            rows={4}
            className={cn(
              !isEditing && "bg-muted/50 cursor-default resize-none",
              validation?.fields?.look === 'invalid' && "border-red-500"
            )}
          />
        </div>
      </div>
      
      {/* Validation message */}
      {validation?.message && (
        <div className={cn(
          "p-3 rounded-lg text-sm border",
          validation.status === 'invalid' 
            ? "bg-red-50 text-red-700 border-red-200" 
            : validation.status === 'valid'
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-blue-50 text-blue-700 border-blue-200"
        )}>
          {validation.message.en || validation.message.ar}
          
          {/* Suggested fix */}
          {validation.suggestedFix && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <p className="font-medium mb-1">{t('suggestedFix') || 'Suggested Fix'}:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalData({ ...localData, ...validation.suggestedFix });
                  if (isEditing) {
                    onUpdate({ ...localData, ...validation.suggestedFix });
                  }
                }}
                className="text-xs"
              >
                {t('applySuggestion') || 'Apply Suggestion'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}