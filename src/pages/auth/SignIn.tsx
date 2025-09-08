import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const { signInWithOAuth, signInWithEmail, resetPassword, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      await signInWithOAuth(provider);
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        navigate('/app');
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(language === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى إيميلك' : 'Password reset link sent to your email');
        setShowResetForm(false);
        setShowEmailForm(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Reset password failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1320] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src={language === 'ar' ? '/brand/logo-lockup-ar-vertical.svg' : '/brand/logo-lockup-en-vertical.svg'} 
          alt="Rawi Logo" 
          className="h-20 w-auto"
        />
      </div>

      {/* Language Toggle */}
      <div className="mb-8 flex gap-2">
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          onClick={() => setLanguage('en')}
          className="text-white"
        >
          EN
        </Button>
        <Button
          variant={language === 'ar' ? 'default' : 'ghost'}
          onClick={() => setLanguage('ar')}
          className="text-white"
        >
          AR
        </Button>
      </div>

      {/* Sign In Form */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </h1>
          <p className="text-white/70">
            {language === 'ar' ? 'ادخل إلى حسابك' : 'Access your account'}
          </p>
        </div>

        {!showEmailForm ? (
          <div className="space-y-4">
            {/* Social Login Buttons */}
            <Button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full bg-gradient-auth hover:opacity-90 text-white border-0 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {language === 'ar' ? 'المتابعة مع جوجل' : 'Continue with Google'}
            </Button>


            <Button
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={isLoading}
              className="w-full bg-gradient-auth hover:opacity-90 text-white border-0 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {language === 'ar' ? 'المتابعة مع فيسبوك' : 'Continue with Facebook'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0F1320] px-2 text-white/70">
                  {language === 'ar' ? 'أو' : 'or'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowEmailForm(true)}
              className="w-full text-white border-white/20 hover:bg-white/5"
            >
              {language === 'ar' ? 'تسجيل الدخول بالإيميل' : 'Sign in with Email'}
            </Button>
          </div>
        ) : showResetForm ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </h2>
              <p className="text-white/70 text-sm">
                {language === 'ar' ? 'أدخل إيميلك لإرسال رابط إعادة تعيين كلمة المرور' : 'Enter your email to receive a password reset link'}
              </p>
            </div>
            <Input
              type="email"
              placeholder={language === 'ar' ? 'الإيميل' : 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-auth hover:opacity-90 text-white border-0"
            >
              {language === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowResetForm(false)}
              className="w-full text-white/70"
            >
              {language === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder={language === 'ar' ? 'الإيميل' : 'Email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            <Input
              type="password"
              placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-white/70 hover:text-white text-sm underline hover:no-underline"
              >
                {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-auth hover:opacity-90 text-white border-0"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEmailForm(false)}
              className="w-full text-white/70"
            >
              {language === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          </form>
        )}

        <div className="text-center">
          <p className="text-white/70">
            {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
            <Link to="/auth/sign-up" className="text-white underline hover:no-underline">
              {language === 'ar' ? 'إنشاء حساب' : 'Sign up'}
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link to="/" className="text-white/70 hover:text-white">
            {language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;