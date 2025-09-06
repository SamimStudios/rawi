import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import rawiLogo from "@/assets/rawi-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with Logo */}
      <header className="px-4 py-6">
        <div className="container mx-auto">
          <img 
            src={rawiLogo} 
            alt="Rawi App Logo" 
            className="h-12 md:h-16"
          />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
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
