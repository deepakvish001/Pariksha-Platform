 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
 
 interface UserProfile {
   user_id: string;
   weekly_digest_enabled: boolean;
 }
 
 interface Profile {
   user_id: string;
   full_name: string | null;
 }
 
 interface AuthUser {
   id: string;
   email: string;
 }
 
 interface QuizResult {
   quiz_type: string;
   accuracy: number;
   score: number;
   total_questions: number;
   completed_at: string;
 }
 
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate secret token for scheduled function (required for cron/internal calls)
    const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    const providedSecret = req.headers.get("X-Cron-Secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
    
    // Also allow service role key as authorization
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isAuthorizedByCron = cronSecret && providedSecret === cronSecret;
    const isAuthorizedByServiceRole = serviceRoleKey && providedSecret === serviceRoleKey;
    
    if (!isAuthorizedByCron && !isAuthorizedByServiceRole) {
      console.log("Unauthorized access attempt to send-weekly-digest");
      return new Response(
        JSON.stringify({ error: "Unauthorized - This function requires internal authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting weekly digest job...");
 
     // Get all users who have weekly_digest_enabled
     const { data: enabledUsers, error: usersError } = await supabase
       .from("user_profiles_extended")
       .select("user_id, weekly_digest_enabled")
       .eq("weekly_digest_enabled", true);
 
     if (usersError) {
       throw new Error(`Failed to fetch users: ${usersError.message}`);
     }
 
     const users = enabledUsers as UserProfile[] || [];
     console.log(`Found ${users.length} users with weekly digest enabled`);
 
     if (users.length === 0) {
       return new Response(
         JSON.stringify({ success: true, message: "No users with weekly digest enabled" }),
         { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Get user emails from auth.users via admin API
     const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
     if (authError) {
       throw new Error(`Failed to fetch auth users: ${authError.message}`);
     }
 
     const authUsers = (authData?.users || []) as AuthUser[];
     const userEmails = new Map(authUsers.map(u => [u.id, u.email]));
 
     // Get user names from profiles
     const { data: profilesData } = await supabase
       .from("profiles")
       .select("user_id, full_name")
       .in("user_id", users.map(u => u.user_id));
 
     const profiles = profilesData as Profile[] || [];
     const userNames = new Map(profiles.map(p => [p.user_id, p.full_name]));
 
     const weekAgo = new Date();
     weekAgo.setDate(weekAgo.getDate() - 7);
 
     let sentCount = 0;
     let errorCount = 0;
 
     for (const user of users) {
       const email = userEmails.get(user.user_id);
       if (!email) {
         console.log(`No email found for user ${user.user_id}, skipping`);
         continue;
       }
 
       try {
         // Fetch quiz results for this user
         const { data: results } = await supabase
           .from("quiz_results")
           .select("quiz_type, accuracy, score, total_questions, completed_at")
           .eq("user_id", user.user_id)
           .gte("completed_at", weekAgo.toISOString())
           .order("completed_at", { ascending: false });
 
         const quizResults = results as QuizResult[] || [];
 
         // Skip if no activity
         if (quizResults.length === 0) {
           console.log(`No quiz activity for user ${user.user_id}, skipping email`);
           continue;
         }
 
         const userName = userNames.get(user.user_id) || email.split("@")[0];
 
         // Calculate stats
         const totalQuizzes = quizResults.length;
         const avgAccuracy = Math.round(
           quizResults.reduce((sum, r) => sum + Number(r.accuracy), 0) / totalQuizzes
         );
         const totalCorrect = quizResults.reduce((sum, r) => sum + r.score, 0);
         const totalQuestions = quizResults.reduce((sum, r) => sum + r.total_questions, 0);
 
         // Count by quiz type
         const byType = quizResults.reduce((acc, r) => {
           acc[r.quiz_type] = (acc[r.quiz_type] || 0) + 1;
           return acc;
         }, {} as Record<string, number>);
 
         // Calculate streak
         const uniqueDates = [...new Set(
           quizResults.map(r => new Date(r.completed_at).toLocaleDateString("en-CA"))
         )].sort((a, b) => b.localeCompare(a));
 
         let streak = 0;
         if (uniqueDates.length > 0) {
           const today = new Date().toLocaleDateString("en-CA");
           const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
           let checkDate = uniqueDates[0] === today ? today : yesterday;
 
           if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
             for (const date of uniqueDates) {
               if (date === checkDate) {
                 streak++;
                 const prevDate = new Date(checkDate);
                 prevDate.setDate(prevDate.getDate() - 1);
                 checkDate = prevDate.toLocaleDateString("en-CA");
               } else if (date < checkDate) {
                 break;
               }
             }
           }
         }
 
          // Fetch achievements earned this week
          const { data: achievements } = await supabase
            .from("user_achievements")
            .select("achievement_id, earned_at")
            .eq("user_id", user.user_id)
            .gte("earned_at", weekAgo.toISOString());
 
          const achievementsThisWeek = achievements || [];
 
          // Fetch XP data
          const { data: xpProfile } = await supabase
            .from("user_profiles_extended")
            .select("total_xp, current_level, xp_this_week")
            .eq("user_id", user.user_id)
            .single();
 
          const xpData = xpProfile || { total_xp: 0, current_level: 1, xp_this_week: 0 };
 
          // Build achievements section
          const achievementsSection = achievementsThisWeek.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h3 style="margin: 0 0 16px; font-size: 18px; color: #e5e7eb;">🏆 Achievements Earned</h3>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
              ${achievementsThisWeek.map(a => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <span style="font-size: 20px;">🎖️</span>
                  <span style="font-weight: 500;">${a.achievement_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : '';
 
         // Build email
         const emailHtml = `
 <!DOCTYPE html>
 <html>
 <head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
 </head>
 <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23; color: #ffffff; padding: 40px 20px; margin: 0;">
   <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2d2d44;">
     
     <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
       <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📊 Your Weekly Quiz Summary</h1>
       <p style="margin: 8px 0 0; opacity: 0.9;">Hey ${userName}! Here's how you did this week.</p>
     </div>
     
     <div style="padding: 32px;">
        <!-- XP & Level Section -->
        <div style="background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; border: 1px solid rgba(147, 51, 234, 0.3);">
          <div style="font-size: 14px; color: #c084fc; margin-bottom: 8px;">⚡ Level ${xpData.current_level}</div>
          <div style="font-size: 32px; font-weight: 700; color: #f0abfc;">+${xpData.xp_this_week} XP</div>
          <div style="font-size: 12px; color: #9ca3af;">this week • ${xpData.total_xp.toLocaleString()} total</div>
        </div>

       <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #f97316;">${totalQuizzes}</div>
           <div style="color: #9ca3af; font-size: 14px;">Quizzes</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #22c55e;">${avgAccuracy}%</div>
           <div style="color: #9ca3af; font-size: 14px;">Accuracy</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #3b82f6;">${totalCorrect}/${totalQuestions}</div>
           <div style="color: #9ca3af; font-size: 14px;">Correct</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #f59e0b;">${streak}🔥</div>
           <div style="color: #9ca3af; font-size: 14px;">Streak</div>
         </div>
       </div>
       
        ${achievementsSection}

       ${Object.keys(byType).length > 0 ? `
       <div style="margin-bottom: 32px;">
         <h3 style="margin: 0 0 16px; font-size: 18px; color: #e5e7eb;">Quiz Breakdown</h3>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
           ${Object.entries(byType).map(([type, count]) => `
             <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
               <span style="text-transform: uppercase; color: #9ca3af;">${type}</span>
               <span style="font-weight: 600;">${count}</span>
             </div>
           `).join('')}
         </div>
       </div>
       ` : ''}
       
       <div style="text-align: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
         <p style="color: #9ca3af; margin: 0 0 16px;">Keep the momentum going! 🚀</p>
       </div>
     </div>
     
     <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
       <p style="margin: 0;">You can disable weekly summaries in your Settings → Notifications.</p>
     </div>
   </div>
 </body>
 </html>
         `;
 
         await resend.emails.send({
           from: "PrepTrack <noreply@resend.dev>",
           to: [email],
           subject: `📊 Weekly Quiz Summary - ${totalQuizzes} quizzes, ${avgAccuracy}% accuracy`,
           html: emailHtml,
         });
 
         sentCount++;
         console.log(`Sent weekly digest to ${email}`);
       } catch (err) {
         console.error(`Failed to send to ${email}:`, err);
         errorCount++;
       }
     }
 
     console.log(`Weekly digest complete: ${sentCount} sent, ${errorCount} errors`);
 
     return new Response(
       JSON.stringify({ success: true, sent: sentCount, errors: errorCount }),
       { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   } catch (error: unknown) {
     console.error("Error in weekly digest:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   }
 };
 
 serve(handler);