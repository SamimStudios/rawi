import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Globe, Link as LinkIcon, Save } from 'lucide-react';

const Settings = () => {
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || '');
    }
  }, [user]);

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

  const handleSave = () => {
    // Simulate saving with toast notification
    setTimeout(() => {
      toast({
        title: t('demoSaved'),
        variant: 'default',
      });
    }, 500);
  };

  const accountConnections = [
    { name: 'Google', connected: true },
    { name: 'Apple', connected: false },
    { name: 'Facebook', connected: false },
    { name: 'Email', connected: true }
  ];

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t('settings')}
              </h1>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profile Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="w-6 h-6 text-primary" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-foreground">{t('name')}</Label>
                  <Input
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Globe className="w-6 h-6 text-primary" />
                  {t('language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">{t('language')}</Label>
                    <p className="text-muted-foreground text-sm">
                      Choose your preferred language
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      onClick={() => setLanguage('en')}
                      className={language === 'en' ? 'bg-primary text-primary-foreground' : 'text-primary border-primary'}
                    >
                      EN
                    </Button>
                    <Button
                      variant={language === 'ar' ? 'default' : 'outline'}
                      onClick={() => setLanguage('ar')}
                      className={language === 'ar' ? 'bg-primary text-primary-foreground' : 'text-primary border-primary'}
                    >
                      AR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Connections */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <LinkIcon className="w-6 h-6 text-primary" />
                  {t('accountConnections')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountConnections.map((connection) => (
                  <div key={connection.name} className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">{connection.name}</Label>
                      <p className="text-muted-foreground text-sm">
                        {connection.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                    <Switch 
                      checked={connection.connected} 
                      disabled 
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Consent Information */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-sm">
                  {t('consentLogNote')}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                className="bg-gradient-auth hover:opacity-90 text-white border-0"
                size="lg"
              >
                <Save className="w-5 h-5 mr-2" />
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;