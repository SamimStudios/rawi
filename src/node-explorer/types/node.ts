export interface Node {
  id: string;
  job_id: string;
  node_type: 'group' | 'form' | 'media';
  path: string;
  parent_id: string | null;
  is_section: boolean;
  content: GroupContent | FormContent | MediaContent;
  edit: Record<string, any>;
  actions: Record<string, any>;
  dependencies: any[];
  version: number;
  updated_at: string;
  created_at?: string;
  removable?: boolean;
}

export interface GroupContent {
  [key: string]: any;
}

export interface FormContent {
  groups: FormGroup[];
  items: FormItem[];
}

export interface FormGroup {
  group_name: string;
  title?: {
    fallback: string;
    key?: string;
  };
  layout?: 'section' | 'accordion' | 'tab' | 'inline';
  importance?: 'low' | 'normal' | 'high';
  repeatable?: {
    min?: number;
    max?: number;
    labelSingular?: string;
    labelPlural?: string;
  };
}

export interface FormItem {
  ref: string;
  required: boolean;
  parent?: {
    group_name: string;
  };
}

export interface MediaContent {
  kind: 'image' | 'video' | 'audio';
  current_v: number;
  versions: MediaVersion[];
}

export interface MediaVersion {
  v: number;
  images?: MediaAsset[];
  videos?: MediaAsset[];
  audios?: MediaAsset[];
}

export interface MediaAsset {
  url: string;
  meta?: {
    width?: number;
    height?: number;
    mime?: string;
    duration?: number;
    size?: number;
  };
}

export interface NodeResponse {
  node: Node;
  ancestors?: Node[];
  children?: Node[];
  descendants?: Node[];
  meta: {
    job_id: string;
    etag: string;
    count: number;
  };
}

export interface FieldRegistryItem {
  id: string;
  field_id: string;
  datatype: string;
  widget: string;
  options?: any;
  rules: any;
  ui: {
    label?: {
      fallback: string;
      key?: string;
    };
    placeholder?: {
      fallback: string;
      key?: string;
    };
    help?: {
      fallback: string;
      key?: string;
    };
  };
  default_value?: any;
  version: number;
}

export interface BreadcrumbItem {
  id: string;
  path: string;
  node_type: string;
  title?: string;
}