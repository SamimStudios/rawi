// src/pages/app/build/node/NodeLibraryBuilder.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNodeLibrary } from '@/hooks/useNodeLibrary'; // uses existing hook in repo
import { MediaContentEditor } from './components/MediaContentEditor'; // our SSOT media editor
import { Badge } from '@/components/ui/badge';

type NodeType = 'form' | 'media' | 'group';

type MediaType = 'image' | 'video' | 'audio';
type MediaItemKind = 'ImageItem' | 'VideoItem' | 'AudioItem';

interface MediaItem {
  kind: MediaItemKind;
  url: string;
  width?: number;
  height?: number;
  duration_ms?: number;
}
interface MediaVersion {
  kind: 'MediaVersion';
  idx: number;
  path: string;
  item: MediaItem;
}
interface MediaContent {
  kind: 'MediaContent';
  type: MediaType;
  path: string;
  versions: MediaVersion[];
  selected_version_idx?: number;
}

interface NodeDraft {
  id: string;
  name: string;
  node_type: NodeType;
  content: Record<string, any>;
  validate_n8n_id?: string | null;
  payload_validate?: Record<string, any> | null;
  generate_n8n_id?: string | null;
  payload_generate?: Record<string, any> | null;
  active: boolean;
  version: number;
}

const id = () => Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();

function isSSOTMedia(x: any): x is MediaContent {
  return x && x.kind === 'MediaContent' && Array.isArray(x.versions);
}

function legacyifyMediaForRPC(content: MediaContent) {
  const selected = typeof content.selected_version_idx === 'number' ? content.selected_version_idx : undefined;
  const versions = (content.versions || []).map((v: MediaVersion) => {
    const url = (v?.item?.url ?? '') as string;
    const width = v?.item?.width;
    const height = v?.item?.height;
    const duration_ms = v?.item?.duration_ms;
    const metadata: Record<string, any> = {};
    if (typeof width === 'number') metadata.width = width;
    if (typeof height === 'number') metadata.height = height;
    if (typeof duration_ms === 'number') metadata.duration = duration_ms / 1000;
    return { version: `v${v.idx}`, url, metadata };
  });
  const out = {
    type: content.type,
    versions,
    default_version: selected ? `v${selected}` : undefined,
  };
  return out;
}

function diagnoseMedia(content: MediaContent) {
  const issues: string[] = [];
  const info: Record<string, any> = {
    type: content.type,
    path: content.path,
    versions_count: content.versions?.length ?? 0,
    selected_version_idx: content.selected_version_idx,
  };

  // Rule candidates we’ve seen in many DB validators:
  if (!content.path || typeof content.path !== 'string' || !content.path.trim()) {
    issues.push('content.path must be a non-empty string');
  }

  // If versions exist, idx must be 1..N and sequential; path should be `${path}.v${idx}`
  (content.versions || []).forEach((v, i) => {
    const expectedIdx = i + 1;
    if (v.idx !== expectedIdx) {
      issues.push(`versions[${i}].idx must be ${expectedIdx}`);
    }
    const expectedPath = `${content.path}.v${expectedIdx}`;
    if (v.path !== expectedPath) {
      issues.push(`versions[${i}].path must be '${expectedPath}'`);
    }
    const expectedKind: MediaItemKind =
      content.type === 'image' ? 'ImageItem' : content.type === 'video' ? 'VideoItem' : 'AudioItem';
    if (!v.item || v.item.kind !== expectedKind) {
      issues.push(`versions[${i}].item.kind must be '${expectedKind}'`);
    }
    if (typeof v.item.url !== 'string') {
      issues.push(`versions[${i}].item.url must be a string ('' allowed)`);
    }
    if ((content.type === 'image' || content.type === 'video') && v.item.width !== undefined && typeof v.item.width !== 'number') {
      issues.push(`versions[${i}].item.width must be a number when provided`);
    }
    if ((content.type === 'image' || content.type === 'video') && v.item.height !== undefined && typeof v.item.height !== 'number') {
      issues.push(`versions[${i}].item.height must be a number when provided`);
    }
    if ((content.type === 'video' || content.type === 'audio') && v.item.duration_ms !== undefined && typeof v.item.duration_ms !== 'number') {
      issues.push(`versions[${i}].item.duration_ms must be a number when provided`);
    }
  });

  // If no versions: selected_version_idx must be undefined/null
  if ((content.versions?.length || 0) === 0 && content.selected_version_idx !== undefined && content.selected_version_idx !== null) {
    issues.push('selected_version_idx must be undefined when versions is empty');
  }
  // If versions exist: selected_version_idx within bounds when present
  if ((content.versions?.length || 0) > 0 && content.selected_version_idx !== undefined && content.selected_version_idx !== null) {
    const n = content.versions.length;
    if (content.selected_version_idx < 1 || content.selected_version_idx > n) {
      issues.push(`selected_version_idx must be between 1 and ${n}`);
    }
  }

  return { info, issues };
}

export default function NodeLibraryBuilder() {
  const { toast } = useToast();
  const { validateEntry, saveEntry } = useNodeLibrary();

  const [debug, setDebug] = useState<boolean>(() => {
    const ls = localStorage.getItem('DEBUG_NODE_LIB');
    return ls === '1';
  });

  const [draft, setDraft] = useState<NodeDraft>(() => ({
    id: id(),
    name: '',
    node_type: 'media',
    content: { kind: 'MediaContent', type: 'image', path: 'media', versions: [] },
    active: true,
    version: 1,
    validate_n8n_id: null,
    payload_validate: null,
    generate_n8n_id: null,
    payload_generate: null,
  }));

  useEffect(() => {
    localStorage.setItem('DEBUG_NODE_LIB', debug ? '1' : '0');
  }, [debug]);

  const reqIdRef = useRef<string>('');
  const nextReqId = () => {
    reqIdRef.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    return reqIdRef.current;
  };

  const onValidate = useCallback(async () => {
    const rid = nextReqId();
    console.groupCollapsed(`🧪 [NodeLibraryBuilder] VALIDATE #${rid}`);
    console.log('Time:', nowIso());
    console.log('Node type:', draft.node_type);
    console.log('Entry ID:', draft.id);
    console.log('Content snapshot:', draft.content);

    // Media diagnostics (client-side mirror)
    if (draft.node_type === 'media' && isSSOTMedia(draft.content)) {
      const diag = diagnoseMedia(draft.content);
      console.log('🔎 Media diagnostics → info:', diag.info);
      if (diag.issues.length) {
        console.warn('⚠️ Media diagnostics → potential issues:', diag.issues);
      } else {
        console.log('✅ Media diagnostics → no client-side issues detected.');
      }
      // Also log the legacy payload we’d send if server expects it
      const legacyPayload = legacyifyMediaForRPC(draft.content);
      console.log('↪︎ Legacy payload preview (for RPC if needed):', legacyPayload);
    }

    try {
      const ok = await validateEntry({
        id: draft.id,
        node_type: draft.node_type,
        content: draft.content,
        payload_validate: draft.payload_validate ?? null,
        payload_generate: draft.payload_generate ?? null,
        validate_n8n_id: draft.validate_n8n_id ?? null,
        generate_n8n_id: draft.generate_n8n_id ?? null,
        active: draft.active,
        version: draft.version,
      } as any);

      console.log('✅ Validation result:', ok);
      if (!ok) {
        console.warn('❌ Server validation returned false.');
        if (draft.node_type === 'media' && isSSOTMedia(draft.content)) {
          const vc = draft.content.versions?.length ?? 0;
          const s = draft.content.selected_version_idx;
          console.warn(
            'Heuristics → versions_count:',
            vc,
            '| selected_version_idx:',
            s,
            '| path:',
            draft.content.path
          );
          if (vc === 0) {
            console.warn(
              'Likely failing rule on server: media.versions must have ≥ 1 entry (server validator stricter than SSOT).'
            );
          }
        }
      }
      console.groupEnd();
      return ok;
    } catch (e) {
      console.error('💥 validateEntry threw:', e);
      console.groupEnd();
      return false;
    }
  }, [draft, validateEntry]);

  const onSave = useCallback(async () => {
    const rid = nextReqId();
    console.groupCollapsed(`💾 [NodeLibraryBuilder] SAVE #${rid}`);
    console.log('Time:', nowIso());
    console.log('Node type:', draft.node_type);
    console.log('Entry ID:', draft.id);
    console.log('Content snapshot:', draft.content);

    const ok = await onValidate();
    if (!ok) {
      toast({
        title: 'Validation failed',
        description: 'Fix the issues printed in console (open DevTools) and try again.',
        variant: 'destructive',
      });
      console.groupEnd();
      return;
    }

    try {
      const saved = await saveEntry({
        id: draft.id,
        node_type: draft.node_type,
        content: draft.content,
        payload_validate: draft.payload_validate ?? null,
        payload_generate: draft.payload_generate ?? null,
        validate_n8n_id: draft.validate_n8n_id ?? null,
        generate_n8n_id: draft.generate_n8n_id ?? null,
        active: draft.active,
        version: draft.version,
      } as any);
      console.log('🟢 saveEntry result:', saved);
      if (saved) {
        toast({ title: 'Saved', description: 'Node library entry saved successfully.' });
      }
    } catch (e) {
      console.error('💥 saveEntry threw:', e);
      toast({ title: 'Save failed', description: String(e), variant: 'destructive' });
    } finally {
      console.groupEnd();
    }
  }, [draft, onValidate, saveEntry, toast]);

  const onTypeChange = (v: NodeType) => {
    setDraft((d) => {
      if (v === 'media' && !isSSOTMedia(d.content)) {
        return {
          ...d,
          node_type: v,
          content: { kind: 'MediaContent', type: 'image', path: 'media', versions: [] },
        };
      }
      return { ...d, node_type: v };
    });
  };

  const onMediaChange = (next: any) => {
    setDraft((d) => ({ ...d, content: next }));
    if (debug) {
      console.debug('[NodeLibraryBuilder] MediaContent changed →', next);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Node Library Builder</h2>
        <div className="flex items-center gap-3">
          <Label className="text-xs flex items-center gap-2">
            <Input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
            />
            Debug logs
          </Label>
          <Badge variant={debug ? 'default' : 'secondary'}>
            DEBUG {debug ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Friendly name"
            />
          </div>

          <div className="space-y-2">
            <Label>Node Type</Label>
            <Select value={draft.node_type} onValueChange={(v) => onTypeChange(v as NodeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Version</Label>
            <Input
              type="number"
              value={draft.version}
              onChange={(e) =>
                setDraft((d) => ({ ...d, version: Math.max(1, parseInt(e.target.value || '1', 10)) }))
              }
              min={1}
            />
          </div>
        </CardContent>
      </Card>

      {draft.node_type === 'media' && (
        <MediaContentEditor content={draft.content} onChange={onMediaChange} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={onValidate}>Validate</Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}
