import { useLanguage } from "@/contexts/LanguageContext";
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';

const Templates = () => {
  const { t, language } = useLanguage();

  // Set SEO for templates page
  useSEOConfig(seoConfigs.templates[language]);

  return (
    <div className="page-container bg-mesh">
      <div className="page-content container mx-auto mobile-padding py-16">
        <div className="text-center space-y-8">
          <h1 className="title-hero text-gradient-primary">
            {t('templates')}
          </h1>
          <p className="text-responsive-xl text-foreground/80 max-w-3xl mx-auto">
            {t('templatesSubtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Templates;