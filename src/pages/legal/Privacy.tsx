import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('privacyPolicy')}
          </h1>
          
          <div className="bg-card rounded-lg p-8 text-foreground">
            <p className="text-lg leading-relaxed mb-6">
              {t('legalPlaceholder')}
            </p>
            
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us through our support channels.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;