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
      cards: {
        Row: {
          after_shot: number | null
          created_at: string
          duration: number | null
          id: string
          job_id: string | null
          text_1: string | null
          text_2: string | null
          text_3: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          after_shot?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          job_id?: string | null
          text_1?: string | null
          text_2?: string | null
          text_3?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          after_shot?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          job_id?: string | null
          text_1?: string | null
          text_2?: string | null
          text_3?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      character_gen: {
        Row: {
          age_range: string | null
          cancel_url: string | null
          clothes: string | null
          created_at: string
          description: string | null
          distinct_trait: string | null
          error: Json | null
          ethnicity: string | null
          face_features: string | null
          face_ref: string | null
          gender: string | null
          head: string | null
          id: string
          job_id: string | null
          logs: Json | null
          metrics: Json | null
          name: string | null
          output: Json | null
          path: string | null
          personality: string | null
          portrait_cues: string | null
          prompt: string | null
          public_url: string | null
          queue_position: number | null
          request_id: string | null
          response_url: string | null
          skin_tone: string | null
          status: string | null
          status_url: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          age_range?: string | null
          cancel_url?: string | null
          clothes?: string | null
          created_at?: string
          description?: string | null
          distinct_trait?: string | null
          error?: Json | null
          ethnicity?: string | null
          face_features?: string | null
          face_ref?: string | null
          gender?: string | null
          head?: string | null
          id?: string
          job_id?: string | null
          logs?: Json | null
          metrics?: Json | null
          name?: string | null
          output?: Json | null
          path?: string | null
          personality?: string | null
          portrait_cues?: string | null
          prompt?: string | null
          public_url?: string | null
          queue_position?: number | null
          request_id?: string | null
          response_url?: string | null
          skin_tone?: string | null
          status?: string | null
          status_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          age_range?: string | null
          cancel_url?: string | null
          clothes?: string | null
          created_at?: string
          description?: string | null
          distinct_trait?: string | null
          error?: Json | null
          ethnicity?: string | null
          face_features?: string | null
          face_ref?: string | null
          gender?: string | null
          head?: string | null
          id?: string
          job_id?: string | null
          logs?: Json | null
          metrics?: Json | null
          name?: string | null
          output?: Json | null
          path?: string | null
          personality?: string | null
          portrait_cues?: string | null
          prompt?: string | null
          public_url?: string | null
          queue_position?: number | null
          request_id?: string | null
          response_url?: string | null
          skin_tone?: string | null
          status?: string | null
          status_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_gen_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      functions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          expected_payload: Json | null
          id: string
          name: string
          price: number
          production_webhook: string | null
          test_webhook: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          expected_payload?: Json | null
          id?: string
          name: string
          price?: number
          production_webhook?: string | null
          test_webhook?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          expected_payload?: Json | null
          id?: string
          name?: string
          price?: number
          production_webhook?: string | null
          test_webhook?: string | null
          type?: string
          updated_at?: string
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
      shot_gen: {
        Row: {
          action: string | null
          audio_cancel_url: string | null
          audio_error: Json | null
          audio_logs: Json | null
          audio_metrics: Json | null
          audio_output: Json | null
          audio_path: string | null
          audio_public_url: string | null
          audio_queue_position: number | null
          audio_request_id: string | null
          audio_response_url: string | null
          audio_status: string | null
          audio_status_url: string | null
          broll: boolean | null
          camera_movement: string | null
          camera_start: string | null
          composition: string | null
          created_at: string
          dialogue_line: string | null
          dialogue_planned: boolean | null
          duration: number | null
          environment: string | null
          id: string
          image_cancel_url: string | null
          image_error: Json | null
          image_logs: Json | null
          image_metrics: Json | null
          image_output: Json | null
          image_path: string | null
          image_prompt: string | null
          image_public_url: string | null
          image_queue_position: number | null
          image_request_id: string | null
          image_response_url: string | null
          image_status: string | null
          image_status_url: string | null
          in_focus: string | null
          job_id: string
          layout: Json | null
          location: string | null
          mood: string | null
          music_cue: string | null
          notes: string | null
          out_of_focus: string | null
          props: Json | null
          role: string | null
          shot_idx: number
          time: string | null
          updated_at: string | null
          video_cancel_url: string | null
          video_error: Json | null
          video_logs: Json | null
          video_metrics: Json | null
          video_output: Json | null
          video_path: string | null
          video_payload: Json | null
          video_public_url: string | null
          video_queue_position: number | null
          video_request_id: string | null
          video_response_url: string | null
          video_status: string | null
          video_status_url: string | null
          vo_path: string | null
          vo_public_url: string | null
          voiceover_line: string | null
          voiceover_planned: boolean | null
        }
        Insert: {
          action?: string | null
          audio_cancel_url?: string | null
          audio_error?: Json | null
          audio_logs?: Json | null
          audio_metrics?: Json | null
          audio_output?: Json | null
          audio_path?: string | null
          audio_public_url?: string | null
          audio_queue_position?: number | null
          audio_request_id?: string | null
          audio_response_url?: string | null
          audio_status?: string | null
          audio_status_url?: string | null
          broll?: boolean | null
          camera_movement?: string | null
          camera_start?: string | null
          composition?: string | null
          created_at?: string
          dialogue_line?: string | null
          dialogue_planned?: boolean | null
          duration?: number | null
          environment?: string | null
          id?: string
          image_cancel_url?: string | null
          image_error?: Json | null
          image_logs?: Json | null
          image_metrics?: Json | null
          image_output?: Json | null
          image_path?: string | null
          image_prompt?: string | null
          image_public_url?: string | null
          image_queue_position?: number | null
          image_request_id?: string | null
          image_response_url?: string | null
          image_status?: string | null
          image_status_url?: string | null
          in_focus?: string | null
          job_id: string
          layout?: Json | null
          location?: string | null
          mood?: string | null
          music_cue?: string | null
          notes?: string | null
          out_of_focus?: string | null
          props?: Json | null
          role?: string | null
          shot_idx: number
          time?: string | null
          updated_at?: string | null
          video_cancel_url?: string | null
          video_error?: Json | null
          video_logs?: Json | null
          video_metrics?: Json | null
          video_output?: Json | null
          video_path?: string | null
          video_payload?: Json | null
          video_public_url?: string | null
          video_queue_position?: number | null
          video_request_id?: string | null
          video_response_url?: string | null
          video_status?: string | null
          video_status_url?: string | null
          vo_path?: string | null
          vo_public_url?: string | null
          voiceover_line?: string | null
          voiceover_planned?: boolean | null
        }
        Update: {
          action?: string | null
          audio_cancel_url?: string | null
          audio_error?: Json | null
          audio_logs?: Json | null
          audio_metrics?: Json | null
          audio_output?: Json | null
          audio_path?: string | null
          audio_public_url?: string | null
          audio_queue_position?: number | null
          audio_request_id?: string | null
          audio_response_url?: string | null
          audio_status?: string | null
          audio_status_url?: string | null
          broll?: boolean | null
          camera_movement?: string | null
          camera_start?: string | null
          composition?: string | null
          created_at?: string
          dialogue_line?: string | null
          dialogue_planned?: boolean | null
          duration?: number | null
          environment?: string | null
          id?: string
          image_cancel_url?: string | null
          image_error?: Json | null
          image_logs?: Json | null
          image_metrics?: Json | null
          image_output?: Json | null
          image_path?: string | null
          image_prompt?: string | null
          image_public_url?: string | null
          image_queue_position?: number | null
          image_request_id?: string | null
          image_response_url?: string | null
          image_status?: string | null
          image_status_url?: string | null
          in_focus?: string | null
          job_id?: string
          layout?: Json | null
          location?: string | null
          mood?: string | null
          music_cue?: string | null
          notes?: string | null
          out_of_focus?: string | null
          props?: Json | null
          role?: string | null
          shot_idx?: number
          time?: string | null
          updated_at?: string | null
          video_cancel_url?: string | null
          video_error?: Json | null
          video_logs?: Json | null
          video_metrics?: Json | null
          video_output?: Json | null
          video_path?: string | null
          video_payload?: Json | null
          video_public_url?: string | null
          video_queue_position?: number | null
          video_request_id?: string | null
          video_response_url?: string | null
          video_status?: string | null
          video_status_url?: string | null
          vo_path?: string | null
          vo_public_url?: string | null
          voiceover_line?: string | null
          voiceover_planned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shot_gen_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      storyboard_jobs: {
        Row: {
          created_at: string
          function_id: string
          id: string
          n8n_response: Json | null
          n8n_webhook_sent: boolean
          result_data: Json | null
          session_id: string | null
          stage: string
          status: string
          updated_at: string
          user_id: string | null
          user_input: Json
        }
        Insert: {
          created_at?: string
          function_id: string
          id?: string
          n8n_response?: Json | null
          n8n_webhook_sent?: boolean
          result_data?: Json | null
          session_id?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          user_input?: Json
        }
        Update: {
          created_at?: string
          function_id?: string
          id?: string
          n8n_response?: Json | null
          n8n_webhook_sent?: boolean
          result_data?: Json | null
          session_id?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          user_input?: Json
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
      [_ in never]: never
    }
    Functions: {
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
      cleanup_old_guest_jobs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      consume_credits: {
        Args: { p_credits: number; p_description?: string; p_user_id: string }
        Returns: boolean
      }
      generate_guest_session_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      link_guest_jobs_to_user: {
        Args: { p_email: string } | { p_email: string; p_session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
