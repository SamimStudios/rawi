import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

const Privacy = () => {
  const { t } = useLanguage();

  const sections = [
    { title: 'privacyData', content: 'privacyDataContent', number: '1.' },
    { title: 'privacyUse', content: 'privacyUseContent', number: '2.' },
    { title: 'privacySharing', content: 'privacySharingContent', number: '3.' },
    { title: 'privacyStorage', content: 'privacyStorageContent', number: '4.' },
    { title: 'privacySecurity', content: 'privacySecurityContent', number: '5.' },
    { title: 'privacyContact', content: 'privacyContactContent', number: '6.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('privacyPolicy')}
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

export default Privacy;