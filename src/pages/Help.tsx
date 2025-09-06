import { useLanguage } from "@/contexts/LanguageContext";

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
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {t('helpPageTitle')}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {t('helpPageSubtitle')}
            </p>
          </div>

          {/* FAQ Section */}
          <div className="bg-card rounded-lg p-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;