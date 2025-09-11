import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSEOConfig } from '@/hooks/useSEO';
import { Search, Share2, FileText, Image as ImageIcon, Globe } from 'lucide-react';

const SEODemo = () => {
  const { t, language } = useLanguage();
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Apply custom SEO if values are set
  useSEOConfig({
    title: customTitle || undefined,
    description: customDescription || undefined,
    image: customImage || undefined,
  });

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const previewImage = customImage || '/brand/og-default.jpg';
  const fullImageUrl = previewImage.startsWith('/') ? `${window.location?.origin}${previewImage}` : previewImage;

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {language === 'ar' ? 'عرض تحسين محركات البحث' : 'SEO Demo'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === 'ar' 
                ? 'جرب كيفية عمل العلامات الوصفية الديناميكية وتحسين المشاركة الاجتماعية' 
                : 'Test how dynamic meta tags and social sharing optimization work'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SEO Controls */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Search className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'تخصيص SEO' : 'Customize SEO'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-foreground">
                      {language === 'ar' ? 'عنوان الصفحة' : 'Page Title'}
                    </Label>
                    <Input
                      id="title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل عنوان مخصص...' : 'Enter custom title...'}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-foreground">
                      {language === 'ar' ? 'وصف الصفحة' : 'Page Description'}
                    </Label>
                    <Textarea
                      id="description"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل وصف مخصص...' : 'Enter custom description...'}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="image" className="text-foreground">
                      {language === 'ar' ? 'صورة المشاركة' : 'Share Image URL'}
                    </Label>
                    <Input
                      id="image"
                      value={customImage}
                      onChange={(e) => setCustomImage(e.target.value)}
                      placeholder="/brand/og-default.jpg"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setCustomTitle('');
                        setCustomDescription('');
                        setCustomImage('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                    </Button>
                    <Button 
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: document.title,
                            text: customDescription || 'Check out Rawi App',
                            url: currentUrl,
                          });
                        } else {
                          navigator.clipboard.writeText(currentUrl);
                        }
                      }}
                      variant="primary"
                      size="sm"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'مشاركة' : 'Share'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current SEO Values */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'العلامات الوصفية الحالية' : 'Current Meta Tags'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">
                      {typeof document !== 'undefined' ? document.title : 'Loading...'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground bg-secondary/50 p-2 rounded">
                      {typeof document !== 'undefined' 
                        ? document.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description set'
                        : 'Loading...'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Canonical URL</Label>
                    <p className="text-sm text-foreground bg-secondary/50 p-2 rounded break-all">
                      {currentUrl}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Media Preview */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Share2 className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'معاينة المشاركة الاجتماعية' : 'Social Media Preview'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Facebook/LinkedIn Style Preview */}
                  <div className="border border-border rounded-lg overflow-hidden bg-background">
                    <div className="aspect-[1.91/1] bg-gradient-primary flex items-center justify-center">
                    <img 
                      src={fullImageUrl}
                      alt={t('socialPreview')}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            // Create fallback element safely without innerHTML
                            const fallbackDiv = document.createElement('div');
                            fallbackDiv.className = 'flex items-center justify-center h-full text-white';
                            const iconDiv = document.createElement('div');
                            iconDiv.className = 'w-12 h-12';
                            iconDiv.setAttribute('aria-label', 'Image placeholder');
                            fallbackDiv.appendChild(iconDiv);
                            parent.appendChild(fallbackDiv);
                          }
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground mb-1 uppercase">
                        {currentUrl.replace(/^https?:\/\//, '')}
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                        {typeof document !== 'undefined' ? document.title : 'Loading...'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {customDescription || (typeof document !== 'undefined' 
                          ? document.querySelector('meta[name="description"]')?.getAttribute('content')
                          : 'Loading...')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Globe className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'التفاصيل التقنية' : 'Technical Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Language</Label>
                      <p className="text-foreground">{language.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Direction</Label>
                      <p className="text-foreground">{language === 'ar' ? 'RTL' : 'LTR'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Open Graph Image</Label>
                    <p className="text-foreground break-all">{fullImageUrl}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Sitemap</Label>
                    <a 
                      href="/sitemap.xml" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      /sitemap.xml
                    </a>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Robots.txt</Label>
                    <a 
                      href="/robots.txt" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      /robots.txt
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SEODemo;