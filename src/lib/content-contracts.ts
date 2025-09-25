/**
 * TypeScript interfaces for SSOT content contracts
 * Based on the AI Scenes Node Contracts specification
 */

// Common types
export interface I18nText {
  fallback: string;
  key?: string;
}

export interface RepeatableConfig {
  min?: number;
  max?: number;
  labelSingular?: string;
  labelPlural?: string;
}

// Form Content Contract - Version v2-items
export interface FormContent {
  kind: 'FormContent';
  version: 'v2-items';
  items: FormItem[];
}

export interface BaseFormItem {
  idx: number;
}

export interface FieldItem extends BaseFormItem {
  kind: 'FieldItem';
  ref: string;
  required?: boolean;
  editable?: boolean;
}

export interface SectionItem extends BaseFormItem {
  kind: 'SectionItem';
  path: string;
  label: I18nText;
  description?: I18nText;
  collapsed?: boolean;
  children: FormItem[];
  repeatable?: RepeatableConfig;
}

export type FormItem = FieldItem | SectionItem;

// Media Content Contract
export interface MediaContent {
  kind: 'image' | 'video' | 'audio';
  current_v: number;
  versions: MediaVersion[];
}

export interface MediaVersion {
  v: number;
  images?: MediaItem[];
  videos?: MediaItem[];
  audios?: MediaItem[];
}

export interface MediaItem {
  id: string;
  url: string;
  meta?: Record<string, any>;
  removable?: boolean;
}

// Group Content Contract
export interface GroupContent {
  // Group content is currently just an empty object
}

// Node addressing helpers
export class NodeAddressing {
  /**
   * Create field value address: {nodeAddr}#{fieldRef}.value
   */
  static fieldValue(nodeAddr: string, fieldRef: string): string {
    return `${nodeAddr}#${fieldRef}.value`;
  }

  /**
   * Create section field value address: {nodeAddr}#{sectionPath}.{fieldRef}.value
   */
  static sectionFieldValue(nodeAddr: string, sectionPath: string, fieldRef: string): string {
    return `${nodeAddr}#${sectionPath}.${fieldRef}.value`;
  }

  /**
   * Create instance field value address: {nodeAddr}#{fieldRef}.instances.i{n}.value
   */
  static instanceFieldValue(nodeAddr: string, fieldRef: string, instanceNum: number): string {
    return `${nodeAddr}#${fieldRef}.instances.i${instanceNum}.value`;
  }

  /**
   * Create section instance field value address: {nodeAddr}#{sectionPath}.instances.i{n}.{fieldRef}.value
   */
  static sectionInstanceFieldValue(nodeAddr: string, sectionPath: string, instanceNum: number, fieldRef: string): string {
    return `${nodeAddr}#${sectionPath}.instances.i${instanceNum}.${fieldRef}.value`;
  }
}

// Content validation helpers
export class ContentValidation {
  static isFormContent(content: any): content is FormContent {
    return content &&
           content.kind === 'FormContent' &&
           content.version === 'v2-items' &&
           Array.isArray(content.items);
  }

  static isFieldItem(item: any): item is FieldItem {
    return item &&
           item.kind === 'FieldItem' &&
           typeof item.ref === 'string' &&
           typeof item.idx === 'number';
  }

  static isSectionItem(item: any): item is SectionItem {
    return item &&
           item.kind === 'SectionItem' &&
           typeof item.path === 'string' &&
           typeof item.idx === 'number' &&
           item.label &&
           Array.isArray(item.children);
  }

  static isMediaContent(content: any): content is MediaContent {
    return content &&
           ['image', 'video', 'audio'].includes(content.kind) &&
           typeof content.current_v === 'number' &&
           Array.isArray(content.versions);
  }
}