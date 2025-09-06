import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="bg-gradient-hero">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <img 
            src="/brand/logo-lockup-bilingual-stacked.svg" 
            alt="Rawi App" 
            className="h-24 md:h-32 mx-auto"
          />
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            Turn your photos into{" "}
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              cinematic moments
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Transform ordinary photos into extraordinary cinematic masterpieces with our AI-powered editing tools.
          </p>

          <div className="pt-8">
            <Button 
              variant="hero" 
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto"
            >
              <Link to="/try/cinematic-teaser">
                Try Free
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
