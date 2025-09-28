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
 * Media builder — SSOT-aligned (ai_scenes_node_contracts)
 * - Allows 0 versions
 * - Allows versions with empty url (placeholder)
 * - Adds verbose debug logs prefixed with: [MediaBuilder]
 */

type MediaType = 'image' | 'video' | 'audio';

interface ImageItem { kind: 'ImageItem'; url: string; width?: number; height?: number; }
interface VideoItem { kind: 'VideoItem'; url: string; duration_ms?: number; width?: number; height?: number; }
interface AudioItem { kind: 'AudioItem'; url: string; duration_ms?: number; }
type MediaItem = ImageItem | VideoItem | AudioItem;

interface MediaVersion {
  kind: 'MediaVersion';
  idx: number;       // 1-based index
  path: string;      // e.g., "media.v1"
  item: MediaItem;   // single item matching MediaContent.type
}

interface MediaContent {
  kind: 'MediaContent';
  type: MediaType;
  path: string;                 // e.g., "media"
  versions: MediaVersion[];     // may be []
  selected_version_idx?: number; // 1..N when versions exist
}

interface MediaContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

function iconFor(type: MediaType) {
  switch (type) {
    case 'image': return <Image className="w-4 h-4" />;
    case 'video': return <Play className="w-4 h-4" />;
    case 'audio': return <Volume2 className="w-4 h-4" />;
    default: return <Image className="w-4 h-4" />;
  }
}

/** Legacy shapes → SSOT migration (idempotent) */
function migrateLegacy(content: any): MediaContent {
  console.debug('[MediaBuilder] 🧪 migrateLegacy() input:', content);
  const legacyVersions = Array.isArray(content?.versions) ? content.versions : [];
  const legacyType: MediaType = (content?.type ?? 'image') as MediaType;
  const path = content?.path ?? 'media';

  // Already in SSOT shape
  if (content?.kind === 'MediaContent' && Array.isArray(content?.versions)) {
    const normalized = normalizeContent(content as MediaContent);
    console.debug('[MediaBuilder] ✅ already SSOT; normalized:', normalized);
    return normalized;
  }

  // Detect legacy { version, url, metadata } entries
  const looksLegacy = legacyVersions.some((v: any) =>
    typeof v === 'object' && (typeof v?.version === 'string' || 'url' in (v || {}))
  );

  if (looksLegacy) {
    const versions: MediaVersion[] = legacyVersions.map((v: any, i: number) => {
      const idx = i + 1;
      const item = buildItemFromLegacy(legacyType, v);
      return { kind: 'MediaVersion', idx, path: `${path}.v${idx}`, item };
    });

    let selected_version_idx: number | undefined = undefined;
    const def = content?.default_version;
    if (typeof def === 'string' && /^v?\d+$/i.test(def)) {
      const n = parseInt(def.replace(/^[^\d]*/, ''), 10);
      if (!Number.isNaN(n) && n >= 1 && n <= versions.length) selected_version_idx = n;
    } else if (versions.length > 0) {
      selected_version_idx = 1;
    }

    const migrated: MediaContent = normalizeContent({
      kind: 'MediaContent',
      type: legacyType,
      path,
      versions,
      selected_version_idx
    });
    console.debug('[MediaBuilder] 🔁 migrated legacy → SSOT:', migrated);
    return migrated;
  }

  const empty: MediaContent = { kind: 'MediaContent', type: legacyType, path, versions: [], selected_version_idx: undefined };
  console.debug('[MediaBuilder] 🆕 initialized empty SSOT content:', empty);
  return empty;
}

function buildItemFromLegacy(type: MediaType, v: any): MediaItem {
  const url = (v?.url ?? '') as string;
  const durationMs = typeof v?.metadata?.duration === 'number' ? Math.round(v.metadata.duration * 1000) : undefined;
  if (type === 'image') return { kind: 'ImageItem', url, width: v?.metadata?.width, height: v?.metadata?.height };
  if (type === 'video') return { kind: 'VideoItem', url, duration_ms: durationMs, width: v?.metadata?.width, height: v?.metadata?.height };
  return { kind: 'AudioItem', url, duration_ms: durationMs };
}

/** Ensure idx sequence, selection validity, and item.kind coherence with type */
function normalizeContent(input: MediaContent): MediaContent {
  const type: MediaType = input.type;
  const path = input.path || 'media';
  const versions: MediaVersion[] = (input.versions || []).map((v, i) => {
    const idx = i + 1;
    const baseUrl = (v.item as any)?.url || '';
    const coerced: MediaItem =
      type === 'image'
        ? { kind: 'ImageItem', url: baseUrl, width: (v.item as any)?.width, height: (v.item as any)?.height }
        : type === 'video'
          ? { kind: 'VideoItem', url: baseUrl, duration_ms: (v.item as any)?.duration_ms, width: (v.item as any)?.width, height: (v.item as any)?.height }
          : { kind: 'AudioItem', url: baseUrl, duration_ms: (v.item as any)?.duration_ms };
    return { kind: 'MediaVersion', idx, path: `${path}.v${idx}`, item: coerced };
  });

  let selected = input.selected_version_idx;
  if (versions.length === 0) selected = undefined;
  else if (!selected || selected < 1 || selected > versions.length) selected = 1;

  return { kind: 'MediaContent', type, path, versions, selected_version_idx: selected };
}

export function MediaContentEditor({ content, onChange }: MediaContentEditorProps) {
  const contentKey = useMemo(() => JSON.stringify(content || {}), [content]);
  const initial = useMemo(() => migrateLegacy(content), [contentKey]);
  const [state, setState] = useState<MediaContent>(initial);

  useEffect(() => {
    console.debug('[MediaBuilder] 🔄 prop.content changed → migrate/normalize');
    const next = migrateLegacy(content);
    setState(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
  }, [contentKey]);

  const emit = (updater: (prev: MediaContent) => MediaContent) => {
    setState(prev => {
      const next = normalizeContent(updater(prev));
      console.debug('[MediaBuilder] 📤 onChange()', next);
      onChange(next as unknown as Record<string, any>);
      return next;
    });
  };

  const addVersion = () => {
    emit(prev => {
      const nextIdx = prev.versions.length + 1;
      const url = '';
      const item: MediaItem =
        prev.type === 'image' ? { kind: 'ImageItem', url } :
        prev.type === 'video' ? { kind: 'VideoItem', url } :
        { kind: 'AudioItem', url };

      const v: MediaVersion = { kind: 'MediaVersion', idx: nextIdx, path: `${prev.path || 'media'}.v${nextIdx}`, item };
      const versions = [...prev.versions, v];
      const selected = prev.versions.length === 0 ? 1 : prev.selected_version_idx;
      console.debug('[MediaBuilder] ➕ addVersion() → idx', nextIdx);
      return { ...prev, versions, selected_version_idx: selected };
    });
  };

  const removeVersion = (idx: number) => {
    emit(prev => {
      const versions = prev.versions
        .filter(v => v.idx !== idx)
        .map((v, i) => ({ ...v, idx: i + 1, path: `${prev.path}.v${i + 1}` }));
      let selected = prev.selected_version_idx;
      if (!versions.length) selected = undefined;
      else if (selected && selected > versions.length) selected = versions.length;
      console.debug('[MediaBuilder] 🗑️ removeVersion()', idx, '→ reindex to', versions.length);
      return { ...prev, versions, selected_version_idx: selected };
    });
  };

  const updateVersionItem = (idx: number, patch: Partial<MediaItem>) => {
    emit(prev => {
      const versions = prev.versions.map(v => v.idx === idx ? { ...v, item: { ...v.item, ...patch } as MediaItem } : v);
      return { ...prev, versions };
    });
  };

  const updatePath = (path: string) => {
    const safe = path?.trim() || 'media';
    emit(prev => {
      const versions = prev.versions.map((v, i) => ({ ...v, path: `${safe}.v${i + 1}` }));
      console.debug('[MediaBuilder] 🧭 path set →', safe);
      return { ...prev, path: safe, versions };
    });
  };

  const updateType = (type: MediaType) => {
    emit(prev => {
      const versions = prev.versions.map(v => {
        const url = (v.item as any)?.url || '';
        const item: MediaItem =
          type === 'image' ? { kind: 'ImageItem', url, width: (v.item as any)?.width, height: (v.item as any)?.height } :
          type === 'video' ? { kind: 'VideoItem', url, duration_ms: (v.item as any)?.duration_ms, width: (v.item as any)?.width, height: (v.item as any)?.height } :
          { kind: 'AudioItem', url, duration_ms: (v.item as any)?.duration_ms };
        return { ...v, item };
      });
      console.debug('[MediaBuilder] 🔁 type changed →', type);
      return { ...prev, type, versions };
    });
  };

  const setSelected = (val?: string) => {
    emit(prev => {
      let selected: number | undefined = undefined;
      if (val && val !== '__none__' && prev.versions.length) {
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) selected = Math.max(1, Math.min(n, prev.versions.length));
      }
      console.debug('[MediaBuilder] 🎯 select version idx →', selected);
      return { ...prev, selected_version_idx: selected };
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Media Configuration</h3>
          <p className="text-sm text-muted-foreground">
            SSOT-aligned. Zero versions allowed. Empty URL allowed.
          </p>
        </div>

        {/* Type & Path */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">{iconFor(state.type)} Type &amp; Path</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
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

            <div className="flex-1 space-y-2">
              <Label>Path</Label>
              <Input value={state.path} onChange={(e) => updatePath(e.target.value)} placeholder="media" />
              <p className="text-[11px] text-muted-foreground">Used as base for version paths (e.g., media.v1).</p>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Selected Version</Label>
              <Select
                value={state.selected_version_idx ? String(state.selected_version_idx) : '__none__'}
                onValueChange={(v) => setSelected(v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="— none —" />
                </SelectTrigger>
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
                No versions yet — this is valid. You can save a media node with zero versions.
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
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={(v.item as any).url || ''}
                          onChange={(e) => updateVersionItem(v.idx, { url: e.target.value })}
                          placeholder="https://… (can be empty)"
                        />
                        <p className="text-[11px] text-muted-foreground">Empty URL is allowed for placeholders.</p>
                      </div>

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
