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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          payload: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          actor_role: string | null
          created_at: string
          diff: Json | null
          entity_slug: string | null
          entity_type: string
          id: string
          ip: string | null
          prev_hash: string | null
          row_hash: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          prev_hash?: string | null
          row_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_role?: string | null
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          prev_hash?: string | null
          row_hash?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_daily_challenge_schedule: {
        Row: {
          challenge_date: string
          created_at: string
          problem_slug: string
          set_by: string | null
        }
        Insert: {
          challenge_date: string
          created_at?: string
          problem_slug: string
          set_by?: string | null
        }
        Update: {
          challenge_date?: string
          created_at?: string
          problem_slug?: string
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_daily_challenge_schedule_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      admin_feature_flag_registry: {
        Row: {
          description: string | null
          key: string
          rollout_pct: number
          schema: Json
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          key: string
          rollout_pct?: number
          schema?: Json
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          rollout_pct?: number
          schema?: Json
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_outreach_hidden: {
        Row: {
          hidden_at: string
          hidden_by: string | null
          reason: string | null
          template_id: string
        }
        Insert: {
          hidden_at?: string
          hidden_by?: string | null
          reason?: string | null
          template_id: string
        }
        Update: {
          hidden_at?: string
          hidden_by?: string | null
          reason?: string | null
          template_id?: string
        }
        Relationships: []
      }
      admin_session_invalidations: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_content_likes: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string
          id: string
          last_accessed_at: string
          progress: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string
          progress?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "ai_generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          id: string
          is_public: boolean
          likes_count: number
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insight_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          insight_key: string
          insight_title: string
          org_id: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          insight_key: string
          insight_title: string
          org_id: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          insight_key?: string
          insight_title?: string
          org_id?: string
          rating?: Database["public"]["Enums"]["ai_insight_rating"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insight_flags: {
        Row: {
          created_at: string
          flagged_by: string
          insight_key: string
          insight_title: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          flagged_by?: string
          insight_key: string
          insight_title: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          flagged_by?: string
          insight_key?: string
          insight_title?: string
          reason?: string | null
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          payload?: Json
        }
        Relationships: []
      }
      arena_daily_attempts: {
        Row: {
          attempted_at: string
          battle_id: string | null
          challenge_date: string
          challenge_id: string
          id: string
          solve_time_sec: number | null
          solved: boolean
          solved_at: string | null
          user_id: string
          xp_awarded: number
        }
        Insert: {
          attempted_at?: string
          battle_id?: string | null
          challenge_date: string
          challenge_id: string
          id?: string
          solve_time_sec?: number | null
          solved?: boolean
          solved_at?: string | null
          user_id: string
          xp_awarded?: number
        }
        Update: {
          attempted_at?: string
          battle_id?: string | null
          challenge_date?: string
          challenge_id?: string
          id?: string
          solve_time_sec?: number | null
          solved?: boolean
          solved_at?: string | null
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "arena_daily_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "arena_daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_daily_challenges: {
        Row: {
          bonus_xp: number
          challenge_date: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          problem_slug: string
          updated_at: string
        }
        Insert: {
          bonus_xp?: number
          challenge_date: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          problem_slug: string
          updated_at?: string
        }
        Update: {
          bonus_xp?: number
          challenge_date?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          problem_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_daily_challenges_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      arena_notification_prefs: {
        Row: {
          daily_reminder: boolean
          last_reminded_date: string | null
          reminder_hour_utc: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_reminder?: boolean
          last_reminded_date?: string | null
          reminder_hour_utc?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_reminder?: boolean
          last_reminded_date?: string | null
          reminder_hour_utc?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arena_quests_catalog: {
        Row: {
          code: string
          created_at: string
          description: string
          difficulty: string
          id: string
          is_active: boolean
          kind: string
          target: number
          title: string
          weight: number
          xp_reward: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          difficulty?: string
          id?: string
          is_active?: boolean
          kind: string
          target?: number
          title: string
          weight?: number
          xp_reward?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          kind?: string
          target?: number
          title?: string
          weight?: number
          xp_reward?: number
        }
        Relationships: []
      }
      arena_streaks: {
        Row: {
          current_streak: number
          freeze_week_start: string | null
          freezes_remaining: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          freeze_week_start?: string | null
          freezes_remaining?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          freeze_week_start?: string | null
          freezes_remaining?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arena_user_daily_quests: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          quest_date: string
          quest_id: string
          target: number
          user_id: string
          xp_reward: number
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_date: string
          quest_id: string
          target: number
          user_id: string
          xp_reward?: number
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          quest_date?: string
          quest_id?: string
          target?: number
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "arena_user_daily_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "arena_quests_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_answer_uploads: {
        Row: {
          attempt_id: string
          id: string
          ordinal: number
          question_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          attempt_id: string
          id?: string
          ordinal: number
          question_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          attempt_id?: string
          id?: string
          ordinal?: number
          question_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answer_uploads_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answer_uploads_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          candidate_details: Json | null
          created_at: string
          device_fingerprint: string | null
          device_ip: unknown
          id: string
          id_photo_url: string | null
          integrity_score: number
          invite_id: string | null
          score: number | null
          screen_extended: boolean
          selfie_url: string | null
          sideeye_required: boolean
          slug: string | null
          start_geo: Json | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          violations: number
        }
        Insert: {
          assessment_id: string
          candidate_details?: Json | null
          created_at?: string
          device_fingerprint?: string | null
          device_ip?: unknown
          id?: string
          id_photo_url?: string | null
          integrity_score?: number
          invite_id?: string | null
          score?: number | null
          screen_extended?: boolean
          selfie_url?: string | null
          sideeye_required?: boolean
          slug?: string | null
          start_geo?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          violations?: number
        }
        Update: {
          assessment_id?: string
          candidate_details?: Json | null
          created_at?: string
          device_fingerprint?: string | null
          device_ip?: unknown
          id?: string
          id_photo_url?: string | null
          integrity_score?: number
          invite_id?: string | null
          score?: number | null
          screen_extended?: boolean
          selfie_url?: string | null
          sideeye_required?: boolean
          slug?: string | null
          start_geo?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          violations?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "assessment_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_chat_messages: {
        Row: {
          attempt_id: string
          body: string
          created_at: string
          id: string
          read_at: string | null
          read_by_recipient: boolean
          sender_role: string
          sender_user_id: string
        }
        Insert: {
          attempt_id: string
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          read_by_recipient?: boolean
          sender_role: string
          sender_user_id: string
        }
        Update: {
          attempt_id?: string
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          read_by_recipient?: boolean
          sender_role?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_chat_messages_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_feedback: {
        Row: {
          assessment_id: string
          attempt_id: string
          clarity: number
          comments: string | null
          created_at: string
          difficulty: string
          id: string
          rating: number
          tech_issues: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          attempt_id: string
          clarity: number
          comments?: string | null
          created_at?: string
          difficulty: string
          id?: string
          rating: number
          tech_issues?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          attempt_id?: string
          clarity?: number
          comments?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          rating?: number
          tech_issues?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_feedback_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_feedback_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_invites: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string | null
          external_id: string | null
          id: string
          last_send_attempt_at: string | null
          last_send_error: string | null
          last_sent_at: string | null
          name: string | null
          org_student_id: string | null
          reminder_sent_at: string | null
          scheduled_send_at: string | null
          send_count: number
          source: Database["public"]["Enums"]["invite_source"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string
          email: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          last_sent_at?: string | null
          name?: string | null
          org_student_id?: string | null
          reminder_sent_at?: string | null
          scheduled_send_at?: string | null
          send_count?: number
          source?: Database["public"]["Enums"]["invite_source"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string | null
          external_id?: string | null
          id?: string
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          last_sent_at?: string | null
          name?: string | null
          org_student_id?: string | null
          reminder_sent_at?: string | null
          scheduled_send_at?: string | null
          send_count?: number
          source?: Database["public"]["Enums"]["invite_source"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_invites_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_invites_org_student_id_fkey"
            columns: ["org_student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_proctor_findings: {
        Row: {
          attempt_id: string
          created_at: string
          finding: Json
          id: string
          severity: string
          snapshot_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          finding?: Json
          id?: string
          severity?: string
          snapshot_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          finding?: Json
          id?: string
          severity?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_proctor_findings_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_proctor_findings_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "assessment_proctor_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_proctor_recordings: {
        Row: {
          attempt_id: string
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          id: string
          kind: string
          recorded_by: string | null
          size_bytes: number | null
          started_at: string
          storage_path: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          kind: string
          recorded_by?: string | null
          size_bytes?: number | null
          started_at?: string
          storage_path: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          kind?: string
          recorded_by?: string | null
          size_bytes?: number | null
          started_at?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_proctor_recordings_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_proctor_session_chunks: {
        Row: {
          attempt_id: string
          created_at: string
          duration_ms: number
          ended_at: string
          id: string
          kind: string
          mime: string
          seq: number
          session_id: string
          size_bytes: number
          started_at: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          duration_ms: number
          ended_at: string
          id?: string
          kind: string
          mime?: string
          seq: number
          session_id: string
          size_bytes?: number
          started_at: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          duration_ms?: number
          ended_at?: string
          id?: string
          kind?: string
          mime?: string
          seq?: number
          session_id?: string
          size_bytes?: number
          started_at?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_proctor_session_chunks_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_proctor_snapshots: {
        Row: {
          attempt_id: string
          captured_at: string
          created_at: string
          id: string
          reviewed: boolean
          source: string
          storage_path: string
        }
        Insert: {
          attempt_id: string
          captured_at?: string
          created_at?: string
          id?: string
          reviewed?: boolean
          source: string
          storage_path: string
        }
        Update: {
          attempt_id?: string
          captured_at?: string
          created_at?: string
          id?: string
          reviewed?: boolean
          source?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_proctor_snapshots_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sections: {
        Row: {
          assessment_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          weight: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          weight?: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sections_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_side_camera_frames: {
        Row: {
          attempt_id: string
          captured_at: string
          created_at: string
          id: string
          pairing_id: string
          storage_path: string
        }
        Insert: {
          attempt_id: string
          captured_at?: string
          created_at?: string
          id?: string
          pairing_id: string
          storage_path: string
        }
        Update: {
          attempt_id?: string
          captured_at?: string
          created_at?: string
          id?: string
          pairing_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_side_camera_frames_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_side_camera_frames_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "assessment_side_camera_pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_side_camera_pairings: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          last_seen_at: string | null
          pair_code: string
          pair_token: string
          paired_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          last_seen_at?: string | null
          pair_code: string
          pair_token?: string
          paired_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          last_seen_at?: string | null
          pair_code?: string
          pair_token?: string
          paired_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_side_camera_pairings_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sos_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          attempt_id: string
          client_attempted_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_error: string | null
          delivery_status: Database["public"]["Enums"]["sos_delivery_status"]
          id: string
          issue: string
          notes: string | null
          raised_by: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["sos_status"]
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          attempt_id: string
          client_attempted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: Database["public"]["Enums"]["sos_delivery_status"]
          id?: string
          issue: string
          notes?: string | null
          raised_by: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          attempt_id?: string
          client_attempted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: Database["public"]["Enums"]["sos_delivery_status"]
          id?: string
          issue?: string
          notes?: string | null
          raised_by?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sos_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          auto_reminder_after_days: number
          auto_reminder_enabled: boolean
          brand_color: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_min: number
          ends_at: string | null
          id: string
          max_attempts: number
          org_id: string
          participation_mode: Database["public"]["Enums"]["participation_mode"]
          proctoring_config: Json
          proctoring_enabled: boolean
          proctoring_level: Database["public"]["Enums"]["proctoring_level"]
          show_results_to_candidate: boolean
          slug: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
          updated_at: string
        }
        Insert: {
          auto_reminder_after_days?: number
          auto_reminder_enabled?: boolean
          brand_color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_min?: number
          ends_at?: string | null
          id?: string
          max_attempts?: number
          org_id: string
          participation_mode?: Database["public"]["Enums"]["participation_mode"]
          proctoring_config?: Json
          proctoring_enabled?: boolean
          proctoring_level?: Database["public"]["Enums"]["proctoring_level"]
          show_results_to_candidate?: boolean
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Update: {
          auto_reminder_after_days?: number
          auto_reminder_enabled?: boolean
          brand_color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_min?: number
          ends_at?: string | null
          id?: string
          max_attempts?: number
          org_id?: string
          participation_mode?: Database["public"]["Enums"]["participation_mode"]
          proctoring_config?: Json
          proctoring_enabled?: boolean
          proctoring_level?: Database["public"]["Enums"]["proctoring_level"]
          show_results_to_candidate?: boolean
          slug?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title?: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          answer: Json
          attempt_id: string
          auto_score: number | null
          created_at: string
          grader_comment: string | null
          id: string
          manual_score: number | null
          question_id: string
          run_log: Json | null
          updated_at: string
        }
        Insert: {
          answer?: Json
          attempt_id: string
          auto_score?: number | null
          created_at?: string
          grader_comment?: string | null
          id?: string
          manual_score?: number | null
          question_id: string
          run_log?: Json | null
          updated_at?: string
        }
        Update: {
          answer?: Json
          attempt_id?: string
          auto_score?: number | null
          created_at?: string
          grader_comment?: string | null
          id?: string
          manual_score?: number | null
          question_id?: string
          run_log?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_event_notes: {
        Row: {
          attempt_id: string
          author_id: string
          author_name: string | null
          body: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
        }
        Insert: {
          attempt_id: string
          author_id: string
          author_name?: string | null
          body: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          author_id?: string
          author_name?: string | null
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_event_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "attempt_events"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_event_pins: {
        Row: {
          attempt_id: string
          created_at: string
          event_id: string
          id: string
          pinned_by: string
          pinned_by_name: string | null
          reason: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          event_id: string
          id?: string
          pinned_by: string
          pinned_by_name?: string | null
          reason?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          event_id?: string
          id?: string
          pinned_by?: string
          pinned_by_name?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_event_pins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "attempt_events"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_events: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          kind: string
          payload: Json
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "attempt_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_leads: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          org_type: string
          organization: string
          source: string | null
          status: string
          team_size: string | null
          updated_at: string
          user_id: string | null
          work_email: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          org_type: string
          organization: string
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id?: string | null
          work_email: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          org_type?: string
          organization?: string
          source?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id?: string | null
          work_email?: string
        }
        Relationships: []
      }
      b2b_onboarding_events: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json
          org_id: string | null
          step: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          org_id?: string | null
          step?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          org_id?: string | null
          step?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_onboarding_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_org_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          org_id: string
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          org_id: string
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          org_id?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_org_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_org_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          capabilities: string[]
          created_at: string
          email: string
          expires_at: string
          id: string
          inviter_id: string
          org_id: string
          revoked: boolean
          role_preset: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          capabilities?: string[]
          created_at?: string
          email: string
          expires_at: string
          id?: string
          inviter_id: string
          org_id: string
          revoked?: boolean
          role_preset?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          capabilities?: string[]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          org_id?: string
          revoked?: boolean
          role_preset?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_achievements: {
        Row: {
          achievement_key: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      battle_events: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          kind: string
          payload: Json
          user_id: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          user_id: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_events_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_invites: {
        Row: {
          battle_id: string | null
          code: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec: number
          expires_at: string
          from_user: string
          id: string
          problem_slug: string | null
          status: string
          to_user: string | null
        }
        Insert: {
          battle_id?: string | null
          code?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec?: number
          expires_at?: string
          from_user: string
          id?: string
          problem_slug?: string | null
          status?: string
          to_user?: string | null
        }
        Update: {
          battle_id?: string | null
          code?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec?: number
          expires_at?: string
          from_user?: string
          id?: string
          problem_slug?: string | null
          status?: string
          to_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_invites_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_queue: {
        Row: {
          difficulty: Database["public"]["Enums"]["battle_difficulty"]
          elo: number
          id: string
          joined_at: string
          status: string
          topic: string | null
          user_id: string
        }
        Insert: {
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          elo?: number
          id?: string
          joined_at?: string
          status?: string
          topic?: string | null
          user_id: string
        }
        Update: {
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          elo?: number
          id?: string
          joined_at?: string
          status?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      battle_submissions: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          language: string
          passed: number
          runtime_ms: number | null
          source_code: string
          total: number
          user_id: string
          verdict: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          language: string
          passed?: number
          runtime_ms?: number | null
          source_code: string
          total?: number
          user_id: string
          verdict: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          language?: string
          passed?: number
          runtime_ms?: number | null
          source_code?: string
          total?: number
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_submissions_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec: number
          elo_a_after: number | null
          elo_a_before: number | null
          elo_b_after: number | null
          elo_b_before: number | null
          end_reason: string | null
          ended_at: string | null
          ends_at: string | null
          id: string
          invite_code: string | null
          is_private: boolean
          player_a: string
          player_b: string
          problem_slug: string
          started_at: string | null
          status: Database["public"]["Enums"]["battle_status"]
          topic: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec?: number
          elo_a_after?: number | null
          elo_a_before?: number | null
          elo_b_after?: number | null
          elo_b_before?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ends_at?: string | null
          id?: string
          invite_code?: string | null
          is_private?: boolean
          player_a: string
          player_b: string
          problem_slug: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          topic?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec?: number
          elo_a_after?: number | null
          elo_a_before?: number | null
          elo_b_after?: number | null
          elo_b_before?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ends_at?: string | null
          id?: string
          invite_code?: string | null
          is_private?: boolean
          player_a?: string
          player_b?: string
          problem_slug?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["battle_status"]
          topic?: string | null
          winner_id?: string | null
        }
        Relationships: []
      }
      blog_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_comment_audit: {
        Row: {
          action: string
          actor_id: string | null
          comment_id: string
          comment_snapshot: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          post_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment_id: string
          comment_snapshot?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          post_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment_id?: string
          comment_snapshot?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          post_id?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["blog_comment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["blog_comment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["blog_comment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          allow_comments: boolean
          author_id: string | null
          auto_approve_comments: boolean
          bookmark_count: number
          canonical_url: string | null
          comment_count: number
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          like_count: number
          og_image_url: string | null
          published_at: string | null
          reading_time_min: number
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          author_id?: string | null
          auto_approve_comments?: boolean
          bookmark_count?: number
          canonical_url?: string | null
          comment_count?: number
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          like_count?: number
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          author_id?: string | null
          auto_approve_comments?: boolean
          bookmark_count?: number
          canonical_url?: string | null
          comment_count?: number
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          like_count?: number
          og_image_url?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      blog_revision_audit: {
        Row: {
          action: string
          actor_id: string | null
          compare_revision_id: string | null
          created_at: string
          id: string
          meta: Json
          post_id: string
          revision_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          compare_revision_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id: string
          revision_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          compare_revision_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          post_id?: string
          revision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_revision_audit_compare_revision_id_fkey"
            columns: ["compare_revision_id"]
            isOneToOne: false
            referencedRelation: "blog_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_revision_audit_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_revision_audit_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "blog_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_revisions: {
        Row: {
          content_md: string
          created_at: string
          id: string
          post_id: string
          saved_by: string | null
          title: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          post_id: string
          saved_by?: string | null
          title: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          post_id?: string
          saved_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_views: {
        Row: {
          dedup_key: string | null
          id: number
          post_id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
          viewed_on: string
        }
        Insert: {
          dedup_key?: string | null
          id?: number
          post_id: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
          viewed_on?: string
        }
        Update: {
          dedup_key?: string | null
          id?: number
          post_id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
          viewed_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      code_drafts: {
        Row: {
          id: string
          language: string
          problem_slug: string
          source_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          language: string
          problem_slug: string
          source_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          language?: string
          problem_slug?: string
          source_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      code_runs: {
        Row: {
          compile_output: string | null
          created_at: string
          id: string
          language: string
          language_id: number
          memory_kb: number | null
          problem_slug: string
          source_code: string
          status: string | null
          status_id: number | null
          stderr: string | null
          stdin: string
          stdout: string | null
          time_ms: number | null
          user_id: string
        }
        Insert: {
          compile_output?: string | null
          created_at?: string
          id?: string
          language: string
          language_id: number
          memory_kb?: number | null
          problem_slug: string
          source_code?: string
          status?: string | null
          status_id?: number | null
          stderr?: string | null
          stdin?: string
          stdout?: string | null
          time_ms?: number | null
          user_id: string
        }
        Update: {
          compile_output?: string | null
          created_at?: string
          id?: string
          language?: string
          language_id?: number
          memory_kb?: number | null
          problem_slug?: string
          source_code?: string
          status?: string | null
          status_id?: number | null
          stderr?: string | null
          stdin?: string
          stdout?: string | null
          time_ms?: number | null
          user_id?: string
        }
        Relationships: []
      }
      code_submissions: {
        Row: {
          created_at: string
          failing_case: Json | null
          id: string
          is_submission: boolean
          language: string
          language_id: number
          memory_kb: number | null
          passed_tests: number
          problem_slug: string
          runtime_ms: number | null
          source_code: string
          stderr: string | null
          total_tests: number
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          failing_case?: Json | null
          id?: string
          is_submission?: boolean
          language: string
          language_id: number
          memory_kb?: number | null
          passed_tests?: number
          problem_slug: string
          runtime_ms?: number | null
          source_code: string
          stderr?: string | null
          total_tests?: number
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          failing_case?: Json | null
          id?: string
          is_submission?: boolean
          language?: string
          language_id?: number
          memory_kb?: number | null
          passed_tests?: number
          problem_slug?: string
          runtime_ms?: number | null
          source_code?: string
          stderr?: string | null
          total_tests?: number
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      coding_leaderboard_snapshots: {
        Row: {
          created_at: string
          id: string
          problems_solved: number
          rank: number
          snapshot_date: string
          user_id: string
          weighted_score: number
          window_kind: string
        }
        Insert: {
          created_at?: string
          id?: string
          problems_solved: number
          rank: number
          snapshot_date?: string
          user_id: string
          weighted_score: number
          window_kind: string
        }
        Update: {
          created_at?: string
          id?: string
          problems_solved?: number
          rank?: number
          snapshot_date?: string
          user_id?: string
          weighted_score?: number
          window_kind?: string
        }
        Relationships: []
      }
      coding_problem_reference_solutions: {
        Row: {
          code: string
          id: string
          lang_id: string
          problem_slug: string
          updated_at: string
        }
        Insert: {
          code?: string
          id?: string
          lang_id: string
          problem_slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          id?: string
          lang_id?: string
          problem_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_reference_solutions_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_sql_specs: {
        Row: {
          order_matters: boolean
          problem_slug: string
          reference_query: string
          schema_sql: string
          seed_sql: string
          starter: string
          updated_at: string
        }
        Insert: {
          order_matters?: boolean
          problem_slug: string
          reference_query?: string
          schema_sql?: string
          seed_sql?: string
          starter?: string
          updated_at?: string
        }
        Update: {
          order_matters?: boolean
          problem_slug?: string
          reference_query?: string
          schema_sql?: string
          seed_sql?: string
          starter?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_sql_specs_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: true
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_starter_code: {
        Row: {
          code: string
          id: string
          lang_id: string
          problem_slug: string
          updated_at: string
        }
        Insert: {
          code?: string
          id?: string
          lang_id: string
          problem_slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          id?: string
          lang_id?: string
          problem_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_starter_code_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problem_tests: {
        Row: {
          created_at: string
          expected: string
          id: string
          input: string
          kind: string
          ord: number
          problem_slug: string
        }
        Insert: {
          created_at?: string
          expected?: string
          id?: string
          input?: string
          kind: string
          ord?: number
          problem_slug: string
        }
        Update: {
          created_at?: string
          expected?: string
          id?: string
          input?: string
          kind?: string
          ord?: number
          problem_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_problem_tests_problem_slug_fkey"
            columns: ["problem_slug"]
            isOneToOne: false
            referencedRelation: "coding_problems"
            referencedColumns: ["slug"]
          },
        ]
      }
      coding_problems: {
        Row: {
          constraints: string[]
          cpu_time_limit_sec: number | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          examples: Json
          hints: string[]
          is_published: boolean
          memory_limit_kb: number | null
          slug: string
          title: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          constraints?: string[]
          cpu_time_limit_sec?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          examples?: Json
          hints?: string[]
          is_published?: boolean
          memory_limit_kb?: number | null
          slug: string
          title: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          constraints?: string[]
          cpu_time_limit_sec?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          examples?: Json
          hints?: string[]
          is_published?: boolean
          memory_limit_kb?: number | null
          slug?: string
          title?: string
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      coding_problems_meta: {
        Row: {
          acceptance_rate: number
          difficulty: string
          problem_slug: string
          total_accepted: number
          total_submissions: number
          updated_at: string
        }
        Insert: {
          acceptance_rate?: number
          difficulty?: string
          problem_slug: string
          total_accepted?: number
          total_submissions?: number
          updated_at?: string
        }
        Update: {
          acceptance_rate?: number
          difficulty?: string
          problem_slug?: string
          total_accepted?: number
          total_submissions?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_prep_plans: {
        Row: {
          generated_at: string
          id: string
          model: string | null
          plan: Json
          progress: Json
          target_company_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          model?: string | null
          plan?: Json
          progress?: Json
          target_company_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          model?: string | null
          plan?: Json
          progress?: Json
          target_company_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_prep_plans_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "target_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      contest_account_bindings: {
        Row: {
          conflict_count: number
          created_at: string
          face_embedding_hash: string
          id: string
          id_document_hash: string
          last_seen_device: string | null
          notes: string | null
          primary_device_fingerprint: string
          updated_at: string
          user_id: string
          verified_at: string
        }
        Insert: {
          conflict_count?: number
          created_at?: string
          face_embedding_hash: string
          id?: string
          id_document_hash: string
          last_seen_device?: string | null
          notes?: string | null
          primary_device_fingerprint: string
          updated_at?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          conflict_count?: number
          created_at?: string
          face_embedding_hash?: string
          id?: string
          id_document_hash?: string
          last_seen_device?: string | null
          notes?: string | null
          primary_device_fingerprint?: string
          updated_at?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      contest_audio_events: {
        Row: {
          analysis: Json | null
          coaching_keywords: string[] | null
          contest_id: string
          created_at: string
          duration_sec: number | null
          id: string
          session_id: string | null
          severity: string
          storage_path: string | null
          transcript: string | null
          user_id: string
          voices_detected: number | null
        }
        Insert: {
          analysis?: Json | null
          coaching_keywords?: string[] | null
          contest_id: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          session_id?: string | null
          severity?: string
          storage_path?: string | null
          transcript?: string | null
          user_id: string
          voices_detected?: number | null
        }
        Update: {
          analysis?: Json | null
          coaching_keywords?: string[] | null
          contest_id?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          session_id?: string | null
          severity?: string
          storage_path?: string | null
          transcript?: string | null
          user_id?: string
          voices_detected?: number | null
        }
        Relationships: []
      }
      contest_behavioral_baselines: {
        Row: {
          calibrated_at: string
          contest_id: string
          created_at: string
          id: string
          mean_inter_key_ms: number
          mean_mouse_speed: number
          sample_n: number
          session_id: string
          std_inter_key_ms: number
          std_mouse_speed: number
          user_id: string
        }
        Insert: {
          calibrated_at?: string
          contest_id: string
          created_at?: string
          id?: string
          mean_inter_key_ms: number
          mean_mouse_speed?: number
          sample_n: number
          session_id: string
          std_inter_key_ms: number
          std_mouse_speed?: number
          user_id: string
        }
        Update: {
          calibrated_at?: string
          contest_id?: string
          created_at?: string
          id?: string
          mean_inter_key_ms?: number
          mean_mouse_speed?: number
          sample_n?: number
          session_id?: string
          std_inter_key_ms?: number
          std_mouse_speed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_behavioral_baselines_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_behavioral_baselines_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_code_provenance: {
        Row: {
          char_count: number | null
          client_ts: string
          contest_id: string
          diff_summary: Json | null
          event_type: string
          id: string
          paste_size: number | null
          problem_id: string
          reason: string | null
          server_ts: string
          session_id: string
          suspicious: boolean
          user_id: string
        }
        Insert: {
          char_count?: number | null
          client_ts: string
          contest_id: string
          diff_summary?: Json | null
          event_type: string
          id?: string
          paste_size?: number | null
          problem_id: string
          reason?: string | null
          server_ts?: string
          session_id: string
          suspicious?: boolean
          user_id: string
        }
        Update: {
          char_count?: number | null
          client_ts?: string
          contest_id?: string
          diff_summary?: Json | null
          event_type?: string
          id?: string
          paste_size?: number | null
          problem_id?: string
          reason?: string | null
          server_ts?: string
          session_id?: string
          suspicious?: boolean
          user_id?: string
        }
        Relationships: []
      }
      contest_cross_similarity: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          match_contest_id: string | null
          match_session_id: string | null
          match_source: string
          match_url: string | null
          match_user_id: string | null
          matched_lines: number | null
          similarity: number
          source_contest_id: string
          source_session_id: string
          source_user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          match_contest_id?: string | null
          match_session_id?: string | null
          match_source: string
          match_url?: string | null
          match_user_id?: string | null
          matched_lines?: number | null
          similarity: number
          source_contest_id: string
          source_session_id: string
          source_user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          match_contest_id?: string | null
          match_session_id?: string | null
          match_source?: string
          match_url?: string | null
          match_user_id?: string | null
          matched_lines?: number | null
          similarity?: number
          source_contest_id?: string
          source_session_id?: string
          source_user_id?: string
        }
        Relationships: []
      }
      contest_dq_signoffs: {
        Row: {
          approver_decision: string | null
          approver_id: string | null
          approver_notes: string | null
          contest_id: string
          created_at: string
          decided_at: string | null
          evidence: Json
          id: string
          proposed_by: string
          proposed_reason: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          approver_decision?: string | null
          approver_id?: string | null
          approver_notes?: string | null
          contest_id: string
          created_at?: string
          decided_at?: string | null
          evidence: Json
          id?: string
          proposed_by: string
          proposed_reason: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          approver_decision?: string | null
          approver_id?: string | null
          approver_notes?: string | null
          contest_id?: string
          created_at?: string
          decided_at?: string | null
          evidence?: Json
          id?: string
          proposed_by?: string
          proposed_reason?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contest_identity_checks: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          id_document_path: string | null
          kind: string
          match_score: number | null
          reasoning: string | null
          selfie_path: string | null
          session_id: string | null
          user_id: string
          verdict: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          id_document_path?: string | null
          kind?: string
          match_score?: number | null
          reasoning?: string | null
          selfie_path?: string | null
          session_id?: string | null
          user_id: string
          verdict?: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          id_document_path?: string | null
          kind?: string
          match_score?: number | null
          reasoning?: string | null
          selfie_path?: string | null
          session_id?: string | null
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      contest_identity_verifications: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          id_card_path: string | null
          match_score: number | null
          reasons: Json | null
          selfie_path: string | null
          status: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          id_card_path?: string | null
          match_score?: number | null
          reasons?: Json | null
          selfie_path?: string | null
          status?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          id_card_path?: string | null
          match_score?: number | null
          reasons?: Json | null
          selfie_path?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_identity_verifications_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_integrity_reports: {
        Row: {
          contest_id: string
          created_at: string
          dq_count: number
          flagged_count: number
          id: string
          is_published: boolean
          published_at: string | null
          summary: Json
          total_participants: number
          updated_at: string
          viva_count: number
        }
        Insert: {
          contest_id: string
          created_at?: string
          dq_count?: number
          flagged_count?: number
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: Json
          total_participants?: number
          updated_at?: string
          viva_count?: number
        }
        Update: {
          contest_id?: string
          created_at?: string
          dq_count?: number
          flagged_count?: number
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: Json
          total_participants?: number
          updated_at?: string
          viva_count?: number
        }
        Relationships: []
      }
      contest_integrity_verdicts: {
        Row: {
          contest_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          final_hash: string | null
          id: string
          public_token: string | null
          reason: string | null
          session_id: string
          updated_at: string
          user_id: string
          verdict: Database["public"]["Enums"]["integrity_verdict"]
        }
        Insert: {
          contest_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          final_hash?: string | null
          id?: string
          public_token?: string | null
          reason?: string | null
          session_id: string
          updated_at?: string
          user_id: string
          verdict?: Database["public"]["Enums"]["integrity_verdict"]
        }
        Update: {
          contest_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          final_hash?: string | null
          id?: string
          public_token?: string | null
          reason?: string | null
          session_id?: string
          updated_at?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["integrity_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "contest_integrity_verdicts_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_integrity_verdicts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_keystroke_baselines: {
        Row: {
          created_at: string
          id: string
          profile: Json
          samples: number
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile: Json
          samples?: number
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile?: Json
          samples?: number
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_keystroke_baselines_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_keystroke_profiles: {
        Row: {
          burst_ratio: number
          contest_id: string
          created_at: string
          id: string
          mean_interval: number
          median_interval: number
          p90_interval: number
          sample_size: number
          session_id: string
          stddev_interval: number
          user_id: string
        }
        Insert: {
          burst_ratio: number
          contest_id: string
          created_at?: string
          id?: string
          mean_interval: number
          median_interval: number
          p90_interval: number
          sample_size: number
          session_id: string
          stddev_interval: number
          user_id: string
        }
        Update: {
          burst_ratio?: number
          contest_id?: string
          created_at?: string
          id?: string
          mean_interval?: number
          median_interval?: number
          p90_interval?: number
          sample_size?: number
          session_id?: string
          stddev_interval?: number
          user_id?: string
        }
        Relationships: []
      }
      contest_keystroke_samples: {
        Row: {
          burst_ratio: number
          contest_id: string
          created_at: string
          drift: boolean
          id: string
          mean_interval: number
          sample_size: number
          session_id: string
          similarity: number | null
          stddev_interval: number
          user_id: string
        }
        Insert: {
          burst_ratio: number
          contest_id: string
          created_at?: string
          drift?: boolean
          id?: string
          mean_interval: number
          sample_size: number
          session_id: string
          similarity?: number | null
          stddev_interval: number
          user_id: string
        }
        Update: {
          burst_ratio?: number
          contest_id?: string
          created_at?: string
          drift?: boolean
          id?: string
          mean_interval?: number
          sample_size?: number
          session_id?: string
          similarity?: number | null
          stddev_interval?: number
          user_id?: string
        }
        Relationships: []
      }
      contest_leaderboard_cache: {
        Row: {
          contest_id: string
          last_solve_at: string | null
          problems_solved: number
          rank: number
          total_penalty_seconds: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_id: string
          last_solve_at?: string | null
          problems_solved?: number
          rank?: number
          total_penalty_seconds?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          last_solve_at?: string | null
          problems_solved?: number
          rank?: number
          total_penalty_seconds?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_leaderboard_cache_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_liveness_challenges: {
        Row: {
          ai_verdict: Json | null
          challenge_type: string
          contest_id: string
          evidence_path: string | null
          expires_at: string
          id: string
          issued_at: string
          prompt: Json
          responded_at: string | null
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          ai_verdict?: Json | null
          challenge_type: string
          contest_id: string
          evidence_path?: string | null
          expires_at?: string
          id?: string
          issued_at?: string
          prompt?: Json
          responded_at?: string | null
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          ai_verdict?: Json | null
          challenge_type?: string
          contest_id?: string
          evidence_path?: string | null
          expires_at?: string
          id?: string
          issued_at?: string
          prompt?: Json
          responded_at?: string | null
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_liveness_challenges_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_lock_events: {
        Row: {
          contest_id: string | null
          created_at: string
          details: Json
          event_kind: string
          id: string
          problem_slug: string | null
          target: string | null
          user_id: string
        }
        Insert: {
          contest_id?: string | null
          created_at?: string
          details?: Json
          event_kind: string
          id?: string
          problem_slug?: string | null
          target?: string | null
          user_id?: string
        }
        Update: {
          contest_id?: string | null
          created_at?: string
          details?: Json
          event_kind?: string
          id?: string
          problem_slug?: string | null
          target?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contest_mouse_metrics: {
        Row: {
          click_count: number
          contest_id: string
          created_at: string
          id: string
          idle_ratio: number
          is_bot_like: boolean
          move_count: number
          path_entropy: number
          session_id: string
          total_distance_px: number
          user_id: string
          window_ms: number
        }
        Insert: {
          click_count: number
          contest_id: string
          created_at?: string
          id?: string
          idle_ratio: number
          is_bot_like?: boolean
          move_count: number
          path_entropy: number
          session_id: string
          total_distance_px: number
          user_id: string
          window_ms: number
        }
        Update: {
          click_count?: number
          contest_id?: string
          created_at?: string
          id?: string
          idle_ratio?: number
          is_bot_like?: boolean
          move_count?: number
          path_entropy?: number
          session_id?: string
          total_distance_px?: number
          user_id?: string
          window_ms?: number
        }
        Relationships: []
      }
      contest_network_audit: {
        Row: {
          blocked: boolean
          contest_id: string
          created_at: string
          host: string
          id: string
          method: string
          page_path: string | null
          session_id: string | null
          severity: string
          url: string
          user_id: string
        }
        Insert: {
          blocked?: boolean
          contest_id: string
          created_at?: string
          host: string
          id?: string
          method?: string
          page_path?: string | null
          session_id?: string | null
          severity?: string
          url: string
          user_id: string
        }
        Update: {
          blocked?: boolean
          contest_id?: string
          created_at?: string
          host?: string
          id?: string
          method?: string
          page_path?: string | null
          session_id?: string | null
          severity?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      contest_preflight_checks: {
        Row: {
          contest_id: string
          created_at: string
          details: Json
          id: string
          session_id: string | null
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          details?: Json
          id?: string
          session_id?: string | null
          status: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          details?: Json
          id?: string
          session_id?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contest_problem_variants: {
        Row: {
          contest_id: string
          created_at: string
          hidden_test_seed: string | null
          id: string
          problem_slug: string
          statement_md: string | null
          title: string | null
          variant_key: string
          weight: number
        }
        Insert: {
          contest_id: string
          created_at?: string
          hidden_test_seed?: string | null
          id?: string
          problem_slug: string
          statement_md?: string | null
          title?: string | null
          variant_key: string
          weight?: number
        }
        Update: {
          contest_id?: string
          created_at?: string
          hidden_test_seed?: string | null
          id?: string
          problem_slug?: string
          statement_md?: string | null
          title?: string | null
          variant_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_problem_variants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_problems: {
        Row: {
          contest_id: string
          created_at: string
          order_index: number
          points: number
          problem_slug: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          order_index?: number
          points?: number
          problem_slug: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          order_index?: number
          points?: number
          problem_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_problems_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_proctor_findings: {
        Row: {
          ai_summary: string | null
          confidence: string | null
          contest_id: string
          created_at: string
          earbuds_detected: boolean | null
          face_count: number | null
          gaze_direction: string | null
          id: string
          phone_detected: boolean | null
          raw: Json
          second_person_detected: boolean | null
          second_screen_detected: boolean | null
          session_id: string | null
          severity: string
          snapshot_id: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          confidence?: string | null
          contest_id: string
          created_at?: string
          earbuds_detected?: boolean | null
          face_count?: number | null
          gaze_direction?: string | null
          id?: string
          phone_detected?: boolean | null
          raw?: Json
          second_person_detected?: boolean | null
          second_screen_detected?: boolean | null
          session_id?: string | null
          severity?: string
          snapshot_id?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          confidence?: string | null
          contest_id?: string
          created_at?: string
          earbuds_detected?: boolean | null
          face_count?: number | null
          gaze_direction?: string | null
          id?: string
          phone_detected?: boolean | null
          raw?: Json
          second_person_detected?: boolean | null
          second_screen_detected?: boolean | null
          session_id?: string | null
          severity?: string
          snapshot_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contest_proctor_snapshots: {
        Row: {
          captured_at: string
          contest_id: string
          id: string
          session_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          contest_id: string
          id?: string
          session_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          captured_at?: string
          contest_id?: string
          id?: string
          session_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_proctor_snapshots_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_proctor_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_registrations: {
        Row: {
          contest_id: string
          display_name: string | null
          disqualified_at: string | null
          disqualified_reason: string | null
          flagged: boolean
          honor_code_accepted_at: string | null
          id: string
          registered_at: string
          status: string
          team_name: string | null
          user_id: string
          violation_count: number
        }
        Insert: {
          contest_id: string
          display_name?: string | null
          disqualified_at?: string | null
          disqualified_reason?: string | null
          flagged?: boolean
          honor_code_accepted_at?: string | null
          id?: string
          registered_at?: string
          status?: string
          team_name?: string | null
          user_id: string
          violation_count?: number
        }
        Update: {
          contest_id?: string
          display_name?: string | null
          disqualified_at?: string | null
          disqualified_reason?: string | null
          flagged?: boolean
          honor_code_accepted_at?: string | null
          id?: string
          registered_at?: string
          status?: string
          team_name?: string | null
          user_id?: string
          violation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_registrations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_room_scans: {
        Row: {
          ai_findings: Json
          ai_summary: string | null
          contest_id: string
          created_at: string
          duration_ms: number | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          storage_path: string
          user_id: string
          verdict: string
        }
        Insert: {
          ai_findings?: Json
          ai_summary?: string | null
          contest_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          storage_path: string
          user_id: string
          verdict?: string
        }
        Update: {
          ai_findings?: Json
          ai_summary?: string | null
          contest_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          storage_path?: string
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
      contest_screen_recordings: {
        Row: {
          contest_id: string
          created_at: string
          duration_sec: number
          id: string
          session_id: string | null
          started_at: string
          storage_path: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          duration_sec?: number
          id?: string
          session_id?: string | null
          started_at?: string
          storage_path: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          duration_sec?: number
          id?: string
          session_id?: string | null
          started_at?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_screen_recordings_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_screen_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_screen_share_audits: {
        Row: {
          ai_summary: string | null
          contest_id: string
          created_at: string
          detected_windows: Json
          forbidden_apps: string[]
          id: string
          session_id: string | null
          severity: string
          storage_path: string | null
          surface_kind: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          contest_id: string
          created_at?: string
          detected_windows?: Json
          forbidden_apps?: string[]
          id?: string
          session_id?: string | null
          severity?: string
          storage_path?: string | null
          surface_kind?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          contest_id?: string
          created_at?: string
          detected_windows?: Json
          forbidden_apps?: string[]
          id?: string
          session_id?: string | null
          severity?: string
          storage_path?: string | null
          surface_kind?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contest_session_event_seq: {
        Row: {
          last_nonce: string | null
          last_seq: number
          session_id: string
          updated_at: string
        }
        Insert: {
          last_nonce?: string | null
          last_seq?: number
          session_id: string
          updated_at?: string
        }
        Update: {
          last_nonce?: string | null
          last_seq?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contest_session_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          key_hash: string
          key_secret: string
          revoked_at: string | null
          rotated_from: string | null
          sequence: number
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          key_hash: string
          key_secret: string
          revoked_at?: string | null
          rotated_from?: string | null
          sequence?: number
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          key_hash?: string
          key_secret?: string
          revoked_at?: string | null
          rotated_from?: string | null
          sequence?: number
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      contest_session_seals: {
        Row: {
          components: Json
          contest_id: string
          hmac: string
          root_hash: string
          sealed_at: string
          sealed_by: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          components?: Json
          contest_id: string
          hmac: string
          root_hash: string
          sealed_at?: string
          sealed_by?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          components?: Json
          contest_id?: string
          hmac?: string
          root_hash?: string
          sealed_at?: string
          sealed_by?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_session_seals_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_session_seals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_sessions: {
        Row: {
          client_fingerprint: Json | null
          contest_id: string
          device_meta: Json
          id: string
          invalidated_at: string | null
          ip_address: unknown
          ip_hash: string | null
          is_active: boolean
          last_heartbeat_at: string | null
          last_seen_at: string
          risk_score: number
          session_token: string
          side_camera_required: boolean
          side_camera_status: string
          started_at: string
          stream_grace_until: string | null
          terminated_at: string | null
          terminated_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          client_fingerprint?: Json | null
          contest_id: string
          device_meta?: Json
          id?: string
          invalidated_at?: string | null
          ip_address?: unknown
          ip_hash?: string | null
          is_active?: boolean
          last_heartbeat_at?: string | null
          last_seen_at?: string
          risk_score?: number
          session_token?: string
          side_camera_required?: boolean
          side_camera_status?: string
          started_at?: string
          stream_grace_until?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          client_fingerprint?: Json | null
          contest_id?: string
          device_meta?: Json
          id?: string
          invalidated_at?: string | null
          ip_address?: unknown
          ip_hash?: string | null
          is_active?: boolean
          last_heartbeat_at?: string | null
          last_seen_at?: string
          risk_score?: number
          session_token?: string
          side_camera_required?: boolean
          side_camera_status?: string
          started_at?: string
          stream_grace_until?: string | null
          terminated_at?: string | null
          terminated_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_sessions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_side_camera_audit_logs: {
        Row: {
          created_at: string
          detail: Json
          event_type: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_note: string | null
          session_id: string
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          session_id: string
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          session_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_side_camera_audit_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_side_camera_frames: {
        Row: {
          ai_summary: Json | null
          captured_at: string
          created_at: string
          id: string
          session_id: string
          severity: string
          storage_path: string
          user_id: string
        }
        Insert: {
          ai_summary?: Json | null
          captured_at?: string
          created_at?: string
          id?: string
          session_id: string
          severity?: string
          storage_path: string
          user_id: string
        }
        Update: {
          ai_summary?: Json | null
          captured_at?: string
          created_at?: string
          id?: string
          session_id?: string
          severity?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_side_camera_frames_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_side_camera_pairings: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          device_user_agent: string | null
          expires_at: string
          id: string
          last_heartbeat_at: string | null
          paired_at: string | null
          pairing_token: string
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          device_user_agent?: string | null
          expires_at?: string
          id?: string
          last_heartbeat_at?: string | null
          paired_at?: string | null
          pairing_token: string
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          device_user_agent?: string | null
          expires_at?: string
          id?: string
          last_heartbeat_at?: string | null
          paired_at?: string | null
          pairing_token?: string
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_side_camera_pairings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_side_camera_recordings: {
        Row: {
          byte_size: number | null
          created_at: string
          ended_at: string | null
          id: string
          session_id: string
          started_at: string
          storage_path: string
          user_id: string
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id: string
          started_at?: string
          storage_path: string
          user_id: string
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          session_id?: string
          started_at?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_side_camera_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_sideeye_consents: {
        Row: {
          consent_text_sha256: string
          consent_version: string
          contest_id: string
          granted_at: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_text_sha256: string
          consent_version: string
          contest_id: string
          granted_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_text_sha256?: string
          consent_version?: string
          contest_id?: string
          granted_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_sideeye_consents_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_similarity_pairs: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          method: string
          problem_slug: string
          rationale: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          similarity: number
          submission_a: string | null
          submission_b: string | null
          user_a: string
          user_b: string
          verdict: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          method?: string
          problem_slug: string
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity: number
          submission_a?: string | null
          submission_b?: string | null
          user_a: string
          user_b: string
          verdict?: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          method?: string
          problem_slug?: string
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity?: number
          submission_a?: string | null
          submission_b?: string | null
          user_a?: string
          user_b?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_similarity_pairs_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_solve_time_analysis: {
        Row: {
          actual_seconds: number
          ai_likelihood: number | null
          contest_id: string
          created_at: string
          details: Json | null
          expected_min_seconds: number
          id: string
          problem_id: string
          session_id: string
          user_id: string
          verdict: string
          z_score: number | null
        }
        Insert: {
          actual_seconds: number
          ai_likelihood?: number | null
          contest_id: string
          created_at?: string
          details?: Json | null
          expected_min_seconds: number
          id?: string
          problem_id: string
          session_id: string
          user_id: string
          verdict: string
          z_score?: number | null
        }
        Update: {
          actual_seconds?: number
          ai_likelihood?: number | null
          contest_id?: string
          created_at?: string
          details?: Json | null
          expected_min_seconds?: number
          id?: string
          problem_id?: string
          session_id?: string
          user_id?: string
          verdict?: string
          z_score?: number | null
        }
        Relationships: []
      }
      contest_stream_health: {
        Row: {
          contest_id: string
          created_at: string
          healthy: boolean
          id: string
          session_id: string | null
          stream_kind: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          healthy: boolean
          id?: string
          session_id?: string | null
          stream_kind: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          healthy?: boolean
          id?: string
          session_id?: string | null
          stream_kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_stream_health_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_stream_health_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_submissions: {
        Row: {
          contest_id: string
          id: string
          penalty_seconds: number
          points_awarded: number
          problem_slug: string
          submission_id: string | null
          submitted_at: string
          user_id: string
          verdict: string
        }
        Insert: {
          contest_id: string
          id?: string
          penalty_seconds?: number
          points_awarded?: number
          problem_slug: string
          submission_id?: string | null
          submitted_at?: string
          user_id: string
          verdict: string
        }
        Update: {
          contest_id?: string
          id?: string
          penalty_seconds?: number
          points_awarded?: number
          problem_slug?: string
          submission_id?: string | null
          submitted_at?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_tab_locks: {
        Row: {
          claimed_at: string
          contest_id: string
          tab_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          contest_id: string
          tab_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          contest_id?: string
          tab_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_tab_locks_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_trust_attestations: {
        Row: {
          automation_flags: Json
          contest_id: string
          created_at: string
          devtools_open: boolean | null
          display_count: number | null
          failures: string[]
          gate_passed: boolean
          id: string
          id_match_passed: boolean | null
          id_match_score: number | null
          ip_reputation: Json
          raw: Json
          rdp_detected: boolean | null
          session_id: string
          side_eye_paired: boolean | null
          signed_token: string | null
          single_monitor_ok: boolean | null
          user_id: string
          vm_detected: boolean | null
          webgl_renderer: string | null
        }
        Insert: {
          automation_flags?: Json
          contest_id: string
          created_at?: string
          devtools_open?: boolean | null
          display_count?: number | null
          failures?: string[]
          gate_passed?: boolean
          id?: string
          id_match_passed?: boolean | null
          id_match_score?: number | null
          ip_reputation?: Json
          raw?: Json
          rdp_detected?: boolean | null
          session_id: string
          side_eye_paired?: boolean | null
          signed_token?: string | null
          single_monitor_ok?: boolean | null
          user_id: string
          vm_detected?: boolean | null
          webgl_renderer?: string | null
        }
        Update: {
          automation_flags?: Json
          contest_id?: string
          created_at?: string
          devtools_open?: boolean | null
          display_count?: number | null
          failures?: string[]
          gate_passed?: boolean
          id?: string
          id_match_passed?: boolean | null
          id_match_score?: number | null
          ip_reputation?: Json
          raw?: Json
          rdp_detected?: boolean | null
          session_id?: string
          side_eye_paired?: boolean | null
          signed_token?: string | null
          single_monitor_ok?: boolean | null
          user_id?: string
          vm_detected?: boolean | null
          webgl_renderer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_trust_attestations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_trust_attestations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_trust_scores: {
        Row: {
          computed_at: string
          contest_id: string
          id: string
          reasons: Json
          risk: string
          score: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          computed_at?: string
          contest_id: string
          id?: string
          reasons?: Json
          risk: string
          score: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          computed_at?: string
          contest_id?: string
          id?: string
          reasons?: Json
          risk?: string
          score?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_trust_scores_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_trust_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_typing_events: {
        Row: {
          char_count: number
          contest_id: string
          created_at: string
          dt_ms: number
          id: string
          is_burst: boolean
          problem_slug: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          char_count: number
          contest_id: string
          created_at?: string
          dt_ms: number
          id?: string
          is_burst?: boolean
          problem_slug: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          char_count?: number
          contest_id?: string
          created_at?: string
          dt_ms?: number
          id?: string
          is_burst?: boolean
          problem_slug?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_typing_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_typing_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_user_variants: {
        Row: {
          assigned_at: string
          contest_id: string
          id: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        Insert: {
          assigned_at?: string
          contest_id: string
          id?: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        Update: {
          assigned_at?: string
          contest_id?: string
          id?: string
          problem_slug?: string
          user_id?: string
          variant_id?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_user_variants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_user_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "contest_problem_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_variant_test_bindings: {
        Row: {
          bundle_hash: string
          contest_id: string
          created_at: string
          id: string
          problem_id: string
          test_bundle: Json
          variant_key: string
        }
        Insert: {
          bundle_hash: string
          contest_id: string
          created_at?: string
          id?: string
          problem_id: string
          test_bundle: Json
          variant_key: string
        }
        Update: {
          bundle_hash?: string
          contest_id?: string
          created_at?: string
          id?: string
          problem_id?: string
          test_bundle?: Json
          variant_key?: string
        }
        Relationships: []
      }
      contest_violations: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          meta: Json
          session_id: string | null
          severity: string
          type: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          meta?: Json
          session_id?: string | null
          severity?: string
          type: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          meta?: Json
          session_id?: string | null
          severity?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_violations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_violations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "contest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_viva_queue: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          notes: string | null
          problem_slug: string | null
          rank: number | null
          reason: string
          reviewer_id: string | null
          scheduled_at: string | null
          session_id: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          notes?: string | null
          problem_slug?: string | null
          rank?: number | null
          reason: string
          reviewer_id?: string | null
          scheduled_at?: string | null
          session_id?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          problem_slug?: string | null
          rank?: number | null
          reason?: string
          reviewer_id?: string | null
          scheduled_at?: string | null
          session_id?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_viva_queue_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          banner_url: string | null
          calibration_required: boolean
          created_at: string
          created_by: string | null
          data_region: string
          description: string | null
          ends_at: string
          enforcement_mode: Database["public"]["Enums"]["contest_enforcement_mode"]
          id: string
          institution_id: string | null
          invite_code: string | null
          max_participants: number | null
          min_trust_score: number
          penalty_minutes: number
          registration_closes_at: string | null
          registration_opens_at: string | null
          require_screen_share: boolean
          retention_days: number
          rules_md: string | null
          scoring_mode: string
          slug: string
          starts_at: string
          status: string
          title: string
          two_person_rule: boolean
          updated_at: string
          visibility: string
        }
        Insert: {
          banner_url?: string | null
          calibration_required?: boolean
          created_at?: string
          created_by?: string | null
          data_region?: string
          description?: string | null
          ends_at: string
          enforcement_mode?: Database["public"]["Enums"]["contest_enforcement_mode"]
          id?: string
          institution_id?: string | null
          invite_code?: string | null
          max_participants?: number | null
          min_trust_score?: number
          penalty_minutes?: number
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_screen_share?: boolean
          retention_days?: number
          rules_md?: string | null
          scoring_mode?: string
          slug: string
          starts_at: string
          status?: string
          title: string
          two_person_rule?: boolean
          updated_at?: string
          visibility?: string
        }
        Update: {
          banner_url?: string | null
          calibration_required?: boolean
          created_at?: string
          created_by?: string | null
          data_region?: string
          description?: string | null
          ends_at?: string
          enforcement_mode?: Database["public"]["Enums"]["contest_enforcement_mode"]
          id?: string
          institution_id?: string | null
          invite_code?: string | null
          max_participants?: number | null
          min_trust_score?: number
          penalty_minutes?: number
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_screen_share?: boolean
          retention_days?: number
          rules_md?: string | null
          scoring_mode?: string
          slug?: string
          starts_at?: string
          status?: string
          title?: string
          two_person_rule?: boolean
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "contests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenge_completions: {
        Row: {
          challenge_date: string
          completed_at: string
          created_at: string
          id: string
          problem_slug: string
          user_id: string
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          created_at?: string
          id?: string
          problem_slug: string
          user_id: string
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          created_at?: string
          id?: string
          problem_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_challenge_leaderboard_optin: {
        Row: {
          created_at: string
          display_name: string | null
          opted_in: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          opted_in?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          opted_in?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          candidates: string
          created_at: string
          email: string
          id: string
          landing_page: string | null
          name: string
          notes: string | null
          org: string
          proctoring: string[]
          referrer: string | null
          reporting: string[]
          status: string
          use_case: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          candidates: string
          created_at?: string
          email: string
          id?: string
          landing_page?: string | null
          name: string
          notes?: string | null
          org: string
          proctoring?: string[]
          referrer?: string | null
          reporting?: string[]
          status?: string
          use_case: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          candidates?: string
          created_at?: string
          email?: string
          id?: string
          landing_page?: string | null
          name?: string
          notes?: string | null
          org?: string
          proctoring?: string[]
          referrer?: string | null
          reporting?: string[]
          status?: string
          use_case?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      drive_applications: {
        Row: {
          applied_at: string
          created_at: string
          current_round: number
          drive_id: string
          id: string
          last_event_at: string
          notes: string | null
          stage: Database["public"]["Enums"]["application_stage"]
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          current_round?: number
          drive_id: string
          id?: string
          last_event_at?: string
          notes?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          current_round?: number
          drive_id?: string
          id?: string
          last_event_at?: string
          notes?: string | null
          stage?: Database["public"]["Enums"]["application_stage"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drive_applications_drive_id_fkey"
            columns: ["drive_id"]
            isOneToOne: false
            referencedRelation: "placement_drives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drive_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_reports: {
        Row: {
          created_at: string
          details: string | null
          experience_id: string
          id: string
          reason: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["experience_report_status"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          experience_id: string
          id?: string
          reason: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["experience_report_status"]
        }
        Update: {
          created_at?: string
          details?: string | null
          experience_id?: string
          id?: string
          reason?: Database["public"]["Enums"]["experience_report_reason"]
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["experience_report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "experience_reports_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_votes: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_votes_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "interview_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_content: {
        Row: {
          ends_at: string | null
          slot: string
          starts_at: string | null
          target_id: string
          target_type: string
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          ends_at?: string | null
          slot: string
          starts_at?: string | null
          target_id: string
          target_type: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Update: {
          ends_at?: string | null
          slot?: string
          starts_at?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: []
      }
      gamification_rule_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: Json
          note: string | null
          old_value: Json | null
          rule_key: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value: Json
          note?: string | null
          old_value?: Json | null
          rule_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: Json
          note?: string | null
          old_value?: Json | null
          rule_key?: string
        }
        Relationships: []
      }
      institution_members: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          contact_email: string | null
          created_at: string
          created_by: string | null
          data_region: string
          default_retention_days: number
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          data_region?: string
          default_retention_days?: number
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          data_region?: string
          default_retention_days?: number
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_experiences: {
        Row: {
          company_name: string
          created_at: string
          ctc_lpa: number | null
          difficulty: string
          experience_type: Database["public"]["Enums"]["experience_type"]
          id: string
          location: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          offer_status: Database["public"]["Enums"]["offer_status"]
          overall_text: string
          role: string
          rounds: Json
          status: Database["public"]["Enums"]["experience_status"]
          tips: string | null
          updated_at: string
          upvotes: number
          user_id: string
          views: number
          year: number
        }
        Insert: {
          company_name: string
          created_at?: string
          ctc_lpa?: number | null
          difficulty?: string
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          location?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"]
          overall_text: string
          role: string
          rounds?: Json
          status?: Database["public"]["Enums"]["experience_status"]
          tips?: string | null
          updated_at?: string
          upvotes?: number
          user_id: string
          views?: number
          year: number
        }
        Update: {
          company_name?: string
          created_at?: string
          ctc_lpa?: number | null
          difficulty?: string
          experience_type?: Database["public"]["Enums"]["experience_type"]
          id?: string
          location?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          offer_status?: Database["public"]["Enums"]["offer_status"]
          overall_text?: string
          role?: string
          rounds?: Json
          status?: Database["public"]["Enums"]["experience_status"]
          tips?: string | null
          updated_at?: string
          upvotes?: number
          user_id?: string
          views?: number
          year?: number
        }
        Relationships: []
      }
      invite_source_backfill_runs: {
        Row: {
          by_source: Json
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          rows_scanned: number
          rows_updated: number
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          by_source?: Json
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_scanned?: number
          rows_updated?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          by_source?: Json
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_scanned?: number
          rows_updated?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          page: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      library_hidden_items: {
        Row: {
          category: string
          hidden_at: string
          hidden_by: string | null
          item_id: string
        }
        Insert: {
          category: string
          hidden_at?: string
          hidden_by?: string | null
          item_id: string
        }
        Update: {
          category?: string
          hidden_at?: string
          hidden_by?: string | null
          item_id?: string
        }
        Relationships: []
      }
      mcq_options: {
        Row: {
          body: string
          created_at: string
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          company: string | null
          created_at: string
          difficulty: string
          ended_at: string | null
          id: string
          role: string
          scorecard: Json | null
          started_at: string
          status: string
          transcript: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          role: string
          scorecard?: Json | null
          started_at?: string
          status?: string
          transcript?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          role?: string
          scorecard?: Json | null
          started_at?: string
          status?: string
          transcript?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          sent_by_admin: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          sent_by_admin?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          sent_by_admin?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_member_capabilities: {
        Row: {
          capability: string
          created_at: string
          id: string
          member_id: string
          org_id: string
        }
        Insert: {
          capability: string
          created_at?: string
          id?: string
          member_id: string
          org_id: string
        }
        Update: {
          capability?: string
          created_at?: string
          id?: string
          member_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_member_capabilities_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_member_capabilities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_student_invite_audit: {
        Row: {
          created_at: string
          detail: string | null
          email: string | null
          id: string
          invite_id: string | null
          ip: string | null
          org_id: string | null
          result: string
          student_id: string | null
          token_prefix: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          email?: string | null
          id?: string
          invite_id?: string | null
          ip?: string | null
          org_id?: string | null
          result: string
          student_id?: string | null
          token_prefix?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          email?: string | null
          id?: string
          invite_id?: string | null
          ip?: string | null
          org_id?: string | null
          result?: string
          student_id?: string | null
          token_prefix?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_student_invite_audit_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "org_student_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_student_invite_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_student_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          last_send_attempt_at: string | null
          last_send_error: string | null
          last_sent_at: string | null
          org_id: string
          revoked: boolean
          send_count: number
          student_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          last_sent_at?: string | null
          org_id: string
          revoked?: boolean
          send_count?: number
          student_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          last_send_attempt_at?: string | null
          last_send_error?: string | null
          last_sent_at?: string | null
          org_id?: string
          revoked?: boolean
          send_count?: number
          student_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_student_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_student_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      org_students: {
        Row: {
          activated_at: string | null
          batch_year: number | null
          branch: string | null
          created_at: string
          email: string
          enrolled_at: string
          enrolled_by: string | null
          full_name: string | null
          id: string
          last_active_at: string | null
          metadata: Json
          org_id: string
          roll_number: string | null
          section: string | null
          status: Database["public"]["Enums"]["org_student_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          batch_year?: number | null
          branch?: string | null
          created_at?: string
          email: string
          enrolled_at?: string
          enrolled_by?: string | null
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json
          org_id: string
          roll_number?: string | null
          section?: string | null
          status?: Database["public"]["Enums"]["org_student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          batch_year?: number | null
          branch?: string | null
          created_at?: string
          email?: string
          enrolled_at?: string
          enrolled_by?: string | null
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json
          org_id?: string
          roll_number?: string | null
          section?: string | null
          status?: Database["public"]["Enums"]["org_student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_students_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allow_retake_default: boolean | null
          allowed_email_domains: string[] | null
          approved_at: string | null
          approved_by: string | null
          auto_release_results: boolean | null
          brand_color: string | null
          created_at: string
          daily_summary_enabled: boolean | null
          default_duration_min: number | null
          default_pass_mark: number | null
          default_proctoring: string | null
          featured: boolean
          id: string
          logo_url: string | null
          name: string
          notify_emails: string[] | null
          owner_id: string
          proctoring_alert_emails: string[] | null
          require_mfa: boolean | null
          slack_webhook_url: string | null
          slug: string
          status: string
          team_session_minutes: number | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          allow_retake_default?: boolean | null
          allowed_email_domains?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          auto_release_results?: boolean | null
          brand_color?: string | null
          created_at?: string
          daily_summary_enabled?: boolean | null
          default_duration_min?: number | null
          default_pass_mark?: number | null
          default_proctoring?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name: string
          notify_emails?: string[] | null
          owner_id: string
          proctoring_alert_emails?: string[] | null
          require_mfa?: boolean | null
          slack_webhook_url?: string | null
          slug: string
          status?: string
          team_session_minutes?: number | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          allow_retake_default?: boolean | null
          allowed_email_domains?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          auto_release_results?: boolean | null
          brand_color?: string | null
          created_at?: string
          daily_summary_enabled?: boolean | null
          default_duration_min?: number | null
          default_pass_mark?: number | null
          default_proctoring?: string | null
          featured?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          notify_emails?: string[] | null
          owner_id?: string
          proctoring_alert_emails?: string[] | null
          require_mfa?: boolean | null
          slack_webhook_url?: string | null
          slug?: string
          status?: string
          team_session_minutes?: number | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      outreach_custom_templates: {
        Row: {
          body: string
          category: string
          created_at: string | null
          id: string
          placeholders: string[] | null
          platform: string
          subject: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string | null
          id?: string
          placeholders?: string[] | null
          platform?: string
          subject?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          placeholders?: string[] | null
          platform?: string
          subject?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outreach_favorites: {
        Row: {
          created_at: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_usage: {
        Row: {
          copied_at: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          copied_at?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          copied_at?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: []
      }
      placement_ai_runs: {
        Row: {
          cost_cents: number | null
          created_at: string
          filters: Json
          id: string
          kind: Database["public"]["Enums"]["placement_ai_kind"]
          org_id: string
          prompt: string | null
          response: string | null
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          filters?: Json
          id?: string
          kind: Database["public"]["Enums"]["placement_ai_kind"]
          org_id: string
          prompt?: string | null
          response?: string | null
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          filters?: Json
          id?: string
          kind?: Database["public"]["Enums"]["placement_ai_kind"]
          org_id?: string
          prompt?: string | null
          response?: string | null
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_ai_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_drives: {
        Row: {
          bond_months: number | null
          closes_at: string | null
          created_at: string
          created_by: string
          ctc_max: number | null
          ctc_min: number | null
          currency: string
          drive_type: Database["public"]["Enums"]["drive_type"]
          eligibility: Json
          id: string
          is_dream: boolean
          location: string | null
          notes: string | null
          opens_at: string | null
          org_id: string
          recruiter_id: string
          role_title: string | null
          status: Database["public"]["Enums"]["drive_status"]
          title: string
          updated_at: string
        }
        Insert: {
          bond_months?: number | null
          closes_at?: string | null
          created_at?: string
          created_by?: string
          ctc_max?: number | null
          ctc_min?: number | null
          currency?: string
          drive_type?: Database["public"]["Enums"]["drive_type"]
          eligibility?: Json
          id?: string
          is_dream?: boolean
          location?: string | null
          notes?: string | null
          opens_at?: string | null
          org_id: string
          recruiter_id: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["drive_status"]
          title: string
          updated_at?: string
        }
        Update: {
          bond_months?: number | null
          closes_at?: string | null
          created_at?: string
          created_by?: string
          ctc_max?: number | null
          ctc_min?: number | null
          currency?: string
          drive_type?: Database["public"]["Enums"]["drive_type"]
          eligibility?: Json
          id?: string
          is_dream?: boolean
          location?: string | null
          notes?: string | null
          opens_at?: string | null
          org_id?: string
          recruiter_id?: string
          role_title?: string | null
          status?: Database["public"]["Enums"]["drive_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_drives_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_drives_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_offers: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          ctc: number | null
          currency: string
          declined_at: string | null
          drive_id: string | null
          id: string
          is_dream_offer: boolean
          location: string | null
          notes: string | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          offered_at: string
          org_id: string
          recruiter_id: string
          role_title: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          ctc?: number | null
          currency?: string
          declined_at?: string | null
          drive_id?: string | null
          id?: string
          is_dream_offer?: boolean
          location?: string | null
          notes?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          offered_at?: string
          org_id: string
          recruiter_id: string
          role_title?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          ctc?: number | null
          currency?: string
          declined_at?: string | null
          drive_id?: string | null
          id?: string
          is_dream_offer?: boolean
          location?: string | null
          notes?: string | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          offered_at?: string
          org_id?: string
          recruiter_id?: string
          role_title?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_offers_drive_id_fkey"
            columns: ["drive_id"]
            isOneToOne: false
            referencedRelation: "placement_drives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_offers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_offers_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_offers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_readiness_scores: {
        Row: {
          breakdown: Json
          computed_at: string
          consistency_score: number
          contest_score: number
          created_at: string
          dsa_score: number
          id: string
          level: string
          resume_score: number
          score: number
          srs_score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          computed_at?: string
          consistency_score?: number
          contest_score?: number
          created_at?: string
          dsa_score?: number
          id?: string
          level?: string
          resume_score?: number
          score?: number
          srs_score?: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          computed_at?: string
          consistency_score?: number
          contest_score?: number
          created_at?: string
          dsa_score?: number
          id?: string
          level?: string
          resume_score?: number
          score?: number
          srs_score?: number
          user_id?: string
        }
        Relationships: []
      }
      placement_snapshots: {
        Row: {
          avg_ctc: number | null
          batch_year: number
          branch: string | null
          dream_offers: number
          id: string
          is_public: boolean
          median_ctc: number | null
          multi_offer_count: number
          org_id: string
          placed_count: number
          snapshot_at: string
          top_ctc: number | null
          total_eligible: number
        }
        Insert: {
          avg_ctc?: number | null
          batch_year: number
          branch?: string | null
          dream_offers?: number
          id?: string
          is_public?: boolean
          median_ctc?: number | null
          multi_offer_count?: number
          org_id: string
          placed_count?: number
          snapshot_at?: string
          top_ctc?: number | null
          total_eligible?: number
        }
        Update: {
          avg_ctc?: number | null
          batch_year?: number
          branch?: string | null
          dream_offers?: number
          id?: string
          is_public?: boolean
          median_ctc?: number | null
          multi_offer_count?: number
          org_id?: string
          placed_count?: number
          snapshot_at?: string
          top_ctc?: number | null
          total_eligible?: number
        }
        Relationships: [
          {
            foreignKeyName: "placement_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_student_scores: {
        Row: {
          applications_count: number
          assessments_taken: number
          avg_assessment_score: number | null
          avg_integrity: number | null
          computed_at: string
          id: string
          is_multi_offer: boolean
          is_placed: boolean
          offers_count: number
          org_id: string
          rank_in_branch: number | null
          rank_in_org: number | null
          score: number
          scores: Json
          shortlisted_count: number
          student_id: string
        }
        Insert: {
          applications_count?: number
          assessments_taken?: number
          avg_assessment_score?: number | null
          avg_integrity?: number | null
          computed_at?: string
          id?: string
          is_multi_offer?: boolean
          is_placed?: boolean
          offers_count?: number
          org_id: string
          rank_in_branch?: number | null
          rank_in_org?: number | null
          score?: number
          scores?: Json
          shortlisted_count?: number
          student_id: string
        }
        Update: {
          applications_count?: number
          assessments_taken?: number
          avg_assessment_score?: number | null
          avg_integrity?: number | null
          computed_at?: string
          id?: string
          is_multi_offer?: boolean
          is_placed?: boolean
          offers_count?: number
          org_id?: string
          rank_in_branch?: number | null
          rank_in_org?: number | null
          score?: number
          scores?: Json
          shortlisted_count?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_student_scores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_student_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_shared: boolean
          name: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name: string
          org_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          best_streak: number
          current_streak: number
          draws: number
          elo: number
          losses: number
          peak_elo: number
          total_battles: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          draws?: number
          elo?: number
          losses?: number
          peak_elo?: number
          total_battles?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          best_streak?: number
          current_streak?: number
          draws?: number
          elo?: number
          losses?: number
          peak_elo?: number
          total_battles?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      player_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          custom_links: Json
          is_public: boolean
          show_badges: boolean
          show_contests: boolean
          show_prs: boolean
          show_resume_score: boolean
          show_target_company: boolean
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          custom_links?: Json
          is_public?: boolean
          show_badges?: boolean
          show_contests?: boolean
          show_prs?: boolean
          show_resume_score?: boolean
          show_target_company?: boolean
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          custom_links?: Json
          is_public?: boolean
          show_badges?: boolean
          show_contests?: boolean
          show_prs?: boolean
          show_resume_score?: boolean
          show_target_company?: boolean
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proctoring_purge_runs: {
        Row: {
          error: string | null
          event_cutoff: string | null
          events_days: number | null
          events_deleted: number
          id: string
          ran_at: string
          snapshot_cutoff: string | null
          snapshot_days: number | null
          snapshots_deleted: number
          source: string
          triggered_by: string | null
        }
        Insert: {
          error?: string | null
          event_cutoff?: string | null
          events_days?: number | null
          events_deleted?: number
          id?: string
          ran_at?: string
          snapshot_cutoff?: string | null
          snapshot_days?: number | null
          snapshots_deleted?: number
          source?: string
          triggered_by?: string | null
        }
        Update: {
          error?: string | null
          event_cutoff?: string | null
          events_days?: number | null
          events_deleted?: number
          id?: string
          ran_at?: string
          snapshot_cutoff?: string | null
          snapshot_days?: number | null
          snapshots_deleted?: number
          source?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_premium: boolean
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_premium?: boolean
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_premium?: boolean
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      question_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          note: string | null
          org_id: string
          question_id: string
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          org_id: string
          question_id: string
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          note?: string | null
          org_id?: string
          question_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_status_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_test_cases: {
        Row: {
          created_at: string
          expected_output: string
          id: string
          input: string
          is_hidden: boolean
          order_index: number
          question_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          expected_output?: string
          id?: string
          input?: string
          is_hidden?: boolean
          order_index?: number
          question_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          expected_output?: string
          id?: string
          input?: string
          is_hidden?: boolean
          order_index?: number
          question_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_test_cases_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          body_md: string | null
          created_at: string
          created_by: string
          global_curated_by: string | null
          id: string
          is_global: boolean
          language: string | null
          meta: Json
          org_id: string | null
          points: number
          starter_code: string | null
          tier: string
          title: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          created_by?: string
          global_curated_by?: string | null
          id?: string
          is_global?: boolean
          language?: string | null
          meta?: Json
          org_id?: string | null
          points?: number
          starter_code?: string | null
          tier?: string
          title: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          created_by?: string
          global_curated_by?: string | null
          id?: string
          is_global?: boolean
          language?: string | null
          meta?: Json
          org_id?: string | null
          points?: number
          starter_code?: string | null
          tier?: string
          title?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_category: string
          question_id: number
          question_index: number
          quiz_result_id: string
          selected_answer_index: number | null
          time_taken_seconds: number | null
          was_flagged: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_category: string
          question_id: number
          question_index: number
          quiz_result_id: string
          selected_answer_index?: number | null
          time_taken_seconds?: number | null
          was_flagged?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_category?: string
          question_id?: number
          question_index?: number
          quiz_result_id?: string
          selected_answer_index?: number | null
          time_taken_seconds?: number | null
          was_flagged?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_responses_quiz_result_id_fkey"
            columns: ["quiz_result_id"]
            isOneToOne: false
            referencedRelation: "quiz_results"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          accuracy: number
          avg_time_seconds: number
          category: string | null
          completed_at: string
          created_at: string
          difficulty: string | null
          id: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }
        Insert: {
          accuracy: number
          avg_time_seconds: number
          category?: string | null
          completed_at?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }
        Update: {
          accuracy?: number
          avg_time_seconds?: number
          category?: string | null
          completed_at?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          quiz_type?: string
          score?: number
          total_questions?: number
          total_time_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_spaced_repetition: {
        Row: {
          correct_streak: number
          created_at: string
          id: string
          last_answered_at: string
          next_review_at: string
          question_category: string
          question_id: number
          question_title: string
          review_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          created_at?: string
          id?: string
          last_answered_at?: string
          next_review_at: string
          question_category: string
          question_id: number
          question_title: string
          review_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          created_at?: string
          id?: string
          last_answered_at?: string
          next_review_at?: string
          question_category?: string
          question_id?: number
          question_title?: string
          review_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          contacts: Json
          created_at: string
          created_by: string
          first_visit_year: number | null
          hq_city: string | null
          id: string
          is_repeat: boolean
          last_visit_year: number | null
          name: string
          notes: string | null
          org_id: string
          sector: Database["public"]["Enums"]["recruiter_sector"]
          updated_at: string
          website: string | null
        }
        Insert: {
          contacts?: Json
          created_at?: string
          created_by?: string
          first_visit_year?: number | null
          hq_city?: string | null
          id?: string
          is_repeat?: boolean
          last_visit_year?: number | null
          name: string
          notes?: string | null
          org_id: string
          sector?: Database["public"]["Enums"]["recruiter_sector"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          contacts?: Json
          created_at?: string
          created_by?: string
          first_visit_year?: number | null
          hq_city?: string | null
          id?: string
          is_repeat?: boolean
          last_visit_year?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          sector?: Database["public"]["Enums"]["recruiter_sector"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_analyses: {
        Row: {
          ats_score: number | null
          content_score: number | null
          created_at: string | null
          file_name: string
          file_url: string
          format_score: number | null
          id: string
          keyword_score: number | null
          keywords_found: Json | null
          overall_score: number | null
          strengths: Json | null
          suggestions: Json | null
          summary: string | null
          user_id: string
        }
        Insert: {
          ats_score?: number | null
          content_score?: number | null
          created_at?: string | null
          file_name: string
          file_url: string
          format_score?: number | null
          id?: string
          keyword_score?: number | null
          keywords_found?: Json | null
          overall_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          user_id: string
        }
        Update: {
          ats_score?: number | null
          content_score?: number | null
          created_at?: string | null
          file_name?: string
          file_url?: string
          format_score?: number | null
          id?: string
          keyword_score?: number | null
          keywords_found?: Json | null
          overall_score?: number | null
          strengths?: Json | null
          suggestions?: Json | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_downloads: {
        Row: {
          created_at: string
          downloaded_at: string
          id: string
          template_id: number
          template_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string
          id?: string
          template_id: number
          template_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string
          id?: string
          template_id?: number
          template_name?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_favorites: {
        Row: {
          created_at: string
          id: string
          template_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: number
          user_id?: string
        }
        Relationships: []
      }
      scheduled_broadcasts: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string
          id: string
          message: string
          recipient_count: number | null
          recipients_count: number
          scheduled_for: string
          sent_at: string | null
          target_filter: Json
          title: string
          type: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          message: string
          recipient_count?: number | null
          recipients_count?: number
          scheduled_for: string
          sent_at?: string | null
          target_filter?: Json
          title: string
          type?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          recipient_count?: number | null
          recipients_count?: number
          scheduled_for?: string
          sent_at?: string | null
          target_filter?: Json
          title?: string
          type?: string
        }
        Relationships: []
      }
      section_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          question_id: string
          section_id: string
          weight_override: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          question_id: string
          section_id: string
          weight_override?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          question_id?: string
          section_id?: string
          weight_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "section_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "assessment_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_folders: {
        Row: {
          allow_copy: boolean
          created_at: string
          expires_at: string | null
          folder_id: string
          id: string
          is_public: boolean
          share_code: string
        }
        Insert: {
          allow_copy?: boolean
          created_at?: string
          expires_at?: string | null
          folder_id: string
          id?: string
          is_public?: boolean
          share_code: string
        }
        Update: {
          allow_copy?: boolean
          created_at?: string
          expires_at?: string | null
          folder_id?: string
          id?: string
          is_public?: boolean
          share_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      sideeye_admin_approvals: {
        Row: {
          action: string
          approved_by: string | null
          contest_id: string | null
          decided_at: string | null
          id: string
          institution_id: string | null
          payload: Json
          reason: string | null
          requested_at: string
          requested_by: string
          status: string
        }
        Insert: {
          action: string
          approved_by?: string | null
          contest_id?: string | null
          decided_at?: string | null
          id?: string
          institution_id?: string | null
          payload?: Json
          reason?: string | null
          requested_at?: string
          requested_by: string
          status?: string
        }
        Update: {
          action?: string
          approved_by?: string | null
          contest_id?: string | null
          decided_at?: string | null
          id?: string
          institution_id?: string | null
          payload?: Json
          reason?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sideeye_admin_approvals_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sideeye_admin_approvals_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sideeye_admin_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          institution_id: string | null
          is_shared: boolean
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          institution_id?: string | null
          is_shared?: boolean
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          institution_id?: string | null
          is_shared?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sideeye_admin_views_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      sideeye_calibration_baselines: {
        Row: {
          baseline: Json
          captured_at: string
          contest_id: string
          created_at: string
          face_count_avg: number | null
          id: string
          lighting_profile: Json | null
          room_fingerprint: string | null
          sample_count: number
          session_id: string
          user_id: string
        }
        Insert: {
          baseline?: Json
          captured_at?: string
          contest_id: string
          created_at?: string
          face_count_avg?: number | null
          id?: string
          lighting_profile?: Json | null
          room_fingerprint?: string | null
          sample_count?: number
          session_id: string
          user_id: string
        }
        Update: {
          baseline?: Json
          captured_at?: string
          contest_id?: string
          created_at?: string
          face_count_avg?: number | null
          id?: string
          lighting_profile?: Json | null
          room_fingerprint?: string | null
          sample_count?: number
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      sideeye_candidate_reports: {
        Row: {
          category: string
          contest_id: string
          created_at: string
          id: string
          message: string | null
          resolved_at: string | null
          resolver_id: string | null
          resolver_note: string | null
          session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          category: string
          contest_id: string
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolver_id?: string | null
          resolver_note?: string | null
          session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          contest_id?: string
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          resolver_id?: string | null
          resolver_note?: string | null
          session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sideeye_candidate_reports_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      sideeye_evidence_chain: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          prev_hash: string | null
          seq: number
          session_id: string
          sha256: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          prev_hash?: string | null
          seq: number
          session_id: string
          sha256: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          prev_hash?: string | null
          seq?: number
          session_id?: string
          sha256?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sideeye_failed_analyses: {
        Row: {
          contest_id: string | null
          created_at: string
          error: string | null
          id: string
          next_retry_at: string
          payload: Json
          resolved_at: string | null
          retry_count: number
          session_id: string | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          next_retry_at?: string
          payload: Json
          resolved_at?: string | null
          retry_count?: number
          session_id?: string | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          next_retry_at?: string
          payload?: Json
          resolved_at?: string | null
          retry_count?: number
          session_id?: string | null
        }
        Relationships: []
      }
      sideeye_idempotency: {
        Row: {
          created_at: string
          function_name: string
          key: string
          result: Json | null
        }
        Insert: {
          created_at?: string
          function_name: string
          key: string
          result?: Json | null
        }
        Update: {
          created_at?: string
          function_name?: string
          key?: string
          result?: Json | null
        }
        Relationships: []
      }
      sideeye_notification_settings: {
        Row: {
          created_at: string
          escalate_kinds: string[]
          id: string
          min_severity: string
          notify_all_admins: boolean
          recipient_user_ids: string[]
          retention_days_audit: number
          retention_days_frames: number
          retention_days_recordings: number
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          escalate_kinds?: string[]
          id?: string
          min_severity?: string
          notify_all_admins?: boolean
          recipient_user_ids?: string[]
          retention_days_audit?: number
          retention_days_frames?: number
          retention_days_recordings?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          escalate_kinds?: string[]
          id?: string
          min_severity?: string
          notify_all_admins?: boolean
          recipient_user_ids?: string[]
          retention_days_audit?: number
          retention_days_frames?: number
          retention_days_recordings?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sideeye_review_feedback: {
        Row: {
          audit_log_id: string | null
          contest_id: string | null
          created_at: string
          finding_kind: string | null
          finding_type: string | null
          id: string
          is_false_positive: boolean
          note: string | null
          reason: string | null
          reviewer_id: string
          session_id: string | null
          verdict: string
        }
        Insert: {
          audit_log_id?: string | null
          contest_id?: string | null
          created_at?: string
          finding_kind?: string | null
          finding_type?: string | null
          id?: string
          is_false_positive: boolean
          note?: string | null
          reason?: string | null
          reviewer_id: string
          session_id?: string | null
          verdict: string
        }
        Update: {
          audit_log_id?: string | null
          contest_id?: string | null
          created_at?: string
          finding_kind?: string | null
          finding_type?: string | null
          id?: string
          is_false_positive?: boolean
          note?: string | null
          reason?: string | null
          reviewer_id?: string
          session_id?: string | null
          verdict?: string
        }
        Relationships: []
      }
      sideeye_runtime_flags: {
        Row: {
          contest_id: string
          frame_interval_ms: number
          high_load: boolean
          notes: string | null
          queue_depth: number
          updated_at: string
        }
        Insert: {
          contest_id: string
          frame_interval_ms?: number
          high_load?: boolean
          notes?: string | null
          queue_depth?: number
          updated_at?: string
        }
        Update: {
          contest_id?: string
          frame_interval_ms?: number
          high_load?: boolean
          notes?: string | null
          queue_depth?: number
          updated_at?: string
        }
        Relationships: []
      }
      sideeye_session_pauses: {
        Row: {
          created_at: string
          id: string
          paused_at: string
          paused_by: string
          reason: string | null
          resumed_at: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paused_at?: string
          paused_by: string
          reason?: string | null
          resumed_at?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paused_at?: string
          paused_by?: string
          reason?: string | null
          resumed_at?: string | null
          session_id?: string
        }
        Relationships: []
      }
      solo_ratings: {
        Row: {
          games_played: number
          mode: string
          peak_rating: number
          rating: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          games_played?: number
          mode: string
          peak_rating?: number
          rating?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          games_played?: number
          mode?: string
          peak_rating?: number
          rating?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solo_session_problems: {
        Row: {
          attempts: number
          awarded_score: number
          created_at: string
          first_ac_at: string | null
          id: string
          ord: number
          problem_slug: string
          session_id: string
          time_to_ac_sec: number | null
          user_id: string
          wrong_submits: number
        }
        Insert: {
          attempts?: number
          awarded_score?: number
          created_at?: string
          first_ac_at?: string | null
          id?: string
          ord?: number
          problem_slug: string
          session_id: string
          time_to_ac_sec?: number | null
          user_id: string
          wrong_submits?: number
        }
        Update: {
          attempts?: number
          awarded_score?: number
          created_at?: string
          first_ac_at?: string | null
          id?: string
          ord?: number
          problem_slug?: string
          session_id?: string
          time_to_ac_sec?: number | null
          user_id?: string
          wrong_submits?: number
        }
        Relationships: [
          {
            foreignKeyName: "solo_session_problems_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "solo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      solo_sessions: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          difficulty: string
          duration_sec: number
          ends_at: string
          focus_lost_count: number
          id: string
          max_score: number
          mode: string
          paste_count: number
          rating_delta: number
          score: number
          started_at: string
          status: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          difficulty?: string
          duration_sec: number
          ends_at: string
          focus_lost_count?: number
          id?: string
          max_score?: number
          mode: string
          paste_count?: number
          rating_delta?: number
          score?: number
          started_at?: string
          status?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          difficulty?: string
          duration_sec?: number
          ends_at?: string
          focus_lost_count?: number
          id?: string
          max_score?: number
          mode?: string
          paste_count?: number
          rating_delta?: number
          score?: number
          started_at?: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      student_profile_preferences: {
        Row: {
          allow_public_share: boolean
          headline: string | null
          show_contact: boolean
          show_resume: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          allow_public_share?: boolean
          headline?: string | null
          show_contact?: boolean
          show_resume?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          allow_public_share?: boolean
          headline?: string | null
          show_contact?: boolean
          show_resume?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_preferences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_share_links: {
        Row: {
          allow_contact: boolean
          allow_resume: boolean
          created_at: string
          created_by: string
          expires_at: string
          id: string
          kind: Database["public"]["Enums"]["student_share_kind"]
          last_viewed_at: string | null
          message: string | null
          org_id: string
          recruiter_email: string | null
          recruiter_name: string | null
          revoked_at: string | null
          student_id: string | null
          student_ids: string[]
          token: string
          view_count: number
        }
        Insert: {
          allow_contact?: boolean
          allow_resume?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["student_share_kind"]
          last_viewed_at?: string | null
          message?: string | null
          org_id: string
          recruiter_email?: string | null
          recruiter_name?: string | null
          revoked_at?: string | null
          student_id?: string | null
          student_ids?: string[]
          token: string
          view_count?: number
        }
        Update: {
          allow_contact?: boolean
          allow_resume?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["student_share_kind"]
          last_viewed_at?: string | null
          message?: string | null
          org_id?: string
          recruiter_email?: string | null
          recruiter_name?: string | null
          revoked_at?: string | null
          student_id?: string | null
          student_ids?: string[]
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_share_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_share_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "org_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_share_views: {
        Row: {
          id: string
          ip_hash: string | null
          referrer: string | null
          share_id: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          share_id: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          share_id?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_share_views_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "student_share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_goals: {
        Row: {
          category: string
          completed_at: string | null
          id: string
          is_completed: boolean
          questions_practiced: number
          started_at: string
          target_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          questions_practiced?: number
          started_at?: string
          target_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          questions_practiced?: number
          started_at?: string
          target_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_canned_replies: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          email: string
          id: string
          replied_at: string | null
          replied_by: string | null
          reply_body: string | null
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          email: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          email?: string
          id?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_body?: string | null
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      target_companies: {
        Row: {
          company_name: string
          created_at: string
          id: string
          is_primary: boolean
          notes: string | null
          role: string
          timeline_weeks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          role?: string
          timeline_weeks?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          role?: string
          timeline_weeks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_company_progress: {
        Row: {
          company_id: string
          created_at: string
          id: string
          item_id: number
          revision: boolean
          solved: boolean
          tab_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          item_id: number
          revision?: boolean
          solved?: boolean
          tab_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          item_id?: number
          revision?: boolean
          solved?: boolean
          tab_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_folder_items: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          question_id: number
          question_source: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          question_id: number
          question_source?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          question_id?: number
          question_source?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          daily_target: number
          daily_xp_target: number | null
          id: string
          updated_at: string
          user_id: string
          weekly_target: number
          weekly_xp_target: number | null
        }
        Insert: {
          created_at?: string
          daily_target?: number
          daily_xp_target?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weekly_target?: number
          weekly_xp_target?: number | null
        }
        Update: {
          created_at?: string
          daily_target?: number
          daily_xp_target?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weekly_target?: number
          weekly_xp_target?: number | null
        }
        Relationships: []
      }
      user_platform_stats: {
        Row: {
          created_at: string
          handle: string
          id: string
          last_synced_at: string
          platform: string
          rating: number | null
          raw: Json
          solved_easy: number
          solved_hard: number
          solved_medium: number
          solved_total: number
          sync_error: string | null
          sync_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          last_synced_at?: string
          platform: string
          rating?: number | null
          raw?: Json
          solved_easy?: number
          solved_hard?: number
          solved_medium?: number
          solved_total?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          last_synced_at?: string
          platform?: string
          rating?: number | null
          raw?: Json
          solved_easy?: number
          solved_hard?: number
          solved_medium?: number
          solved_total?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_platform_sync_jobs: {
        Row: {
          created_at: string
          enabled: boolean
          handle: string
          interval_hours: number
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          next_run_at: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          handle: string
          interval_hours?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          handle?: string
          interval_hours?: number
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_problem_solutions: {
        Row: {
          code: Json
          code_updated_at: Json
          created_at: string
          id: string
          notes: string
          notes_updated_at: string | null
          problem_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: Json
          code_updated_at?: Json
          created_at?: string
          id?: string
          notes?: string
          notes_updated_at?: string | null
          problem_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: Json
          code_updated_at?: Json
          created_at?: string
          id?: string
          notes?: string
          notes_updated_at?: string | null
          problem_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles_extended: {
        Row: {
          aspirations: string[] | null
          bio: string | null
          branch: string | null
          codechef_url: string | null
          codeforces_url: string | null
          coding_leaderboard_hidden: boolean
          college_name: string | null
          company_name: string | null
          course_name: string | null
          created_at: string
          current_experience: string | null
          current_level: number | null
          email_notifications_enabled: boolean | null
          experience: string | null
          geeksforgeeks_url: string | null
          github_url: string | null
          goals: string[] | null
          hackerrank_url: string | null
          id: string
          instagram_url: string | null
          interested_features: string[] | null
          interests: string[] | null
          is_suspended: boolean
          last_xp_reset_at: string | null
          leaderboard_hidden: boolean
          leetcode_url: string | null
          linkedin_url: string | null
          location: string | null
          marketing_emails_enabled: boolean | null
          mobile_number: string | null
          new_feature_alerts_enabled: boolean | null
          notify_achievement_unlock: boolean | null
          notify_goal_milestone: boolean | null
          notify_new_follower: boolean | null
          notify_rare_achievement: boolean | null
          notify_streak_reminder: boolean | null
          notify_velocity_reminder: boolean | null
          occupation: string | null
          onboarding_completed: boolean | null
          other_description: string | null
          other_links: Json | null
          profile_completion_percentage: number | null
          referral_source: string | null
          resume_url: string | null
          role: string | null
          skills: string[] | null
          srs_intervals: number[] | null
          srs_mastery_threshold: number | null
          study_year: Database["public"]["Enums"]["study_year"] | null
          suspended_at: string | null
          suspended_reason: string | null
          target_goal: string | null
          theme_preference: string | null
          total_xp: number | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
          website: string | null
          weekly_digest_enabled: boolean | null
          xp_this_week: number | null
        }
        Insert: {
          aspirations?: string[] | null
          bio?: string | null
          branch?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          coding_leaderboard_hidden?: boolean
          college_name?: string | null
          company_name?: string | null
          course_name?: string | null
          created_at?: string
          current_experience?: string | null
          current_level?: number | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          id?: string
          instagram_url?: string | null
          interested_features?: string[] | null
          interests?: string[] | null
          is_suspended?: boolean
          last_xp_reset_at?: string | null
          leaderboard_hidden?: boolean
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          marketing_emails_enabled?: boolean | null
          mobile_number?: string | null
          new_feature_alerts_enabled?: boolean | null
          notify_achievement_unlock?: boolean | null
          notify_goal_milestone?: boolean | null
          notify_new_follower?: boolean | null
          notify_rare_achievement?: boolean | null
          notify_streak_reminder?: boolean | null
          notify_velocity_reminder?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          other_description?: string | null
          other_links?: Json | null
          profile_completion_percentage?: number | null
          referral_source?: string | null
          resume_url?: string | null
          role?: string | null
          skills?: string[] | null
          srs_intervals?: number[] | null
          srs_mastery_threshold?: number | null
          study_year?: Database["public"]["Enums"]["study_year"] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_goal?: string | null
          theme_preference?: string | null
          total_xp?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
          weekly_digest_enabled?: boolean | null
          xp_this_week?: number | null
        }
        Update: {
          aspirations?: string[] | null
          bio?: string | null
          branch?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          coding_leaderboard_hidden?: boolean
          college_name?: string | null
          company_name?: string | null
          course_name?: string | null
          created_at?: string
          current_experience?: string | null
          current_level?: number | null
          email_notifications_enabled?: boolean | null
          experience?: string | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          id?: string
          instagram_url?: string | null
          interested_features?: string[] | null
          interests?: string[] | null
          is_suspended?: boolean
          last_xp_reset_at?: string | null
          leaderboard_hidden?: boolean
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          marketing_emails_enabled?: boolean | null
          mobile_number?: string | null
          new_feature_alerts_enabled?: boolean | null
          notify_achievement_unlock?: boolean | null
          notify_goal_milestone?: boolean | null
          notify_new_follower?: boolean | null
          notify_rare_achievement?: boolean | null
          notify_streak_reminder?: boolean | null
          notify_velocity_reminder?: boolean | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          other_description?: string | null
          other_links?: Json | null
          profile_completion_percentage?: number | null
          referral_source?: string | null
          resume_url?: string | null
          role?: string | null
          skills?: string[] | null
          srs_intervals?: number[] | null
          srs_mastery_threshold?: number | null
          study_year?: Database["public"]["Enums"]["study_year"] | null
          suspended_at?: string | null
          suspended_reason?: string | null
          target_goal?: string | null
          theme_preference?: string | null
          total_xp?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
          website?: string | null
          weekly_digest_enabled?: boolean | null
          xp_this_week?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_study_focus_sessions: {
        Row: {
          actual_minutes: number | null
          completed_cycles: number
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_cycles?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed_cycles?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_study_focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_study_plan_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_study_plan_tasks: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string
          day_date: string
          difficulty: string
          est_minutes: number
          id: string
          locked: boolean
          order_index: number
          plan_id: string
          scheduled_end: string | null
          scheduled_start: string | null
          score: number | null
          source_id: string | null
          source_type: string | null
          source_url: string | null
          started_at: string | null
          status: string
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          day_date: string
          difficulty?: string
          est_minutes?: number
          id?: string
          locked?: boolean
          order_index?: number
          plan_id: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          score?: number | null
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          day_date?: string
          difficulty?: string
          est_minutes?: number
          id?: string
          locked?: boolean
          order_index?: number
          plan_id?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          score?: number | null
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_study_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "user_study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_study_plans: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          is_active: boolean
          model: string | null
          plan: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          plan?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          is_active?: boolean
          model?: string | null
          plan?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_study_profile: {
        Row: {
          created_at: string
          goal: string
          level: string
          notes: string | null
          target_date: string | null
          topics_known: string[]
          updated_at: string
          user_id: string
          weekday_minutes: number
          weekend_minutes: number
        }
        Insert: {
          created_at?: string
          goal: string
          level?: string
          notes?: string | null
          target_date?: string | null
          topics_known?: string[]
          updated_at?: string
          user_id: string
          weekday_minutes?: number
          weekend_minutes?: number
        }
        Update: {
          created_at?: string
          goal?: string
          level?: string
          notes?: string | null
          target_date?: string | null
          topics_known?: string[]
          updated_at?: string
          user_id?: string
          weekday_minutes?: number
          weekend_minutes?: number
        }
        Relationships: []
      }
      user_topic_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          is_revision: boolean
          note: string | null
          review_count: number
          sheet_id: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_revision?: boolean
          note?: string | null
          review_count?: number
          sheet_id: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          is_revision?: boolean
          note?: string | null
          review_count?: number
          sheet_id?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json
          reference_id: string | null
          reversal_of: string | null
          reversal_reason: string | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          reversal_of?: string | null
          reversal_reason?: string | null
          source: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json
          reference_id?: string | null
          reversal_of?: string | null
          reversal_reason?: string | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "xp_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      b2b_onboarding_funnel: {
        Row: {
          copy_link_events: number | null
          invite_resend_events: number | null
          invite_send_events: number | null
          orgs_created: number | null
          pct_invite_to_copy: number | null
          pct_orgs_skipped: number | null
          pct_orgs_to_invite_send: number | null
          users_copied_link: number | null
          users_sent_invites: number | null
          users_skipped: number | null
        }
        Relationships: []
      }
      leaderboard_view: {
        Row: {
          avatar_url: string | null
          completed_count: number | null
          full_name: string | null
          revision_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      public_user_profiles: {
        Row: {
          aspirations: string[] | null
          bio: string | null
          codechef_url: string | null
          codeforces_url: string | null
          created_at: string | null
          current_level: number | null
          geeksforgeeks_url: string | null
          github_url: string | null
          goals: string[] | null
          hackerrank_url: string | null
          instagram_url: string | null
          interests: string[] | null
          leetcode_url: string | null
          linkedin_url: string | null
          location: string | null
          occupation: string | null
          profile_completion_percentage: number | null
          skills: string[] | null
          total_xp: number | null
          twitter_url: string | null
          user_id: string | null
          username: string | null
          website: string | null
          xp_this_week: number | null
        }
        Insert: {
          aspirations?: string[] | null
          bio?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          created_at?: string | null
          current_level?: number | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          occupation?: string | null
          profile_completion_percentage?: number | null
          skills?: string[] | null
          total_xp?: number | null
          twitter_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
          xp_this_week?: number | null
        }
        Update: {
          aspirations?: string[] | null
          bio?: string | null
          codechef_url?: string | null
          codeforces_url?: string | null
          created_at?: string | null
          current_level?: number | null
          geeksforgeeks_url?: string | null
          github_url?: string | null
          goals?: string[] | null
          hackerrank_url?: string | null
          instagram_url?: string | null
          interests?: string[] | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          occupation?: string | null
          profile_completion_percentage?: number | null
          skills?: string[] | null
          total_xp?: number | null
          twitter_url?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
          xp_this_week?: number | null
        }
        Relationships: []
      }
      xp_leaderboard_view: {
        Row: {
          avatar_url: string | null
          current_level: number | null
          full_name: string | null
          total_xp: number | null
          user_id: string | null
          username: string | null
          xp_this_week: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _admin_audit: {
        Args: {
          _action: string
          _diff?: Json
          _entity_slug: string
          _entity_type: string
        }
        Returns: undefined
      }
      _infer_invite_source: {
        Args: { p_email: string; p_external_id: string; p_name: string }
        Returns: Database["public"]["Enums"]["invite_source"]
      }
      accept_b2b_org_invite: { Args: { _token: string }; Returns: string }
      acknowledge_logout: { Args: never; Returns: undefined }
      admin_achievement_stats: {
        Args: never
        Returns: {
          achievement_id: string
          earned_count: number
          last_earned: string
        }[]
      }
      admin_adjust_xp: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_audit_entity_types: {
        Args: never
        Returns: {
          entity_type: string
        }[]
      }
      admin_broadcast_notification: {
        Args: {
          _audience: Json
          _data?: Json
          _message: string
          _title: string
        }
        Returns: number
      }
      admin_cancel_scheduled_broadcast: {
        Args: { _id: string }
        Returns: undefined
      }
      admin_canned_reply_delete: { Args: { _id: string }; Returns: undefined }
      admin_canned_reply_upsert: {
        Args: { _body: string; _id: string; _label: string }
        Returns: string
      }
      admin_chat_usage: { Args: never; Returns: Json }
      admin_daily_challenge_claimers: {
        Args: { _date: string }
        Returns: {
          attempted_at: string
          display_name: string
          solve_time_sec: number
          solved: boolean
          solved_at: string
          user_id: string
          xp_awarded: number
        }[]
      }
      admin_daily_challenge_claimers_range: {
        Args: { _from: string; _to: string }
        Returns: {
          attempted_at: string
          challenge_date: string
          claimed: boolean
          display_name: string
          problem_slug: string
          solve_time_sec: number
          solved: boolean
          solved_at: string
          user_id: string
          xp_awarded: number
        }[]
      }
      admin_daily_challenge_user_detail: {
        Args: { _date: string; _user_id: string }
        Returns: Json
      }
      admin_dashboard_kpis: { Args: never; Returns: Json }
      admin_delete_ai_content: { Args: { _id: string }; Returns: undefined }
      admin_delete_quiz_attempt: {
        Args: { _attempt_id: string }
        Returns: undefined
      }
      admin_delete_resume: { Args: { _id: string }; Returns: string }
      admin_export_submissions: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          created_at: string
          id: string
          is_submission: boolean
          language: string
          memory_kb: number
          problem_slug: string
          runtime_ms: number
          user_id: string
          verdict: string
        }[]
      }
      admin_export_users: {
        Args: { _limit?: number }
        Returns: {
          current_level: number
          email: string
          full_name: string
          is_suspended: boolean
          joined_at: string
          last_active_at: string
          roles: string
          total_xp: number
          user_id: string
          username: string
        }[]
      }
      admin_flag_registry_upsert: {
        Args: {
          _description: string
          _key: string
          _rollout_pct: number
          _schema: Json
          _type: string
        }
        Returns: undefined
      }
      admin_force_logout: {
        Args: { _reason?: string; _user_id: string }
        Returns: string
      }
      admin_force_snapshot_leaderboard: { Args: never; Returns: number }
      admin_gamification_history: {
        Args: { _key?: string; _limit?: number }
        Returns: {
          actor_name: string
          changed_at: string
          changed_by: string
          id: string
          new_value: Json
          note: string
          old_value: Json
          rule_key: string
        }[]
      }
      admin_get_ai_insight_overview: {
        Args: { _days?: number }
        Returns: {
          down_count: number
          flag_reason: string
          flagged_at: string
          insight_key: string
          insight_title: string
          is_flagged: boolean
          last_at: string
          net_score: number
          org_count: number
          total_count: number
          up_count: number
        }[]
      }
      admin_get_daily_review_audit: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          actor_id: string
          actor_name: string
          attempt_count: number
          challenge_date: string
          created_at: string
          id: string
          inspected_user_id: string
          inspected_user_name: string
          seeded_problem_slug: string
          submission_count: number
        }[]
      }
      admin_get_full_problem: { Args: { _slug: string }; Returns: Json }
      admin_get_gamification_rules: { Args: never; Returns: Json }
      admin_grant_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: undefined
      }
      admin_grant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_leaderboard_top: {
        Args: { _limit?: number; _window?: string }
        Returns: {
          avatar_url: string
          current_level: number
          full_name: string
          leaderboard_hidden: boolean
          total_xp: number
          user_id: string
          username: string
          xp_this_week: number
        }[]
      }
      admin_list_ai_insight_feedback: {
        Args: {
          _insight_key?: string
          _limit?: number
          _offset?: number
          _org_id?: string
          _rating?: Database["public"]["Enums"]["ai_insight_rating"]
        }
        Returns: {
          comment: string
          created_at: string
          id: string
          insight_key: string
          insight_title: string
          org_id: string
          org_name: string
          rating: Database["public"]["Enums"]["ai_insight_rating"]
          total_count: number
          updated_at: string
          user_avatar_url: string
          user_email: string
          user_full_name: string
          user_id: string
        }[]
      }
      admin_list_audit_log: {
        Args: {
          _action?: string
          _actor?: string
          _entity_type?: string
          _from?: string
          _limit?: number
          _offset?: number
          _to?: string
        }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          diff: Json
          entity_slug: string
          entity_type: string
          id: string
          total_count: number
        }[]
      }
      admin_list_conversations: {
        Args: { _limit?: number; _offset?: number; _user_id?: string }
        Returns: {
          full_name: string
          id: string
          message_count: number
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_list_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          last_return_message: string
          last_run_started_at: string
          last_status: string
          schedule: string
        }[]
      }
      admin_list_notifications: {
        Args: {
          _limit?: number
          _offset?: number
          _type?: string
          _user_id?: string
        }
        Returns: {
          created_at: string
          data: Json
          full_name: string
          id: string
          message: string
          read: boolean
          sent_by_admin: string
          title: string
          type: string
          user_id: string
          username: string
        }[]
      }
      admin_list_outreach_templates: {
        Args: { _limit?: number; _offset?: number; _q?: string }
        Returns: {
          category: string
          copies: number
          created_at: string
          full_name: string
          hidden: boolean
          id: string
          platform: string
          title: string
          user_id: string
        }[]
      }
      admin_list_public_tables: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      admin_list_push_subscriptions: {
        Args: { _limit?: number; _user_id?: string }
        Returns: {
          created_at: string
          endpoint: string
          full_name: string
          id: string
          is_active: boolean
          user_id: string
        }[]
      }
      admin_list_quiz_attempts: {
        Args: {
          _category?: string
          _limit?: number
          _offset?: number
          _user_id?: string
        }
        Returns: {
          accuracy: number
          category: string
          completed_at: string
          difficulty: string
          full_name: string
          id: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
          username: string
        }[]
      }
      admin_list_resumes: {
        Args: { _limit?: number; _offset?: number; _user_id?: string }
        Returns: {
          ats_score: number
          created_at: string
          file_name: string
          file_url: string
          full_name: string
          id: string
          overall_score: number
          user_id: string
        }[]
      }
      admin_list_scheduled_broadcasts: {
        Args: { _only_pending?: boolean }
        Returns: {
          cancelled_at: string | null
          created_at: string
          created_by: string
          id: string
          message: string
          recipient_count: number | null
          recipients_count: number
          scheduled_for: string
          sent_at: string | null
          target_filter: Json
          title: string
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "scheduled_broadcasts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_shared_folders: {
        Args: { _limit?: number; _offset?: number }
        Returns: {
          allow_copy: boolean
          created_at: string
          expires_at: string
          folder_id: string
          folder_name: string
          id: string
          is_public: boolean
          owner_name: string
          owner_user_id: string
          share_code: string
        }[]
      }
      admin_list_submissions: {
        Args: {
          _limit?: number
          _offset?: number
          _problem_slug?: string
          _user_id?: string
          _verdict?: string
        }
        Returns: {
          created_at: string
          full_name: string
          id: string
          language: string
          memory_kb: number
          passed_tests: number
          problem_slug: string
          runtime_ms: number
          total_tests: number
          user_id: string
          verdict: string
        }[]
      }
      admin_list_table_policies: {
        Args: { _table: string }
        Returns: {
          check_expr: string
          command: string
          permissive: string
          policy_name: string
          roles: string[]
          using_expr: string
        }[]
      }
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          avatar_url: string
          current_level: number
          email: string
          full_name: string
          is_suspended: boolean
          joined_at: string
          last_active_at: string
          roles: string[]
          total_xp: number
          user_id: string
          username: string
        }[]
      }
      admin_outreach_stats: { Args: never; Returns: Json }
      admin_problem_acceptance: {
        Args: { _limit?: number }
        Returns: {
          acceptance: number
          accepted: number
          problem_slug: string
          total: number
        }[]
      }
      admin_purge_audit_older_than: { Args: { _days: number }; Returns: number }
      admin_purge_user_conversations: {
        Args: { _user_id: string }
        Returns: number
      }
      admin_quiz_overview: {
        Args: never
        Returns: {
          attempts: number
          avg_accuracy: number
          avg_time_sec: number
          category: string
          quiz_type: string
        }[]
      }
      admin_recent_auth_events: {
        Args: { _limit?: number }
        Returns: {
          action: string
          created_at: string
          id: string
          ip_address: string
          payload: Json
        }[]
      }
      admin_recompute_achievements: {
        Args: { _user_id: string }
        Returns: number
      }
      admin_reset_srs: {
        Args: { _category?: string; _user_id: string }
        Returns: number
      }
      admin_resolve_report: {
        Args: { _id: string; _new_status: string }
        Returns: undefined
      }
      admin_resume_stats: { Args: never; Returns: Json }
      admin_revoke_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: undefined
      }
      admin_revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_revoke_share: { Args: { _share_id: string }; Returns: undefined }
      admin_role_audit: {
        Args: { _action?: string; _limit?: number; _user_id?: string }
        Returns: {
          action: string
          actor_email: string
          actor_id: string
          actor_name: string
          created_at: string
          diff: Json
          id: string
          role: string
          target_email: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_rollback_daily_challenge: { Args: { _date: string }; Returns: Json }
      admin_run_invite_source_backfill: {
        Args: never
        Returns: {
          by_source: Json
          duration_ms: number
          rows_scanned: number
          rows_updated: number
          run_id: string
        }[]
      }
      admin_run_sideeye_purge: { Args: never; Returns: Json }
      admin_save_problem: { Args: { payload: Json }; Returns: Json }
      admin_schedule_broadcast: {
        Args: {
          _message: string
          _scheduled_for: string
          _target_filter: Json
          _title: string
          _type: string
        }
        Returns: string
      }
      admin_schedule_daily_challenge: {
        Args: { _date: string; _slug: string }
        Returns: undefined
      }
      admin_search_users: {
        Args: { _limit?: number; _q: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
          username: string
        }[]
      }
      admin_send_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      admin_set_ai_content_visibility: {
        Args: { _id: string; _is_public: boolean }
        Returns: undefined
      }
      admin_set_gamification_rule: {
        Args: { _key: string; _note?: string; _value: Json }
        Returns: undefined
      }
      admin_set_insight_flag: {
        Args: {
          _flagged?: boolean
          _insight_key: string
          _insight_title: string
          _reason?: string
        }
        Returns: boolean
      }
      admin_set_leaderboard_hidden: {
        Args: { _hidden: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_outreach_hidden: {
        Args: { _hidden: boolean; _reason?: string; _template_id: string }
        Returns: undefined
      }
      admin_set_setting: {
        Args: { _key: string; _value: Json }
        Returns: undefined
      }
      admin_storage_stats: {
        Args: never
        Returns: {
          bucket_id: string
          object_count: number
          total_bytes: number
        }[]
      }
      admin_submission_detail: { Args: { _id: string }; Returns: Json }
      admin_suspend_user: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_system_health: { Args: never; Returns: Json }
      admin_trend_signups: {
        Args: { _days?: number }
        Returns: {
          day: string
          signups: number
        }[]
      }
      admin_trend_submissions: {
        Args: { _days?: number }
        Returns: {
          accepted: number
          day: string
          total: number
        }[]
      }
      admin_unsuspend_user: { Args: { _user_id: string }; Returns: undefined }
      admin_user_detail: { Args: { _user_id: string }; Returns: Json }
      arena_claim_quest: { Args: { _user_quest_id: string }; Returns: Json }
      arena_complete_daily_challenge: {
        Args: { _battle_id: string; _solve_time_sec: number }
        Returns: Json
      }
      arena_ensure_daily_quests: {
        Args: never
        Returns: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          quest_date: string
          quest_id: string
          target: number
          user_id: string
          xp_reward: number
        }[]
        SetofOptions: {
          from: "*"
          to: "arena_user_daily_quests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      arena_get_daily_challenge: {
        Args: never
        Returns: {
          attempted: boolean
          bonus_xp: number
          challenge_date: string
          challenge_id: string
          global_solves: number
          problem_slug: string
          solve_time_sec: number
          solved: boolean
        }[]
      }
      arena_get_daily_history:
        | {
            Args: { _days?: number }
            Returns: {
              attempted_at: string
              challenge_date: string
              problem_slug: string
              problem_title: string
              solve_time_sec: number
              solved: boolean
              xp_awarded: number
            }[]
          }
        | {
            Args: { _days?: number; _offset?: number }
            Returns: {
              attempted_at: string
              challenge_date: string
              problem_slug: string
              problem_title: string
              solve_time_sec: number
              solved: boolean
              xp_awarded: number
            }[]
          }
      arena_get_daily_history_range: {
        Args: { _from: string; _to: string }
        Returns: {
          attempted_at: string
          challenge_date: string
          problem_slug: string
          problem_title: string
          solve_time_sec: number
          solved: boolean
          xp_awarded: number
        }[]
      }
      arena_pick_daily_problem: { Args: { _for_date: string }; Returns: string }
      arena_record_quest_progress: {
        Args: { _amount?: number; _kind: string }
        Returns: undefined
      }
      arena_tick_streak: { Args: never; Returns: Json }
      assessment_org: { Args: { _assessment: string }; Returns: string }
      assign_contest_variant: {
        Args: { _contest_id: string; _problem_slug: string }
        Returns: {
          assigned_at: string
          contest_id: string
          id: string
          problem_slug: string
          user_id: string
          variant_id: string
          variant_key: string
        }
        SetofOptions: {
          from: "*"
          to: "contest_user_variants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      attach_problem_to_contest: {
        Args: { _contest_id: string; _problem_slug: string }
        Returns: Json
      }
      attempt_assessment_org: { Args: { _attempt: string }; Returns: string }
      attempt_owner: { Args: { _attempt: string }; Returns: string }
      audit_daily_completions: { Args: never; Returns: Json }
      audit_daily_completions_all: { Args: never; Returns: Json }
      award_earned_achievements: { Args: never; Returns: string[] }
      award_xp: {
        Args: {
          _amount: number
          _description?: string
          _source: string
          _user_id: string
        }
        Returns: Json
      }
      award_xp_idempotent: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_reference_id: string
          p_source: string
          p_user_id: string
        }
        Returns: string
      }
      b2b_my_role: { Args: { _org_id: string }; Returns: string }
      b2b_user_owns_org: { Args: { _org_id: string }; Returns: boolean }
      backfill_assessment_invite_sources: {
        Args: never
        Returns: {
          by_source: Json
          duration_ms: number
          rows_scanned: number
          rows_updated: number
          run_id: string
        }[]
      }
      battle_accept_invite: { Args: { _invite: string }; Returns: string }
      battle_create_code: {
        Args: {
          _difficulty: Database["public"]["Enums"]["battle_difficulty"]
          _duration?: number
          _problem_slug: string
        }
        Returns: {
          code: string
          invite_id: string
        }[]
      }
      battle_create_private: {
        Args: {
          _difficulty: Database["public"]["Enums"]["battle_difficulty"]
          _duration?: number
          _problem_slug: string
          _to_user: string
        }
        Returns: string
      }
      battle_finish: {
        Args: { _battle_id: string; _reason: string; _winner: string }
        Returns: undefined
      }
      battle_join_code: { Args: { _code: string }; Returns: string }
      battle_matchmake: {
        Args: {
          _difficulty: Database["public"]["Enums"]["battle_difficulty"]
          _topic: string
        }
        Returns: string
      }
      battle_peek_code: {
        Args: { _code: string }
        Returns: {
          difficulty: Database["public"]["Enums"]["battle_difficulty"]
          duration_sec: number
          expires_at: string
          problem_slug: string
          status: string
        }[]
      }
      blog_increment_view: {
        Args: { _post_id: string; _session_id: string }
        Returns: undefined
      }
      blog_publish_scheduled: { Args: never; Returns: number }
      calc_elo_delta: {
        Args: { _k?: number; _loser_elo: number; _winner_elo: number }
        Returns: number
      }
      calculate_profile_completion: {
        Args: {
          profile_row: Database["public"]["Tables"]["user_profiles_extended"]["Row"]
        }
        Returns: number
      }
      can_view_proctoring: { Args: { _org_id: string }; Returns: boolean }
      can_write_org: { Args: { _org: string }; Returns: boolean }
      claim_assessment_invite: {
        Args: { _token: string }
        Returns: {
          assessment_id: string
          candidate_details: Json | null
          created_at: string
          device_fingerprint: string | null
          device_ip: unknown
          id: string
          id_photo_url: string | null
          integrity_score: number
          invite_id: string | null
          score: number | null
          screen_extended: boolean
          selfie_url: string | null
          sideeye_required: boolean
          slug: string | null
          start_geo: Json | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          violations: number
        }
        SetofOptions: {
          from: "*"
          to: "assessment_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_open_org_assessment: {
        Args: { _assessment_id: string }
        Returns: {
          invite_id: string
          token: string
        }[]
      }
      clone_global_question: {
        Args: { _question_id: string; _target_org: string }
        Returns: string
      }
      contest_accept_honor_code: {
        Args: { _contest_id: string }
        Returns: undefined
      }
      contest_aux_unlocked: { Args: { _contest_id: string }; Returns: boolean }
      contest_claim_tab_lock: {
        Args: { _contest_id: string; _tab_id: string }
        Returns: Json
      }
      contest_effective_status: {
        Args: { _contest_id: string }
        Returns: string
      }
      contest_force_dq: {
        Args: { _contest_id: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      contest_force_end_session: {
        Args: { _session_id: string }
        Returns: undefined
      }
      contest_log_violation: {
        Args: {
          _contest_id: string
          _meta?: Json
          _session_id: string
          _severity?: string
          _type: string
        }
        Returns: Json
      }
      contest_record_keystroke_profile: {
        Args: {
          _burst_ratio: number
          _contest_id: string
          _mean: number
          _median: number
          _p90: number
          _sample_size: number
          _session_id: string
          _stddev: number
        }
        Returns: string
      }
      contest_record_keystroke_sample: {
        Args: {
          _burst_ratio: number
          _contest_id: string
          _mean: number
          _sample_size: number
          _session_id: string
          _stddev: number
        }
        Returns: Json
      }
      contest_record_mouse_metrics: {
        Args: {
          _click_count: number
          _contest_id: string
          _idle_ratio: number
          _move_count: number
          _path_entropy: number
          _session_id: string
          _total_distance_px: number
          _window_ms: number
        }
        Returns: string
      }
      contest_record_preflight: {
        Args: {
          _contest_id: string
          _details: Json
          _session_id: string
          _status: string
          _user_agent: string
        }
        Returns: string
      }
      contest_record_room_scan: {
        Args: {
          _contest_id: string
          _duration_ms: number
          _session_id: string
          _storage_path: string
        }
        Returns: string
      }
      contest_report_stream_health: {
        Args: { _healthy: boolean; _kind: string; _session_id: string }
        Returns: Json
      }
      contest_session_heartbeat:
        | { Args: { _session_id: string }; Returns: Json }
        | { Args: { _fingerprint: Json; _session_id: string }; Returns: Json }
      contest_start_secure_session:
        | {
            Args: { _contest_id: string; _user_agent?: string }
            Returns: string
          }
        | {
            Args: {
              _contest_id: string
              _fingerprint?: Json
              _user_agent?: string
            }
            Returns: string
          }
      create_b2b_org_invite: {
        Args: {
          _capabilities: string[]
          _email: string
          _org_id: string
          _role_preset?: string
        }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          capabilities: string[]
          created_at: string
          email: string
          expires_at: string
          id: string
          inviter_id: string
          org_id: string
          revoked: boolean
          role_preset: string
          token: string
        }
        SetofOptions: {
          from: "*"
          to: "b2b_org_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      drive_org: { Args: { _drive: string }; Returns: string }
      ensure_player_rating: { Args: { _user: string }; Returns: undefined }
      get_ai_insight_feedback_summary: {
        Args: { _org_id: string }
        Returns: {
          down_count: number
          insight_key: string
          insight_title: string
          last_at: string
          net_score: number
          total_count: number
          up_count: number
        }[]
      }
      get_ai_insight_feedback_trend: {
        Args: { _days?: number; _org_id: string }
        Returns: {
          day: string
          down_count: number
          insight_key: string
          insight_title: string
          up_count: number
        }[]
      }
      get_assessment_answer_key: {
        Args: { _assessment: string }
        Returns: Json
      }
      get_attempt_paper: { Args: { _attempt: string }; Returns: Json }
      get_attempt_results: { Args: { _attempt: string }; Returns: Json }
      get_b2b_dashboard_stats: {
        Args: { _org_id: string; _window_days?: number }
        Returns: Json
      }
      get_coding_leaderboard:
        | {
            Args: {
              _limit?: number
              _offset?: number
              _search?: string
              _window?: string
            }
            Returns: {
              acceptance_rate: number
              avatar_url: string
              display_name: string
              fastest_avg_runtime: number
              last_accepted_at: string
              problems_solved: number
              rank: number
              total_accepted: number
              user_id: string
              username: string
              weighted_score: number
            }[]
          }
        | {
            Args: {
              _accepted_only?: boolean
              _difficulty?: string
              _limit?: number
              _offset?: number
              _search?: string
              _window?: string
            }
            Returns: {
              acceptance_rate: number
              avatar_url: string
              display_name: string
              fastest_avg_runtime: number
              last_accepted_at: string
              problems_solved: number
              rank: number
              total_accepted: number
              user_id: string
              username: string
              weighted_score: number
            }[]
          }
      get_coding_leaderboard_rank_delta: {
        Args: { _user_id: string; _window?: string }
        Returns: {
          current_rank: number
          delta_day: number
          delta_week: number
          week_ago_rank: number
          yesterday_rank: number
        }[]
      }
      get_coding_leaderboard_stats: {
        Args: never
        Returns: {
          total_accepted_today: number
          total_accepted_week: number
          total_participants: number
          total_problems_solved: number
        }[]
      }
      get_coding_leaderboard_user_breakdown: {
        Args: { _user_id: string }
        Returns: {
          acceptance_rate: number
          avatar_url: string
          avg_runtime_ms: number
          display_name: string
          easy_score: number
          easy_solved: number
          fastest_problems: Json
          fastest_runtime_ms: number
          hard_score: number
          hard_solved: number
          last_accepted_at: string
          medium_score: number
          medium_solved: number
          problems_solved: number
          slowest_runtime_ms: number
          speed_bonus: number
          total_accepted: number
          total_submissions: number
          user_id: string
          username: string
          weighted_score: number
        }[]
      }
      get_coding_leaderboard_user_rank: {
        Args: { _user_id: string; _window?: string }
        Returns: {
          acceptance_rate: number
          avatar_url: string
          display_name: string
          fastest_avg_runtime: number
          last_accepted_at: string
          problems_solved: number
          rank: number
          total_accepted: number
          total_ranked: number
          user_id: string
          username: string
          weighted_score: number
        }[]
      }
      get_contest_registered_count: {
        Args: { _contest_id: string }
        Returns: number
      }
      get_daily_challenge_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          current_streak: number
          display_name: string
          last_completed_at: string
          total_completions: number
          user_id: string
          username: string
          weekly_completions: number
        }[]
      }
      get_fundamentals_leaderboard: {
        Args: { p_limit?: number; p_since?: string; p_type?: string }
        Returns: {
          avatar_url: string
          avg_accuracy: number
          best_accuracy: number
          full_name: string
          total_questions: number
          total_quizzes: number
          total_score: number
          user_id: string
        }[]
      }
      get_insight_feedback_signals: {
        Args: { _days?: number; _org_id: string }
        Returns: {
          down_count: number
          insight_key: string
          insight_title: string
          net_score: number
          up_count: number
        }[]
      }
      get_invite_source_backfill_runs: {
        Args: { p_limit?: number }
        Returns: {
          by_source: Json
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          rows_scanned: number
          rows_updated: number
          started_at: string
          status: string
          triggered_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "invite_source_backfill_runs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_integrity_verdict: {
        Args: { p_token: string }
        Returns: {
          contest_id: string
          decided_at: string
          final_hash: string
          session_id: string
          verdict: Database["public"]["Enums"]["integrity_verdict"]
        }[]
      }
      get_quiz_leaderboard: {
        Args: {
          p_difficulty?: string
          p_limit?: number
          p_order_by_total?: boolean
          p_quiz_type: string
          p_since?: string
        }
        Returns: {
          accuracy: number
          avatar_url: string
          avg_time_seconds: number
          completed_at: string
          full_name: string
          id: string
          quiz_type: string
          score: number
          total_questions: number
          total_time_seconds: number
          user_id: string
        }[]
      }
      get_submission_percentiles: {
        Args: { _mode?: string; _submission_id: string }
        Returns: {
          memory_beats: number
          memory_kb: number
          mode: string
          runtime_beats: number
          runtime_ms: number
          total_compared: number
          total_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_share_view_count: {
        Args: { p_share_id: string }
        Returns: undefined
      }
      is_blog_editor: { Args: { _uid: string }; Returns: boolean }
      is_institution_member: {
        Args: {
          _inst: string
          _min_role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_billing_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: {
        Args: {
          _org_id: string
          _roles?: Database["public"]["Enums"]["org_member_role"][]
        }
        Returns: boolean
      }
      is_org_student: { Args: { _org_id: string }; Returns: boolean }
      log_org_audit: {
        Args: {
          _action: string
          _metadata?: Json
          _org_id: string
          _target?: string
        }
        Returns: string
      }
      next_unique_slug: {
        Args: {
          base: string
          scope_col: string
          scope_table: string
          scope_val: string
        }
        Returns: string
      }
      notify_admins: {
        Args: { _data?: Json; _message: string; _title: string; _type?: string }
        Returns: undefined
      }
      placement_overview: {
        Args: { _filters?: Json; _org: string }
        Returns: Json
      }
      placement_rankings:
        | {
            Args: {
              _filters?: Json
              _limit?: number
              _offset?: number
              _org_id: string
            }
            Returns: {
              applications_count: number
              assessments_taken: number
              avg_assessment_score: number
              avg_integrity: number
              batch_year: number
              branch: string
              email: string
              full_name: string
              is_multi_offer: boolean
              is_placed: boolean
              offers_count: number
              rank_in_branch: number
              rank_in_org: number
              roll_number: string
              score: number
              scores: Json
              section: string
              shortlisted_count: number
              student_id: string
            }[]
          }
        | {
            Args: {
              _filters?: Json
              _limit?: number
              _offset?: number
              _org_id: string
              _sort?: string
              _student_ids?: string[]
            }
            Returns: {
              applications_count: number
              assessments_taken: number
              avg_assessment_score: number
              avg_integrity: number
              batch_year: number
              branch: string
              email: string
              full_name: string
              is_multi_offer: boolean
              is_placed: boolean
              offers_count: number
              rank_in_branch: number
              rank_in_org: number
              roll_number: string
              score: number
              scores: Json
              section: string
              shortlisted_count: number
              student_id: string
            }[]
          }
      placement_rankings_count: {
        Args: { _filters?: Json; _org_id: string; _student_ids?: string[] }
        Returns: number
      }
      placement_rankings_filter_values: {
        Args: { _org_id: string }
        Returns: {
          batches: number[]
          branches: string[]
          sections: string[]
        }[]
      }
      placement_recompute_scores: { Args: { _org_id: string }; Returns: number }
      preview_assessment_invite: { Args: { _token: string }; Returns: Json }
      preview_invite_source_backfill: {
        Args: never
        Returns: {
          count: number
          inferred_source: string
          sample: Json
        }[]
      }
      question_is_global: { Args: { _qid: string }; Returns: boolean }
      question_org: { Args: { _question: string }; Returns: string }
      recompute_contest_leaderboard: {
        Args: { _contest_id: string }
        Returns: undefined
      }
      register_for_contest: {
        Args: { _contest_id: string; _invite_code?: string }
        Returns: string
      }
      reverse_xp_entry: {
        Args: { p_reason: string; p_reference_id: string; p_source: string }
        Returns: string
      }
      section_org: { Args: { _section: string }; Returns: string }
      set_member_capabilities: {
        Args: { _capabilities: string[]; _member_id: string }
        Returns: undefined
      }
      sideeye_purge_old_data: { Args: never; Returns: Json }
      sideeye_sweep_stale_status: { Args: never; Returns: Json }
      sideeye_unified_risk_score: {
        Args: { _session_id: string }
        Returns: {
          false_positive_count: number
          high_severity_count: number
          presence_count: number
          score: number
          screen_count: number
          side_camera_count: number
        }[]
      }
      slugify: { Args: { input: string }; Returns: string }
      snapshot_my_coding_leaderboard_rank: { Args: never; Returns: Json }
      solo_finalize_session: { Args: { _session_id: string }; Returns: Json }
      solo_record_attempt: {
        Args: {
          _problem_slug: string
          _session_id: string
          _solved: boolean
          _verdict?: string
        }
        Returns: undefined
      }
      solo_start_session: {
        Args: { _difficulty?: string; _duration_sec?: number; _mode: string }
        Returns: string
      }
      start_preview_attempt: {
        Args: { _assessment: string }
        Returns: {
          assessment_id: string
          candidate_details: Json | null
          created_at: string
          device_fingerprint: string | null
          device_ip: unknown
          id: string
          id_photo_url: string | null
          integrity_score: number
          invite_id: string | null
          score: number | null
          screen_extended: boolean
          selfie_url: string | null
          sideeye_required: boolean
          slug: string | null
          start_geo: Json | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          violations: number
        }
        SetofOptions: {
          from: "*"
          to: "assessment_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_attempt: {
        Args: { _attempt: string }
        Returns: {
          assessment_id: string
          candidate_details: Json | null
          created_at: string
          device_fingerprint: string | null
          device_ip: unknown
          id: string
          id_photo_url: string | null
          integrity_score: number
          invite_id: string | null
          score: number | null
          screen_extended: boolean
          selfie_url: string | null
          sideeye_required: boolean
          slug: string | null
          start_geo: Json | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          violations: number
        }
        SetofOptions: {
          from: "*"
          to: "assessment_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      test_invite_source_heuristics: { Args: never; Returns: Json }
      transfer_org_ownership: {
        Args: { _new_owner_user_id: string; _org_id: string }
        Returns: undefined
      }
      user_is_premium: { Args: { _user_id: string }; Returns: boolean }
      user_pending_logout: { Args: { _user_id: string }; Returns: boolean }
      validate_contest_submission: {
        Args: { _contest_id: string; _problem_slug: string }
        Returns: Json
      }
    }
    Enums: {
      ai_insight_rating: "up" | "down"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "owner"
        | "proctor_viewer"
        | "proctor_reviewer"
        | "proctor_admin"
        | "institution_admin"
      application_stage:
        | "applied"
        | "shortlisted"
        | "in_rounds"
        | "offered"
        | "accepted"
        | "rejected"
        | "withdrew"
      assessment_status: "draft" | "published" | "archived"
      assessment_type: "placement_mock" | "academic" | "benchmark" | "contest"
      attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "abandoned"
      battle_difficulty: "easy" | "medium" | "hard"
      battle_status: "pending" | "live" | "ended" | "abandoned"
      blog_comment_status: "visible" | "hidden" | "reported" | "deleted"
      blog_post_status: "draft" | "scheduled" | "published" | "archived"
      contest_enforcement_mode: "open" | "standard" | "hard" | "custom"
      drive_status: "upcoming" | "open" | "closed" | "cancelled"
      drive_type: "on_campus" | "pool" | "off_campus" | "virtual"
      experience_report_reason:
        | "spam"
        | "misinformation"
        | "plagiarism"
        | "offensive"
        | "personal_info"
        | "other"
      experience_report_status: "open" | "resolved" | "dismissed"
      experience_status: "pending" | "approved" | "rejected"
      experience_type: "on_campus" | "off_campus" | "internship" | "referral"
      friendship_status: "pending" | "accepted" | "blocked"
      integrity_verdict: "pending" | "confirmed" | "disputed" | "inconclusive"
      invite_source: "email" | "link" | "bulk_upload" | "manual" | "api"
      invite_status: "pending" | "claimed" | "submitted" | "expired"
      offer_status: "selected" | "rejected" | "waitlisted" | "in_progress"
      offer_type: "intern" | "fte" | "ppo"
      org_member_role: "owner" | "admin" | "recruiter" | "viewer" | "proctor"
      org_student_status: "invited" | "active" | "suspended" | "alumni"
      org_type: "college" | "company"
      participation_mode: "invite" | "roster" | "open_org"
      placement_ai_kind:
        | "nl_query"
        | "weekly_digest"
        | "at_risk"
        | "recruiter_outreach"
      proctoring_level: "off" | "light" | "standard" | "strict"
      question_type:
        | "coding"
        | "mcq"
        | "sql"
        | "subjective"
        | "true_false"
        | "matching"
        | "short_answer"
        | "numerical"
        | "fill_blanks"
      recruiter_sector:
        | "tech"
        | "consulting"
        | "finance"
        | "product"
        | "core"
        | "analytics"
        | "startup"
        | "psu"
        | "edtech"
        | "healthtech"
        | "other"
      sos_delivery_status: "queued" | "sent" | "failed"
      sos_status: "open" | "acknowledged" | "resolved"
      student_share_kind: "profile" | "shortlist"
      study_year:
        | "1st Year"
        | "2nd Year"
        | "3rd Year"
        | "4th Year"
        | "5th Year"
        | "Other"
      user_type: "student" | "professional" | "other"
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
      ai_insight_rating: ["up", "down"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "owner",
        "proctor_viewer",
        "proctor_reviewer",
        "proctor_admin",
        "institution_admin",
      ],
      application_stage: [
        "applied",
        "shortlisted",
        "in_rounds",
        "offered",
        "accepted",
        "rejected",
        "withdrew",
      ],
      assessment_status: ["draft", "published", "archived"],
      assessment_type: ["placement_mock", "academic", "benchmark", "contest"],
      attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "abandoned",
      ],
      battle_difficulty: ["easy", "medium", "hard"],
      battle_status: ["pending", "live", "ended", "abandoned"],
      blog_comment_status: ["visible", "hidden", "reported", "deleted"],
      blog_post_status: ["draft", "scheduled", "published", "archived"],
      contest_enforcement_mode: ["open", "standard", "hard", "custom"],
      drive_status: ["upcoming", "open", "closed", "cancelled"],
      drive_type: ["on_campus", "pool", "off_campus", "virtual"],
      experience_report_reason: [
        "spam",
        "misinformation",
        "plagiarism",
        "offensive",
        "personal_info",
        "other",
      ],
      experience_report_status: ["open", "resolved", "dismissed"],
      experience_status: ["pending", "approved", "rejected"],
      experience_type: ["on_campus", "off_campus", "internship", "referral"],
      friendship_status: ["pending", "accepted", "blocked"],
      integrity_verdict: ["pending", "confirmed", "disputed", "inconclusive"],
      invite_source: ["email", "link", "bulk_upload", "manual", "api"],
      invite_status: ["pending", "claimed", "submitted", "expired"],
      offer_status: ["selected", "rejected", "waitlisted", "in_progress"],
      offer_type: ["intern", "fte", "ppo"],
      org_member_role: ["owner", "admin", "recruiter", "viewer", "proctor"],
      org_student_status: ["invited", "active", "suspended", "alumni"],
      org_type: ["college", "company"],
      participation_mode: ["invite", "roster", "open_org"],
      placement_ai_kind: [
        "nl_query",
        "weekly_digest",
        "at_risk",
        "recruiter_outreach",
      ],
      proctoring_level: ["off", "light", "standard", "strict"],
      question_type: [
        "coding",
        "mcq",
        "sql",
        "subjective",
        "true_false",
        "matching",
        "short_answer",
        "numerical",
        "fill_blanks",
      ],
      recruiter_sector: [
        "tech",
        "consulting",
        "finance",
        "product",
        "core",
        "analytics",
        "startup",
        "psu",
        "edtech",
        "healthtech",
        "other",
      ],
      sos_delivery_status: ["queued", "sent", "failed"],
      sos_status: ["open", "acknowledged", "resolved"],
      student_share_kind: ["profile", "shortlist"],
      study_year: [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Other",
      ],
      user_type: ["student", "professional", "other"],
    },
  },
} as const
