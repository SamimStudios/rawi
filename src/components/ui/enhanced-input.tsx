import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const enhancedInputVariants = cva(
  "flex w-full rounded-md border font-body text-base transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input bg-background px-3 py-2 hover:border-ring/50",
        glass: "border-white/20 bg-glass backdrop-blur-xl px-3 py-2 text-white placeholder:text-white/70 hover:border-white/30",
        glow: "border-primary/50 bg-background px-3 py-2 shadow-glow hover:border-primary focus:shadow-glow-accent",
        minimal: "border-transparent border-b-2 border-b-border bg-transparent px-0 py-2 rounded-none hover:border-b-primary focus:border-b-primary",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-3 py-1 text-xs",
        lg: "h-11 px-4 py-3 text-base",
        xl: "h-12 px-4 py-3 text-lg",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

export interface EnhancedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof enhancedInputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, type, variant, size, state, leftIcon, rightIcon, ...props }, ref) => {
    const hasIcons = leftIcon || rightIcon;

    if (hasIcons) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              enhancedInputVariants({ variant, size, state }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(enhancedInputVariants({ variant, size, state }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput, enhancedInputVariants };