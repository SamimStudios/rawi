import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface GenerateSectionProps {
  title: string;
  functionId?: string;
  isGenerating: boolean;
  hasData: boolean;
  canGenerate: boolean;
  validationStatus?: 'validating' | 'valid' | 'invalid' | null;
  validationMessage?: string;
  onGenerate: () => void;
  onValidate?: () => void;
  validateFunctionId?: string;
  children?: React.ReactNode;
  className?: string;
}

export function GenerateSection({
  title,
  functionId,
  isGenerating,
  hasData,
  canGenerate,
  validationStatus,
  validationMessage,
  onGenerate,
  onValidate,
  validateFunctionId,
  children,
  className
}: GenerateSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className={cn('border-dashed border-2', className)}>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h4 className="font-medium text-foreground mb-2">{title}</h4>
          
          {/* Status indicators */}
          {hasData && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-green-600">{t('dataGenerated') || 'Generated'}</span>
            </div>
          )}
          
          {validationStatus && (
            <div className={cn(
              'flex items-center justify-center gap-2 mb-3 text-xs',
              validationStatus === 'valid' && 'text-green-600',
              validationStatus === 'invalid' && 'text-red-600',
              validationStatus === 'validating' && 'text-orange-600'
            )}>
              {validationStatus === 'validating' && <Loader2 className="w-3 h-3 animate-spin" />}
              {validationStatus === 'valid' && <CheckCircle className="w-3 h-3" />}
              {validationStatus === 'invalid' && <AlertCircle className="w-3 h-3" />}
              <span>
                {validationStatus === 'validating' && (t('validating') || 'Validating...')}
                {validationStatus === 'valid' && (t('validated') || 'Validated')}
                {validationStatus === 'invalid' && (t('needsAttention') || 'Needs attention')}
              </span>
            </div>
          )}
          
          {validationMessage && (
            <p className="text-xs text-muted-foreground mb-3">{validationMessage}</p>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button 
              onClick={onGenerate}
              disabled={isGenerating || !canGenerate}
              functionId={functionId}
              showCredits
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isGenerating ? t('generating') : hasData ? t('regenerate') : t('generate')}
            </Button>
            
            {hasData && onValidate && validateFunctionId && (
              <Button 
                onClick={onValidate}
                disabled={validationStatus === 'validating'}
                variant="outline"
                functionId={validateFunctionId}
                showCredits
                className="flex items-center gap-2"
              >
                {validationStatus === 'validating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {t('validate')}
              </Button>
            )}
          </div>
          
          {!canGenerate && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {t('completeRequiredSectionsFirst') || 'Complete required sections first'}
            </p>
          )}
        </div>
        
        {/* Custom content */}
        {children}
      </CardContent>
    </Card>
  );
}