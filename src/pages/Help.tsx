import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

const Help = () => {
  const { t } = useLanguage();

  const faqs = [
    { question: 'faq1Question', answer: 'faq1Answer' },
    { question: 'faq2Question', answer: 'faq2Answer' },
    { question: 'faq3Question', answer: 'faq3Answer' },
    { question: 'faq4Question', answer: 'faq4Answer' },
    { question: 'faq5Question', answer: 'faq5Answer' },
    { question: 'faq6Question', answer: 'faq6Answer' },
    { question: 'faq7Question', answer: 'faq7Answer' },
  ];

  return (
    <div className="page-container bg-mesh">
      <main className="page-content container mx-auto mobile-padding py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-8 mb-16">
            <h1 className="title-hero text-gradient-primary">
              {t('helpPageTitle')}
            </h1>
            <p className="text-responsive-xl text-foreground/80 max-w-3xl mx-auto">
              {t('helpPageSubtitle')}
            </p>
          </div>

          {/* FAQ Section */}
          <Card className="card-enhanced p-8">
            <h2 className="title-section text-gradient-secondary mb-8 text-center">
              {t('faqTitle')}
            </h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-6 last:border-b-0">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t(faq.question)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(faq.answer)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Help;