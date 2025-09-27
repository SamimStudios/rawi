// src/pages/app/build/node/components/FormContentEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* ===================== SSOT-aligned types (Library: template-only) ===================== */
type Importance = 'low' | 'normal' | 'high';

interface I18nText { fallback: string; key?: string }

interface UIBlock {
  kind: 'UIBlock';
  label: I18nText;
  help?: I18nText;
  placeholder?: I18nText;
  override: boolean;
}

interface FieldItem {
  kind: 'FieldItem';
  idx: number;
  path: string;
  ref: string;        // references field_registry.id
  editable: boolean;
  required: boolean;
  importance: Importance;
  ui: UIBlock;
  value?: any;        // library can omit; kept for compatibility
}

interface SectionItem {
  kind: 'SectionItem';
  idx: number;
  path: string;
  label: I18nText;
  description?: I18nText;
  required: boolean;
  hidden: boolean;
  collapsed: boolean;
  children: ContentItem[];
}

/** Collection primitives (TEMPLATE ONLY in library) */
interface CollectionSection {
  kind: 'CollectionSection';
  idx: number;
  path: string;
  label: I18nText;
  description?: I18nText;
  required: boolean;
  hidden: boolean;
  collapsed: boolean;
  min_instances: number;
  max_instances: number;
  default_instances: number;  // how many to materialize at job time
  children: ContentItem[];    // TEMPLATE children, no instances[] in library
}

interface CollectionFieldItem {
  kind: 'CollectionFieldItem';
  idx: number;
  path: string;
  ref: string;
  editable: boolean;
  required: boolean;
  importance: Importance;
  ui: UIBlock;
  min_instances: number;
  max_instances: number;
  default_instances: number;  // how many to materialize at job time
}

type ContentItem = FieldItem | SectionItem | CollectionSection | CollectionFieldItem;

interface FormContent {
  kind: 'FormContent';
  version: 'v2-items';
  items: ContentItem[];
}

interface Props {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ===================== helpers ===================== */
const nextIdx = (arr: Array<{ idx: number }>) => Math.max(0, ...arr.map(x => Number(x?.idx) || 0)) + 1;
const isField = (x: ContentItem): x is FieldItem => x?.kind === 'FieldItem';
const isSection = (x: ContentItem): x is SectionItem => x?.kind === 'SectionItem';
const isCField = (x: ContentItem): x is CollectionFieldItem => x?.kind === 'CollectionFieldItem';
const isCSection = (x: ContentItem): x is CollectionSection => x?.kind === 'CollectionSection';
const reindex = <T extends { idx: number }>(xs: T[]) => xs.map((x, i) => ({ ...x, idx: i + 1 }));

function sanitizeTemplateOnly(content: any): FormContent {
  const base: FormContent = {
    kind: 'FormContent',
    version: 'v2-items',
    items: Array.isArray(content?.items) ? content.items : [],
  };

  // Drop any instances[] if present from previous versions; keep only template
  const scrub = (items: any[]): ContentItem[] =>
    (items || []).map((it: any, i: number) => {
      if (it?.kind === 'FieldItem') {
        return {
          kind: 'FieldItem',
          idx: i + 1,
          path: it.path || `field_${i + 1}`,
          ref: it.ref || '',
          editable: !!it.editable,
          required: !!it.required,
          importance: (it.importance as Importance) || 'normal',
          ui: {
            kind: 'UIBlock',
            label: it.ui?.label || { fallback: it.ref || `Field ${i + 1}` },
            help: it.ui?.help,
            placeholder: it.ui?.placeholder,
            override: !!it.ui?.override,
          },
        } as FieldItem;
      }

      if (it?.kind === 'CollectionFieldItem') {
        return {
          kind: 'CollectionFieldItem',
          idx: i + 1,
          path: it.path || `cfield_${i + 1}`,
          ref: it.ref || '',
          editable: !!it.editable,
          required: !!it.required,
          importance: (it.importance as Importance) || 'normal',
          ui: {
            kind: 'UIBlock',
            label: it.ui?.label || { fallback: it.ref || `Collection Field ${i + 1}` },
            help: it.ui?.help,
            placeholder: it.ui?.placeholder,
            override: !!it.ui?.override,
          },
          min_instances: Number(it.min_instances ?? 0),
          max_instances: Number(it.max_instances ?? 10),
          default_instances: Number(it.default_instances ?? 1),
        } as CollectionFieldItem;
      }

      if (it?.kind === 'CollectionSection') {
        // treat children as TEMPLATE; remove instances[]
        return {
          kind: 'CollectionSection',
          idx: i + 1,
          path: it.path || `csection_${i + 1}`,
          label: it.label || { fallback: `Collection Section ${i + 1}` },
          description: it.description,
          required: !!it.required,
          hidden: !!it.hidden,
          collapsed: !!it.collapsed,
          min_instances: Number(it.min_instances ?? 0),
          max_instances: Number(it.max_instances ?? 10),
          default_instances: Number(it.default_instances ?? 1),
          children: scrub(it.children || []),
        } as CollectionSection;
      }

      if (it?.kind === 'SectionItem') {
        return {
          kind: 'SectionItem',
          idx: i + 1,
          path: it.path || `section_${i + 1}`,
          label: it.label || { fallback: `Section ${i + 1}` },
          description: it.description,
          required: !!it.required,
          hidden: !!it.hidden,
          collapsed: !!it.collapsed,
          children: scrub(it.children || []),
        } as SectionItem;
      }

      // unknown -> coerce to Field
      return {
        kind: 'FieldItem',
        idx: i + 1,
        path: `field_${i + 1}`,
        ref: '',
        editable: true,
        required: false,
        importance: 'normal',
        ui: { kind: 'UIBlock', label: { fallback: `Field ${i + 1}` }, override: false },
      } as FieldItem;
    });

  base.items = scrub(base.items);
  return base;
}

/* ===================== Component ===================== */
export function FormContentEditor({ content, onChange }: Props) {
  const [state, setState] = useState<FormContent>(() => sanitizeTemplateOnly(content || {}));
  const [availableFields, setAvailableFields] = useState<Array<{ id: string }>>([]);

  // push baseline on mount
  useEffect(() => { onChange(state as any); /* eslint-disable-next-line */ }, []);
  // sync if parent changes
  useEffect(() => {
    const next = sanitizeTemplateOnly(content || {});
    setState(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [content]);

  // fetch field registry (id only)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          // @ts-ignore
          .schema('app' as any)
          .from('field_registry')
          .select('id')
          .order('id');
        if (error) throw error;
        setAvailableFields((data ?? []) as any);
      } catch (e) {
        console.error('field_registry fetch failed:', e);
      }
    })();
  }, []);

  const commit = (updater: (p: FormContent) => FormContent) => {
    setState(prev => {
      const next = updater(prev);
      // reindex top-level
      next.items = reindex(next.items);
      onChange(next as any);
      return next;
    });
  };

  /* ---------------- Top-level adders ---------------- */
  const addField = () => commit(prev => ({
    ...prev,
    items: [
      ...prev.items,
      {
        kind: 'FieldItem',
        idx: nextIdx(prev.items as any),
        path: `field_${nextIdx(prev.items as any)}`,
        ref: '',
        editable: true,
        required: false,
        importance: 'normal',
        ui: { kind: 'UIBlock', label: { fallback: 'New Field' }, override: false },
      } as FieldItem,
    ],
  }));

  const addSection = () => commit(prev => ({
    ...prev,
    items: [
      ...prev.items,
      {
        kind: 'SectionItem',
        idx: nextIdx(prev.items as any),
        path: `section_${nextIdx(prev.items as any)}`,
        label: { fallback: 'New Section' },
        required: false,
        hidden: false,
        collapsed: false,
        children: [],
      } as SectionItem,
    ],
  }));

  const addCField = () => commit(prev => ({
    ...prev,
    items: [
      ...prev.items,
      {
        kind: 'CollectionFieldItem',
        idx: nextIdx(prev.items as any),
        path: `cfield_${nextIdx(prev.items as any)}`,
        ref: '',
        editable: true,
        required: false,
        importance: 'normal',
        ui: { kind: 'UIBlock', label: { fallback: 'Collection Field' }, override: false },
        min_instances: 0,
        max_instances: 10,
        default_instances: 1,
      } as CollectionFieldItem,
    ],
  }));

  const addCSection = () => commit(prev => ({
    ...prev,
    items: [
      ...prev.items,
      {
        kind: 'CollectionSection',
        idx: nextIdx(prev.items as any),
        path: `csection_${nextIdx(prev.items as any)}`,
        label: { fallback: 'Collection Section' },
        required: false,
        hidden: false,
        collapsed: false,
        min_instances: 0,
        max_instances: 10,
        default_instances: 1,
        children: [],
      } as CollectionSection,
    ],
  }));

  /* ---------------- Generic update/remove ---------------- */
  const updateItem = (index: number, patch: Partial<ContentItem>) =>
    commit(prev => ({ ...prev, items: prev.items.map((it, i) => (i === index ? ({ ...it, ...patch } as ContentItem) : it)) }));

  const removeItem = (index: number) =>
    commit(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  /* ---------------- Section-like children ops ---------------- */
  const addChildToSection = (owner: SectionItem | CollectionSection, kind: ContentItem['kind']) => {
    const nextIndex = nextIdx(owner.children as any);
    const base = owner.path;
    let child: ContentItem;

    if (kind === 'FieldItem') {
      child = {
        kind: 'FieldItem',
        idx: nextIndex,
        path: `${base}.field_${nextIndex}`,
        ref: '',
        editable: true,
        required: false,
        importance: 'normal',
        ui: { kind: 'UIBlock', label: { fallback: 'New Field' }, override: false },
      };
    } else if (kind === 'SectionItem') {
      child = {
        kind: 'SectionItem',
        idx: nextIndex,
        path: `${base}.section_${nextIndex}`,
        label: { fallback: 'New Subsection' },
        required: false,
        hidden: false,
        collapsed: false,
        children: [],
      };
    } else if (kind === 'CollectionFieldItem') {
      child = {
        kind: 'CollectionFieldItem',
        idx: nextIndex,
        path: `${base}.cfield_${nextIndex}`,
        ref: '',
        editable: true,
        required: false,
        importance: 'normal',
        ui: { kind: 'UIBlock', label: { fallback: 'Collection Field' }, override: false },
        min_instances: 0,
        max_instances: 10,
        default_instances: 1,
      };
    } else {
      // CollectionSection
      child = {
        kind: 'CollectionSection',
        idx: nextIndex,
        path: `${base}.csection_${nextIndex}`,
        label: { fallback: 'Collection Section' },
        required: false,
        hidden: false,
        collapsed: false,
        min_instances: 0,
        max_instances: 10,
        default_instances: 1,
        children: [],
      };
    }

    return reindex([...(owner.children || []), child]);
  };

  const replaceChildInSection = (
    owner: SectionItem | CollectionSection,
    childPath: string,
    patch: Partial<ContentItem>
  ) => reindex(owner.children.map(c => (c.path === childPath ? ({ ...(c as any), ...patch } as ContentItem) : c)));

  const removeChildInSection = (owner: SectionItem | CollectionSection, childPath: string) =>
    (owner.children || []).filter(c => c.path !== childPath);

  /* ---------------- Editors ---------------- */
  const FieldEditor = ({ item, onPatch, onRemove }: { item: FieldItem; onPatch: (p: Partial<FieldItem>) => void; onRemove: () => void }) => (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm">Field</CardTitle>
        <Button onClick={onRemove} variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>

      <CardContent className="mt-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Ref</Label>
            <Select value={item.ref || undefined} onValueChange={(value) => onPatch({ ref: value, path: value })}>
              <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
              <SelectContent>
                {availableFields.map(af => (<SelectItem key={af.id} value={af.id}>{af.id}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Importance</Label>
            <Select value={item.importance} onValueChange={(v: Importance) => onPatch({ importance: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Index</Label>
            <Input type="number" value={item.idx} onChange={(e) => onPatch({ idx: parseInt(e.target.value) || 1 })} min={1} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Label (fallback)</Label>
            <Input value={item.ui.label?.fallback || ''} onChange={(e) => onPatch({ ui: { ...item.ui, label: { ...item.ui.label, fallback: e.target.value } } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (key)</Label>
            <Input value={item.ui.label?.key || ''} onChange={(e) => onPatch({ ui: { ...item.ui, label: { ...item.ui.label, key: e.target.value } } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Help (fallback)</Label>
            <Input value={item.ui.help?.fallback || ''} onChange={(e) => onPatch({ ui: { ...item.ui, help: { ...item.ui.help, fallback: e.target.value } } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Help (key)</Label>
            <Input value={item.ui.help?.key || ''} onChange={(e) => onPatch({ ui: { ...item.ui, help: { ...item.ui.help, key: e.target.value } } })} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={item.required} onCheckedChange={(checked) => onPatch({ required: checked })} />
            <Label className="text-xs">Required</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={item.editable} onCheckedChange={(checked) => onPatch({ editable: checked })} />
            <Label className="text-xs">Editable</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={item.ui.override} onCheckedChange={(checked) => onPatch({ ui: { ...item.ui, override: checked } })} />
            <Label className="text-xs">Override</Label>
          </div>
          <Badge variant={item.importance === 'high' ? 'destructive' : item.importance === 'normal' ? 'default' : 'secondary'}>
            {item.importance}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const CFieldEditor = ({
    item, onPatch, onRemove,
  }: { item: CollectionFieldItem; onPatch: (p: Partial<CollectionFieldItem>) => void; onRemove: () => void }) => (
    <Card className="p-4 border-primary/30">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm">Collection Field (template only)</CardTitle>
        <Button onClick={onRemove} variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>

      <CardContent className="mt-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Ref</Label>
            <Select value={item.ref || undefined} onValueChange={(value) => onPatch({ ref: value, path: item.path || value })}>
              <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
              <SelectContent>
                {availableFields.map(af => (<SelectItem key={af.id} value={af.id}>{af.id}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min</Label>
            <Input type="number" value={item.min_instances} onChange={(e) => onPatch({ min_instances: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max</Label>
            <Input type="number" value={item.max_instances} onChange={(e) => onPatch({ max_instances: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Default</Label>
            <Input type="number" value={item.default_instances} onChange={(e) => onPatch({ default_instances: parseInt(e.target.value) || 1 })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Label (fallback)</Label>
            <Input value={item.ui.label?.fallback || ''} onChange={(e) => onPatch({ ui: { ...item.ui, label: { ...item.ui.label, fallback: e.target.value } } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (key)</Label>
            <Input value={item.ui.label?.key || ''} onChange={(e) => onPatch({ ui: { ...item.ui, label: { ...item.ui.label, key: e.target.value } } })} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={item.required} onCheckedChange={(checked) => onPatch({ required: checked })} />
            <Label className="text-xs">Required</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={item.editable} onCheckedChange={(checked) => onPatch({ editable: checked })} />
            <Label className="text-xs">Editable</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={item.ui.override} onCheckedChange={(checked) => onPatch({ ui: { ...item.ui, override: checked } })} />
            <Label className="text-xs">Override</Label>
          </div>
          <Badge variant={item.importance === 'high' ? 'destructive' : item.importance === 'normal' ? 'default' : 'secondary'}>
            {item.importance}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const SectionLikeEditor = ({
    item, onPatch, onRemove, isCollection,
  }: {
    item: SectionItem | CollectionSection;
    onPatch: (p: Partial<SectionItem & CollectionSection>) => void;
    onRemove: () => void;
    isCollection?: boolean;
  }) => (
    <Card className={`p-4 ${isCollection ? 'border-secondary/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onPatch({ collapsed: !(item as any).collapsed })}>
            {(item as any).collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <CardTitle className="text-sm">{isCollection ? 'Collection Section (template only)' : 'Section'}</CardTitle>
          <Badge variant="outline" className="text-xs">idx: {(item as any).idx}</Badge>
        </div>
        <Button onClick={onRemove} variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
      </div>

      {!(item as any).collapsed && (
        <CardContent className="mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Path</Label>
              <Input value={item.path} onChange={(e) => onPatch({ path: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (fallback)</Label>
              <Input value={item.label?.fallback || ''} onChange={(e) => onPatch({ label: { ...(item.label || { fallback: '' }), fallback: e.target.value } as any })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (key)</Label>
              <Input value={item.label?.key || ''} onChange={(e) => onPatch({ label: { ...(item.label || { fallback: '' }), key: e.target.value } as any })} />
            </div>
          </div>

          {isCollection && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min</Label>
                <Input type="number" value={(item as any).min_instances} onChange={(e) => onPatch({ min_instances: parseInt(e.target.value) || 0 } as any)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max</Label>
                <Input type="number" value={(item as any).max_instances} onChange={(e) => onPatch({ max_instances: parseInt(e.target.value) || 0 } as any)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Default</Label>
                <Input type="number" value={(item as any).default_instances} onChange={(e) => onPatch({ default_instances: parseInt(e.target.value) || 1 } as any)} />
              </div>
            </div>
          )}

          {/* Children (TEMPLATE editing) */}
          <div className="flex items-center justify-between mt-2">
            <div className="font-medium">Content</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const children = addChildToSection(item, 'FieldItem');
                onPatch({ children } as any);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Field
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const children = addChildToSection(item, 'SectionItem');
                onPatch({ children } as any);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Subsection
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const children = addChildToSection(item, 'CollectionFieldItem');
                onPatch({ children } as any);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Collection Field
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const children = addChildToSection(item, 'CollectionSection');
                onPatch({ children } as any);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Collection Section
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {(item.children || []).length === 0 ? (
              <div className="text-xs text-muted-foreground">No content in this {isCollection ? 'collection section' : 'section'}.</div>
            ) : (
              item.children.map((child, idx) => {
                const patchChild = (patch: Partial<ContentItem>) =>
                  onPatch({ children: replaceChildInSection(item, child.path, patch) } as any);
                const removeChild = () =>
                  onPatch({ children: reindex(removeChildInSection(item, child.path)) } as any);

                if (isField(child)) return <FieldEditor key={child.path} item={child} onPatch={patchChild as any} onRemove={removeChild} />;
                if (isCField(child)) return <CFieldEditor key={child.path} item={child} onPatch={patchChild as any} onRemove={removeChild} />;

                if (isCSection(child)) {
                  return (
                    <SectionLikeEditor
                      key={child.path}
                      item={child}
                      isCollection
                      onPatch={patchChild as any}
                      onRemove={removeChild}
                    />
                  );
                }

                if (isSection(child)) {
                  return (
                    <SectionLikeEditor
                      key={child.path}
                      item={child}
                      onPatch={patchChild as any}
                      onRemove={removeChild}
                    />
                  );
                }

                return null;
              })
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Content (v2-items)</h3>
          <p className="text-sm text-muted-foreground">Fields, sections, and collection templates (no instances in library)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={addField} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Field</Button>
          <Button onClick={addSection} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Section</Button>
          <Button onClick={addCField} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Collection Field</Button>
          <Button onClick={addCSection} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Collection Section</Button>
        </div>
      </div>

      {state.items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No content configured</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={addField} variant="outline"><Plus className="w-4 h-4 mr-2" /> Field</Button>
                <Button onClick={addSection} variant="outline"><Plus className="w-4 h-4 mr-2" /> Section</Button>
                <Button onClick={addCField} variant="outline"><Plus className="w-4 h-4 mr-2" /> Collection Field</Button>
                <Button onClick={addCSection} variant="outline"><Plus className="w-4 h-4 mr-2" /> Collection Section</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {state.items.map((item, index) => {
            const onPatch = (patch: Partial<ContentItem>) => updateItem(index, patch);
            const onRemove = () => removeItem(index);

            if (isField(item)) return <FieldEditor key={item.path} item={item} onPatch={onPatch as any} onRemove={onRemove} />;
            if (isCField(item)) return <CFieldEditor key={item.path} item={item} onPatch={onPatch as any} onRemove={onRemove} />;
            if (isCSection(item)) return <SectionLikeEditor key={item.path} item={item} isCollection onPatch={onPatch as any} onRemove={onRemove} />;
            if (isSection(item)) return <SectionLikeEditor key={item.path} item={item} onPatch={onPatch as any} onRemove={onRemove} />;
            return null;
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Debug:</strong> items={state.items.length} · registry={availableFields.length}
      </div>
    </div>
  );
}

export default FormContentEditor;
