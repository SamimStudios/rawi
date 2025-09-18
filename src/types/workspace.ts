// Local types for workspace functionality
export interface VideoJob {
  id: string;
  user_id?: string;
  template_key?: string;
  status?: string;
  characters?: any;
  props?: any;
  timeline?: any;
  music?: any;
  movie_info?: any;
  user_input?: any;
  user_input_updated_at?: string;
  characters_updated_at?: string;
  props_updated_at?: string;
  timeline_updated_at?: string;
  music_updated_at?: string;
  movie_info_updated_at?: string;
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