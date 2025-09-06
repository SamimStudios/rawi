import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

const ServerError = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const isRTL = language === 'ar';

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0F1320] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-primary mb-2">500</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            {t('serverError')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('serverErrorMessage')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <Button
            onClick={handleReload}
            className="bg-gradient-auth hover:opacity-90 text-white border-0"
            size="lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {t('tryAgain')}
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="text-primary border-primary hover:bg-primary/10"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            {t('goHome')}
          </Button>
        </div>

        {/* Help Link */}
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-2">
            {t('persistentError')}
          </p>
          <Button
            onClick={() => navigate('/help')}
            variant="link"
            className="text-primary hover:underline p-0"
          >
            {t('contactSupport')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;