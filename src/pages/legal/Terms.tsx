import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

const Terms = () => {
  const { t } = useLanguage();

  const sections = [
    { title: 'termsAcceptance', content: 'termsAcceptanceContent', number: '1.' },
    { title: 'termsCredits', content: 'termsCreditsContent', number: '2.' },
    { title: 'termsOwnership', content: 'termsOwnershipContent', number: '3.' },
    { title: 'termsProhibited', content: 'termsProhibitedContent', number: '4.' },
    { title: 'termsAvailability', content: 'termsAvailabilityContent', number: '5.' },
    { title: 'termsLiability', content: 'termsLiabilityContent', number: '6.' },
    { title: 'termsLaw', content: 'termsLawContent', number: '7.' },
    { title: 'termsChanges', content: 'termsChangesContent', number: '8.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('termsConditions')}
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

export default Terms;