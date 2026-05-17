 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
interface QuizSummaryRequest {
  userId: string;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    // Validate JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No valid token provided" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's token for authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the JWT token
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;
    const { userId }: QuizSummaryRequest = await req.json();

    // Validate that the userId in the request matches the authenticated user
    if (userId !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You can only request your own quiz summary" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!userId) {
      throw new Error("Missing required field: userId");
    }

    // Use service role client for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the verified email from auth — never trust caller-supplied address
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUserData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const email = authUserData.user.email;

    // Fetch display name from profile — never trust caller-supplied value
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();
    const userName = escapeHtml(profileRow?.full_name || email.split("@")[0]);

    // Fetch quiz results from the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
 
     const { data: results, error: resultsError } = await supabase
       .from("quiz_results")
       .select("quiz_type, accuracy, score, total_questions, completed_at")
       .eq("user_id", userId)
       .gte("completed_at", weekAgo.toISOString())
       .order("completed_at", { ascending: false });
 
     if (resultsError) {
       throw new Error(`Failed to fetch quiz results: ${resultsError.message}`);
     }
 
     const quizResults = results as QuizResult[] || [];
 
     // Calculate stats
     const totalQuizzes = quizResults.length;
     const avgAccuracy = totalQuizzes > 0
       ? Math.round(quizResults.reduce((sum, r) => sum + Number(r.accuracy), 0) / totalQuizzes)
       : 0;
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
 
     // Determine achievements earned
     const achievements: string[] = [];
     if (totalQuizzes >= 1) achievements.push("🌟 First Steps");
     if (totalQuizzes >= 10) achievements.push("⚡ Quiz Enthusiast");
     if (avgAccuracy >= 80 && totalQuizzes >= 5) achievements.push("🏅 Consistent Performer");
     if (quizResults.some(r => Number(r.accuracy) === 100)) achievements.push("🏆 Perfectionist");
     if (totalCorrect >= 100) achievements.push("✨ Century Club");
 
     // Build email HTML
     const emailHtml = `
 <!DOCTYPE html>
 <html>
 <head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Your Weekly Quiz Summary</title>
 </head>
 <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f23; color: #ffffff; padding: 40px 20px; margin: 0;">
   <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2d2d44;">
     
     <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px; text-align: center;">
       <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📊 Weekly Quiz Summary</h1>
       <p style="margin: 8px 0 0; opacity: 0.9;">Hey ${userName || "there"}! Here's how you did this week.</p>
     </div>
     
     <div style="padding: 32px;">
       
       <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #f97316;">${totalQuizzes}</div>
           <div style="color: #9ca3af; font-size: 14px;">Quizzes Taken</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #22c55e;">${avgAccuracy}%</div>
           <div style="color: #9ca3af; font-size: 14px;">Avg Accuracy</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #3b82f6;">${totalCorrect}/${totalQuestions}</div>
           <div style="color: #9ca3af; font-size: 14px;">Correct Answers</div>
         </div>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
           <div style="font-size: 36px; font-weight: 700; color: #f59e0b;">${streak}🔥</div>
           <div style="color: #9ca3af; font-size: 14px;">Current Streak</div>
         </div>
       </div>
       
       ${Object.keys(byType).length > 0 ? `
       <div style="margin-bottom: 32px;">
         <h3 style="margin: 0 0 16px; font-size: 18px; color: #e5e7eb;">Quiz Breakdown</h3>
         <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
           ${Object.entries(byType).map(([type, count]) => `
             <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
               <span style="text-transform: uppercase; color: #9ca3af;">${type}</span>
               <span style="font-weight: 600;">${count} quiz${count > 1 ? 'zes' : ''}</span>
             </div>
           `).join('')}
         </div>
       </div>
       ` : ''}
       
       ${achievements.length > 0 ? `
       <div style="margin-bottom: 32px;">
         <h3 style="margin: 0 0 16px; font-size: 18px; color: #e5e7eb;">Achievements Earned</h3>
         <div style="display: flex; flex-wrap: wrap; gap: 8px;">
           ${achievements.map(a => `
             <span style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">${a}</span>
           `).join('')}
         </div>
       </div>
       ` : ''}
       
       <div style="text-align: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
         <p style="color: #9ca3af; margin: 0 0 16px;">Keep up the great work! 🚀</p>
         <a href="https://preptrack.com/library/quiz-history" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">View Full History</a>
       </div>
       
     </div>
     
     <div style="background: rgba(0,0,0,0.2); padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
       <p style="margin: 0;">You received this email because you requested a weekly quiz summary.</p>
     </div>
     
   </div>
 </body>
 </html>
     `;
 
     const emailResponse = await resend.emails.send({
       from: "PrepTrack <noreply@resend.dev>",
       to: [email],
       subject: `📊 Your Weekly Quiz Summary - ${totalQuizzes} quizzes, ${avgAccuracy}% accuracy`,
       html: emailHtml,
     });
 
     console.log("Weekly summary email sent successfully:", emailResponse);
 
     return new Response(
       JSON.stringify({
         success: true,
         stats: { totalQuizzes, avgAccuracy, totalCorrect, totalQuestions, streak },
       }),
       {
         status: 200,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       }
     );
   } catch (error: unknown) {
     console.error("Error in send-quiz-summary function:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       {
         status: 500,
         headers: { "Content-Type": "application/json", ...corsHeaders },
       }
     );
   }
 };
 
 serve(handler);