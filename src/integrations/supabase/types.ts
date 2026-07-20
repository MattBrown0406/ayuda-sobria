export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      coaching_orders: {
        Row: {
          amount: number;
          captured_at: string | null;
          created_at: string;
          customer_email: string | null;
          customer_name: string | null;
          id: string;
          paypal_order_id: string;
          session_type: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          captured_at?: string | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          id?: string;
          paypal_order_id: string;
          session_type: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          captured_at?: string | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string | null;
          id?: string;
          paypal_order_id?: string;
          session_type?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      meeting_registrations: {
        Row: {
          auto_register: boolean;
          confirmation_email_error: string | null;
          confirmation_email_sent_at: string | null;
          confirmation_email_status: string;
          consent_confidentiality: boolean;
          consent_updates: boolean;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          location: string | null;
          occurrence_id: string | null;
          phone: string | null;
          preferred_contact_date: string | null;
          preferred_contact_time: string | null;
          preferred_timezone: string | null;
          relationship: string | null;
          reminder_claimed_at: string | null;
          reminder_error: string | null;
          reminder_sent_at: string | null;
          request_follow_up: boolean;
          situation: string | null;
          submitted_question: string | null;
          updated_at: string;
          zoom_failure_reason: string | null;
          zoom_join_url: string | null;
          zoom_registrant_id: string | null;
          zoom_registration_status: string;
        };
        Insert: {
          auto_register?: boolean;
          confirmation_email_error?: string | null;
          confirmation_email_sent_at?: string | null;
          confirmation_email_status?: string;
          consent_confidentiality?: boolean;
          consent_updates?: boolean;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          location?: string | null;
          occurrence_id?: string | null;
          phone?: string | null;
          preferred_contact_date?: string | null;
          preferred_contact_time?: string | null;
          preferred_timezone?: string | null;
          relationship?: string | null;
          reminder_claimed_at?: string | null;
          reminder_error?: string | null;
          reminder_sent_at?: string | null;
          request_follow_up?: boolean;
          situation?: string | null;
          submitted_question?: string | null;
          updated_at?: string;
          zoom_failure_reason?: string | null;
          zoom_join_url?: string | null;
          zoom_registrant_id?: string | null;
          zoom_registration_status?: string;
        };
        Update: {
          auto_register?: boolean;
          confirmation_email_error?: string | null;
          confirmation_email_sent_at?: string | null;
          confirmation_email_status?: string;
          consent_confidentiality?: boolean;
          consent_updates?: boolean;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          location?: string | null;
          occurrence_id?: string | null;
          phone?: string | null;
          preferred_contact_date?: string | null;
          preferred_contact_time?: string | null;
          preferred_timezone?: string | null;
          relationship?: string | null;
          reminder_claimed_at?: string | null;
          reminder_error?: string | null;
          reminder_sent_at?: string | null;
          request_follow_up?: boolean;
          situation?: string | null;
          submitted_question?: string | null;
          updated_at?: string;
          zoom_failure_reason?: string | null;
          zoom_join_url?: string | null;
          zoom_registrant_id?: string | null;
          zoom_registration_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_registrations_occurrence_id_fkey";
            columns: ["occurrence_id"];
            isOneToOne: false;
            referencedRelation: "zoom_occurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          access_ends_at: string | null;
          amount: number;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          id: string;
          next_billing_date: string | null;
          paypal_subscription_id: string;
          plan_type: string;
          start_date: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_ends_at?: string | null;
          amount?: number;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          next_billing_date?: string | null;
          paypal_subscription_id: string;
          plan_type?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_ends_at?: string | null;
          amount?: number;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          id?: string;
          next_billing_date?: string | null;
          paypal_subscription_id?: string;
          plan_type?: string;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      zoom_occurrences: {
        Row: {
          id: string;
          series_key: string;
          occurrence_date: string;
          starts_at: string;
          timezone: string;
          status: string;
          zoom_meeting_id: string | null;
          join_url: string | null;
          start_url: string | null;
          failure_reason: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          series_key?: string;
          occurrence_date: string;
          starts_at: string;
          timezone?: string;
          status?: string;
          zoom_meeting_id?: string | null;
          join_url?: string | null;
          start_url?: string | null;
          failure_reason?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          series_key?: string;
          occurrence_date?: string;
          starts_at?: string;
          timezone?: string;
          status?: string;
          zoom_meeting_id?: string | null;
          join_url?: string | null;
          start_url?: string | null;
          failure_reason?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      zoom_attendance: {
        Row: {
          id: string;
          occurrence_id: string;
          participant_key: string;
          participant_name: string;
          participant_email: string | null;
          joined_at: string;
          left_at: string | null;
          duration_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          occurrence_id: string;
          participant_key: string;
          participant_name: string;
          participant_email?: string | null;
          joined_at: string;
          left_at?: string | null;
          duration_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          occurrence_id?: string;
          participant_key?: string;
          participant_name?: string;
          participant_email?: string | null;
          joined_at?: string;
          left_at?: string | null;
          duration_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zoom_attendance_occurrence_id_fkey";
            columns: ["occurrence_id"];
            isOneToOne: false;
            referencedRelation: "zoom_occurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      zoom_webhook_events: {
        Row: {
          series_key: string;
          event_id: string;
          event_type: string;
          payload_hash: string;
          occurred_at: string;
          received_at: string;
          claimed_at: string | null;
          lease_id: string | null;
          processed_at: string | null;
        };
        Insert: {
          series_key: string;
          event_id: string;
          event_type: string;
          payload_hash: string;
          occurred_at: string;
          received_at?: string;
          claimed_at?: string | null;
          lease_id?: string | null;
          processed_at?: string | null;
        };
        Update: {
          series_key?: string;
          event_id?: string;
          event_type?: string;
          payload_hash?: string;
          occurred_at?: string;
          received_at?: string;
          claimed_at?: string | null;
          lease_id?: string | null;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      zoom_followup_queue: {
        Row: {
          id: string;
          registration_id: string;
          sequence_step: number;
          scheduled_for: string;
          claimed_at: string | null;
          sent_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          sequence_step: number;
          scheduled_for: string;
          claimed_at?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          sequence_step?: number;
          scheduled_for?: string;
          claimed_at?: string | null;
          sent_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zoom_followup_queue_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "meeting_registrations";
            referencedColumns: ["id"];
          },
        ];
      };
      zoom_recordings: {
        Row: {
          id: string;
          occurrence_id: string;
          zoom_meeting_id: string;
          zoom_meeting_uuid: string;
          topic: string;
          started_at: string;
          recording_start: string | null;
          recording_end: string | null;
          duration_minutes: number | null;
          title: string | null;
          description: string | null;
          public_url: string | null;
          provider_share_url: string | null;
          provider_play_passcode: string | null;
          public_play_passcode: string | null;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          occurrence_id: string;
          zoom_meeting_id: string;
          zoom_meeting_uuid: string;
          topic?: string;
          started_at: string;
          recording_start?: string | null;
          recording_end?: string | null;
          duration_minutes?: number | null;
          title?: string | null;
          description?: string | null;
          public_url?: string | null;
          provider_share_url?: string | null;
          provider_play_passcode?: string | null;
          public_play_passcode?: string | null;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          occurrence_id?: string;
          zoom_meeting_id?: string;
          zoom_meeting_uuid?: string;
          topic?: string;
          started_at?: string;
          recording_start?: string | null;
          recording_end?: string | null;
          duration_minutes?: number | null;
          title?: string | null;
          description?: string | null;
          public_url?: string | null;
          provider_share_url?: string | null;
          provider_play_passcode?: string | null;
          public_play_passcode?: string | null;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zoom_recordings_occurrence_id_fkey";
            columns: ["occurrence_id"];
            isOneToOne: false;
            referencedRelation: "zoom_occurrences";
            referencedColumns: ["id"];
          },
        ];
      };
      zoom_recording_files: {
        Row: {
          id: string;
          recording_id: string;
          zoom_file_id: string;
          file_type: string | null;
          file_extension: string | null;
          file_size: number | null;
          play_url: string | null;
          download_url: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recording_id: string;
          zoom_file_id: string;
          file_type?: string | null;
          file_extension?: string | null;
          file_size?: number | null;
          play_url?: string | null;
          download_url?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recording_id?: string;
          zoom_file_id?: string;
          file_type?: string | null;
          file_extension?: string | null;
          file_size?: number | null;
          play_url?: string | null;
          download_url?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "zoom_recording_files_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "zoom_recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_zoom_occurrence: {
        Args: { _series_key: string; _occurrence_date: string; _starts_at: string };
        Returns: Json;
      };
      claim_zoom_registration: {
        Args: {
          _occurrence_id: string;
          _full_name: string;
          _email: string;
          _phone: string | null;
          _location: string | null;
          _relationship: string | null;
          _situation: string | null;
          _submitted_question: string | null;
          _auto_register: boolean;
          _request_follow_up: boolean;
          _preferred_contact_date: string | null;
          _preferred_contact_time: string | null;
          _preferred_timezone: string | null;
          _consent_confidentiality: boolean;
          _consent_updates: boolean;
        };
        Returns: Json;
      };
      claim_zoom_webhook_event: {
        Args: {
          _series_key: string;
          _event_id: string;
          _event_type: string;
          _occurred_at: string;
          _payload_hash: string;
        };
        Returns: Json;
      };
      complete_zoom_webhook_event: {
        Args: { _series_key: string; _event_id: string; _lease_id: string };
        Returns: boolean;
      };
      release_zoom_webhook_event: {
        Args: { _series_key: string; _event_id: string; _lease_id: string };
        Returns: boolean;
      };
      claim_zoom_reminders: {
        Args: { _now: string; _horizon: string; _limit?: number };
        Returns: Database["public"]["Tables"]["meeting_registrations"]["Row"][];
      };
      claim_zoom_followups: {
        Args: { _now: string; _limit?: number };
        Returns: Database["public"]["Tables"]["zoom_followup_queue"]["Row"][];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
