export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      credit_packages: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          id: string
          name: string
          price_aed: number
          price_sar: number
          price_usd: number
          stripe_price_id_aed: string | null
          stripe_price_id_sar: string | null
          stripe_price_id_usd: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          id?: string
          name: string
          price_aed: number
          price_sar: number
          price_usd: number
          stripe_price_id_aed?: string | null
          stripe_price_id_sar?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          id?: string
          name?: string
          price_aed?: number
          price_sar?: number
          price_usd?: number
          stripe_price_id_aed?: string | null
          stripe_price_id_sar?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fal_requests: {
        Row: {
          attempts: number
          cancel_url: string | null
          completed_at: string | null
          error: Json | null
          final_output_url: string | null
          id: string
          job_type: string | null
          last_http_status: number | null
          logs: Json | null
          metrics: Json | null
          output: Json | null
          poll_ms: number | null
          provider: string
          queue_position: number | null
          response_url: string | null
          source_note: string | null
          source_row_id: string | null
          source_table: string | null
          started_at: string
          status: string | null
          status_url: string
          terminal_statuses: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          cancel_url?: string | null
          completed_at?: string | null
          error?: Json | null
          final_output_url?: string | null
          id: string
          job_type?: string | null
          last_http_status?: number | null
          logs?: Json | null
          metrics?: Json | null
          output?: Json | null
          poll_ms?: number | null
          provider?: string
          queue_position?: number | null
          response_url?: string | null
          source_note?: string | null
          source_row_id?: string | null
          source_table?: string | null
          started_at?: string
          status?: string | null
          status_url: string
          terminal_statuses?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          cancel_url?: string | null
          completed_at?: string | null
          error?: Json | null
          final_output_url?: string | null
          id?: string
          job_type?: string | null
          last_http_status?: number | null
          logs?: Json | null
          metrics?: Json | null
          output?: Json | null
          poll_ms?: number | null
          provider?: string
          queue_position?: number | null
          response_url?: string | null
          source_note?: string | null
          source_row_id?: string | null
          source_table?: string | null
          started_at?: string
          status?: string | null
          status_url?: string
          terminal_statuses?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_number: string
          pdf_url: string | null
          status: string
          stripe_invoice_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          invoice_number: string
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          pdf_url?: string | null
          status?: string
          stripe_invoice_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          conditions: Json | null
          created_at: string
          credits_amount: number
          description: string | null
          id: string
          name: string
          reward_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          conditions?: Json | null
          created_at?: string
          credits_amount: number
          description?: string | null
          id?: string
          name: string
          reward_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          conditions?: Json | null
          created_at?: string
          credits_amount?: number
          description?: string | null
          id?: string
          name?: string
          reward_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          credits_per_week: number
          id: string
          name: string
          price_aed: number
          price_sar: number
          price_usd: number
          stripe_price_id_aed: string | null
          stripe_price_id_sar: string | null
          stripe_price_id_usd: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits_per_week: number
          id?: string
          name: string
          price_aed: number
          price_sar: number
          price_usd: number
          stripe_price_id_aed?: string | null
          stripe_price_id_sar?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits_per_week?: number
          id?: string
          name?: string
          price_aed?: number
          price_sar?: number
          price_usd?: number
          stripe_price_id_aed?: string | null
          stripe_price_id_sar?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          structure: string | null
          template: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          structure?: string | null
          template: Json
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          structure?: string | null
          template?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_paid: number | null
          created_at: string
          credits_amount: number
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          credits_amount: number
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          credits_amount?: number
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      field_registry: {
        Row: {
          created_at: string | null
          datatype: Database["public"]["Enums"]["field_datatype"] | null
          default_value: Json | null
          id: string | null
          options: Json | null
          rules: Json | null
          ui: Json | null
          updated_at: string | null
          version: number | null
          widget: Database["public"]["Enums"]["field_widget"] | null
        }
        Insert: {
          created_at?: string | null
          datatype?: Database["public"]["Enums"]["field_datatype"] | null
          default_value?: Json | null
          id?: string | null
          options?: Json | null
          rules?: Json | null
          ui?: Json | null
          updated_at?: string | null
          version?: number | null
          widget?: Database["public"]["Enums"]["field_widget"] | null
        }
        Update: {
          created_at?: string | null
          datatype?: Database["public"]["Enums"]["field_datatype"] | null
          default_value?: Json | null
          id?: string | null
          options?: Json | null
          rules?: Json | null
          ui?: Json | null
          updated_at?: string | null
          version?: number | null
          widget?: Database["public"]["Enums"]["field_widget"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      _ltree_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      _ltree_gist_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      add_credits: {
        Args: {
          p_amount_paid?: number
          p_credits: number
          p_currency?: string
          p_description?: string
          p_stripe_session_id?: string
          p_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      add_updated_at_trigger: {
        Args: { p_schema: string; p_table: string }
        Returns: undefined
      }
      addr_write_many: {
        Args: { p_job_id: string; p_writes: Json }
        Returns: Json
      }
      api_job_get: {
        Args: { p_job_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_limit?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      cleanup_old_guest_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      consume_credits: {
        Args: { p_credits: number; p_description?: string; p_user_id: string }
        Returns: boolean
      }
      export_db_catalog: {
        Args: { p_schemas?: string[] }
        Returns: Json
      }
      flatten_section_items: {
        Args: { p: Json }
        Returns: Json[]
      }
      form_default_required_false: {
        Args: { j: Json }
        Returns: Json
      }
      form_plain_to_lquery: {
        Args: { p: string }
        Returns: unknown
      }
      generate_guest_session_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_token: {
        Args: { length_bytes?: number }
        Returns: string
      }
      get_field_contracts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_form_node: {
        Args: { p_job_id: string; p_path: unknown } | { p_node_id: string }
        Returns: Json
      }
      get_function_pricing: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          price_in_credits: number
        }[]
      }
      get_n8n_function_id: {
        Args: { id_or_name: string }
        Returns: string
      }
      get_node_content: {
        Args: { p_node_id: string }
        Returns: Json
      }
      hash_ltree: {
        Args: { "": unknown }
        Returns: number
      }
      in_enum: {
        Args: { etype: unknown; val: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_i18n_text: {
        Args: { p: Json }
        Returns: boolean
      }
      is_ltree_slug: {
        Args: { p: string }
        Returns: boolean
      }
      is_nonempty_text: {
        Args: { p: string }
        Returns: boolean
      }
      is_repeatable_config: {
        Args: { p: Json }
        Returns: boolean
      }
      is_selector_object: {
        Args: { j: Json }
        Returns: boolean
      }
      is_string_array_of_slugs: {
        Args: { p: Json }
        Returns: boolean
      }
      is_uuid: {
        Args: { p: string }
        Returns: boolean
      }
      is_valid_asset_item: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_audio_item: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_content_shape: {
        Args: { content: Json; node_type: string }
        Returns: boolean
      }
      is_valid_expected_payload_strict: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_field_default_strict: {
        Args:
          | {
              p_datatype: Database["public"]["Enums"]["field_datatype"]
              p_default: Json
              p_options: Json
              p_widget: Database["public"]["Enums"]["field_widget"]
            }
          | {
              p_datatype: Database["public"]["Enums"]["field_datatype"]
              p_default: Json
              p_options: Json
              p_widget: string
            }
          | {
              p_datatype: string
              p_default: Json
              p_options: Json
              p_widget: string
            }
        Returns: boolean
      }
      is_valid_field_item_strict: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_field_options: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_field_options_strict: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_field_rules_strict: {
        Args:
          | {
              p: Json
              p_datatype: Database["public"]["Enums"]["field_datatype"]
            }
          | { p: Json; p_datatype: string }
        Returns: boolean
      }
      is_valid_field_ui_strict: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_form_content: {
        Args: { content: Json }
        Returns: boolean
      }
      is_valid_image_item: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_media_content: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_node_actions_strict: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_node_dependencies: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_node_edit_strict: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_node_link: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_node_path_selector: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_node_type: {
        Args: { p: string }
        Returns: boolean
      }
      is_valid_path_text: {
        Args: { p: string }
        Returns: boolean
      }
      is_valid_payload_node_recursive: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_rules: {
        Args:
          | {
              p: Json
              p_datatype: Database["public"]["Enums"]["field_datatype"]
            }
          | { p: Json; p_datatype: string }
        Returns: boolean
      }
      is_valid_selector_strict: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_ui: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_video_item: {
        Args: { j: Json }
        Returns: boolean
      }
      jsonb_strip_key_recursive: {
        Args: { kill_key: string; p: Json }
        Returns: Json
      }
      lca: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      link_guest_jobs_to_user: {
        Args: { p_email: string } | { p_email: string; p_session_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      lquery_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_send: {
        Args: { "": unknown }
        Returns: string
      }
      ltree_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_gist_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_gist_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      ltree_gist_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_send: {
        Args: { "": unknown }
        Returns: string
      }
      ltree2text: {
        Args: { "": unknown }
        Returns: string
      }
      ltxtq_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_send: {
        Args: { "": unknown }
        Returns: string
      }
      make_media_path: {
        Args: {
          p_ext: string
          p_item_id: string
          p_job: string
          p_kind: string
          p_node: string
          p_v: number
        }
        Returns: string
      }
      nlevel: {
        Args: { "": unknown }
        Returns: number
      }
      nodes_form_get: {
        Args: { p_job_id: string; p_node_path: unknown; p_q: unknown }
        Returns: {
          path: string
          path_i: string
          path_ltree: unknown
          ref: string
          value: Json
        }[]
      }
      nodes_form_get_text: {
        Args: { p_job_id: string; p_node_path: unknown; p_plain: string }
        Returns: {
          path: string
          path_i: string
          path_ltree: unknown
          ref: string
          value: Json
        }[]
      }
      nodes_form_items: {
        Args: { p_job_id: string; p_node_path: unknown }
        Returns: {
          editable: boolean
          importance: string
          item_instance_id: number
          path: string
          path_i: string
          path_ltree: unknown
          ref: string
          required: boolean
          value: Json
        }[]
      }
      nodes_form_items_scan: {
        Args: { p_content: Json }
        Returns: {
          editable: boolean
          importance: string
          item_instance_id: number
          path: string
          path_i: string
          path_ltree: unknown
          ref: string
          required: boolean
          value: Json
        }[]
      }
      nodes_form_normalize_content_v3: {
        Args: { p_content: Json }
        Returns: Json
      }
      nodes_normalize_field_item_v3: {
        Args: {
          p: Json
          p_idx: number
          p_item_instance_id: number
          p_ref: string
          p_sec_path: string
          p_sec_path_i: string
        }
        Returns: Json
      }
      nodes_normalize_section_v3: {
        Args: {
          p: Json
          p_idx: number
          p_parent_path: string
          p_parent_pi: string
        }
        Returns: Json
      }
      nodes_rpc_normalize_by_path_v3: {
        Args: { p_job_id: string; p_path: unknown }
        Returns: Json
      }
      normalize_field_item: {
        Args: { p: Json; p_idx: number } | { p: Json; p_idx: number }
        Returns: Json
      }
      normalize_form_content: {
        Args: { p: Json }
        Returns: Json
      }
      normalize_section: {
        Args: { p: Json; p_idx: number } | { p: Json; p_idx: number }
        Returns: Json
      }
      nullif_blank: {
        Args: { p: string }
        Returns: string
      }
      path_i_to_ltree: {
        Args: { p: string }
        Returns: unknown
      }
      refresh_job_node_index: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      safe_refresh_job_node_index: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      sanitize_json_input: {
        Args: { input_json: Json }
        Returns: Json
      }
      set_character_description: {
        Args: { p_desc: Json; p_id: string; p_role: string }
        Returns: undefined
      }
      set_character_portrait_url: {
        Args: { p_id: string; p_role: string; p_url: string }
        Returns: undefined
      }
      slugify_ident: {
        Args: { p: string }
        Returns: string
      }
      text2ltree: {
        Args: { "": string }
        Returns: unknown
      }
      validate_characters_payload: {
        Args: { doc: Json }
        Returns: boolean
      }
      validate_json_structure: {
        Args: { input_json: Json; required_fields: string[] }
        Returns: boolean
      }
      validate_session_token: {
        Args: { p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      array_item_type:
        | "string"
        | "number"
        | "boolean"
        | "uuid"
        | "url"
        | "date"
        | "datetime"
        | "object"
      field_datatype:
        | "string"
        | "number"
        | "boolean"
        | "array"
        | "object"
        | "uuid"
        | "url"
        | "date"
        | "datetime"
      field_widget:
        | "text"
        | "textarea"
        | "select"
        | "radio"
        | "checkbox"
        | "tags"
        | "group"
        | "date"
        | "datetime"
        | "url"
        | "color"
        | "file"
      group_layout: "section" | "accordion" | "tab" | "inline"
      http_method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
      importance_level: "low" | "normal" | "high"
      media_kind: "image" | "video" | "audio"
      options_source: "static" | "endpoint" | "table"
      order_dir: "asc" | "desc"
      string_format:
        | "none"
        | "email"
        | "phone"
        | "color"
        | "slug"
        | "uri"
        | "url"
      table_where_op:
        | "eq"
        | "neq"
        | "gt"
        | "gte"
        | "lt"
        | "lte"
        | "like"
        | "ilike"
        | "in"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      array_item_type: [
        "string",
        "number",
        "boolean",
        "uuid",
        "url",
        "date",
        "datetime",
        "object",
      ],
      field_datatype: [
        "string",
        "number",
        "boolean",
        "array",
        "object",
        "uuid",
        "url",
        "date",
        "datetime",
      ],
      field_widget: [
        "text",
        "textarea",
        "select",
        "radio",
        "checkbox",
        "tags",
        "group",
        "date",
        "datetime",
        "url",
        "color",
        "file",
      ],
      group_layout: ["section", "accordion", "tab", "inline"],
      http_method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      importance_level: ["low", "normal", "high"],
      media_kind: ["image", "video", "audio"],
      options_source: ["static", "endpoint", "table"],
      order_dir: ["asc", "desc"],
      string_format: ["none", "email", "phone", "color", "slug", "uri", "url"],
      table_where_op: [
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "like",
        "ilike",
        "in",
      ],
    },
  },
} as const
