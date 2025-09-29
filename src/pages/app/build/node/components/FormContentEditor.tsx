// src/pages/app/build/node/components/FormContentEditor.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Importance = 'low' | 'normal' | 'high';

interface I18nText {
  fallback: string | null;
  key?: string | null;
}

interface UIBlock {
  kind: 'UIBlock';
  help: I18nText | null;
  placeholder: I18nText | null;
  widget: string | null;
  datatype: string | null;
  override: boolean;
}

interface FieldItem {
  kind: 'FieldItem';
  idx: number;
  path: string;
  ref: string;
  label: I18nText;
  editable: boolean;
  required: boolean;
  importance: Importance;
  ui: UIBlock;
  value: any;
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

interface CollectionInstance {
  instance_id: number;
  path: string;
  value?: any;
  children?: ContentItem[];
}

interface CollectionFieldItem {
  kind: 'CollectionFieldItem';
  idx: number;
  path: string;
  ref: string;
  label: I18nText;
  editable: boolean;
  required: boolean;
  importance: Importance;
  ui: UIBlock;
  min_instances: number;
  max_instances: number;
  instances: CollectionInstance[];
}

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
  instances: CollectionInstance[];
}

type ContentItem = FieldItem | SectionItem | CollectionFieldItem | CollectionSection;

interface FormContent {
  kind: 'FormContent';
  version: 'v2-items';
  items: ContentItem[];
}

interface FormContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

/* ---------------- helpers ---------------- */

const s2n = (s: string | null | undefined) => (s && s.trim() !== '' ? s : null);

const i18n = (t?: Partial<I18nText> | null): I18nText => ({
  fallback: s2n(t?.fallback ?? null),
  key: s2n(t?.key ?? null),
});

const clampIdx = (n?: number) => Math.max(1, Number.isFinite(n as any) ? (n as number) : 1);
const nextIdx = (arr: { idx?: number }[]) => (arr.length ? Math.max(...arr.map(x => clampIdx(x.idx))) + 1 : 1);
const isField = (x: any): x is FieldItem => x?.kind === 'FieldItem';
const isSection = (x: any): x is SectionItem => x?.kind === 'SectionItem';
const isCField = (x: any): x is CollectionFieldItem => x?.kind === 'CollectionFieldItem';
const isCSection = (x: any): x is CollectionSection => x?.kind === 'CollectionSection';

function normalizeUI(raw?: Partial<UIBlock> | null): UIBlock {
  const help_f = s2n((raw as any)?.help?.fallback);
  const help_k = s2n((raw as any)?.help?.key);
  const placeholder_f = s2n((raw as any)?.placeholder?.fallback);
  const placeholder_k = s2n((raw as any)?.placeholder?.key);
  const widget = s2n((raw as any)?.widget);
  const datatype = s2n((raw as any)?.datatype);

  const help = help_f || help_k ? { fallback: help_f, key: help_k } : null;
  const placeholder = placeholder_f || placeholder_k ? { fallback: placeholder_f, key: placeholder_k } : null;

  const override = !!(help || placeholder || widget || datatype);

  if (!override) {
    return {
      kind: 'UIBlock',
      help: null,
      placeholder: null,
      widget: null,
      datatype: null,
      override: false,
    };
  }

  return {
    kind: 'UIBlock',
    help,
    placeholder,
    widget: widget ?? null,
    datatype: datatype ?? null,
    override: true,
  };
}

function normalizeFieldItem(item: any, fallbackPath = 'field'): FieldItem {
  const idx = clampIdx(item?.idx);
  const ref = (item?.ref ?? item?.path ?? `${fallbackPath}_${idx}`).toString();
  const path = (item?.path ?? ref).toString();

  const liftedLabel = item?.label ?? item?.ui?.label ?? { fallback: null, key: null };

  return {
    kind: 'FieldItem',
    idx,
    path,
    ref,
    label: i18n(liftedLabel),
    editable: item?.editable !== false,
    required: !!item?.required,
    importance: (['low', 'normal', 'high'] as Importance[]).includes(item?.importance) ? item.importance : 'normal',
    ui: normalizeUI(item?.ui),
    value: item?.value ?? null,
  };
}

function normalizeSectionItem(item: any, fallbackPath = 'section'): SectionItem {
  const idx = clampIdx(item?.idx);
  const path = (item?.path ?? `${fallbackPath}_${idx}`).toString();
  const children: ContentItem[] = Array.isArray(item?.children)
    ? (item.children as any[]).map((c: any) => normalizeAnyItem(c, path))
    : [];

  return {
    kind: 'SectionItem',
    idx,
    path,
    label: i18n(item?.label ?? { fallback: null, key: null }),
    description: item?.description ? i18n(item.description) : undefined,
    required: !!item?.required,
    hidden: !!item?.hidden,
    collapsed: !!item?.collapsed,
    children,
  };
}

function normalizeCFieldItem(item: any, basePath = 'cfield'): CollectionFieldItem {
  const idx = clampIdx(item?.idx);
  const ref = (item?.ref ?? item?.path ?? `${basePath}_${idx}`).toString();
  const path = (item?.path ?? ref).toString();

  const tmpl: CollectionInstance = {
    instance_id: 1,
    path: `${path}.i1`,
    value: item?.instances?.[0]?.value ?? null,
  };

  return {
    kind: 'CollectionFieldItem',
    idx,
    path,
    ref,
    label: i18n(item?.label ?? item?.ui?.label ?? { fallback: null, key: null }),
    editable: item?.editable !== false,
    required: !!item?.required,
    importance: (['low', 'normal', 'high'] as Importance[]).includes(item?.importance) ? item.importance : 'normal',
    ui: normalizeUI(item?.ui),
    min_instances: Number.isFinite(item?.min_instances) ? item.min_instances : 1,
    max_instances: Number.isFinite(item?.max_instances) ? item.max_instances : 1,
    instances: [tmpl],
  };
}

function normalizeCSectionItem(item: any, basePath = 'csection'): CollectionSection {
  const idx = clampIdx(item?.idx);
  const path = (item?.path ?? `${basePath}_${idx}`).toString();

  const tmplChildren: ContentItem[] = Array.isArray(item?.instances?.[0]?.children)
    ? (item.instances[0].children as any[]).map((c: any) => normalizeAnyItem(c, `${path}.i1`))
    : [];

  const tmpl: CollectionInstance = {
    instance_id: 1,
    path: `${path}.i1`,
    children: tmplChildren,
  };

  return {
    kind: 'CollectionSection',
    idx,
    path,
    label: i18n(item?.label ?? { fallback: null, key: null }),
    description: item?.description ? i18n(item.description) : undefined,
    required: !!item?.required,
    hidden: !!item?.hidden,
    collapsed: !!item?.collapsed,
    min_instances: Number.isFinite(item?.min_instances) ? item.min_instances : 1,
    max_instances: Number.isFinite(item?.max_instances) ? item.max_instances : 1,
    instances: [tmpl],
  };
}

function normalizeAnyItem(item: any, parentPath: string): ContentItem {
  switch (item?.kind) {
    case 'FieldItem':
      return normalizeFieldItem(item, `${parentPath}.field`);
    case 'SectionItem':
      return normalizeSectionItem(item, `${parentPath}.section`);
    case 'CollectionFieldItem':
      return normalizeCFieldItem(item, `${parentPath}.cfield`);
    case 'CollectionSection':
      return normalizeCSectionItem(item, `${parentPath}.csection`);
    default:
      if (item?.ref) return normalizeFieldItem(item, `${parentPath}.field`);
      if (Array.isArray(item?.children)) return normalizeSectionItem({ ...item, kind: 'SectionItem' }, `${parentPath}.section`);
      return normalizeFieldItem({ kind: 'FieldItem', ref: 'field', idx: 1, path: `${parentPath}.field_1`, label: { fallback: null, key: null } }, parentPath);
  }
}

function normalizeFormContent(raw: any): FormContent {
  if (raw?.sections && !raw?.items) {
    const converted: ContentItem[] = (raw.sections as any[]).map((section: any, idx: number) =>
      normalizeSectionItem(
        {
          kind: 'SectionItem',
          idx: idx + 1,
          path: section.key || `section_${idx + 1}`,
          label: i18n(section.title ?? { fallback: null, key: null }),
          description: section.ui?.help ? i18n(section.ui.help) : undefined,
          required: false,
          hidden: false,
          collapsed: false,
          children: (section.fields || []).map((field: any, fIdx: number) =>
            normalizeFieldItem(
              {
                kind: 'FieldItem',
                idx: fIdx + 1,
                path: field.field_ref || `field_${fIdx + 1}`,
                ref: field.field_ref || '',
                editable: true,
                required: field.required || false,
                importance: field.importance || 'normal',
                ui: field.ui,
                value: null,
                label: field.ui?.label ?? { fallback: null, key: null },
              },
              `section_${idx + 1}`
            )
          ),
        },
        'section'
      )
    );

    return { kind: 'FormContent', version: 'v2-items', items: converted };
  }

  const items = Array.isArray(raw?.items) ? raw.items : [];
  const normalized = items.map((it: any, i: number) => {
    const base = it?.kind ? it : { ...it, kind: 'FieldItem' };
    const parent = 'form';
    return normalizeAnyItem({ ...base, idx: clampIdx(it?.idx ?? i + 1) }, parent);
  });

  return { kind: 'FormContent', version: 'v2-items', items: normalized };
}

/* ---------------- component ---------------- */

export function FormContentEditor({ content, onChange }: FormContentEditorProps) {
  const [availableFields, setAvailableFields] = useState<Array<{ id: string; ui?: any; widget?: string; datatype?: string }>>([]);

  const initial = useMemo(() => normalizeFormContent(content || {}), [JSON.stringify(content || {})]);
  const [formContent, setFormContent] = useState<FormContent>(initial);

  useEffect(() => {
    const next = normalizeFormContent(content || {});
    setFormContent(prev => JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
  }, [JSON.stringify(content || {})]);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .schema('app' as any)
          .from('field_registry')
          .select('id, widget, datatype, ui')
          .order('id');

        if (error) throw error;
        setAvailableFields(data || []);
      } catch (error) {
        console.error('[FormBuilder] Failed to fetch field registry:', error);
      }
    };
    fetchFields();
  }, []);

  useEffect(() => {
    const normalized = normalizeFormContent(formContent);
    onChange(normalized as unknown as Record<string, any>);
  }, [formContent, onChange]);

  /* ---------- adders ---------- */

  const addTopLevelField = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const field = normalizeFieldItem(
        {
          kind: 'FieldItem',
          idx,
          ref: '',
          path: `field_${idx}`,
          label: { fallback: null, key: null },
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          editable: true,
          required: false,
          importance: 'normal',
          value: null,
        },
        'field'
      );
      return { ...prev, items: [...prev.items, field] };
    });
  };

  const addSection = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const section = normalizeSectionItem(
        {
          kind: 'SectionItem',
          idx,
          path: `section_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          children: [],
        },
        'section'
      );
      return { ...prev, items: [...prev.items, section] };
    });
  };

  const addCollectionField = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const cfield = normalizeCFieldItem(
        {
          kind: 'CollectionFieldItem',
          idx,
          path: `cfield_${idx}`,
          ref: '',
          label: { fallback: null, key: null },
          editable: true,
          required: false,
          importance: 'normal',
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `cfield_${idx}.i1`, value: null }],
        },
        'cfield'
      );
      return { ...prev, items: [...prev.items, cfield] };
    });
  };

  const addCollectionSection = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const csection = normalizeCSectionItem(
        {
          kind: 'CollectionSection',
          idx,
          path: `csection_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `csection_${idx}.i1`, children: [] }],
        },
        'csection'
      );
      return { ...prev, items: [...prev.items, csection] };
    });
  };

  /* ---------- updaters ---------- */

  const updateItemAt = (index: number, updates: Partial<ContentItem>) => {
    setFormContent(prev => {
      const items = [...prev.items];
      const cur = items[index];
      let next: ContentItem = { ...(cur as any), ...updates };

      if (isField(next)) next = normalizeFieldItem(next, 'field');
      if (isSection(next)) next = normalizeSectionItem(next, 'section');
      if (isCField(next)) next = normalizeCFieldItem(next, 'cfield');
      if (isCSection(next)) next = normalizeCSectionItem(next, 'csection');

      items[index] = next;
      return { ...prev, items };
    });
  };

  const removeItemAt = (index: number) => {
    setFormContent(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  /* ---------- renderers ---------- */

  const setFieldUI = (field: FieldItem, patch: Partial<UIBlock>) =>
    normalizeUI({ ...(field.ui || { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false }), ...patch });
  const setCFieldUI = (item: CollectionFieldItem, patch: Partial<UIBlock>) =>
    normalizeUI({ ...(item.ui || { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false }), ...patch });

  const renderFieldEditor = (field: FieldItem, onUpdate: (updates: Partial<FieldItem>) => void, onRemove: () => void) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Field ref</Label>
              <Select
                value={field.ref || undefined}
                onValueChange={(value) =>
                  onUpdate({
                    ref: value,
                    path: value,
                    label: field.label,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (fallback)</Label>
              <Input
                value={field.label?.fallback || ''}
                onChange={(e) => onUpdate({ label: { ...field.label, fallback: s2n(e.target.value) } })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (key)</Label>
              <Input
                value={field.label?.key || ''}
                onChange={(e) => onUpdate({ label: { ...field.label, key: s2n(e.target.value) } })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Index</Label>
              <Input type="number" value={field.idx} min={1} onChange={(e) => onUpdate({ idx: clampIdx(parseInt(e.target.value)) })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Importance</Label>
              <Select
                value={field.importance}
                onValueChange={(value: Importance) => onUpdate({ importance: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Help (fallback)</Label>
              <Input
                value={field.ui?.help?.fallback || ''}
                onChange={(e) => onUpdate({ ui: setFieldUI(field, { help: { fallback: s2n(e.target.value), key: field.ui?.help?.key ?? null } as any }) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Help (key)</Label>
              <Input
                value={field.ui?.help?.key || ''}
                onChange={(e) => onUpdate({ ui: setFieldUI(field, { help: { fallback: field.ui?.help?.fallback ?? null, key: s2n(e.target.value) } as any }) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placeholder (fallback)</Label>
              <Input
                value={field.ui?.placeholder?.fallback || ''}
                onChange={(e) => onUpdate({ ui: setFieldUI(field, { placeholder: { fallback: s2n(e.target.value), key: field.ui?.placeholder?.key ?? null } as any }) })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Placeholder (key)</Label>
              <Input
                value={field.ui?.placeholder?.key || ''}
                onChange={(e) => onUpdate({ ui: setFieldUI(field, { placeholder: { fallback: field.ui?.placeholder?.fallback ?? null, key: s2n(e.target.value) } as any }) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={field.required} onCheckedChange={(v) => onUpdate({ required: v })} />
              <Label className="text-xs">Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={field.editable} onCheckedChange={(v) => onUpdate({ editable: v })} />
              <Label className="text-xs">Editable</Label>
            </div>
            <div className="flex-1" />
            <Badge variant={field.importance === 'high' ? 'destructive' : field.importance === 'normal' ? 'default' : 'secondary'}>
              {field.importance}
            </Badge>
          </div>
        </div>
        <Button onClick={onRemove} variant="ghost" size="sm" aria-label="remove-field">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );

  const renderSectionEditor = (
    section: SectionItem,
    opts: {
      depth: number;
      parentPath: string;
      onUpdate: (updates: Partial<SectionItem>) => void;
      onRemove: () => void;
    }
  ) => {
    const { depth, parentPath, onUpdate, onRemove } = opts;

    const updateChild = (childIdx: number, updates: Partial<ContentItem>) => {
      const children = [...section.children];
      let next: ContentItem = { ...(children[childIdx] as any), ...updates };

      if (isField(next)) next = normalizeFieldItem(next, section.path);
      else if (isSection(next)) next = normalizeSectionItem(next, section.path);
      else if (isCField(next)) next = normalizeCFieldItem(next, section.path);
      else if (isCSection(next)) next = normalizeCSectionItem(next, section.path);

      children[childIdx] = next;
      onUpdate({ children });
    };

    const removeChild = (childIdx: number) => {
      const children = section.children.filter((_, i) => i !== childIdx);
      onUpdate({ children });
    };

    const addFieldHere = () => {
      const idx = nextIdx(section.children);
      const field = normalizeFieldItem(
        {
          kind: 'FieldItem',
          idx,
          path: `${section.path}.field_${idx}`,
          ref: '',
          label: { fallback: null, key: null },
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          editable: true,
          required: false,
          importance: 'normal',
          value: null,
        },
        section.path
      );
      onUpdate({ children: [...section.children, field] });
    };

    const addSubsectionHere = () => {
      const idx = nextIdx(section.children);
      const sub = normalizeSectionItem(
        {
          kind: 'SectionItem',
          idx,
          path: `${section.path}.section_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          children: [],
        },
        section.path
      );
      onUpdate({ children: [...section.children, sub] });
    };

    const addCFieldHere = () => {
      const idx = nextIdx(section.children);
      const cfield = normalizeCFieldItem(
        {
          kind: 'CollectionFieldItem',
          idx,
          path: `${section.path}.cfield_${idx}`,
          ref: '',
          label: { fallback: null, key: null },
          editable: true,
          required: false,
          importance: 'normal',
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `${section.path}.cfield_${idx}.i1`, value: null }],
        },
        section.path
      );
      onUpdate({ children: [...section.children, cfield] });
    };

    const addCSectionHere = () => {
      const idx = nextIdx(section.children);
      const csection = normalizeCSectionItem(
        {
          kind: 'CollectionSection',
          idx,
          path: `${section.path}.csection_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `${section.path}.csection_${idx}.i1`, children: [] }],
        },
        section.path
      );
      onUpdate({ children: [...section.children, csection] });
    };

    return (
      <Card key={section.path} className={`border-l-4 ${depth === 0 ? 'border-l-primary' : 'border-l-muted'} ${depth > 0 ? 'ml-6' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onUpdate({ collapsed: !section.collapsed })}>
                {section.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <CardTitle className={depth === 0 ? 'text-base' : 'text-sm'}>Section: {section.label?.fallback || section.path}</CardTitle>
              {depth > 0 && <Badge variant="outline" className="text-xs">Nested</Badge>}
            </div>
            <Button onClick={onRemove} variant="ghost" size="sm" aria-label="remove-section">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>

        {!section.collapsed && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Path</Label>
                <Input value={section.path} onChange={(e) => onUpdate({ path: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label (fallback)</Label>
                <Input value={section.label?.fallback || ''} onChange={(e) => onUpdate({ label: { ...section.label, fallback: s2n(e.target.value) } })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Index</Label>
                <Input type="number" value={section.idx} min={1} onChange={(e) => onUpdate({ idx: Math.max(1, parseInt(e.target.value) || 1) })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Label (key)</Label>
                <Input value={section.label?.key || ''} onChange={(e) => onUpdate({ label: { ...section.label, key: s2n(e.target.value) } })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description (fallback)</Label>
                <Textarea value={section.description?.fallback || ''} onChange={(e) => onUpdate({ description: { ...(section.description || {}), fallback: s2n(e.target.value) } })} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={section.required} onCheckedChange={(v) => onUpdate({ required: v })} />
                <Label className="text-xs">Required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={section.hidden} onCheckedChange={(v) => onUpdate({ hidden: v })} />
                <Label className="text-xs">Hidden</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Children</h4>
                <div className="flex gap-2">
                  <Button onClick={addFieldHere} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Field
                  </Button>
                  <Button onClick={addSubsectionHere} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Subsection
                  </Button>
                  <Button onClick={addCFieldHere} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Collection Field
                  </Button>
                  <Button onClick={addCSectionHere} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />Add Collection Section
                  </Button>
                </div>
              </div>

              {section.children.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md p-3">No children yet.</div>
              ) : (
                <div className="space-y-3">
                  {section.children.map((child, cIdx) => (
                    <div key={(child as any).path || `${section.path}-${cIdx}`}>
                      {isField(child) &&
                        renderFieldEditor(
                          child,
                          (updates) => updateChild(cIdx, updates),
                          () => removeChild(cIdx)
                        )}
                      {isSection(child) &&
                        renderSectionEditor(child as SectionItem, {
                          depth: depth + 1,
                          parentPath: section.path,
                          onUpdate: (u) => updateChild(cIdx, u),
                          onRemove: () => removeChild(cIdx),
                        })}
                      {isCField(child) &&
                        renderCFieldEditor(
                          child as CollectionFieldItem,
                          (updates) => updateChild(cIdx, updates),
                          () => removeChild(cIdx)
                        )}
                      {isCSection(child) &&
                        renderCSectionEditor(
                          child as CollectionSection,
                          (updates) => updateChild(cIdx, updates),
                          () => removeChild(cIdx)
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderCFieldEditor = (
    item: CollectionFieldItem,
    onUpdate: (updates: Partial<CollectionFieldItem>) => void,
    onRemove: () => void
  ) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Field ref</Label>
              <Select value={item.ref || undefined} onValueChange={(v) => onUpdate({ ref: v, path: item.path || v, label: item.label })}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {availableFields.map(f => <SelectItem key={f.id} value={f.id}>{f.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (fallback)</Label>
              <Input value={item.label?.fallback || ''} onChange={(e) => onUpdate({ label: { ...item.label, fallback: s2n(e.target.value) } })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min instances</Label>
              <Input type="number" value={item.min_instances} min={1} onChange={(e) => onUpdate({ min_instances: clampIdx(parseInt(e.target.value)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max instances</Label>
              <Input type="number" value={item.max_instances} min={item.min_instances || 1} onChange={(e) => onUpdate({ max_instances: clampIdx(parseInt(e.target.value)) })} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={item.required} onCheckedChange={(v) => onUpdate({ required: v })} />
              <Label className="text-xs">Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={item.editable} onCheckedChange={(v) => onUpdate({ editable: v })} />
              <Label className="text-xs">Editable</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Template instance value</Label>
            <Input
              value={item.instances?.[0]?.value ?? ''}
              onChange={(e) => onUpdate({ instances: [{ ...(item.instances?.[0] || { instance_id: 1, path: `${item.path}.i1` }), value: e.target.value }] })}
              placeholder="Default value for each instance"
            />
            <p className="text-[11px] text-muted-foreground">Builder keeps one template instance (i1). Jobs may add more.</p>
          </div>
        </div>
        <Button onClick={onRemove} variant="ghost" size="sm" aria-label="remove-cfield">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );

  const renderCSectionEditor = (
    item: CollectionSection,
    onUpdate: (updates: Partial<CollectionSection>) => void,
    onRemove: () => void
  ) => {
    const tmpl = item.instances?.[0];
    const children = tmpl?.children || [];

    const updateChild = (childIdx: number, updates: Partial<ContentItem>) => {
      const newChildren = [...children];
      let next: ContentItem = { ...(newChildren[childIdx] as any), ...updates };

      if (isField(next)) next = normalizeFieldItem(next, `${item.path}.i1`);
      else if (isSection(next)) next = normalizeSectionItem(next, `${item.path}.i1`);
      else if (isCField(next)) next = normalizeCFieldItem(next, `${item.path}.i1`);
      else if (isCSection(next)) next = normalizeCSectionItem(next, `${item.path}.i1`);

      newChildren[childIdx] = next;
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: newChildren };
      onUpdate({ instances: [newTmpl] });
    };

    const removeChild = (childIdx: number) => {
      const newChildren = children.filter((_, i) => i !== childIdx);
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: newChildren };
      onUpdate({ instances: [newTmpl] });
    };

    const addFieldHere = () => {
      const idx = nextIdx(children as any);
      const field = normalizeFieldItem(
        {
          kind: 'FieldItem',
          idx,
          path: `${item.path}.i1.field_${idx}`,
          ref: '',
          label: { fallback: null, key: null },
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          editable: true,
          required: false,
          importance: 'normal',
          value: null,
        },
        `${item.path}.i1`
      );
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: [...children, field] };
      onUpdate({ instances: [newTmpl] });
    };

    const addSubsectionHere = () => {
      const idx = nextIdx(children as any);
      const sub = normalizeSectionItem(
        {
          kind: 'SectionItem',
          idx,
          path: `${item.path}.i1.section_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          children: [],
        },
        `${item.path}.i1`
      );
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: [...children, sub] };
      onUpdate({ instances: [newTmpl] });
    };

    const addCFieldHere = () => {
      const idx = nextIdx(children as any);
      const cfield = normalizeCFieldItem(
        {
          kind: 'CollectionFieldItem',
          idx,
          path: `${item.path}.i1.cfield_${idx}`,
          ref: '',
          label: { fallback: null, key: null },
          editable: true,
          required: false,
          importance: 'normal',
          ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `${item.path}.i1.cfield_${idx}.i1`, value: null }],
        },
        `${item.path}.i1`
      );
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: [...children, cfield] };
      onUpdate({ instances: [newTmpl] });
    };

    const addCSectionHere = () => {
      const idx = nextIdx(children as any);
      const csection = normalizeCSectionItem(
        {
          kind: 'CollectionSection',
          idx,
          path: `${item.path}.i1.csection_${idx}`,
          label: { fallback: null, key: null },
          required: false,
          hidden: false,
          collapsed: false,
          min_instances: 1,
          max_instances: 3,
          instances: [{ instance_id: 1, path: `${item.path}.i1.csection_${idx}.i1`, children: [] }],
        },
        `${item.path}.i1`
      );
      const newTmpl = { ...(tmpl || { instance_id: 1, path: `${item.path}.i1`, children: [] }), children: [...children, csection] };
      onUpdate({ instances: [newTmpl] });
    };

    return (
      <Card className="p-4 border-l-4 border-l-secondary">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Collection Section: {item.label?.fallback || item.path}</CardTitle>
          </div>
          <Button onClick={onRemove} variant="ghost" size="sm" aria-label="remove-csection">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Path</Label>
            <Input value={item.path} onChange={(e) => onUpdate({ path: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label (fallback)</Label>
            <Input value={item.label?.fallback || ''} onChange={(e) => onUpdate({ label: { ...item.label, fallback: s2n(e.target.value) } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min instances</Label>
            <Input type="number" value={item.min_instances} min={1} onChange={(e) => onUpdate({ min_instances: clampIdx(parseInt(e.target.value)) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max instances</Label>
            <Input type="number" value={item.max_instances} min={item.min_instances || 1} onChange={(e) => onUpdate({ max_instances: clampIdx(parseInt(e.target.value)) })} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Description (fallback)</Label>
            <Textarea
              value={item.description?.fallback || ''}
              onChange={(e) =>
                onUpdate({
                  description: {
                    ...(item.description || {}),
                    fallback: s2n(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description (key)</Label>
            <Input
              value={item.description?.key || ''}
              onChange={(e) =>
                onUpdate({
                  description: {
                    ...(item.description || {}),
                    key: s2n(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Template instance children</h4>
            <div className="flex gap-2">
              <Button onClick={addFieldHere} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Field
              </Button>
              <Button onClick={addSubsectionHere} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Subsection
              </Button>
              <Button onClick={addCFieldHere} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Collection Field
              </Button>
              <Button onClick={addCSectionHere} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Collection Section
              </Button>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-md p-3 mt-2">No children yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {children.map((child, cIdx) => (
                <div key={(child as any).path || `${item.path}.i1-${cIdx}`}>
                  {isField(child) && renderFieldEditor(
                    child,
                    (updates) => updateChild(cIdx, updates),
                    () => removeChild(cIdx)
                  )}
                  {isSection(child) && renderSectionEditor(child as SectionItem, {
                    depth: 1,
                    parentPath: `${item.path}.i1`,
                    onUpdate: (u) => updateChild(cIdx, u),
                    onRemove: () => removeChild(cIdx),
                  })}
                  {isCField(child) && renderCFieldEditor(
                    child as CollectionFieldItem,
                    (updates) => updateChild(cIdx, updates),
                    () => removeChild(cIdx)
                  )}
                  {isCSection(child) && renderCSectionEditor(
                    child as CollectionSection,
                    (updates) => updateChild(cIdx, updates),
                    () => removeChild(cIdx)
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-2">Builder keeps one template instance (i1). Jobs may add more.</p>
        </div>
      </Card>
    );
  };

  /* ---------- main ---------- */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Form Content (SSOT v2-items)</h3>
          <p className="text-sm text-muted-foreground">Fields, sections, and collections. UI override is automatic.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addTopLevelField} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />Add Field
          </Button>
          <Button onClick={addSection} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />Add Section
          </Button>
          <Button onClick={addCollectionField} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />Add Collection Field
          </Button>
          <Button onClick={addCollectionSection} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />Add Collection Section
          </Button>
        </div>
      </div>

      {formContent.items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No content configured</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={addTopLevelField} variant="outline"><Plus className="w-4 h-4 mr-2" />Add Field</Button>
                <Button onClick={addSection} variant="outline"><Plus className="w-4 h-4 mr-2" />Add Section</Button>
                <Button onClick={addCollectionField} variant="outline"><Plus className="w-4 h-4 mr-2" />Add Collection Field</Button>
                <Button onClick={addCollectionSection} variant="outline"><Plus className="w-4 h-4 mr-2" />Add Collection Section</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {formContent.items.map((item, index) => {
            if (isField(item)) {
              return renderFieldEditor(
                item,
                (updates) => updateItemAt(index, updates),
                () => removeItemAt(index)
              );
            } else if (isSection(item)) {
              return renderSectionEditor(item, {
                depth: 0,
                parentPath: 'form',
                onUpdate: (updates) => updateItemAt(index, updates),
                onRemove: () => removeItemAt(index),
              });
            } else if (isCField(item)) {
              return renderCFieldEditor(
                item,
                (updates) => updateItemAt(index, updates),
                () => removeItemAt(index)
              );
            } else if (isCSection(item)) {
              return renderCSectionEditor(
                item,
                (updates) => updateItemAt(index, updates),
                () => removeItemAt(index)
              );
            }
            return null;
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Debug:</strong> items={formContent.items.length} • availableFields={availableFields.length}
      </div>
    </div>
  );
}

export default FormContentEditor;
