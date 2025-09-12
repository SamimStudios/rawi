import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { validateEmail, validatePassword, sanitizeInput, rateLimit } from '@/lib/security';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const { signUp, signInWithOAuth, user } = useAuth();
  const { language, setLanguage } = useLanguage();
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
      toast.error(error.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation and sanitization
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password; // Don't sanitize password to preserve special chars
    
    if (!validateEmail(sanitizedEmail)) {
      toast.error(language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format');
      return;
    }
    
    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      const errorMsg = passwordValidation.errors[0];
      toast.error(language === 'ar' ? 'كلمة المرور ضعيفة' : errorMsg);
      return;
    }
    
    if (sanitizedPassword !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    
    if (!consentAgreed) {
      toast.error(language === 'ar' ? 'يجب الموافقة على شروط الملكية الفكرية' : 'You must agree to the IP and consent terms');
      return;
    }
    
    // Rate limiting
    if (!rateLimit(`signup_${sanitizedEmail}`, 3, 60 * 60 * 1000)) {
      toast.error(language === 'ar' ? 'تم تجاوز عدد المحاولات المسموح' : 'Too many signup attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(sanitizedEmail, sanitizedPassword);
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error(language === 'ar' ? 'المستخدم مسجل بالفعل' : 'User already registered');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(language === 'ar' ? 'تم إنشاء الحساب! تحقق من إيميلك.' : 'Account created! Check your email.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container bg-mesh flex flex-col items-center justify-center mobile-padding">
      <div className="page-content w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img 
            src={language === 'ar' ? '/brand/logo-lockup-ar-vertical.svg' : '/brand/logo-lockup-en-vertical.svg'} 
            alt="Rawi Logo" 
            className="h-20 w-auto mx-auto interactive-scale-small"
          />
        </div>

        {/* Language Toggle */}
        <div className="mb-8 flex gap-2 justify-center">
          <Button
            variant={language === 'en' ? 'gradient' : 'glass'}
            onClick={() => setLanguage('en')}
            className="interactive-scale-small"
          >
            EN
          </Button>
          <Button
            variant={language === 'ar' ? 'gradient' : 'glass'}
            onClick={() => setLanguage('ar')}
            className="interactive-scale-small"
          >
            AR
          </Button>
        </div>

        {/* Sign Up Form */}
        <div className="space-y-6 card-enhanced p-8 rounded-xl">
          <div className="text-center">
            <h1 className="title-section text-gradient-primary mb-2">
              {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
            </h1>
            <p className="text-foreground/70">
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create a new account'}
            </p>
          </div>

        {!showEmailForm ? (
          <div className="space-y-4">
            {/* Social Login Buttons */}
            <Button
              onClick={() => handleOAuthSignIn('google')}
              variant="gradient"
              disabled={isLoading}
              className="w-full h-12 interactive-scale"
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
              variant="gradient"
              disabled={isLoading}
              className="w-full h-12 interactive-scale"
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
              variant="glass"
              onClick={() => setShowEmailForm(true)}
              className="w-full interactive-scale"
            >
              {language === 'ar' ? 'التسجيل بالإيميل' : 'Sign up with Email'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="email"
            placeholder={language === 'ar' ? 'الإيميل' : 'Email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
          <Input
            type="password"
            placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
          
          <div className="flex items-start space-x-2 rtl:space-x-reverse">
            <input
              type="checkbox"
              id="consent"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
              required
            />
            <label htmlFor="consent" className="text-sm text-white/70 leading-5">
              {language === 'ar' ? (
                <>
                  أوافق على{' '}
                  <Link to="/legal/terms" className="text-white underline hover:no-underline" target="_blank">
                    الشروط والأحكام
                  </Link>
                  {' '}و{' '}
                  <Link to="/legal/consent" className="text-white underline hover:no-underline" target="_blank">
                    سياسة الموافقة والملكية الفكرية
                  </Link>
                </>
              ) : (
                <>
                  I agree to the{' '}
                  <Link to="/legal/terms" className="text-white underline hover:no-underline" target="_blank">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/legal/consent" className="text-white underline hover:no-underline" target="_blank">
                    Consent & IP Policy
                  </Link>
                </>
              )}
            </label>
          </div>
          <Button
            type="submit"
            variant="gradient"
            disabled={isLoading}
            className="w-full interactive-scale"
          >
            {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
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
            <p className="text-foreground/70">
              {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link to="/auth/sign-in" className="text-gradient-accent hover:opacity-80 transition-opacity">
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link to="/" className="text-foreground/70 hover:text-foreground transition-colors">
              {language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;