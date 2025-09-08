import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import MediaPlayer from '@/components/MediaPlayer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Play, Video, Users } from 'lucide-react';

const MediaPlayerDemo = () => {
  const { t } = useLanguage();
  const [videoSrc, setVideoSrc] = useState('');
  const [posterSrc, setPosterSrc] = useState('/placeholder.svg');
  const [isGuest, setIsGuest] = useState(false);
  const [title, setTitle] = useState('Epic Cinematic Trailer');
  const [autoPlay, setAutoPlay] = useState(false);
  const [controls, setControls] = useState(true);

  // Sample video URLs for testing
  const sampleVideos = [
    { name: 'Sample Video 1', url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4' },
    { name: 'Sample Video 2', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { name: 'No Video (Poster Only)', url: '' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                MediaPlayer Component Demo
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Reusable 16:9 responsive video player with guest watermark support
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Player Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="video-src">Video Source URL</Label>
                    <Input
                      id="video-src"
                      placeholder="Enter video URL or leave empty for poster mode"
                      value={videoSrc}
                      onChange={(e) => setVideoSrc(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="poster-src">Poster Image URL</Label>
                    <Input
                      id="poster-src"
                      placeholder="Enter poster image URL"
                      value={posterSrc}
                      onChange={(e) => setPosterSrc(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">Video Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter video title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-guest">Guest Mode (Show Watermark)</Label>
                    <Switch
                      id="is-guest"
                      checked={isGuest}
                      onCheckedChange={setIsGuest}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-play">Auto Play</Label>
                    <Switch
                      id="auto-play"
                      checked={autoPlay}
                      onCheckedChange={setAutoPlay}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="controls">Show Controls</Label>
                    <Switch
                      id="controls"
                      checked={controls}
                      onCheckedChange={setControls}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sample Videos</Label>
                  <div className="space-y-2">
                    {sampleVideos.map((sample, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setVideoSrc(sample.url)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {sample.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaPlayer
                  src={videoSrc}
                  poster={posterSrc}
                  isGuest={isGuest}
                  title={title}
                  autoPlay={autoPlay}
                  controls={controls}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Feature Documentation */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>MediaPlayer Component Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Core Features</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• 16:9 responsive aspect ratio</li>
                    <li>• HTML5 video with fallback poster</li>
                    <li>• Custom play/pause overlay controls</li>
                    <li>• Smooth hover animations</li>
                    <li>• Loading state indicators</li>
                    <li>• Accessible keyboard navigation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Guest Mode Watermark</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Diagonal "RAWI PREVIEW" overlay</li>
                    <li>• Semi-transparent repeating pattern</li>
                    <li>• Corner watermarks for extra protection</li>
                    <li>• Non-destructive CSS-only implementation</li>
                    <li>• Unselectable text to prevent copying</li>
                    <li>• Maintains video quality underneath</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Props Interface</h4>
                <pre className="text-xs overflow-x-auto p-4 bg-muted rounded-[var(--radius)]">
{`interface MediaPlayerProps {
  src?: string;           // Video source URL
  poster?: string;        // Fallback poster image
  isGuest?: boolean;      // Show watermark overlay
  title?: string;         // Video title for accessibility
  className?: string;     // Additional CSS classes
  autoPlay?: boolean;     // Auto-start video
  controls?: boolean;     // Show video controls
  muted?: boolean;        // Mute audio by default
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Usage Example</h4>
                <pre className="text-xs overflow-x-auto p-4 bg-muted rounded-[var(--radius)]">
{`import MediaPlayer from '@/components/MediaPlayer';

// Basic usage
<MediaPlayer
  src="/videos/trailer.mp4"
  poster="/images/poster.jpg"
  isGuest={!user?.isPremium}
  title="Epic Action Trailer - Duration: 30s"
  controls={true}
/>

// Poster-only mode (no video)
<MediaPlayer
  poster="/images/poster.jpg"
  title="Coming Soon"
  isGuest={true}
/>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MediaPlayerDemo;