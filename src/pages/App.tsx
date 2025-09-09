import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

const App = () => {
  const { user, signOut, loading } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <header className="border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img 
            src={language === 'ar' ? '/brand/logo-lockup-ar-horizontal.svg' : '/brand/logo-lockup-en-horizontal.svg'} 
            alt={t('rawiLogo')} 
            className="h-8 w-auto"
          />
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="text-white border-white/20 hover:bg-white/5"
          >
            {language === 'ar' ? 'تسجيل خروج' : 'Sign Out'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            {language === 'ar' ? 'مرحباً بك في رواي' : 'Welcome to Rawi'}
          </h1>
          
          <p className="text-xl text-white/80">
            {language === 'ar' ? 'أنت الآن في التطبيق!' : 'You are now in the app!'}
          </p>

          <div className="text-white/60">
            {language === 'ar' ? 'المستخدم:' : 'User:'} {user.email}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;