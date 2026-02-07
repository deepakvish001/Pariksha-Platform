import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserWithGoal {
  user_id: string;
  email: string;
  full_name: string | null;
  roadmap_id: string;
  target_completion_date: string;
  weekly_topics_target: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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
      console.log("Unauthorized access attempt to send-velocity-reminder");
      return new Response(
        JSON.stringify({ error: "Unauthorized - This function requires internal authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with active learning goals and reminders enabled
    const { data: usersWithGoals, error: goalsError } = await supabase
      .from("roadmap_learning_goals")
      .select(`
        user_id,
        roadmap_id,
        target_completion_date,
        weekly_topics_target
      `)
      .eq("is_active", true)
      .eq("reminder_enabled", true);

    if (goalsError) {
      throw new Error(`Error fetching goals: ${goalsError.message}`);
    }

    if (!usersWithGoals || usersWithGoals.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with active goals" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const notificationsSent: string[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const goal of usersWithGoals) {
      // Get user's progress this week
      const { data: weeklyProgress, error: progressError } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", goal.user_id)
        .like("sheet_id", `roadmap-tree-${goal.roadmap_id}`)
        .eq("completed", true)
        .gte("completed_at", oneWeekAgo.toISOString());

      if (progressError) {
        console.error(`Error fetching progress for user ${goal.user_id}:`, progressError);
        continue;
      }

      const completedThisWeek = weeklyProgress?.length || 0;
      const targetPerWeek = goal.weekly_topics_target;

      // Check if user is behind target (less than 50% of weekly goal by mid-week)
      const dayOfWeek = now.getDay();
      const expectedProgress = (dayOfWeek / 7) * targetPerWeek;
      const isBehind = completedThisWeek < expectedProgress * 0.5;

      if (isBehind && dayOfWeek >= 3) { // Only notify mid-week (Wednesday+)
        // Check user's notification preferences
        const { data: userPrefs } = await supabase
          .from("user_profiles_extended")
          .select("notify_velocity_reminder, email_notifications_enabled")
          .eq("user_id", goal.user_id)
          .single();

        // Skip if user has disabled velocity reminders
        if (userPrefs?.notify_velocity_reminder === false) {
          console.log(`Skipping velocity reminder for user ${goal.user_id} - disabled in preferences`);
          continue;
        }

        // Get user's email
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(goal.user_id);
        
        if (authError || !authUser.user?.email) {
          console.error(`Error fetching user email for ${goal.user_id}:`, authError);
          continue;
        }

        // Get user's name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", goal.user_id)
          .single();

        const userName = profile?.full_name || "Learner";
        const userEmail = authUser.user.email;

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: goal.user_id,
          type: "velocity_reminder",
          title: "Keep Your Momentum Going!",
          message: `You've completed ${completedThisWeek} topics this week. Complete ${targetPerWeek - completedThisWeek} more to stay on track!`,
          data: {
            roadmap_id: goal.roadmap_id,
            completed_this_week: completedThisWeek,
            weekly_target: targetPerWeek,
          },
        });

        // Send email if Resend is configured and user has email notifications enabled
        if (resendApiKey && userPrefs?.email_notifications_enabled !== false) {
          const resend = new Resend(resendApiKey);
          
          try {
            await resend.emails.send({
              from: "Learning Roadmap <noreply@lovable.app>",
              to: [userEmail],
              subject: "📚 Keep Your Learning Momentum Going!",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #7c3aed;">Hey ${userName}! 👋</h1>
                  <p>We noticed you've been a bit quiet on your learning journey this week.</p>
                  <p>You've completed <strong>${completedThisWeek} topics</strong> so far, but your goal is <strong>${targetPerWeek} topics per week</strong>.</p>
                  <p>Don't worry – you still have time to catch up! Just complete <strong>${targetPerWeek - completedThisWeek} more topics</strong> to stay on track.</p>
                  <div style="margin: 24px 0;">
                    <a href="${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/research/roadmap/${goal.roadmap_id}" 
                       style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                      Continue Learning →
                    </a>
                  </div>
                  <p style="color: #666;">Remember: small steps lead to big progress! 🚀</p>
                </div>
              `,
            });
          } catch (emailError) {
            console.error(`Error sending email to ${userEmail}:`, emailError);
          }
        }

        notificationsSent.push(goal.user_id);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Velocity check completed",
        notificationsSent: notificationsSent.length,
        users: notificationsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-velocity-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
