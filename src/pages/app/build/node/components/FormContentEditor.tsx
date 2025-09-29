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
  fallback: string;
  key?: string;
}

interface UIBlock {
  kind: 'UIBlock';
  help: I18nText | null;
  placeholder: I18nText | null;
  widget: string | null;
  datatype: string | null;
  override: boolean; // auto: true if any property is filled, else false
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
  instance_id: number; // always 1 in builder
  path: string;
  value?: any; // for CollectionFieldItem
  children?: ContentItem[]; // for CollectionSection
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
  instances: CollectionInstance[]; // [ { instance_id:1, path, value } ]
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
  instances: CollectionInstance[]; // [ { instance_id:1, path, children:[] } ]
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

const i18n = (t?: I18nText | null): I18nText => ({ fallback: t?.fallback ?? '', key: t?.key || undefined });
const clampIdx = (n?: number) => Math.max(1, Number.isFinite(n as any) ? (n as number) : 1);
const nextIdx = (arr: { idx?: number }[]) => (arr.length ? Math.max(...arr.map(x => clampIdx(x.idx))) + 1 : 1);
const isField = (x: any): x is FieldItem => x?.kind === 'FieldItem';
const isSection = (x: any): x is SectionItem => x?.kind === 'SectionItem';
const isCField = (x: any): x is CollectionFieldItem => x?.kind === 'CollectionFieldItem';
const isCSection = (x: any): x is CollectionSection => x?.kind === 'CollectionSection';

const s2n = (s: string | null | undefined) => (s && s.trim() !== '' ? s : null);

/** Auto-compute override; null all props when empty */
function normalizeUI(raw?: Partial<UIBlock> | null): UIBlock {
  const help_f = s2n((raw as any)?.help?.fallback);
  const help_k = s2n((raw as any)?.help?.key);
  const placeholder_f = s2n((raw as any)?.placeholder?.fallback);
  const placeholder_k = s2n((raw as any)?.placeholder?.key);
  const widget = s2n((raw as any)?.widget);
  const datatype = s2n((raw as any)?.datatype);

  const help = help_f || help_k ? { fallback: help_f ?? '', key: help_k ?? undefined } : null;
  const placeholder = placeholder_f || placeholder_k ? { fallback: placeholder_f ?? '', key: placeholder_k ?? undefined } : null;

  const override = !!(help || placeholder || widget || datatype);

  // If nothing is filled, force nulls + override=false
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

  // Lift legacy ui.label to top-level label if present
  const liftedLabel = item?.label ?? item?.ui?.label;

  return {
    kind: 'FieldItem',
    idx,
    path,
    ref,
    label: i18n(liftedLabel ?? { fallback: ref }),
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
    label: i18n(item?.label ?? { fallback: 'Section' }),
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
    label: i18n(item?.label ?? item?.ui?.label ?? { fallback: ref }),
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
    label: i18n(item?.label ?? { fallback: 'Collection' }),
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
      // guess best fit
      if (item?.ref) return normalizeFieldItem(item, `${parentPath}.field`);
      if (Array.isArray(item?.children)) return normalizeSectionItem({ ...item, kind: 'SectionItem' }, `${parentPath}.section`);
      return normalizeFieldItem({ kind: 'FieldItem', ref: 'field', idx: 1, path: `${parentPath}.field_1` }, parentPath);
  }
}

function normalizeFormContent(raw: any): FormContent {
  // legacy "sections" to v2-items
  if (raw?.sections && !raw?.items) {
    const converted: ContentItem[] = (raw.sections as any[]).map((section: any, idx: number) =>
      normalizeSectionItem(
        {
          kind: 'SectionItem',
          idx: idx + 1,
          path: section.key || `section_${idx + 1}`,
          label: section.title || { fallback: `Section ${idx + 1}` },
          description: section.ui?.help,
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
                ui: normalizeUI(field.ui),
                value: null,
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

  // Emit normalized SSOT content
  useEffect(() => {
    const normalized = normalizeFormContent(formContent);
    onChange(normalized as unknown as Record<string, any>);
  }, [formContent, onChange]);

  /* ---------- adders ---------- */

  const addTopLevelField = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const field = normalizeFieldItem({
        kind: 'FieldItem', idx, ref: '', path: `field_${idx}`,
        label: { fallback },
        ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
        editable: true, required: false, importance: 'normal', value: null,
      }, 'field');
      return { ...prev, items: [...prev.items, field] };
    });
  };

  const addSection = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const section = normalizeSectionItem({
        kind: 'SectionItem', idx, path: `section_${idx}`,
        label: { fallback: 'New Section' }, required: false, hidden: false, collapsed: false, children: [],
      }, 'section');
      return { ...prev, items: [...prev.items, section] };
    });
  };

  const addCollectionField = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const cfield = normalizeCFieldItem({
        kind: 'CollectionFieldItem', idx, path: `cfield_${idx}`, ref: '', label: { fallback: 'Collection Field' },
        editable: true, required: false, importance: 'normal',
        ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
        min_instances: 1, max_instances: 3, instances: [{ instance_id: 1, path: `cfield_${idx}.i1`, value: null }],
      }, 'cfield');
      return { ...prev, items: [...prev.items, cfield] };
    });
  };

  const addCollectionSection = () => {
    setFormContent(prev => {
      const idx = nextIdx(prev.items);
      const csection = normalizeCSectionItem({
        kind: 'CollectionSection', idx, path: `csection_${idx}`,
        label: { fallback: 'Collection Section' }, required: false, hidden: false, collapsed: false,
        min_instances: 1, max_instances: 3,
        instances: [{ instance_id: 1, path: `csection_${idx}.i1`, children: [] }],
      }, 'csection');
      return { ...prev, items: [...prev.items, csection] };
    });
  };

  /* ---------- updaters ---------- */

  const updateItemAt = (index: number, updates: Partial<ContentItem>) => {
    setFormContent(prev => {
      const items = [...prev.items];
      const cur = items[index];
      let next: ContentItem = { ...(cur as any), ...updates };

      // Re-normalize specific kinds to keep SSOT sound (and UI override auto)
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

  /* ---------- nested helpers (sections & csections) ---------- */

  const updateSectionChildAt = (sectionIdx: number, childIdx: number, updates: Partial<ContentItem>) => {
    const section = formContent.items[sectionIdx] as SectionItem;
    if (!isSection(section)) return;
    const children = [...section.children];
    let next: ContentItem = { ...(children[childIdx] as any), ...updates };
    if (isField(next)) next = normalizeFieldItem(next, section.path);
    if (isSection(next)) next = normalizeSectionItem(next, section.path);
    if (isCField(next)) next = normalizeCFieldItem(next, section.path);
    if (isCSection(next)) next = normalizeCSectionItem(next, section.path);
    children[childIdx] = next;
    updateItemAt(sectionIdx, { children } as any);
  };

  const addFieldToSection = (sectionIdx: number) => {
    const section = formContent.items[sectionIdx] as SectionItem;
    if (!isSection(section)) return;
    const idx = nextIdx(section.children);
    const field = normalizeFieldItem(
      {
        kind: 'FieldItem',
        idx,
        path: `${section.path}.field_${idx}`,
        ref: '',
        label: { fallback },
        ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
        editable: true,
        required: false,
        importance: 'normal',
        value: null,
      },
      section.path
    );
    updateItemAt(sectionIdx, { children: [...section.children, field] } as any);
  };

  const addSubsectionToSection = (sectionIdx: number) => {
    const section = formContent.items[sectionIdx] as SectionItem;
    if (!isSection(section)) return;
    const idx = nextIdx(section.children);
    const sub = normalizeSectionItem(
      {
        kind: 'SectionItem',
        idx,
        path: `${section.path}.section_${idx}`,
        label: { fallback: 'New Subsection' },
        required: false,
        hidden: false,
        collapsed: false,
        children: [],
      },
      section.path
    );
    updateItemAt(sectionIdx, { children: [...section.children, sub] } as any);
  };

  const removeSectionChild = (sectionIdx: number, childIdx: number) => {
    const section = formContent.items[sectionIdx] as SectionItem;
    if (!isSection(section)) return;
    const children = section.children.filter((_, i) => i !== childIdx);
    updateItemAt(sectionIdx, { children } as any);
  };

  /* ---------- collection helpers ---------- */

  const updateCSectionTemplateChildren = (csecIdx: number, children: ContentItem[]) => {
    const item = formContent.items[csecIdx] as CollectionSection;
    if (!isCSection(item)) return;
    const tmpl = { ...(item.instances[0] || { instance_id: 1, path: `${item.path}.i1`, children: [] }) };
    tmpl.children = children;
    updateItemAt(csecIdx, { instances: [tmpl] } as any);
  };

  const addFieldToCSection = (csecIdx: number) => {
    const item = formContent.items[csecIdx] as CollectionSection;
    if (!isCSection(item)) return;
    const tmpl = item.instances[0];
    const children = tmpl?.children ? [...tmpl.children] : [];
    const idx = nextIdx(children as any);
    const field = normalizeFieldItem(
      {
        kind: 'FieldItem',
        idx,
        path: `${item.path}.i1.field_${idx}`,
        ref: '',
        label: { fallback },
        ui: { kind: 'UIBlock', help: null, placeholder: null, widget: null, datatype: null, override: false },
        editable: true,
        required: false,
        importance: 'normal',
        value: null,
      },
      `${item.path}.i1`
    );
    updateCSectionTemplateChildren(csecIdx, [...children, field]);
  };

  const addSubsectionToCSection = (csecIdx: number) => {
    const item = formContent.items[csecIdx] as CollectionSection;
    if (!isCSection(item)) return;
    const tmpl = item.instances[0];
    const children = tmpl?.children ? [...tmpl.children] : [];
    const idx = nextIdx(children as any);
    const sub = normalizeSectionItem(
      {
        kind: 'SectionItem',
        idx,
        path: `${item.path}.i1.section_${idx}`,
        label: { fallback: 'New Subsection' },
        required: false,
        hidden: false,
        collapsed: false,
        children: [],
      },
      `${item.path}.i1`
    );
    updateCSectionTemplateChildren(csecIdx, [...children, sub]);
  };

  const updateChildInCSection = (csecIdx: number, childIdx: number, updates: Partial<ContentItem>) => {
    const item = formContent.items[csecIdx] as CollectionSection;
    if (!isCSection(item)) return;
    const tmpl = item.instances[0];
    const children = tmpl?.children ? [...tmpl.children] : [];
    let next: ContentItem = { ...(children[childIdx] as any), ...updates };
    if (isField(next)) next = normalizeFieldItem(next, `${item.path}.i1`);
    if (isSection(next)) next = normalizeSectionItem(next, `${item.path}.i1`);
    if (isCField(next)) next = normalizeCFieldItem(next, `${item.path}.i1`);
    if (isCSection(next)) next = normalizeCSectionItem(next, `${item.path}.i1`);
    children[childIdx] = next;
    updateCSectionTemplateChildren(csecIdx, children);
  };

  const removeChildFromCSection = (csecIdx: number, childIdx: number) => {
    const item = formContent.items[csecIdx] as CollectionSection;
    if (!isCSection(item)) return;
    const tmpl = item.instances[0];
    const children = (tmpl?.children || []).filter((_, i) => i !== childIdx);
    updateCSectionTemplateChildren(csecIdx, children);
  };

  /* ---------- renderers ---------- */

  // UI helpers: always go through normalizeUI to auto-set override and null-out empties
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
                    label: field.label?.fallback ? field.label : { fallback: value },
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
                onChange={(e) => onUpdate({ label: { ...field.label, fallback: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (key)</Label>
              <Input
                value={field.label?.key || ''}
                onChange={(e) => onUpdate({ label: { ...field.label, key: s2n(e.target.value) || undefined } })}
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
            {/* UI Override toggle intentionally hidden: auto-computed */}
          </div>
        </div>
        <Button onClick={onRemove} variant="ghost" size="sm" aria-label="remove-field">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );

  const renderSectionEditor = (section: SectionItem, index: number, depth = 0) => (
    <Card key={section.path} className={`border-l-4 ${depth === 0 ? 'border-l-primary' : 'border-l-muted'} ${depth > 0 ? 'ml-6' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => updateItemAt(index, { collapsed: !section.collapsed })}>
              {section.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <CardTitle className={depth === 0 ? 'text-base' : 'text-sm'}>Section: {section.label?.fallback || section.path}</CardTitle>
            {depth > 0 && <Badge variant="outline" className="text-xs">Nested</Badge>}
          </div>
          <Button onClick={() => removeItemAt(index)} variant="ghost" size="sm" aria-label="remove-section">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>

      {!section.collapsed && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Path</Label>
              <Input value={section.path} onChange={(e) => updateItemAt(index, { path: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (fallback)</Label>
              <Input value={section.label?.fallback || ''} onChange={(e) => updateItemAt(index, { label: { ...section.label, fallback: e.target.value } as any })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Index</Label>
              <Input type="number" value={section.idx} min={1} onChange={(e) => updateItemAt(index, { idx: clampIdx(parseInt(e.target.value)) })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Label (key)</Label>
              <Input value={section.label?.key || ''} onChange={(e) => updateItemAt(index, { label: { ...section.label, key: s2n(e.target.value) || undefined } as any })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (fallback)</Label>
              <Textarea value={section.description?.fallback || ''} onChange={(e) => updateItemAt(index, { description: { ...(section.description || {}), fallback: e.target.value } as any })} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={section.required} onCheckedChange={(v) => updateItemAt(index, { required: v } as any)} />
              <Label className="text-xs">Required</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={section.hidden} onCheckedChange={(v) => updateItemAt(index, { hidden: v } as any)} />
              <Label className="text-xs">Hidden</Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Children</h4>
              <div className="flex gap-2">
                <Button onClick={() => addFieldToSection(index)} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />Add Field
                </Button>
                <Button onClick={() => addSubsectionToSection(index)} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />Add Subsection
                </Button>
              </div>
            </div>

            {section.children.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md p-3">No children yet.</div>
            ) : (
              <div className="space-y-3">
                {section.children.map((child, cIdx) => (
                  <div key={(child as any).path || `${section.path}-${cIdx}`}>
                    {isField(child) && renderFieldEditor(
                      child,
                      (updates) => updateSectionChildAt(index, cIdx, updates),
                      () => removeSectionChild(index, cIdx)
                    )}
                    {isSection(child) && renderSectionEditor(child as SectionItem, index, depth + 1)}
                    {isCField(child) && renderCFieldEditor(
                      child as CollectionFieldItem,
                      (updates) => updateSectionChildAt(index, cIdx, updates),
                      () => removeSectionChild(index, cIdx)
                    )}
                    {isCSection(child) && renderCSectionEditor(
                      child as CollectionSection,
                      (updates) => updateSectionChildAt(index, cIdx, updates),
                      () => removeSectionChild(index, cIdx)
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
              <Select value={item.ref || undefined} onValueChange={(v) => onUpdate({ ref: v, path: item.path || v, label: item.label?.fallback ? item.label : { fallback: v } })}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {availableFields.map(f => <SelectItem key={f.id} value={f.id}>{f.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label (fallback)</Label>
              <Input value={item.label?.fallback || ''} onChange={(e) => onUpdate({ label: { ...item.label, fallback: e.target.value } as any })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min instances</Label>
              <Input type="number" value={item.min_instances} min={1} onChange={(e) => onUpdate({ min_instances: clampIdx(parseInt(e.target.value)) } as any)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max instances</Label>
              <Input type="number" value={item.max_instances} min={item.min_instances || 1} onChange={(e) => onUpdate({ max_instances: clampIdx(parseInt(e.target.value)) } as any)} />
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
            {/* UI Override toggle intentionally hidden: auto-computed */}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Template instance value</Label>
            <Input
              value={item.instances?.[0]?.value ?? ''}
              onChange={(e) => onUpdate({ instances: [{ ...(item.instances?.[0] || { instance_id: 1, path: `${item.path}.i1` }), value: e.target.value }] } as any)}
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
            <Input value={item.label?.fallback || ''} onChange={(e) => onUpdate({ label: { ...item.label, fallback: e.target.value } as any })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min instances</Label>
            <Input type="number" value={item.min_instances} min={1} onChange={(e) => onUpdate({ min_instances: clampIdx(parseInt(e.target.value)) } as any)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max instances</Label>
            <Input type="number" value={item.max_instances} min={item.min_instances || 1} onChange={(e) => onUpdate({ max_instances: clampIdx(parseInt(e.target.value)) } as any)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Template instance children</h4>
            <div className="flex gap-2">
              <Button onClick={() => addFieldToCSection(formContent.items.indexOf(item))} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Field
              </Button>
              <Button onClick={() => addSubsectionToCSection(formContent.items.indexOf(item))} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Subsection
              </Button>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded-md p-3 mt-2">No children yet.</div>
          ) : (
            <div className="space-y-3 mt-2">
              {children.map((child, i) => (
                <div key={(child as any).path || `${item.path}.i1-${i}`}>
                  {isField(child) && renderFieldEditor(
                    child,
                    (updates) => updateChildInCSection(formContent.items.indexOf(item), i, updates),
                    () => removeChildFromCSection(formContent.items.indexOf(item), i)
                  )}
                  {isSection(child) && renderSectionEditor(child as SectionItem, formContent.items.indexOf(item), 1)}
                  {isCField(child) && renderCFieldEditor(
                    child as CollectionFieldItem,
                    (updates) => updateChildInCSection(formContent.items.indexOf(item), i, updates as any),
                    () => removeChildFromCSection(formContent.items.indexOf(item), i)
                  )}
                  {isCSection(child) && renderCSectionEditor(
                    child as CollectionSection,
                    (updates) => updateChildInCSection(formContent.items.indexOf(item), i, updates as any),
                    () => removeChildFromCSection(formContent.items.indexOf(item), i)
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
              return renderSectionEditor(item, index, 0);
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

