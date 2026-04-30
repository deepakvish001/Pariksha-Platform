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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          diff: Json | null
          entity_slug: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          diff?: Json | null
          entity_slug?: string | null
          entity_type?: string
          id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
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
      roadmap_learning_goals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          reminder_enabled: boolean
          roadmap_id: string
          target_completion_date: string
          updated_at: string
          user_id: string
          weekly_topics_target: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          reminder_enabled?: boolean
          roadmap_id: string
          target_completion_date: string
          updated_at?: string
          user_id: string
          weekly_topics_target?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          reminder_enabled?: boolean
          roadmap_id?: string
          target_completion_date?: string
          updated_at?: string
          user_id?: string
          weekly_topics_target?: number
        }
        Relationships: []
      }
      roadmap_overrides: {
        Row: {
          is_featured: boolean
          is_published: boolean
          roadmap_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          is_featured?: boolean
          is_published?: boolean
          roadmap_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          is_featured?: boolean
          is_published?: boolean
          roadmap_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
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
      user_roadmap_node_order: {
        Row: {
          created_at: string
          id: string
          node_order: string[]
          roadmap_id: string
          section_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          node_order: string[]
          roadmap_id: string
          section_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          node_order?: string[]
          roadmap_id?: string
          section_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roadmap_notes: {
        Row: {
          created_at: string
          id: string
          node_id: string
          note: string
          roadmap_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          node_id: string
          note?: string
          roadmap_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          node_id?: string
          note?: string
          roadmap_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roadmap_saved_paths: {
        Row: {
          created_at: string
          custom_orders: Json
          description: string | null
          id: string
          is_active: boolean
          name: string
          roadmap_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_orders?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          roadmap_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_orders?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          roadmap_id?: string
          updated_at?: string
          user_id?: string
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
          description: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
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
      roadmap_leaderboard_view: {
        Row: {
          completed_topics: number | null
          last_completed_at: string | null
          roadmaps_started: number | null
          user_id: string | null
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
      audit_daily_completions: { Args: never; Returns: Json }
      audit_daily_completions_all: { Args: never; Returns: Json }
      award_xp: {
        Args: {
          _amount: number
          _description?: string
          _source: string
          _user_id: string
        }
        Returns: Json
      }
      calculate_profile_completion: {
        Args: {
          profile_row: Database["public"]["Tables"]["user_profiles_extended"]["Row"]
        }
        Returns: number
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
      snapshot_my_coding_leaderboard_rank: { Args: never; Returns: Json }
      user_pending_logout: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
