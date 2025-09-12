import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Clock, Coins, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useNavigate } from 'react-router-dom';
import { WorkspaceJob } from '@/hooks/useWorkspaceState';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  job: WorkspaceJob;
  unsavedChanges: Set<string>;
  onSave: () => void;
}

export function WorkspaceHeader({ job, unsavedChanges, onSave }: WorkspaceHeaderProps) {
  const { t } = useLanguage();
  const { credits } = useUserCredits();
  const navigate = useNavigate();
  
  const hasUnsavedChanges = unsavedChanges.size > 0;
  
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
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation & Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToDashboard') || 'Dashboard'}
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">
                {getJobTitle()}
              </h1>
              
              {/* Job info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {job.id.slice(0, 8)}...
                </Badge>
                
                {job.updated_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {new Date(job.updated_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Credits & Actions */}
          <div className="flex items-center gap-3">
            {/* Credits display */}
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-medium text-primary">{credits}</span>
              <span className="text-muted-foreground hidden sm:inline">{t('credits')}</span>
            </div>
            
            {/* Save status */}
            <div className="flex items-center gap-2">
              {hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {t('autoSaving') || 'Auto-saving...'}
                  </span>
                  <Button
                    onClick={onSave}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('save')}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {unsavedChanges.size}
                    </Badge>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">{t('allChangesSaved') || 'Saved'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile title row */}
        <div className="md:hidden mt-2">
          <h1 className="text-base font-semibold text-foreground truncate">
            {getJobTitle()}
          </h1>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {job.id.slice(0, 8)}...
              </Badge>
              {job.updated_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(job.updated_at).toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {/* Mobile save indicator */}
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                {unsavedChanges.size} unsaved
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}