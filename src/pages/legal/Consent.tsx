import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

const Consent = () => {
  const { t } = useLanguage();

  const sections = [
    { title: 'consentProcess', content: 'consentProcessContent', number: '1.' },
    { title: 'consentUploads', content: 'consentUploadsContent', number: '2.' },
    { title: 'consentOutputs', content: 'consentOutputsContent', number: '3.' },
    { title: 'consentRestrictions', content: 'consentRestrictionsContent', number: '4.' },
    { title: 'consentLiability', content: 'consentLiabilityContent', number: '5.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('consentIpPolicy')}
          </h1>
          
          <Card className="p-8 text-foreground">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <section key={index}>
                  <h2 className="text-2xl font-semibold mb-4 flex items-start gap-2">
                    <span className="text-primary">{section.number}</span>
                    <span>{t(section.title)}</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(section.content)}
                  </p>
                </section>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Consent;