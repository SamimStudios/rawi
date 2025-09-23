import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Play, Image, Volume2 } from 'lucide-react';

interface MediaVersion {
  version: string;
  url: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    format?: string;
  };
}

interface MediaContent {
  type: 'image' | 'video' | 'audio';
  versions: MediaVersion[];
  default_version?: string;
}

interface MediaContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function MediaContentEditor({ content, onChange }: MediaContentEditorProps) {
  const [mediaContent, setMediaContent] = useState<MediaContent>({
    type: 'image',
    versions: [],
    default_version: undefined
  });

  useEffect(() => {
    // Initialize from content
    if (content.type && Array.isArray(content.versions)) {
      setMediaContent({
        type: content.type || 'image',
        versions: content.versions || [],
        default_version: content.default_version
      });
    }
  }, [content]);

  useEffect(() => {
    // Update parent content when media content changes
    onChange(mediaContent);
  }, [mediaContent, onChange]);

  const addVersion = () => {
    const newVersion: MediaVersion = {
      version: `v${mediaContent.versions.length + 1}`,
      url: '',
      metadata: {}
    };
    
    setMediaContent(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion],
      default_version: prev.versions.length === 0 ? newVersion.version : prev.default_version
    }));
  };

  const updateVersion = (index: number, updates: Partial<MediaVersion>) => {
    setMediaContent(prev => ({
      ...prev,
      versions: prev.versions.map((version, i) => 
        i === index ? { ...version, ...updates } : version
      )
    }));
  };

  const removeVersion = (index: number) => {
    const versionToRemove = mediaContent.versions[index];
    
    setMediaContent(prev => ({
      ...prev,
      versions: prev.versions.filter((_, i) => i !== index),
      default_version: prev.default_version === versionToRemove.version 
        ? prev.versions[0]?.version 
        : prev.default_version
    }));
  };

  const setDefaultVersion = (version: string) => {
    setMediaContent(prev => ({
      ...prev,
      default_version: version
    }));
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'audio':
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  const updateMetadata = (versionIndex: number, key: string, value: any) => {
    const version = mediaContent.versions[versionIndex];
    const updatedMetadata = {
      ...version.metadata,
      [key]: value === '' ? undefined : value
    };
    
    updateVersion(versionIndex, { metadata: updatedMetadata });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Media Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure the media type and versions for this node
          </p>
        </div>

        {/* Media Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {getMediaTypeIcon(mediaContent.type)}
              Media Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={mediaContent.type}
              onValueChange={(value: 'image' | 'video' | 'audio') => 
                setMediaContent(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Image
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Audio
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Versions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Media Versions</CardTitle>
              <Button onClick={addVersion} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Version
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mediaContent.versions.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-muted-foreground mb-4">No versions configured</p>
                <Button onClick={addVersion} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Version
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mediaContent.versions.map((version, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Version {index + 1}</h4>
                          {mediaContent.default_version === version.version && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {mediaContent.default_version !== version.version && (
                            <Button
                              onClick={() => setDefaultVersion(version.version)}
                              variant="ghost"
                              size="sm"
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            onClick={() => removeVersion(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Version Name</Label>
                          <Input
                            value={version.version}
                            onChange={(e) => updateVersion(index, { version: e.target.value })}
                            placeholder="v1, hd, mobile..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>URL</Label>
                          <Input
                            value={version.url}
                            onChange={(e) => updateVersion(index, { url: e.target.value })}
                            placeholder="https://example.com/media.jpg"
                          />
                        </div>
                      </div>

                      {/* Metadata based on media type */}
                      <div className="space-y-4">
                        <h5 className="font-medium text-sm">Metadata</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(mediaContent.type === 'image' || mediaContent.type === 'video') && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Width (px)</Label>
                                <Input
                                  type="number"
                                  value={version.metadata?.width || ''}
                                  onChange={(e) => updateMetadata(index, 'width', parseInt(e.target.value) || undefined)}
                                  placeholder="1920"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Height (px)</Label>
                                <Input
                                  type="number"
                                  value={version.metadata?.height || ''}
                                  onChange={(e) => updateMetadata(index, 'height', parseInt(e.target.value) || undefined)}
                                  placeholder="1080"
                                />
                              </div>
                            </>
                          )}

                          {(mediaContent.type === 'video' || mediaContent.type === 'audio') && (
                            <div className="space-y-2">
                              <Label className="text-xs">Duration (sec)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={version.metadata?.duration || ''}
                                onChange={(e) => updateMetadata(index, 'duration', parseFloat(e.target.value) || undefined)}
                                placeholder="30.5"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs">File Size (bytes)</Label>
                            <Input
                              type="number"
                              value={version.metadata?.size || ''}
                              onChange={(e) => updateMetadata(index, 'size', parseInt(e.target.value) || undefined)}
                              placeholder="1048576"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Format</Label>
                            <Input
                              value={version.metadata?.format || ''}
                              onChange={(e) => updateMetadata(index, 'format', e.target.value)}
                              placeholder="jpg, mp4, mp3..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}