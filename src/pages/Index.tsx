import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Index = () => {
  const { t, language } = useLanguage();

  // Set SEO for homepage
  useSEOConfig(seoConfigs.homepage[language]);

  return (
    <div className="bg-[#0F1320]">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
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
              <Link to="/auth/sign-up">
                {t('getStarted')}
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