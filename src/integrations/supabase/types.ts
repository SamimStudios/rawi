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
        }
        Relationships: []
      }
      field_registry: {
        Row: {
          created_at: string
          datatype: Database["public"]["Enums"]["field_datatype"]
          default_value: Json | null
          field_id: string
          id: string
          options: Json | null
          rules: Json
          ui: Json
          updated_at: string
          version: number
          widget: Database["public"]["Enums"]["field_widget"]
        }
        Insert: {
          created_at?: string
          datatype: Database["public"]["Enums"]["field_datatype"]
          default_value?: Json | null
          field_id: string
          id?: string
          options?: Json | null
          rules?: Json
          ui?: Json
          updated_at?: string
          version?: number
          widget: Database["public"]["Enums"]["field_widget"]
        }
        Update: {
          created_at?: string
          datatype?: Database["public"]["Enums"]["field_datatype"]
          default_value?: Json | null
          field_id?: string
          id?: string
          options?: Json | null
          rules?: Json
          ui?: Json
          updated_at?: string
          version?: number
          widget?: Database["public"]["Enums"]["field_widget"]
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
      jobs: {
        Row: {
          accent: string | null
          cards: Json | null
          characters: Json | null
          created_at: string
          email: string | null
          face_image_url: string | null
          gender: string | null
          genres: string | null
          id: string
          input_data: Json
          internal_stage: number | null
          language: string | null
          look: string | null
          movie_logline: string | null
          movie_title: string | null
          music_path: string | null
          music_prefs: Json | null
          music_public_url: string | null
          name: string | null
          progress: string | null
          props: Json | null
          result_data: Json | null
          session_id: string | null
          shots: Json | null
          stage: number | null
          template: string | null
          type: string
          updated_at: string
          user_id: string | null
          world: string | null
        }
        Insert: {
          accent?: string | null
          cards?: Json | null
          characters?: Json | null
          created_at?: string
          email?: string | null
          face_image_url?: string | null
          gender?: string | null
          genres?: string | null
          id?: string
          input_data: Json
          internal_stage?: number | null
          language?: string | null
          look?: string | null
          movie_logline?: string | null
          movie_title?: string | null
          music_path?: string | null
          music_prefs?: Json | null
          music_public_url?: string | null
          name?: string | null
          progress?: string | null
          props?: Json | null
          result_data?: Json | null
          session_id?: string | null
          shots?: Json | null
          stage?: number | null
          template?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          world?: string | null
        }
        Update: {
          accent?: string | null
          cards?: Json | null
          characters?: Json | null
          created_at?: string
          email?: string | null
          face_image_url?: string | null
          gender?: string | null
          genres?: string | null
          id?: string
          input_data?: Json
          internal_stage?: number | null
          language?: string | null
          look?: string | null
          movie_logline?: string | null
          movie_title?: string | null
          music_path?: string | null
          music_prefs?: Json | null
          music_public_url?: string | null
          name?: string | null
          progress?: string | null
          props?: Json | null
          result_data?: Json | null
          session_id?: string | null
          shots?: Json | null
          stage?: number | null
          template?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          world?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_template_fkey"
            columns: ["template"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_functions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          expected_payload: Json | null
          expected_schema: Json | null
          id: string
          name: string
          price: number
          production_webhook: string | null
          success_response_schema: Json | null
          test_webhook: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          expected_payload?: Json | null
          expected_schema?: Json | null
          id?: string
          name: string
          price?: number
          production_webhook?: string | null
          success_response_schema?: Json | null
          test_webhook?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          expected_payload?: Json | null
          expected_schema?: Json | null
          id?: string
          name?: string
          price?: number
          production_webhook?: string | null
          success_response_schema?: Json | null
          test_webhook?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      node_definitions: {
        Row: {
          actions_template: Json
          active: boolean
          content_template: Json
          created_at: string
          def_key: string
          dependencies_template: Json
          description: string | null
          edit_template: Json
          id: string
          is_section: boolean
          node_type: string
          parent_path_template: string | null
          path_template: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          actions_template?: Json
          active?: boolean
          content_template?: Json
          created_at?: string
          def_key: string
          dependencies_template?: Json
          description?: string | null
          edit_template?: Json
          id?: string
          is_section?: boolean
          node_type: string
          parent_path_template?: string | null
          path_template: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          actions_template?: Json
          active?: boolean
          content_template?: Json
          created_at?: string
          def_key?: string
          dependencies_template?: Json
          description?: string | null
          edit_template?: Json
          id?: string
          is_section?: boolean
          node_type?: string
          parent_path_template?: string | null
          path_template?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
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
      story_nodes: {
        Row: {
          content: Json
          created_at: string
          editable: boolean | null
          id: string
          needs_validation: boolean | null
          parent_id: string | null
          path: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          editable?: boolean | null
          id?: string
          needs_validation?: boolean | null
          parent_id?: string | null
          path: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          editable?: boolean | null
          id?: string
          needs_validation?: boolean | null
          parent_id?: string | null
          path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_jobs: {
        Row: {
          characters: Json | null
          characters_updated_at: string | null
          created_at: string
          id: string
          movie_info: Json | null
          movie_info_updated_at: string | null
          music: Json | null
          music_updated_at: string | null
          props: Json | null
          props_updated_at: string | null
          session_id: string | null
          timeline: Json | null
          timeline_updated_at: string | null
          updated_at: string
          user_id: string | null
          user_input: Json | null
          user_input_updated_at: string
        }
        Insert: {
          characters?: Json | null
          characters_updated_at?: string | null
          created_at?: string
          id?: string
          movie_info?: Json | null
          movie_info_updated_at?: string | null
          music?: Json | null
          music_updated_at?: string | null
          props?: Json | null
          props_updated_at?: string | null
          session_id?: string | null
          timeline?: Json | null
          timeline_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          user_input?: Json | null
          user_input_updated_at?: string
        }
        Update: {
          characters?: Json | null
          characters_updated_at?: string | null
          created_at?: string
          id?: string
          movie_info?: Json | null
          movie_info_updated_at?: string | null
          music?: Json | null
          music_updated_at?: string | null
          props?: Json | null
          props_updated_at?: string | null
          session_id?: string | null
          timeline?: Json | null
          timeline_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          user_input?: Json | null
          user_input_updated_at?: string
        }
        Relationships: []
      }
      storyboard_nodes: {
        Row: {
          actions: Json
          content: Json
          created_at: string
          dependencies: Json
          edit: Json
          id: string
          is_section: boolean
          job_id: string
          node_type: string
          parent_id: string | null
          path: unknown
          removable: boolean
          updated_at: string
          version: number
        }
        Insert: {
          actions?: Json
          content?: Json
          created_at?: string
          dependencies?: Json
          edit?: Json
          id?: string
          is_section?: boolean
          job_id: string
          node_type: string
          parent_id?: string | null
          path: unknown
          removable?: boolean
          updated_at?: string
          version?: number
        }
        Update: {
          actions?: Json
          content?: Json
          created_at?: string
          dependencies?: Json
          edit?: Json
          id?: string
          is_section?: boolean
          job_id?: string
          node_type?: string
          parent_id?: string | null
          path?: unknown
          removable?: boolean
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "storyboard_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_forms_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "storyboard_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "storyboard_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_forms_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_sections"
            referencedColumns: ["id"]
          },
        ]
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
      v_storyboard_forms_normalized: {
        Row: {
          actions: Json | null
          content: Json | null
          dependencies: Json | null
          edit: Json | null
          id: string | null
          job_id: string | null
          parent_id: string | null
          path: unknown | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actions?: Json | null
          content?: never
          dependencies?: Json | null
          edit?: Json | null
          id?: string | null
          job_id?: string | null
          parent_id?: string | null
          path?: unknown | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actions?: Json | null
          content?: never
          dependencies?: Json | null
          edit?: Json | null
          id?: string | null
          job_id?: string | null
          parent_id?: string | null
          path?: unknown | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "storyboard_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_forms_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_storyboard_nodes_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "storyboard_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "storyboard_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_forms_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storyboard_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_storyboard_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      v_storyboard_sections: {
        Row: {
          id: string | null
          job_id: string | null
          n_forms: number | null
          n_groups: number | null
          n_media: number | null
          path: unknown | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          job_id?: string | null
          n_forms?: never
          n_groups?: never
          n_media?: never
          path?: unknown | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          job_id?: string | null
          n_forms?: never
          n_groups?: never
          n_media?: never
          path?: unknown | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storyboard_nodes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "storyboard_jobs"
            referencedColumns: ["id"]
          },
        ]
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
      form_default_required_false: {
        Args: { j: Json }
        Returns: Json
      }
      generate_guest_session_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_n8n_function_id: {
        Args: { id_or_name: string }
        Returns: string
      }
      hash_ltree: {
        Args: { "": unknown }
        Returns: number
      }
      in_enum: {
        Args: { etype: unknown; val: string }
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
      is_valid_field_group: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_field_groups: {
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_field_item: {
        Args: { j: Json }
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
        Args: { p: Json }
        Returns: boolean
      }
      is_valid_image_item: {
        Args: { j: Json }
        Returns: boolean
      }
      is_valid_items_with_groups: {
        Args: { groups: Json; items: Json }
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
      lca: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      link_guest_jobs_to_user: {
        Args: { p_email: string } | { p_email: string; p_session_id: string }
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
      set_character_description: {
        Args: { p_desc: Json; p_id: string; p_role: string }
        Returns: undefined
      }
      set_character_portrait_url: {
        Args: { p_id: string; p_role: string; p_url: string }
        Returns: undefined
      }
      text2ltree: {
        Args: { "": string }
        Returns: unknown
      }
      validate_characters_payload: {
        Args: { doc: Json }
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
