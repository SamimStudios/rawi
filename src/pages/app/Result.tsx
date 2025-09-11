import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import MediaPlayer from '@/components/MediaPlayer';
import { Download, Share, RotateCcw, Copy, Play, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ResultData {
  id: string;
  title: string;
  duration: string;
  templateName: string;
  language: string;
  submittedDate: string;
  creditsSpent: number;
  isGuest: boolean;
  videoUrl: string;
  posterUrl?: string;
  publicUrl: string;
  relatedOutputs: Array<{
    id: string;
    thumbnail: string;
    title: string;
  }>;
}

const Result = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Mock result data - replace with API call later
    const mockResult: ResultData = {
      id: id || 'mock-result-id',
      title: 'Epic Action Trailer',
      duration: '~30s',
      templateName: 'Cinematic Action Trailer',
      language: 'English',
      submittedDate: new Date().toLocaleDateString(),
      creditsSpent: 20,
      isGuest: !user,
      videoUrl: user ? 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4' : '', // Sample video for registered users
      posterUrl: '/placeholder.svg', // Fallback poster
      publicUrl: `${window.location.origin}/public/results/${id}`,
      relatedOutputs: [
        { id: '1', thumbnail: '/placeholder.svg', title: 'Variation 1' },
        { id: '2', thumbnail: '/placeholder.svg', title: 'Variation 2' },
        { id: '3', thumbnail: '/placeholder.svg', title: 'Variation 3' }
      ]
    };
    setResult(mockResult);
  }, [id, user]);

  const handleShareLink = () => {
    if (result) {
      navigator.clipboard.writeText(result.publicUrl);
      toast.success(t('linkCopied'));
    }
  };

  const handleDownload = () => {
    toast.info('Download functionality coming soon');
  };

  const handleRegenerate = () => {
    toast.info('Regenerate functionality coming soon');
  };

  const handleMakeVariation = () => {
    toast.info('Make variation functionality coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Result not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('yourResult')}
            </h1>
          </div>

          {/* Guest Ribbon */}
          {result.isGuest && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
              <div className="text-yellow-500 text-center font-medium">
                {t('guestRibbon')}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Video Player */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <MediaPlayer
                    src={result.videoUrl}
                    poster={result.posterUrl}
                    isGuest={result.isGuest}
                    title={`${result.title || t('untitled')} - ${t('duration')}: ${result.duration}`}
                    controls={true}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="primary"
                  disabled={result.isGuest}
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t('download')}
                </Button>

                <Button 
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={handleShareLink}
                >
                  <Share className="w-5 h-5 mr-2" />
                  {t('shareLink')}
                </Button>

                <Button 
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={handleRegenerate}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  {t('regenerate')}
                </Button>

                <Button 
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={handleMakeVariation}
                >
                  <Copy className="w-5 h-5 mr-2" />
                  {t('makeVariation')}
                </Button>
              </div>

              {/* Notes Section */}
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="text-muted-foreground">
                    {t('resultNotes')}{' '}
                    <Link to="/help" className="text-primary hover:underline">
                      {t('help')}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Related Outputs */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('relatedOutputs')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {result.relatedOutputs.map((output) => (
                      <div key={output.id} className="space-y-2">
                        <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          {output.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata Panel */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">{t('template')}</label>
                    <p className="text-foreground font-medium">{result.templateName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">{t('language')}</label>
                    <p className="text-foreground font-medium">{result.language}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">{t('submittedDate')}</label>
                    <p className="text-foreground font-medium">{result.submittedDate}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">{t('creditsSpent')}</label>
                    <p className="text-foreground font-medium">{result.creditsSpent} credits</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary/10"
                    asChild
                  >
                    <Link to="/app/history">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      View History
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary/10"
                    asChild
                  >
                    <Link to="/templates">
                      Browse Templates
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Result;