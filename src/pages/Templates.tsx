import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Templates = () => {
  const { t, language } = useLanguage();

  // Set SEO for templates page
  useSEOConfig(seoConfigs.templates[language]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            {t('templates')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('templatesSubtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Templates;