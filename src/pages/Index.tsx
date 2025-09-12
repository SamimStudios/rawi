import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Index = () => {
  const { t, language } = useLanguage();

  // Set SEO for homepage
  useSEOConfig(seoConfigs.homepage[language]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Hero Section */}
      <main className="container mx-auto p-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="title-hero text-gradient">
            {t('heroHeadline')}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('heroSubtext')}
          </p>

          <div className="pt-8 mobile-stack flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto gradient glow interactive ripple"
            >
              <Link to="/auth/sign-up">
                {t('getStarted')}
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto interactive"
            >
              <Link to="/try/cinematic-teaser">
                {t('tryFreeButton')}
              </Link>
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="pt-8">
            <p className="text-muted-foreground">
              {t('alreadyHaveAccount')}{' '}
              <Link 
                to="/auth/sign-in" 
                className="text-gradient hover:opacity-80 transition-opacity"
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