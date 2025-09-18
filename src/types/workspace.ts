// Local types for workspace functionality
export interface VideoJob {
  id: string;
  user_id?: string;
  template_key: string;
  status: string;
  watermark: boolean;
  credits_used: number;
  session_id?: string;
  accepted_terms_at?: string;
  accepted_ip_at?: string;
  node_index: any;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceNode {
  id: string;
  job_id: string;
  path: any;
  content: any;
  dependencies: any;
  removable: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  actions: any;
  edit: any;
  node_type: string;
  parent_id?: string | null;
  is_section: boolean;
}