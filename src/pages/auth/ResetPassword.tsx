import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have the required tokens from the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    if (!accessToken || !refreshToken || type !== 'recovery') {
      toast.error('Invalid or expired reset link');
      navigate('/auth/sign-in');
      return;
    }

    // Set the session with the tokens from URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    }).catch((error) => {
      console.error('Session error:', error);
      toast.error('Invalid reset link');
      navigate('/auth/sign-in');
    });
  }, [searchParams, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
        navigate('/app');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
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

      {/* Reset Password Form */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
          </h1>
          <p className="text-white/70">
            {language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            type="password"
            placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
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
            {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/auth/sign-in')}
            className="text-white/70 hover:text-white underline hover:no-underline"
          >
            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;