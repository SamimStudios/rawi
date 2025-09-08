import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { validateEmail, validatePassword, sanitizeInput } from '@/lib/security';

interface GuestJobRegistrationProps {
  jobId: string;
  onRegistrationComplete: () => void;
}

const GuestJobRegistration = ({ jobId, onRegistrationComplete }: GuestJobRegistrationProps) => {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation and sanitization
    const sanitizedEmail = sanitizeInput(email);
    
    if (!validateEmail(sanitizedEmail)) {
      toast.error(t('invalidEmail'));
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { error: signUpError } = await signUp(sanitizedEmail, password);
      
      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      // Link guest jobs to the new user account
      const { error: linkError } = await supabase.rpc('link_guest_jobs_to_user', {
        p_email: sanitizedEmail
      });

      if (linkError) {
        console.error('Error linking guest jobs:', linkError);
        // Don't show error to user as the account was still created successfully
      }

      toast.success(t('accountCreatedSuccess'));
      onRegistrationComplete();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(t('createAccountFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-5 h-5" />
          {t('saveYourResultCreate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('enterEmail')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('enterPassword')}
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('confirmYourPassword')}
              minLength={6}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-auth hover:opacity-90 text-white"
            disabled={loading}
          >
            {loading ? t('creatingAccount') : t('createAccountAndSave')}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            {t('byCreatingAccount')}
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestJobRegistration;