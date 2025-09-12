import React from 'react';
import { ArrowLeft, Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { WorkspaceJob } from '@/hooks/useWorkspaceState';

interface WorkspaceHeaderProps {
  job: WorkspaceJob;
  unsavedChanges: Set<string>;
  onSave: () => void;
}

export function WorkspaceHeader({ job, unsavedChanges, onSave }: WorkspaceHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const hasUnsavedChanges = unsavedChanges.size > 0;
  
  const getStatusBadge = () => {
    switch (job.status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t('draft')}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            {t('processing')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            {t('completed')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {t('failed')}
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getJobTitle = () => {
    const userInput = job.user_input;
    if (userInput?.leadName || userInput?.lead_name) {
      return `${userInput.leadName || userInput.lead_name} - ${t('storyboard')}`;
    }
    if (job.movie_info?.title) {
      return `${job.movie_info.title} - ${t('storyboard')}`;
    }
    return `${t('storyboard')} ${job.id.slice(0, 8)}`;
  };
  
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Navigation and title */}
      <div className="flex items-center gap-4 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center gap-2 hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('back')}</span>
        </Button>
        
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {getJobTitle()}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {getStatusBadge()}
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                {t('unsavedChanges')}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Auto-save indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          {hasUnsavedChanges ? (
            <>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              {t('autoSaving') || 'Auto-saving...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3 text-green-600" />
              {t('allChangesSaved') || 'All changes saved'}
            </>
          )}
        </div>
        
        {/* Manual save button */}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className={cn(
            "flex items-center gap-2 transition-all",
            hasUnsavedChanges && "bg-primary hover:bg-primary/90"
          )}
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">
            {hasUnsavedChanges ? t('save') : t('saved')}
          </span>
        </Button>
        
        {/* Progress indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
          <div className="flex items-center gap-1">
            <span>{t('progress') || 'Progress'}:</span>
            <span className="font-medium">3/5</span> {/* TODO: Calculate actual progress */}
          </div>
          <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div className="w-3/5 h-full bg-primary rounded-full transition-all duration-300" />
          </div>
        </div>
      </div>
    </header>
  );
}