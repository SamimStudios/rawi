import React, { useEffect, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCancel = () => {
    console.log('SystemAlertDialog: handleCancel called');
    onOpenChange(false);
  };

  // Custom click outside handler
  useEffect(() => {
    if (!open || !allowClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      console.log('SystemAlertDialog: Click detected, checking if outside');
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        console.log('SystemAlertDialog: Click outside detected, closing dialog');
        onOpenChange(false);
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, allowClickOutside, onOpenChange]);

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
    console.log('SystemAlertDialog: handleOpenChange called with', newOpen);
    // Don't prevent the dialog from closing, let our custom click outside handler manage it
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent 
        ref={contentRef}
        className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", className)}
      >
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

        <AlertDialogFooter className="flex-wrap gap-2 sm:justify-end">
          {cancelLabel && (
            <AlertDialogCancel 
              onClick={handleCancel}
              className="flex-1 sm:flex-none text-sm"
            >
              {cancelLabel}
            </AlertDialogCancel>
          )}
          
          {actions.map((action, index) => (
            <AlertDialogAction
              key={index}
              onClick={action.onClick}
              className={cn(
                "flex-1 sm:flex-none text-sm",
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