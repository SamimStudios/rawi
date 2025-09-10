import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SystemAlertAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export interface SystemAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions: SystemAlertAction[];
  cancelLabel?: string;
  showIcon?: boolean;
  iconVariant?: 'warning' | 'error' | 'info' | 'success';
  allowClickOutside?: boolean;
  className?: string;
}

export function SystemAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  cancelLabel,
  showIcon = true,
  iconVariant = 'warning',
  allowClickOutside = true,
  className
}: SystemAlertDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (iconVariant) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />;
      case 'info':
        return <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0" />;
      case 'success':
        return <AlertTriangle className="h-5 w-5 text-green-500 flex-shrink-0" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // If trying to close the dialog
    if (!newOpen) {
      // Only allow closing if click outside is enabled or it's being closed programmatically
      if (allowClickOutside) {
        onOpenChange(false);
      }
      // If allowClickOutside is false, prevent closing by not calling onOpenChange
    } else {
      // Always allow opening
      onOpenChange(true);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", className)}>
        {/* X button in corner */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <AlertDialogHeader className="pr-8">
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            {showIcon && getIcon()}
            <span className="break-words">{title}</span>
          </AlertDialogTitle>
          {(description || children) && (
            <AlertDialogDescription className="text-sm">
              {description && <p className="break-words">{description}</p>}
              {children}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {cancelLabel && (
            <AlertDialogCancel 
              onClick={handleCancel}
              className="w-full sm:w-auto text-sm"
            >
              {cancelLabel}
            </AlertDialogCancel>
          )}
          
          {actions.map((action, index) => (
            <AlertDialogAction
              key={index}
              onClick={action.onClick}
              className={cn(
                "w-full sm:w-auto text-sm",
                action.variant === 'destructive' && "bg-destructive hover:bg-destructive/90",
                action.className
              )}
            >
              {action.label}
            </AlertDialogAction>
          ))}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}