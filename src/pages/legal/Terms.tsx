import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
            {t('termsConditions')}
          </h1>
          
          <div className="bg-card rounded-lg p-8 text-foreground">
            <p className="text-lg leading-relaxed mb-6">
              {t('legalPlaceholder')}
            </p>
            
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                <p className="text-muted-foreground">
                  Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
                <p className="text-muted-foreground">
                  The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
                <p className="text-muted-foreground">
                  In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Terms;