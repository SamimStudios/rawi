import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { RTLWrapper, RTLFlex } from '@/components/ui/rtl-wrapper';
import { Globe, Star, Heart, MessageCircle, Settings, User } from 'lucide-react';

const I18nDemo = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              i18n Demo - {language === 'ar' ? 'عرض النظام المتعدد اللغات' : 'Internationalization Showcase'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'ar' 
                ? 'يُظهر هذا العرض إمكانيات النظام المتعدد اللغات مع دعم RTL الكامل' 
                : 'This demo showcases the i18n system capabilities with full RTL support'
              }
            </p>
            
            {/* Language Toggles */}
            <RTLFlex justify="center" className="gap-4 mt-6">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                English
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                onClick={() => setLanguage('ar')}
                className="flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                العربية
              </Button>
            </RTLFlex>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* RTL Layout Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  {language === 'ar' ? 'تخطيط RTL' : 'RTL Layout'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' 
                    ? 'يتم قلب التخطيط تلقائياً للعربية مع محاذاة النص إلى اليمين'
                    : 'Layout automatically flips for Arabic with right-aligned text'
                  }
                </p>
                <RTLFlex reverse className="gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <Heart className="w-4 h-4 text-red-500" />
                  <Settings className="w-4 h-4 text-accent" />
                </RTLFlex>
              </CardContent>
            </Card>

            {/* Navigation Demo */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-primary" />
                  {t('templates')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('browseTemplates')}</p>
                  <p className="text-sm text-muted-foreground">{t('myHistory')}</p>
                  <p className="text-sm text-muted-foreground">{t('settings')}</p>
                  <p className="text-sm text-muted-foreground">{t('help')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Demo */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Globe className="w-5 h-5 text-primary" />
                  {t('wallet')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-primary">
                    120 {t('credits')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('creditsExpireIn90')}
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-auth hover:opacity-90 text-white border-0 w-full"
                  >
                    {t('buyCredits')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Demo */}
          <Card className="bg-card border-border mb-12">
            <CardHeader>
              <CardTitle className="text-foreground">{t('transactionHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: t('purchase'), amount: '+150', date: '2025-09-01' },
                  { type: t('generation') + ' — ' + t('teaser'), amount: '-24', date: '2025-09-02' },
                  { type: t('generation') + ' — ' + t('trailer'), amount: '-66', date: '2025-09-03' },
                ].map((transaction, index) => (
                  <RTLFlex key={index} justify="between" className="p-4 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.amount} {transaction.amount.includes('+') ? 'AED' : ''}
                    </div>
                  </RTLFlex>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Demo */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <RTLFlex justify="between" align="center">
                  <div>
                    <p className="font-medium text-foreground">{t('language')}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'اختر لغتك المفضلة' : 'Choose your preferred language'}
                    </p>
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      onClick={() => setLanguage('en')}
                      size="sm"
                    >
                      EN
                    </Button>
                    <Button
                      variant={language === 'ar' ? 'default' : 'outline'}
                      onClick={() => setLanguage('ar')}
                      size="sm"
                    >
                      AR
                    </Button>
                  </div>
                </RTLFlex>

                <RTLFlex justify="between" align="center">
                  <div>
                    <p className="font-medium text-foreground">{t('name')}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'اسمك الكامل' : 'Your full name'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'محمد أحمد' : 'John Doe'}
                  </div>
                </RTLFlex>

                <div className="pt-4 border-t border-border">
                  <Button 
                    className="bg-gradient-auth hover:opacity-90 text-white border-0"
                    size="lg"
                  >
                    {t('save')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'التقنيات المستخدمة: React Context API، localStorage، RTL CSS، و Tailwind'
                : 'Technologies: React Context API, localStorage persistence, RTL CSS, and Tailwind'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'ar' 
                ? `الاتجاه الحالي: ${isRTL ? 'من اليمين إلى اليسار' : 'من اليسار إلى اليمين'} | اللغة: ${language.toUpperCase()}`
                : `Current direction: ${isRTL ? 'Right-to-Left' : 'Left-to-Right'} | Language: ${language.toUpperCase()}`
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default I18nDemo;