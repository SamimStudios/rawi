import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password);
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

      {/* Sign Up Form */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
          </h1>
          <p className="text-white/70">
            {language === 'ar' ? 'إنشاء حساب جديد' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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
          <Input
            type="password"
            placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-auth hover:opacity-90 text-white border-0"
          >
            {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-white/70">
            {language === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link to="/auth/sign-in" className="text-white underline hover:no-underline">
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
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

export default SignUp;