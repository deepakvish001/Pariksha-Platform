import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_LABELS: Record<string, string> = {
  dsa: "Data Structures & Algorithms",
  cs: "Computer Science",
  sql: "SQL & Databases",
  aptitude: "Aptitude & Reasoning",
};

interface StudyGoal {
  id: string;
  user_id: string;
  category: string;
  target_questions: number;
  questions_practiced: number;
  is_completed: boolean;
  started_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate secret token for scheduled function
    const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    const providedSecret = req.headers.get("X-Cron-Secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const isAuthorizedByCron = cronSecret && providedSecret === cronSecret;
    const isAuthorizedByServiceRole = serviceRoleKey && providedSecret === serviceRoleKey;
    
    if (!isAuthorizedByCron && !isAuthorizedByServiceRole) {
      console.log("Unauthorized access attempt to send-study-reminder");
      return new Response(
        JSON.stringify({ error: "Unauthorized - This function requires internal authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active (incomplete) study goals
    const { data: activeGoals, error: goalsError } = await supabase
      .from("study_plan_goals")
      .select("*")
      .eq("is_completed", false);

    if (goalsError) throw goalsError;

    if (!activeGoals || activeGoals.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active study goals found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group goals by user
    const goalsByUser: Record<string, StudyGoal[]> = {};
    for (const goal of activeGoals) {
      if (!goalsByUser[goal.user_id]) {
        goalsByUser[goal.user_id] = [];
      }
      goalsByUser[goal.user_id].push(goal);
    }

    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Process each user
    for (const [userId, goals] of Object.entries(goalsByUser)) {
      try {
        // Get user email and profile
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (!authUser?.user?.email) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle();

        // Check user notification preferences
        const { data: extProfile } = await supabase
          .from("user_profiles_extended")
          .select("email_notifications_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        if (extProfile?.email_notifications_enabled === false) continue;

        const userName = profile?.full_name || authUser.user.email.split("@")[0];

        // Build goals summary HTML
        const goalsHtml = goals.map(goal => {
          const progress = Math.round((goal.questions_practiced / goal.target_questions) * 100);
          const remaining = goal.target_questions - goal.questions_practiced;
          const categoryLabel = CATEGORY_LABELS[goal.category] || goal.category.toUpperCase();
          
          return `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${categoryLabel}</h3>
              <div style="background: #e9ecef; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background: #6366f1; height: 100%; width: ${progress}%;"></div>
              </div>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                ${goal.questions_practiced}/${goal.target_questions} questions completed • ${remaining} remaining
              </p>
            </div>
          `;
        }).join("");

        const totalRemaining = goals.reduce((sum, g) => sum + (g.target_questions - g.questions_practiced), 0);

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a;">📚 Study Goals Reminder</h1>
            <p style="color: #4b5563; font-size: 16px;">
              Hi ${userName}! You have ${goals.length} active study ${goals.length === 1 ? 'goal' : 'goals'} waiting for you.
            </p>
            
            ${goalsHtml}
            
            <div style="background: #eef2ff; border-radius: 8px; padding: 16px; margin-top: 20px;">
              <p style="margin: 0; color: #4338ca; font-weight: 500;">
                💪 ${totalRemaining} questions to go! Keep up the great work.
              </p>
            </div>
            
            <div style="margin-top: 24px;">
              <a href="${supabaseUrl.replace('.supabase.co', '')}/library/quiz" 
                 style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Start Practicing →
              </a>
            </div>
            
            <p style="margin-top: 32px; color: #9ca3af; font-size: 12px;">
              You're receiving this because you have active study goals. 
              You can disable email notifications in your profile settings.
            </p>
          </body>
          </html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Study Tracker <noreply@resend.dev>",
            to: [authUser.user.email],
            subject: `📚 ${goals.length} study ${goals.length === 1 ? 'goal' : 'goals'} need your attention`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          errors.push(`Failed to send to ${authUser.user.email}: ${errorData.message || "Unknown error"}`);
        } else {
          emailsSent.push(authUser.user.email);
        }
      } catch (userError: any) {
        errors.push(`Error processing user ${userId}: ${userError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: emailsSent.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-study-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
