import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const enhancedBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Enhanced variants
        gradient: "border-transparent bg-gradient-primary text-white shadow-glow hover:shadow-glow-accent",
        glass: "border-white/20 bg-glass text-white backdrop-blur-xl",
        neon: "border-primary bg-transparent text-primary hover:bg-primary hover:text-white pulse-glow",
        premium: "border-transparent bg-gradient-secondary text-white shadow-glow-secondary",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-yellow-500 text-white",
        info: "border-transparent bg-blue-500 text-white",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        float: "animate-float",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

export interface EnhancedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedBadgeVariants> {}

function EnhancedBadge({ 
  className, 
  variant, 
  size, 
  animation, 
  ...props 
}: EnhancedBadgeProps) {
  return (
    <div 
      className={cn(enhancedBadgeVariants({ variant, size, animation }), className)} 
      {...props} 
    />
  );
}

export { EnhancedBadge, enhancedBadgeVariants };