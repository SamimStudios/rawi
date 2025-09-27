// src/pages/app/build/node/components/MediaContentEditor.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Play, Image, Volume2, CheckCircle2 } from 'lucide-react';

// ---- tiny local buffer so validator doesn't fight every keystroke ----
type EditBuf = Record<string, string>;
const makeKey = (idx: number, field: string) => `${idx}:${field}`;
const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
};

// ---- SSOT-aligned minimal types ----
type MediaType = 'image' | 'video' | 'audio';

type BaseMediaItem = {
  uri: string;
  format?: string;
  poster?: string; // video only
};
type ImageItem = BaseMediaItem & { kind: 'ImageItem'; width?: number; height?: number };
type VideoItem = BaseMediaItem & {
  kind: 'VideoItem';
  width?: number; height?: number; duration?: number; fps?: number;
};
type AudioItem = BaseMediaItem & { kind: 'AudioItem'; duration?: number; bitrate?: number };

type MediaItem = ImageItem | VideoItem | AudioItem;

type MediaVersion = { kind: 'MediaVersion'; idx: number; path?: string; item: MediaItem };

type MediaContent = {
  kind: 'MediaContent';
  type: MediaType;
  path: string;
  versions: MediaVersion[];              // can be []
  selected_version_idx: number;          // 1..N (ignored when versions === [])
};

interface MediaContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

// ---- legacy → SSOT normalizer (safe if already SSOT) ----
function normalizeToSSOT(raw: any): MediaContent {
  const type: MediaType = raw?.type === 'video' || raw?.type === 'audio' ? raw.type : 'image';
  const legacyVersions = Array.isArray(raw?.versions) ? raw.versions : [];
  const ssotVersions: MediaVersion[] = legacyVersions.map((v: any, i: number) => {
    const base: BaseMediaItem = { uri: v?.url ?? v?.item?.uri ?? '', format: v?.metadata?.format ?? v?.item?.format };
    const path = v?.version ?? v?.path ?? `v${i + 1}`;
    if (type === 'video') {
      const item: VideoItem = {
        kind: 'VideoItem',
        ...base,
        poster: v?.metadata?.poster ?? v?.item?.poster,
        width: v?.metadata?.width ?? v?.item?.width,
        height: v?.metadata?.height ?? v?.item?.height,
        duration: v?.metadata?.duration ?? v?.item?.duration,
        fps: v?.metadata?.fps ?? v?.item?.fps,
      };
      return { kind: 'MediaVersion', idx: i + 1, path, item };
    }
    if (type === 'audio') {
      const item: AudioItem = {
        kind: 'AudioItem',
        ...base,
        duration: v?.metadata?.duration ?? v?.item?.duration,
        bitrate: v?.metadata?.bitrate ?? v?.item?.bitrate,
      };
      return { kind: 'MediaVersion', idx: i + 1, path, item };
    }
    const item: ImageItem = {
      kind: 'ImageItem',
      ...base,
      width: v?.metadata?.width ?? v?.item?.width,
      height: v?.metadata?.height ?? v?.item?.height,
    };
    return { kind: 'MediaVersion', idx: i + 1, path, item };
  });

  let selectedIdx = 1;
  if (typeof raw?.selected_version_idx === 'number') selectedIdx = raw.selected_version_idx;
  else if (typeof raw?.default_version === 'string') {
    const m = ssotVersions.find(v => v.path === raw.default_version);
    selectedIdx = m?.idx ?? 1;
  }
  if (ssotVersions.length > 0) selectedIdx = Math.min(Math.max(1, selectedIdx), ssotVersions.length);
  else selectedIdx = 1;

  return {
    kind: 'MediaContent',
    type,
    path: raw?.path || 'media',
    versions: ssotVersions,
    selected_version_idx: selectedIdx,
  };
}

function makeBlankItemByType(type: MediaType): MediaItem {
  if (type === 'video') return { kind: 'VideoItem', uri: '' };
  if (type === 'audio') return { kind: 'AudioItem', uri: '' };
  return { kind: 'ImageItem', uri: '' };
}

function reindexVersions(versions: MediaVersion[]): MediaVersion[] {
  return versions
    .filter(v => v && v.item && typeof v.item.uri === 'string')
    .map((v, i) => ({ ...v, kind: 'MediaVersion', idx: i + 1 }));
}

export function MediaContentEditor({ content, onChange }: MediaContentEditorProps) {
  const [state, setState] = useState<MediaContent>(() => normalizeToSSOT(content || {}));
  const [buf, setBuf] = useState<EditBuf>({});

  const getBuf = (idx: number, field: string, fallback: string) =>
    buf[makeKey(idx, field)] ?? fallback;
  const setBufVal = (idx: number, field: string, val: string) =>
    setBuf(prev => ({ ...prev, [makeKey(idx, field)]: val }));
  const commitBuf = (idx: number, field: string, parse: (s: string) => any = s => s) => {
    const k = makeKey(idx, field);
    if (!(k in buf)) return;
    const raw = buf[k];
    const value = parse(raw);
    setItemField(idx, field, value);
    setBuf(({ [k]: _omit, ...rest }) => rest);
  };

  // push a sanitized baseline so parent never sees {}
  useEffect(() => {
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
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync from parent (if it changes externally)
  useEffect(() => {
    setState(prev => {
      const next = normalizeToSSOT(content || {});
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, [content]);

  // commit helper sanitizes before emitting
  const commit = (updater: (prev: MediaContent) => MediaContent) => {
    setState(prev => {
      const next = updater(prev);
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
      onChange(out as any);
      return out;
    });
  };

  const versions = state.versions ?? [];
  const isVideo = state.type === 'video';
  const isAudio = state.type === 'audio';

  const getMediaTypeIcon = (t: string) =>
    t === 'video' ? <Play className="w-4 h-4" /> : t === 'audio' ? <Volume2 className="w-4 h-4" /> : <Image className="w-4 h-4" />;

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
      const converted = prev.versions.map(v => {
        const uri = v.item?.uri ?? '';
        const label = v.path;
        return {
          kind: 'MediaVersion',
          idx: v.idx,
          path: label,
          item: { ...makeBlankItemByType(nextType), uri },
        } as MediaVersion;
      });
      return { ...prev, type: nextType, versions: converted };
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
                onKeyDown={blurOnEnter}
                placeholder="media"
              />
              <p className="text-xs text-muted-foreground">Used by the addressing system (e.g., items.media).</p>
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
                      <Image className="w-4 h-4" /> Image
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" /> Video
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" /> Audio
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
                onKeyDown={blurOnEnter}
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
                          {getMediaTypeIcon(state.type)} v{v.idx}
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
                            value={getBuf(v.idx, 'path', v.path ?? '')}
                            onChange={e => setBufVal(v.idx, 'path', e.target.value)}
                            onBlur={() => {
                              const k = makeKey(v.idx, 'path');
                              if (!(k in buf)) return;
                              const raw = buf[k];
                              setVersionPath(v.idx, raw);
                              setBuf(({ [k]: _omit, ...rest }) => rest);
                            }}
                            onKeyDown={blurOnEnter}
                            placeholder={`v${v.idx}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URI</Label>
                          <Input
                            value={getBuf(v.idx, 'uri', v.item.uri ?? '')}
                            onChange={e => setBufVal(v.idx, 'uri', e.target.value)}
                            onBlur={() => commitBuf(v.idx, 'uri')}
                            onKeyDown={blurOnEnter}
                            placeholder="https://… or storage path"
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
                              value={getBuf(v.idx, 'width', (v.item as any).width?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'width', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'width', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
                              placeholder="e.g., 1920"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              type="number"
                              value={getBuf(v.idx, 'height', (v.item as any).height?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'height', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'height', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
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
                              value={getBuf(v.idx, 'duration', (v.item as any).duration?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'duration', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'duration', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
                              placeholder="e.g., 30.5"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>FPS</Label>
                            <Input
                              type="number"
                              step="1"
                              value={getBuf(v.idx, 'fps', (v.item as any).fps?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'fps', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'fps', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
                              placeholder="e.g., 24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Poster (URL)</Label>
                            <Input
                              value={getBuf(v.idx, 'poster', (v.item as any).poster ?? '')}
                              onChange={e => setBufVal(v.idx, 'poster', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'poster', s => (s || undefined))}
                              onKeyDown={blurOnEnter}
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
                              value={getBuf(v.idx, 'duration', (v.item as any).duration?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'duration', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'duration', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
                              placeholder="e.g., 12.3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bitrate (kbps)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={getBuf(v.idx, 'bitrate', (v.item as any).bitrate?.toString() ?? '')}
                              onChange={e => setBufVal(v.idx, 'bitrate', e.target.value)}
                              onBlur={() => commitBuf(v.idx, 'bitrate', s => (s === '' ? undefined : Number(s)))}
                              onKeyDown={blurOnEnter}
                              placeholder="e.g., 192"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Input
                          value={getBuf(v.idx, 'format', v.item.format ?? '')}
                          onChange={e => setBufVal(v.idx, 'format', e.target.value)}
                          onBlur={() => commitBuf(v.idx, 'format', s => (s || undefined))}
                          onKeyDown={blurOnEnter}
                          placeholder="png, mp4, wav…"
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
