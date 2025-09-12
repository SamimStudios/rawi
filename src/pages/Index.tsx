import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Index = () => {
  const { t, language } = useLanguage();

  // Set SEO for homepage
  useSEOConfig(seoConfigs.homepage[language]);

  return (
    <div className="page-container bg-mesh">
      {/* Hero Section */}
      <main className="page-content container mx-auto mobile-padding py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="title-hero text-gradient-primary">
            {t('heroHeadline')}
          </h1>
          
          <p className="text-responsive-xl text-foreground/80 max-w-3xl mx-auto">
            {t('heroSubtext')}
          </p>

          <div className="pt-8 mobile-stack flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="gradient"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto glow-primary interactive-scale"
            >
              <Link to="/auth/sign-up">
                {t('getStarted')}
              </Link>
            </Button>
            
            <Button 
              variant="glass"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto interactive-scale"
            >
              <Link to="/try/cinematic-teaser">
                {t('tryFreeButton')}
              </Link>
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="pt-8">
            <p className="text-foreground/70">
              {t('alreadyHaveAccount')}{' '}
              <Link 
                to="/auth/sign-in" 
                className="text-gradient-accent hover:opacity-80 transition-opacity"
              >
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;