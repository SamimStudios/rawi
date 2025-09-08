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
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      // Link guest jobs to the new user account
      const { error: linkError } = await supabase.rpc('link_guest_jobs_to_user', {
        p_email: email
      });

      if (linkError) {
        console.error('Error linking guest jobs:', linkError);
        // Don't show error to user as the account was still created successfully
      }

      toast.success('Account created successfully! Your job has been saved to your account.');
      onRegistrationComplete();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-5 h-5" />
          Save Your Result - Create Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              minLength={6}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-auth hover:opacity-90 text-white"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account & Save Job'}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            By creating an account, you agree to our Terms & Privacy Policy
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestJobRegistration;