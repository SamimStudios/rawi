// src/pages/app/build/node/components/MediaContentEditor.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Play, Image, Volume2, CheckCircle2 } from 'lucide-react';

/**
 * SSOT-aligned types (minimal)
 */
type MediaType = 'image' | 'video' | 'audio';

type BaseMediaItem = {
  uri: string;
  format?: string;
  poster?: string; // video only
};

type ImageItem = BaseMediaItem & {
  kind: 'ImageItem';
  width?: number;
  height?: number;
};

type VideoItem = BaseMediaItem & {
  kind: 'VideoItem';
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
};

type AudioItem = BaseMediaItem & {
  kind: 'AudioItem';
  duration?: number;
  bitrate?: number;
};

type MediaItem = ImageItem | VideoItem | AudioItem;

type MediaVersion = {
  kind: 'MediaVersion';
  idx: number;      // 1..N
  path?: string;    // optional label like "v1", "hd", etc.
  item: MediaItem;
};

type MediaContent = {
  kind: 'MediaContent';
  type: MediaType;
  path: string;               // e.g., "media"
  versions: MediaVersion[];   // can be empty
  selected_version_idx: number; // 1..N (ignored when versions === [])
};

interface MediaContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/**
 * Convert legacy builder content (if any) to SSOT MediaContent.
 * Legacy shape was:
 * { type: 'image'|'video'|'audio', versions: [{version, url, metadata:{...}}], default_version?: string }
 */
function normalizeToSSOT(raw: any): MediaContent {
  const type: MediaType = (raw?.type === 'video' || raw?.type === 'audio') ? raw.type : 'image';
  const legacyVersions = Array.isArray(raw?.versions) ? raw.versions : [];
  const ssotVersions: MediaVersion[] = legacyVersions.map((v: any, i: number) => {
    const base: BaseMediaItem = { uri: v?.url ?? '', format: v?.metadata?.format };
    const common = { path: v?.version ?? `v${i + 1}` };
    if (type === 'video') {
      const item: VideoItem = {
        kind: 'VideoItem',
        ...base,
        poster: v?.metadata?.poster,
        width: v?.metadata?.width,
        height: v?.metadata?.height,
        duration: v?.metadata?.duration,
        fps: v?.metadata?.fps,
      };
      return { kind: 'MediaVersion', idx: i + 1, item, ...common };
    }
    if (type === 'audio') {
      const item: AudioItem = {
        kind: 'AudioItem',
        ...base,
        duration: v?.metadata?.duration,
        // legacy had "size" — not in SSOT; drop it
        bitrate: v?.metadata?.bitrate,
      };
      return { kind: 'MediaVersion', idx: i + 1, item, ...common };
    }
    // image
    const item: ImageItem = {
      kind: 'ImageItem',
      ...base,
      width: v?.metadata?.width,
      height: v?.metadata?.height,
    };
    return { kind: 'MediaVersion', idx: i + 1, item, ...common };
  });

  // selected index
  let selectedIdx = 1;
  if (typeof raw?.selected_version_idx === 'number') {
    selectedIdx = raw.selected_version_idx;
  } else if (typeof raw?.default_version === 'string') {
    const match = ssotVersions.find(v => v.path === raw.default_version);
    selectedIdx = match?.idx ?? 1;
  }

  // Clamp or ignore when empty
  if (ssotVersions.length > 0) {
    if (selectedIdx < 1 || selectedIdx > ssotVersions.length) selectedIdx = 1;
  } else {
    selectedIdx = 1;
  }

  return {
    kind: 'MediaContent',
    type,
    path: raw?.path || 'media',
    versions: ssotVersions,
    selected_version_idx: selectedIdx,
  };
}

function makeBlankItemByType(type: MediaType): MediaItem {
  if (type === 'video') return { kind: 'VideoItem', uri: '', format: undefined, poster: undefined, width: undefined, height: undefined, duration: undefined, fps: undefined };
  if (type === 'audio') return { kind: 'AudioItem', uri: '', format: undefined, duration: undefined, bitrate: undefined };
  return { kind: 'ImageItem', uri: '', format: undefined, width: undefined, height: undefined };
}

function reindexVersions(versions: MediaVersion[]): MediaVersion[] {
  return versions
    .filter(v => v && v.item && typeof v.item.uri === 'string') // keep entries
    .map((v, i) => ({ ...v, kind: 'MediaVersion', idx: i + 1 }));
}

export function MediaContentEditor({ content, onChange }: MediaContentEditorProps) {
  const [state, setState] = useState<MediaContent>(() => normalizeToSSOT(content || {}));

  // after the existing `const [state, setState] = useState(...);`
  useEffect(() => {
    // push a sanitized baseline so the parent never has {}
    const cleanVersions = reindexVersions(state.versions ?? []);
    const sel = cleanVersions.length
      ? Math.min(Math.max(1, state.selected_version_idx || 1), cleanVersions.length)
      : 1;
    onChange({
      ...state,
      kind: 'MediaContent',
      path: state.path || 'media',
      versions: cleanVersions,
      selected_version_idx: sel,
    } as unknown as Record<string, any>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute when parent passes new content
  useEffect(() => {
    setState(prev => {
      const next = normalizeToSSOT(content || {});
      // only update if actually different (stringify-safe since shallow)
      const a = JSON.stringify(prev);
      const b = JSON.stringify(next);
      return a === b ? prev : next;
    });
  }, [content]);

  // helper to stage state and emit normalized SSOT
  const commit = (updater: (prev: MediaContent) => MediaContent) => {
    setState(prev => {
      const next = updater(prev);
      // sanitize before emitting
      const cleanVersions = reindexVersions(next.versions);
      let sel = next.selected_version_idx;
      if (cleanVersions.length === 0) sel = 1;
      else if (sel < 1 || sel > cleanVersions.length) sel = 1;
      const out: MediaContent = {
        ...next,
        kind: 'MediaContent',
        path: next.path || 'media',
        versions: cleanVersions,
        selected_version_idx: sel,
      };
      onChange(out as unknown as Record<string, any>);
      return out;
    });
  };

  const versions = state.versions ?? [];
  const isVideo = state.type === 'video';
  const isAudio = state.type === 'audio';

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

  const addVersion = () => {
    commit(prev => ({
      ...prev,
      versions: [
        ...prev.versions,
        {
          kind: 'MediaVersion',
          idx: prev.versions.length + 1,
          path: `v${prev.versions.length + 1}`,
          item: makeBlankItemByType(prev.type),
        },
      ],
    }));
  };

  const removeVersion = (idx: number) => {
    commit(prev => ({
      ...prev,
      versions: prev.versions.filter(v => v.idx !== idx),
      // selected idx will be clamped in commit()
    }));
  };

  const setSelected = (idx: number) => {
    commit(prev => ({ ...prev, selected_version_idx: idx }));
  };

  const setItemField = (idx: number, field: string, value: any) => {
    commit(prev => ({
      ...prev,
      versions: prev.versions.map(v => (v.idx === idx ? { ...v, item: { ...v.item, [field]: value } } : v)),
    }));
  };

  const setVersionPath = (idx: number, label: string) => {
    commit(prev => ({
      ...prev,
      versions: prev.versions.map(v => (v.idx === idx ? { ...v, path: label || undefined } : v)),
    }));
  };

  const setType = (nextType: MediaType) => {
    commit(prev => {
      if (prev.type === nextType) return prev;
      // convert all items to the new type (URIs preserved)
      const converted = prev.versions.map(v => {
        const uri = v.item?.uri ?? '';
        const label = v.path;
        return {
          kind: 'MediaVersion',
          idx: v.idx,
          path: label,
          item: makeBlankItemByType(nextType),
        } as MediaVersion;
      });
      // keep URIs
      const withUris = converted.map((v, i) => ({
        ...v,
        item: { ...v.item, uri: prev.versions[i]?.item?.uri ?? '' },
      }));
      return { ...prev, type: nextType, versions: withUris };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Media Node Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Define media versions. Zero versions is allowed; generation can create the first one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Media Path</Label>
              <Input
                value={state.path}
                onChange={e => commit(prev => ({ ...prev, path: e.target.value || 'media' }))}
                placeholder="media"
              />
              <p className="text-xs text-muted-foreground">Used by the addressing system (e.g., <code>items.media</code>).</p>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={state.type} onValueChange={(v: any) => setType(v)}>
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
            </div>

            <div className="space-y-2">
              <Label>Selected Version</Label>
              <Input
                value={versions.length === 0 ? '' : String(state.selected_version_idx)}
                onChange={e => {
                  const n = parseInt(e.target.value || '1', 10);
                  setSelected(Number.isFinite(n) ? n : 1);
                }}
                placeholder={versions.length === 0 ? '—' : '1'}
                disabled={versions.length === 0}
              />
              <p className="text-xs text-muted-foreground">Index (1..N). Disabled when no versions.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Versions</CardTitle>
          <Button type="button" onClick={addVersion}>
            <Plus className="w-4 h-4 mr-2" />
            Add version
          </Button>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No versions yet. You can save like this; the renderer will show a Generate button (if configured).
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {versions
                .slice()
                .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
                .map((v) => (
                  <Card key={v.idx}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          {getMediaTypeIcon(state.type)}
                          v{v.idx}
                        </Badge>
                        {state.selected_version_idx === v.idx && (
                          <span className="inline-flex items-center text-xs text-primary gap-1">
                            <CheckCircle2 className="w-3 h-3" /> default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={state.selected_version_idx === v.idx ? 'default' : 'outline'} onClick={() => setSelected(v.idx)}>
                          Default
                        </Button>
                        <Button onClick={() => removeVersion(v.idx)} variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Version Label (path)</Label>
                          <Input
                            value={v.path ?? ''}
                            onChange={e => setVersionPath(v.idx, e.target.value)}
                            placeholder={`v${v.idx}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URI</Label>
                          <Input
                            value={v.item.uri ?? ''}
                            onChange={e => setItemField(v.idx, 'uri', e.target.value)}
                            placeholder="https://... or storage path"
                          />
                        </div>
                      </div>
                      {/* Type-specific metadata */}
                      {!isAudio && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                              type="number"
                              value={(v.item as any).width ?? ''}
                              onChange={e => setItemField(v.idx, 'width', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 1920"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              type="number"
                              value={(v.item as any).height ?? ''}
                              onChange={e => setItemField(v.idx, 'height', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 1080"
                            />
                          </div>
                        </div>
                      )}
                      {isVideo && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Duration (s)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(v.item as any).duration ?? ''}
                              onChange={e => setItemField(v.idx, 'duration', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 30.5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>FPS</Label>
                            <Input
                              type="number"
                              step="1"
                              value={(v.item as any).fps ?? ''}
                              onChange={e => setItemField(v.idx, 'fps', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Poster (URL)</Label>
                            <Input
                              value={(v.item as any).poster ?? ''}
                              onChange={e => setItemField(v.idx, 'poster', e.target.value || undefined)}
                              placeholder="Optional poster frame URL"
                            />
                          </div>
                        </div>
                      )}
                      {isAudio && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Duration (s)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(v.item as any).duration ?? ''}
                              onChange={e => setItemField(v.idx, 'duration', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 12.3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bitrate (kbps)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={(v.item as any).bitrate ?? ''}
                              onChange={e => setItemField(v.idx, 'bitrate', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="e.g., 192"
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Input
                          value={v.item.format ?? ''}
                          onChange={e => setItemField(v.idx, 'format', e.target.value || undefined)}
                          placeholder="png, mp4, wav..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
