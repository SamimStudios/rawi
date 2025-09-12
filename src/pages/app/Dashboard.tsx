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
        <div className="text-white">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background bg-grain relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-primary rounded-full opacity-10 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-secondary rounded-full opacity-10 blur-3xl pointer-events-none animate-float" style={{ animationDelay: "2s" }} />
      
      <main className="relative space-mobile">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header with Animation */}
          <div className="mb-8 sm:mb-12 text-center animate-fade-in">
            <h1 className="text-responsive-4xl font-header font-bold text-gradient-primary mb-4 animate-scale-in">
              {t('welcomeUser')}, <span className="text-highlight">{userName}</span>
            </h1>
            <p className="text-responsive-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Ready to create something amazing today?
            </p>
          </div>

          {/* Enhanced Wallet Balance Card */}
          <div className="mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-glass border-white/20 shadow-glow interactive-scale-small">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-foreground font-header">
                  <div className="p-2 rounded-lg bg-gradient-primary">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  {t('walletBalance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-responsive-3xl font-header font-bold text-gradient-primary animate-pulse-glow">
                  {creditsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `${credits} ${t('credits')}`
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Ready to use
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Never expire
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Quick Links Grid */}
          <div className="mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <h2 className="text-responsive-2xl font-header font-bold text-foreground mb-6 text-center">{t('quickLinks')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-glass border-white/20 hover:shadow-glow interactive-scale group">
                <CardContent className="space-mobile">
                  <Link to="/templates" className="block">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-responsive-lg font-header font-semibold text-foreground mb-2">{t('browseTemplates')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t('exploreTemplates')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-glass border-white/20 hover:shadow-glow interactive-scale group">
                <CardContent className="space-mobile">
                  <Link to="/app/history" className="block">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-secondary group-hover:scale-110 transition-transform duration-300">
                        <History className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-responsive-lg font-header font-semibold text-foreground mb-2">{t('myHistory')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t('viewPastGenerations')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-glass border-white/20 hover:shadow-glow interactive-scale group sm:col-span-2 lg:col-span-1">
                <CardContent className="space-mobile">
                  <Link to="/app/wallet" className="block">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-accent group-hover:scale-110 transition-transform duration-300 pulse-glow">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-responsive-lg font-header font-semibold text-foreground mb-2">{t('buyCredits')}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t('purchaseCredits')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Recent Jobs Section */}
          <div className="animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <h2 className="text-responsive-2xl font-header font-bold text-foreground mb-6 text-center">{t('recentJobs')}</h2>
            <Card className="bg-glass border-white/20 shadow-medium">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-primary/20 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-primary animate-float" />
                  </div>
                  <h3 className="text-responsive-lg font-header font-semibold text-foreground mb-3">
                    Your creative journey starts here
                  </h3>
                  <p className="text-muted-foreground text-responsive-base leading-relaxed">
                    {t('recentJobsPlaceholder')}
                  </p>
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