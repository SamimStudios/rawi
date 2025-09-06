import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

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
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Link to="/try/cinematic-teaser">
                {t('tryFreeButton')}
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              size="lg" 
              asChild
              className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0"
            >
              <Link to="/templates">
                {t('browseTemplates')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;