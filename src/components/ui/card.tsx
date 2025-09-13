import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[var(--radius)] text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border bg-card shadow-[var(--shadow-soft)]",
        elevated: "border bg-card shadow-[var(--shadow-elevated)] hover:shadow-[var(--shadow-premium)]",
        glass: "border border-white/20 bg-white/10 backdrop-blur-md shadow-[var(--shadow-glass)]",
        gradient: "border-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 shadow-[var(--shadow-glow)]",
        premium: "border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-glow)]",
        solid: "border-0 bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]",
        outline: "border-2 border-primary bg-transparent shadow-none hover:bg-primary/5",
        ghost: "border-0 bg-transparent shadow-none hover:bg-accent",
        neon: "border border-primary bg-card shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]",
        focus: "border-2 border-primary bg-card shadow-[0_0_15px_hsl(var(--primary)/0.4)] ring-2 ring-primary/20",
        edit: "border-2 border-yellow-400 bg-card shadow-[var(--shadow-soft)]",
        danger: "border border-destructive bg-destructive/5 shadow-[0_0_10px_hsl(var(--destructive)/0.2)] hover:shadow-[0_0_15px_hsl(var(--destructive)/0.3)]",
      },
      size: {
        default: "",
        sm: "text-sm",
        lg: "text-lg",
      },
      padding: {
        default: "",
        none: "[&>*]:p-0",
        sm: "[&>*]:p-3",
        lg: "[&>*]:p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
