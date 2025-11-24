import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';
import heroBg from "@/assets/hero-bg-cinematic.jpg";

const Index = () => {
  const { t, language } = useLanguage();

  // Set SEO for homepage
  useSEOConfig(seoConfigs.homepage[language]);

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Animated Gradient Overlay */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{ 
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), rgba(37, 99, 235, 0.3))',
          backgroundSize: '200% 200%'
        }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Hero Section */}
      <main className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            {t('heroHeadline')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
            {t('heroSubtext')}
          </p>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="primary"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto"
            >
              <Link to="/app/templates">
                Explore Templates
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Link to="/try/cinematic-teaser">
                {t('tryFreeButton')}
              </Link>
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="pt-8">
            <p className="text-white/70">
              {t('alreadyHaveAccount')}{' '}
              <Link 
                to="/auth/sign-in" 
                className="text-white underline hover:no-underline"
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