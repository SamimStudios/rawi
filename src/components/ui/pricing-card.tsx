import * as React from "react";
import { cn } from "@/lib/utils";
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "./enhanced-card";
import { EnhancedBadge } from "./enhanced-badge";
import { EnhancedButton } from "./enhanced-button";
import { Check, Star, Zap, Crown } from "lucide-react";

export interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  discount?: number;
  popular?: boolean;
  premium?: boolean;
  loading?: boolean;
  onSelect: () => void;
  className?: string;
}

const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  ({ 
    title, 
    price, 
    description, 
    features, 
    discount, 
    popular = false, 
    premium = false,
    loading = false,
    onSelect, 
    className,
    ...props 
  }, ref) => {
    const cardVariant = premium ? "premium" : popular ? "glow" : "glass";
    const buttonVariant = premium ? "premium" : popular ? "cta" : "gradient";

    return (
      <EnhancedCard
        ref={ref}
        variant={cardVariant}
        interactive
        className={cn(
          "relative h-full",
          popular && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          premium && "ring-2 ring-purple-500 ring-offset-2 ring-offset-background",
          className
        )}
        {...props}
      >
        {/* Popular/Premium Badge */}
        {(popular || premium) && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <EnhancedBadge 
              variant={premium ? "premium" : "gradient"} 
              size="lg"
              animation="float"
              className="shadow-lg"
            >
              {premium ? (
                <>
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </>
              )}
            </EnhancedBadge>
          </div>
        )}

        <EnhancedCardHeader className="text-center pb-6">
          <EnhancedCardTitle className="text-2xl mb-2">
            {title}
          </EnhancedCardTitle>
          
          {/* Price Display */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className={cn(
                "text-4xl font-bold font-header",
                premium ? "text-gradient-secondary" : "text-gradient-primary"
              )}>
                {price}
              </span>
            </div>
            
            {discount && (
              <EnhancedBadge variant="success" className="animate-pulse">
                {discount}% OFF
              </EnhancedBadge>
            )}
            
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </EnhancedCardHeader>

        <EnhancedCardContent className="space-y-6">
          {/* Features List */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                  premium ? "bg-gradient-secondary" : "bg-gradient-primary"
                )}>
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-foreground leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <EnhancedButton
            variant={buttonVariant}
            size="lg"
            loading={loading}
            onClick={onSelect}
            className="w-full font-semibold"
            leftIcon={premium ? <Zap className="w-4 h-4" /> : undefined}
          >
            {loading ? "Processing..." : premium ? "Upgrade Now" : "Get Started"}
          </EnhancedButton>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {premium ? "Instant activation • Premium support" : "Instant activation • No commitment"}
            </p>
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    );
  }
);

PricingCard.displayName = "PricingCard";

export { PricingCard };