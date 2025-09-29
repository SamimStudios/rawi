// src/pages/app/build/node/components/MediaContentEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Play, Image, Volume2 } from 'lucide-react';

/**
 * SSOT-aligned MediaContent editor (per ai_scenes_node_contracts)
 * - Allows zero versions
 * - Allows empty URL
 * - Emits SSOT shape:
 *   {
 *     kind: 'MediaContent',
 *     type: 'image'|'video'|'audio',
 *     path: 'media',
 *     versions: [{ kind:'MediaVersion', idx:1..N, path:'media.v1', item:{kind:'ImageItem'|'VideoItem'|'AudioItem', url, ...}}],
 *     selected_version_idx?: number
 *   }
 * - Verbose debug logs with [MediaBuilder]
 */

type MediaType = 'image' | 'video' | 'audio';

interface ImageItem { kind: 'ImageItem'; url: string; width?: number; height?: number; }
interface VideoItem { kind: 'VideoItem'; url: string; duration_ms?: number; width?: number; height?: number; }
interface AudioItem { kind: 'AudioItem'; url: string; duration_ms?: number; }
type MediaItem = ImageItem | VideoItem | AudioItem;

interface MediaVersion {
  kind: 'MediaVersion';
  idx: number;     // 1-based
  path: string;    // "<content.path>.v<idx>"
  item: MediaItem;
}

interface MediaContent {
  kind: 'MediaContent';
  type: MediaType;
  path: string;
  versions: MediaVersion[];
  selected_version_idx?: number; // undefined when versions=[]
}

interface MediaContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ---------- utils ---------- */

const iconFor = (type: MediaType) =>
  type === 'video' ? <Play className="w-4 h-4" /> :
  type === 'audio' ? <Volume2 className="w-4 h-4" /> :
  <Image className="w-4 h-4" />;

const itemKindFor = (type: MediaType): MediaItem['kind'] =>
  type === 'video' ? 'VideoItem' : type === 'audio' ? 'AudioItem' : 'ImageItem';

function coerceItemToType(type: MediaType, existing?: Partial<MediaItem>): MediaItem {
  const url = (existing as any)?.url ?? '';
  const width = (existing as any)?.width;
  const height = (existing as any)?.height;
  const duration_ms = (existing as any)?.duration_ms;

  if (type === 'image') return { kind: 'ImageItem', url: String(url), width, height };
  if (type === 'video') return { kind: 'VideoItem', url: String(url), duration_ms, width, height };
  return { kind: 'AudioItem', url: String(url), duration_ms };
}

function normalizeContent(input: MediaContent): MediaContent {
  const type = input.type as MediaType;
  const basePath = (input.path?.trim() || 'media');
  const versions = (input.versions || []).map((v, i) => {
    const idx = i + 1;
    const coerced = coerceItemToType(type, v.item);
    return { kind: 'MediaVersion', idx, path: `${basePath}.v${idx}`, item: coerced };
  });

  let sel = input.selected_version_idx;
  if (versions.length === 0) sel = undefined;
  else if (!sel || sel < 1 || sel > versions.length) sel = 1;

  const out: MediaContent = { kind: 'MediaContent', type, path: basePath, versions, selected_version_idx: sel };
  return out;
}

/** Accepts legacy shapes and converts to SSOT */
function migrateLegacy(raw: any): MediaContent {
  console.debug('[MediaBuilder] 🧪 migrateLegacy input:', raw);

  // already SSOT?
  if (raw && raw.kind === 'MediaContent') {
    const normalized = normalizeContent(raw as MediaContent);
    console.debug('[MediaBuilder] ✅ already SSOT; normalized:', normalized);
    return normalized;
  }

  const type: MediaType = (raw?.type ?? 'image') as MediaType;
  const basePath = raw?.path || 'media';
  const legacyVersions: any[] = Array.isArray(raw?.versions) ? raw.versions : [];

  // legacy → SSOT
  const versions: MediaVersion[] = legacyVersions.map((lv, i) => {
    const idx = i + 1;
    const url = lv?.url ?? '';
    const meta = lv?.metadata ?? {};
    const duration_ms = typeof meta.duration === 'number' ? Math.round(meta.duration * 1000) : undefined;
    const item = type === 'image'
      ? { kind: 'ImageItem', url, width: meta.width, height: meta.height }
      : type === 'video'
        ? { kind: 'VideoItem', url, duration_ms, width: meta.width, height: meta.height }
        : { kind: 'AudioItem', url, duration_ms };

    return { kind: 'MediaVersion', idx, path: `${basePath}.v${idx}`, item };
  });

  let selected_version_idx: number | undefined;
  if (versions.length > 0) {
    const def = raw?.default_version;
    if (typeof def === 'string' && /^v?\d+$/i.test(def)) {
      const n = parseInt(def.replace(/^[^\d]*/, ''), 10);
      if (!Number.isNaN(n) && n >= 1 && n <= versions.length) selected_version_idx = n;
      else selected_version_idx = 1;
    } else selected_version_idx = 1;
  }

  const ssot: MediaContent = normalizeContent({
    kind: 'MediaContent',
    type,
    path: basePath,
    versions,
    selected_version_idx
  });

  console.debug('[MediaBuilder] 🔁 migrated legacy → SSOT:', ssot);
  return ssot;
}

/* ---------- component ---------- */

export function MediaContentEditor({ content, onChange }: MediaContentEditorProps) {
  const key = useMemo(() => JSON.stringify(content || {}), [content]);
  const initial = useMemo(() => migrateLegacy(content), [key]);
  const [state, setState] = useState<MediaContent>(initial);

  // sync when parent content changes
  useEffect(() => {
    const next = migrateLegacy(content);
    setState(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
  }, [key]);

  const emit = (updater: (prev: MediaContent) => MediaContent) => {
    setState(prev => {
      const next = normalizeContent(updater(prev));
      console.debug('[MediaBuilder] 📤 onChange', next);
      onChange(next as unknown as Record<string, any>);
      return next;
    });
  };

  /* ----- handlers ----- */

  const updateType = (t: MediaType) => {
    emit(prev => {
      console.debug('[MediaBuilder] 🔁 type →', t);
      const versions = prev.versions.map(v => ({ ...v, item: coerceItemToType(t, v.item) }));
      return { ...prev, type: t, versions };
    });
  };

  const updatePath = (p: string) => {
    const safe = p?.trim() || 'media';
    emit(prev => {
      console.debug('[MediaBuilder] 🧭 path →', safe);
      const versions = prev.versions.map((v, i) => ({ ...v, path: `${safe}.v${i + 1}` }));
      return { ...prev, path: safe, versions };
    });
  };

  const addVersion = () => {
    emit(prev => {
      const nextIdx = prev.versions.length + 1;
      const item = coerceItemToType(prev.type, { url: '' });
      const v: MediaVersion = { kind: 'MediaVersion', idx: nextIdx, path: `${prev.path}.v${nextIdx}`, item };
      console.debug('[MediaBuilder] ➕ add version →', v);
      const versions = [...prev.versions, v];
      const selected = prev.versions.length === 0 ? 1 : prev.selected_version_idx;
      return { ...prev, versions, selected_version_idx: selected };
    });
  };

  const removeVersion = (idx: number) => {
    emit(prev => {
      console.debug('[MediaBuilder] 🗑️ remove version idx →', idx);
      const filtered = prev.versions.filter(v => v.idx !== idx);
      const reindexed = filtered.map((v, i) => ({ ...v, idx: i + 1, path: `${prev.path}.v${i + 1}` }));
      let selected = prev.selected_version_idx;
      if (!reindexed.length) selected = undefined;
      else if (selected && selected > reindexed.length) selected = reindexed.length;
      return { ...prev, versions: reindexed, selected_version_idx: selected };
    });
  };

  const updateVersionItem = (idx: number, patch: Partial<MediaItem>) => {
    emit(prev => {
      const versions = prev.versions.map(v => v.idx === idx ? { ...v, item: { ...v.item, ...patch } as MediaItem } : v);
      return { ...prev, versions };
    });
  };

  const setSelected = (val: string | undefined) => {
    emit(prev => {
      let selected: number | undefined = undefined;
      if (val && val !== '__none__' && prev.versions.length) {
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) selected = Math.max(1, Math.min(n, prev.versions.length));
      }
      console.debug('[MediaBuilder] 🎯 selected_version_idx →', selected);
      return { ...prev, selected_version_idx: selected };
    });
  };

  /* ---------- UI ---------- */

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Media Configuration</h3>
          <p className="text-sm text-muted-foreground">
            SSOT-aligned. Zero versions and empty URL are allowed.
          </p>
        </div>

        {/* Type & Path & Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">{iconFor(state.type)} Type &amp; Path</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Media Type</Label>
              <Select value={state.type} onValueChange={(v) => updateType(v as MediaType)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Path</Label>
              <Input value={state.path} onChange={(e) => updatePath(e.target.value)} placeholder="media" />
              <p className="text-[11px] text-muted-foreground">Used to build version paths (e.g., media.v1).</p>
            </div>

            <div className="space-y-2">
              <Label>Selected Version</Label>
              <Select
                value={state.selected_version_idx ? String(state.selected_version_idx) : '__none__'}
                onValueChange={(v) => setSelected(v)}
              >
                <SelectTrigger className="w-40"><SelectValue placeholder="— none —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— none —</SelectItem>
                  {state.versions.map(v => (
                    <SelectItem key={v.idx} value={String(v.idx)}>v{v.idx}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Versions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Versions</CardTitle>
            <Button variant="secondary" size="sm" onClick={addVersion}>
              <Plus className="w-4 h-4 mr-1" /> Add version
            </Button>
          </CardHeader>
          <CardContent>
            {state.versions.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md p-3">
                No versions yet — valid state. You can save a media node with zero versions.
              </div>
            ) : (
              <div className="space-y-4">
                {state.versions.map((v) => (
                  <Card key={v.idx} className="border">
                    <CardHeader className="flex flex-row items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{v.idx}</Badge>
                        <span className="text-xs text-muted-foreground">{v.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => removeVersion(v.idx)} variant="ghost" size="sm" aria-label={`Remove v${v.idx}`}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* URL */}
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={(v.item as any).url || ''}
                          onChange={(e) => updateVersionItem(v.idx, { url: e.target.value })}
                          placeholder="https://… (empty allowed)"
                        />
                        <p className="text-[11px] text-muted-foreground">Empty URL is allowed for placeholders.</p>
                      </div>

                      {/* width/height for image/video */}
                      {state.type !== 'audio' && (
                        <>
                          <div className="space-y-2">
                            <Label>Width (px)</Label>
                            <Input
                              type="number"
                              value={(v.item as any).width ?? ''}
                              onChange={(e) => updateVersionItem(v.idx, { width: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                              placeholder="e.g., 1024"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Height (px)</Label>
                            <Input
                              type="number"
                              value={(v.item as any).height ?? ''}
                              onChange={(e) => updateVersionItem(v.idx, { height: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                              placeholder="e.g., 576"
                            />
                          </div>
                        </>
                      )}

                      {/* duration_ms for video/audio */}
                      {state.type !== 'image' && (
                        <div className="space-y-2">
                          <Label>Duration (ms)</Label>
                          <Input
                            type="number"
                            value={(v.item as any).duration_ms ?? ''}
                            onChange={(e) => updateVersionItem(v.idx, { duration_ms: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                            placeholder="e.g., 30000"
                          />
                        </div>
                      )}
                    </CardContent>
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
