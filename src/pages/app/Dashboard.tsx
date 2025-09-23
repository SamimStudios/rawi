import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, History, Settings, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {language === 'ar' ? 'مرحباً بك في رواي' : 'Welcome to Rawi'}
            </h1>
            <p className="text-xl text-muted-foreground">
              {language === 'ar' 
                ? 'ابدأ رحلتك في إنتاج المحتوى الإبداعي' 
                : 'Start your creative content production journey'
              }
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Project */}
            <Card className="bg-card border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Plus className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {language === 'ar' ? 'إنشاء مشروع جديد' : 'Create New Project'}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' 
                    ? 'ابدأ مشروع إبداعي جديد' 
                    : 'Start a new creative project'
                  }
                </p>
                <Button variant="primary" className="w-full" disabled>
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>

            {/* My Projects */}
            <Card className="bg-card border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <History className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {language === 'ar' ? 'مشاريعي' : 'My Projects'}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' 
                    ? 'تصفح وإدارة مشاريعك' 
                    : 'Browse and manage your projects'
                  }
                </p>
                <Button variant="outline" className="w-full" disabled>
                  {language === 'ar' ? 'عرض المشاريع' : 'View Projects'}
                </Button>
              </CardContent>
            </Card>

            {/* Wallet */}
            <Card className="bg-card border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <Link to="/user/wallet" className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {language === 'ar' ? 'المحفظة' : 'Wallet'}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {language === 'ar' 
                      ? 'إدارة رصيدك والاشتراكات' 
                      : 'Manage your credits and subscriptions'
                    }
                  </p>
                  <Button variant="outline" className="w-full">
                    {language === 'ar' ? 'فتح المحفظة' : 'Open Wallet'}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-card border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-6">
                <Link to="/user/settings" className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {language === 'ar' ? 'الإعدادات' : 'Settings'}
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {language === 'ar' 
                      ? 'تخصيص حسابك وتفضيلاتك' 
                      : 'Customize your account and preferences'
                    }
                  </p>
                  <Button variant="outline" className="w-full">
                    {language === 'ar' ? 'فتح الإعدادات' : 'Open Settings'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Section */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">
                  {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {language === 'ar' 
                    ? 'نحن نعمل على إضافة المزيد من الميزات الرائعة' 
                    : 'Core functionality is being built. Stay tuned for amazing features!'
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}