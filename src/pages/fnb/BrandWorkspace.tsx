import { useState } from 'react';
import { useParams, useNavigate, Routes, Route } from 'react-router-dom';
import { 
  Settings, 
  Image, 
  BarChart3, 
  ChevronLeft, 
  Sparkles,
  Calendar,
  Filter,
  Grid3X3,
  List,
  Heart,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFnbBrand, useFnbContentRequests, useFnbGeneratedContent } from '@/hooks/useFnbBrands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sidebar component
function BrandSidebar({ brand, onNavigate }: { brand: any; onNavigate: (path: string) => void }) {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="w-64 border-e bg-card p-4 flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/fnb')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {brand?.visual_identity?.logo_primary ? (
          <img 
            src={brand.visual_identity.logo_primary} 
            alt={brand.brand_name}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div 
            className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: brand?.visual_identity?.primary_color_hex || '#6366f1' }}
          >
            {brand?.brand_name?.charAt(0) || 'B'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{brand?.brand_name}</h2>
          <p className="text-xs text-muted-foreground">{brand?.city || brand?.country}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => onNavigate('content')}
        >
          <Image className="h-4 w-4 me-2" />
          {t('fnb.contentGeneration')}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => onNavigate('performance')}
        >
          <BarChart3 className="h-4 w-4 me-2" />
          {t('fnb.performance')}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={() => onNavigate('setup')}
        >
          <Settings className="h-4 w-4 me-2" />
          {t('fnb.brandSettings')}
        </Button>
      </nav>

      {/* Progress */}
      <div className="pt-4 border-t">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">{t('fnb.setupProgress')}</span>
          <span className="font-medium">{brand?.setup_progress || 0}%</span>
        </div>
        <Progress value={brand?.setup_progress || 0} className="h-2" />
      </div>
    </div>
  );
}

// Content Generation Tab
function ContentTab({ brandId }: { brandId: string }) {
  const { t, isRTL } = useLanguage();
  const { requests, createRequest, refetch: refetchRequests } = useFnbContentRequests(brandId);
  const { content, toggleFavorite, archiveContent, refetch: refetchContent } = useFnbGeneratedContent(brandId);
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'favorites'>('all');
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video' | 'both'>('image');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('fnb.promptRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createRequest.mutateAsync({
        brand_id: brandId,
        content_type: contentType,
        prompt: prompt.trim(),
        request_type: 'manual',
        options: {
          include_caption: true,
          caption_languages: ['ar', 'en'],
        },
      });
      toast.success(t('fnb.requestCreated'));
      setIsGenerateOpen(false);
      setPrompt('');
      refetchRequests();
    } catch (error) {
      toast.error(t('error'));
    }
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const filteredContent = content.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return item.is_favorite;
    return item.content_type === filter;
  });

  // Pending/Processing requests
  const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'processing');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('fnb.contentGeneration')}</h2>
          <p className="text-muted-foreground">{t('fnb.contentGenerationDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Sparkles className="h-4 w-4 me-2" />
                {t('fnb.generateContent')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('fnb.generateContent')}</DialogTitle>
                <DialogDescription>{t('fnb.generateContentDesc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>{t('fnb.contentType')}</Label>
                  <Select value={contentType} onValueChange={(v: any) => setContentType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">{t('fnb.image')}</SelectItem>
                      <SelectItem value="video">{t('fnb.video')}</SelectItem>
                      <SelectItem value="both">{t('fnb.both')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('fnb.prompt')}</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('fnb.promptPlaceholder')}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleGenerate} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t('fnb.generate')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" disabled>
            <Calendar className="h-4 w-4 me-2" />
            {t('fnb.autoSchedule')}
          </Button>
        </div>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('fnb.activeRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium line-clamp-1">{request.prompt}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`fnb.status.${request.status}`)} • {request.content_type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t('fnb.all')}
          </Button>
          <Button
            variant={filter === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('image')}
          >
            {t('fnb.images')}
          </Button>
          <Button
            variant={filter === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('video')}
          >
            {t('fnb.videos')}
          </Button>
          <Button
            variant={filter === 'favorites' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('favorites')}
          >
            <Heart className="h-4 w-4 me-1" />
            {t('fnb.favorites')}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Gallery */}
      {filteredContent.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Image className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('fnb.noContentYet')}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t('fnb.noContentDescription')}
            </p>
            <Button onClick={() => setIsGenerateOpen(true)}>
              <Sparkles className="h-4 w-4 me-2" />
              {t('fnb.generateFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'space-y-3'
        )}>
          {filteredContent.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="relative aspect-square">
                {item.content_type === 'video' ? (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : (
                  <img 
                    src={item.file_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => toggleFavorite.mutate({ id: item.id, is_favorite: !item.is_favorite })}>
                    <Heart className={cn("h-4 w-4", item.is_favorite && "fill-current text-red-500")} />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => archiveContent.mutate(item.id)}>
                        <Trash2 className="h-4 w-4 me-2" />
                        {t('fnb.archive')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Type Badge */}
                <Badge className="absolute top-2 start-2" variant="outline">
                  {item.content_type}
                </Badge>
                {item.is_favorite && (
                  <Heart className="absolute top-2 end-2 h-5 w-5 fill-red-500 text-red-500" />
                )}
              </div>
              {viewMode === 'list' && (
                <CardContent className="p-3">
                  {item.captions?.ar && (
                    <p className="text-sm line-clamp-2">{item.captions.ar}</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Performance Tab (Placeholder)
function PerformanceTab() {
  const { t } = useLanguage();

  // Dummy data for demonstration
  const dummyMetrics = {
    totalImpressions: 125000,
    totalReach: 85000,
    totalEngagement: 12500,
    topPost: { platform: 'instagram', impressions: 45000 },
    weeklyGrowth: 12.5,
  };

  const dummyPosts = [
    { id: 1, platform: 'instagram', type: 'reel', impressions: 45000, likes: 3200, comments: 156, revenue: 12500 },
    { id: 2, platform: 'tiktok', type: 'video', impressions: 32000, likes: 4500, comments: 230, revenue: 8900 },
    { id: 3, platform: 'instagram', type: 'post', impressions: 18000, likes: 1200, comments: 45, revenue: 4200 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('fnb.performance')}</h2>
        <p className="text-muted-foreground">{t('fnb.performanceDesc')}</p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="flex items-center gap-4 py-6">
          <BarChart3 className="h-12 w-12 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">{t('fnb.performanceComingSoon')}</h3>
            <p className="text-muted-foreground">{t('fnb.performanceComingSoonDesc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dummy Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('fnb.totalImpressions')}</CardDescription>
            <CardTitle className="text-2xl">{dummyMetrics.totalImpressions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('fnb.totalReach')}</CardDescription>
            <CardTitle className="text-2xl">{dummyMetrics.totalReach.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('fnb.totalEngagement')}</CardDescription>
            <CardTitle className="text-2xl">{dummyMetrics.totalEngagement.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('fnb.weeklyGrowth')}</CardDescription>
            <CardTitle className="text-2xl text-green-500">+{dummyMetrics.weeklyGrowth}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Dummy Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fnb.topPerformingContent')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dummyPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{post.platform} {post.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.impressions.toLocaleString()} {t('fnb.impressions')}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="font-semibold text-green-500">SAR {post.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t('fnb.attributedRevenue')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post to Social (Disabled) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle>{t('fnb.postToSocial')}</CardTitle>
          <CardDescription>{t('fnb.postToSocialDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button disabled>Instagram</Button>
            <Button disabled>TikTok</Button>
            <Button disabled>Snapchat</Button>
            <Button disabled>X</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Workspace Component
export default function BrandWorkspace() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { data: brand, isLoading } = useFnbBrand(brandId);

  const handleNavigate = (path: string) => {
    if (path === 'setup') {
      navigate(`/app/fnb/${brandId}/setup`);
    }
    // Other navigation handled by tabs
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-64 border-e p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('fnb.brandNotFound')}</h2>
          <Button onClick={() => navigate('/app/fnb')}>{t('fnb.backToBrands')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <BrandSidebar brand={brand} onNavigate={handleNavigate} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="content">
              <Image className="h-4 w-4 me-2" />
              {t('fnb.content')}
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3 className="h-4 w-4 me-2" />
              {t('fnb.performance')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ContentTab brandId={brandId!} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
