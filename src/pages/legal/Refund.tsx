import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

const Refund = () => {
  const { t } = useLanguage();

  const sections = [
    { title: 'refundGeneral', content: 'refundGeneralContent', number: '1.' },
    { title: 'refundEligible', content: 'refundEligibleContent', number: '2.' },
    { title: 'refundProcess', content: 'refundProcessContent', number: '3.' },
    { title: 'refundExclusions', content: 'refundExclusionsContent', number: '4.' },
    { title: 'refundSubscriptions', content: 'refundSubscriptionsContent', number: '5.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('refundPolicy')}
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
              
              <div className="mt-12 pt-8 border-t border-border">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {t('privacyContact')}
                  </h3>
                  <p className="text-muted-foreground">
                    support@rawiapp.io
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Refund;