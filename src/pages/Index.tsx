import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Index = () => {
  const { t, language } = useLanguage();

  // Set SEO for homepage
  useSEOConfig(seoConfigs.homepage[language]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-orange-900/20"></div>
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Hero Section */}
      <main className="relative z-10 container mx-auto p-6 py-20 md:py-28">
        <div className="text-center space-y-12 max-w-5xl mx-auto">
          <h1 className="title-hero text-gradient leading-tight">
            {t('heroHeadline')}
          </h1>
          
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {t('heroSubtext')}
          </p>

          <div className="pt-12 mobile-stack flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              asChild
              className="text-xl px-12 py-6 h-auto gradient glow interactive ripple font-medium"
            >
              <Link to="/auth/sign-up">
                {t('getStarted')}
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              size="lg" 
              asChild
              className="text-xl px-12 py-6 h-auto glass border-blue-300/40 hover:border-blue-300/60 hover:glow-hover font-medium"
            >
              <Link to="/try/cinematic-teaser">
                {t('tryFreeButton')}
              </Link>
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="pt-12">
            <p className="text-muted-foreground text-xl">
              {t('alreadyHaveAccount')}{' '}
              <Link 
                to="/auth/sign-in" 
                className="text-gradient hover:opacity-80 transition-opacity font-medium"
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