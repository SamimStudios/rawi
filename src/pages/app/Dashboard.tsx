import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSEOConfig, seoConfigs } from '@/hooks/useSEO';
import { CreditCard, History, FileText, Wallet } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const { credits, loading: creditsLoading } = useUserCredits();
  const navigate = useNavigate();

  // Set SEO for dashboard page
  useSEOConfig(seoConfigs.dashboard[language]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

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

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('welcomeUser')}, {userName}
            </h1>
          </div>

          {/* Wallet Balance Card */}
          <div className="mb-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wallet className="w-6 h-6 text-primary" />
                  {t('walletBalance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {creditsLoading ? "..." : credits} {t('credits')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">{t('quickLinks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <Link to="/templates" className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">{t('browseTemplates')}</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Explore cinematic templates for your projects
                    </p>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <Link to="/app/history" className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <History className="w-8 h-8 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">{t('myHistory')}</h3>
                    </div>
                    <p className="text-muted-foreground">
                      View your past generations and projects
                    </p>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <Link to="/app/wallet" className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">{t('buyCredits')}</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Purchase credits to generate content
                    </p>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Jobs Placeholder */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Jobs</h2>
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground text-lg">
                  {t('recentJobsPlaceholder')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;