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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
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
      user_profiles_extended: {
        Row: {
          aspirations: string[] | null
          bio: string | null
          branch: string | null
          codechef_url: string | null
          codeforces_url: string | null
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
          last_xp_reset_at: string | null
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
          last_xp_reset_at?: string | null
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
          last_xp_reset_at?: string | null
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
      calculate_profile_completion: {
        Args: {
          profile_row: Database["public"]["Tables"]["user_profiles_extended"]["Row"]
        }
        Returns: number
      }
    }
    Enums: {
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
