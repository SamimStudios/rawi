import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, EyeOff, Download, Play, Volume2 } from 'lucide-react';
import { Node, MediaContent, MediaVersion, MediaAsset } from '../types/node';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection } from '../utils/i18n';

interface MediaRendererProps {
  node: Node;
}

export function MediaRenderer({ node }: MediaRendererProps) {
  const { language } = useLanguage();
  const [showJson, setShowJson] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const textDirection = getTextDirection(language);

  const mediaContent = node.content as MediaContent;
  const currentVersion = mediaContent.versions?.find(v => v.v === mediaContent.current_v);
  const displayVersion = selectedVersion !== null 
    ? mediaContent.versions?.find(v => v.v === selectedVersion) 
    : currentVersion;

  return (
    <div className="space-y-4" dir={textDirection}>
      {/* Media Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>🎬</span>
              <span>{t('media', language)} Content</span>
              <Badge variant="outline">{mediaContent.kind}</Badge>
              <Badge className="bg-primary/10 text-primary">
                v{mediaContent.current_v}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-2"
            >
              {showJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showJson ? t('hideJson', language) : t('showJson', language)}
            </Button>
          </div>
        </CardHeader>
        {showJson && (
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-md">
              <pre className="text-sm text-muted-foreground overflow-auto">
                {JSON.stringify(mediaContent, null, 2)}
              </pre>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Version Selector */}
      {mediaContent.versions && mediaContent.versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mediaContent.versions.map((version) => (
                <Button
                  key={version.v}
                  variant={
                    (selectedVersion !== null ? selectedVersion : mediaContent.current_v) === version.v 
                      ? "default" 
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedVersion(version.v)}
                >
                  v{version.v}
                  {version.v === mediaContent.current_v && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {t('currentVersion', language)}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Content */}
      {displayVersion ? (
        <div className="space-y-4">
          {mediaContent.kind === 'image' && displayVersion.images && (
            <MediaAssetsGrid
              assets={displayVersion.images}
              type="image"
              language={language as 'en' | 'ar'}
            />
          )}
          {mediaContent.kind === 'video' && displayVersion.videos && (
            <MediaAssetsGrid
              assets={displayVersion.videos}
              type="video"
              language={language as 'en' | 'ar'}
            />
          )}
          {mediaContent.kind === 'audio' && displayVersion.audios && (
            <MediaAssetsGrid
              assets={displayVersion.audios}
              type="audio"
              language={language as 'en' | 'ar'}
            />
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No media content available for the selected version
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MediaAssetsGridProps {
  assets: MediaAsset[];
  type: 'image' | 'video' | 'audio';
  language: 'en' | 'ar';
}

function MediaAssetsGrid({ assets, type, language }: MediaAssetsGridProps) {
  if (!assets.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No {type} assets found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{getMediaTypeIcon(type)}</span>
          <span className="capitalize">{type} Assets</span>
          <Badge variant="outline">{assets.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <MediaAssetCard
              key={index}
              asset={asset}
              type={type}
              index={index}
              language={language}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MediaAssetCardProps {
  asset: MediaAsset;
  type: 'image' | 'video' | 'audio';
  index: number;
  language: 'en' | 'ar';
}

function MediaAssetCard({ asset, type, index, language }: MediaAssetCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {type === 'image' && !imageError ? (
          <AspectRatio ratio={16 / 9}>
            <img
              src={asset.url}
              alt={`Image ${index + 1}`}
              className="object-cover w-full h-full rounded-t-md"
              onError={() => setImageError(true)}
            />
          </AspectRatio>
        ) : type === 'video' ? (
          <AspectRatio ratio={16 / 9}>
            <div className="flex items-center justify-center bg-muted/30 w-full h-full rounded-t-md">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          </AspectRatio>
        ) : type === 'audio' ? (
          <div className="flex items-center justify-center bg-muted/30 h-24 rounded-t-md">
            <Volume2 className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : (
          <AspectRatio ratio={16 / 9}>
            <div className="flex items-center justify-center bg-muted/30 w-full h-full rounded-t-md">
              <span className="text-muted-foreground">Failed to load</span>
            </div>
          </AspectRatio>
        )}
      </div>

      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {type.charAt(0).toUpperCase() + type.slice(1)} {index + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={asset.url} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3" />
              </a>
            </Button>
          </div>

          {asset.meta && (
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {asset.meta.width && asset.meta.height && (
                <>
                  <span>{t('width', language)}:</span>
                  <span>{asset.meta.width}px</span>
                  <span>{t('height', language)}:</span>
                  <span>{asset.meta.height}px</span>
                </>
              )}
              {asset.meta.duration && (
                <>
                  <span>{t('duration', language)}:</span>
                  <span>{formatDuration(asset.meta.duration)}</span>
                </>
              )}
              {asset.meta.size && (
                <>
                  <span>{t('size', language)}:</span>
                  <span>{formatFileSize(asset.meta.size)}</span>
                </>
              )}
              {asset.meta.mime && (
                <>
                  <span>{t('mimeType', language)}:</span>
                  <span className="font-mono">{asset.meta.mime}</span>
                </>
              )}
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <a href={asset.url} target="_blank" rel="noopener noreferrer" className="break-all">
                {asset.url}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getMediaTypeIcon(type: string): string {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'video':
      return '🎥';
    case 'audio':
      return '🔊';
    default:
      return '📁';
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}