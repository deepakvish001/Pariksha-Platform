 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
 
 interface UserReviewSummary {
   userId: string;
   email: string;
   userName: string;
   criticalCount: number;
   dueCount: number;
   totalCount: number;
 }
 
const handler = async (req: Request): Promise<Response> => {
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
      console.log("Unauthorized access attempt to send-srs-reminder");
      return new Response(
        JSON.stringify({ error: "Unauthorized - This function requires internal authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const now = new Date();
     const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
 
     // Get all due reviews grouped by user
     const { data: dueReviews, error: reviewsError } = await supabase
       .from("quiz_spaced_repetition")
       .select("user_id, next_review_at, question_title")
       .lte("next_review_at", tomorrow.toISOString())
       .order("next_review_at", { ascending: true });
 
     if (reviewsError) {
       throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
     }
 
     if (!dueReviews || dueReviews.length === 0) {
       console.log("No due reviews found");
       return new Response(JSON.stringify({ success: true, emailsSent: 0 }), {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Group by user
     const userReviews = new Map<string, { critical: number; due: number; questions: string[] }>();
     
     for (const review of dueReviews) {
       const existing = userReviews.get(review.user_id) || { critical: 0, due: 0, questions: [] };
       const reviewDate = new Date(review.next_review_at);
       
       if (reviewDate < now) {
         existing.critical++;
       } else {
         existing.due++;
       }
       
       if (existing.questions.length < 5) {
         existing.questions.push(review.question_title);
       }
       
       userReviews.set(review.user_id, existing);
     }
 
     let emailsSent = 0;
     const errors: string[] = [];
 
     for (const [userId, reviewData] of userReviews) {
       try {
         // Get user email and preferences
         const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
         
         if (authError || !authUser?.user?.email) {
           console.log(`Could not fetch email for user ${userId}`);
           continue;
         }
 
         const userEmail = authUser.user.email;
 
         // Check notification preferences
         const { data: profile } = await supabase
           .from("user_profiles_extended")
           .select("email_notifications_enabled")
           .eq("user_id", userId)
           .single();
 
         if (profile?.email_notifications_enabled === false) {
           console.log(`User ${userId} has notifications disabled`);
           continue;
         }
 
         const { data: basicProfile } = await supabase
           .from("profiles")
           .select("full_name")
           .eq("user_id", userId)
           .single();
 
         const userName = basicProfile?.full_name || "there";
         const totalDue = reviewData.critical + reviewData.due;
         
         const urgencyText = reviewData.critical > 0 
           ? `🚨 ${reviewData.critical} overdue` 
           : `📚 ${totalDue} due today`;
 
         const questionsList = reviewData.questions
           .map(q => `<li style="margin-bottom: 8px;">${q}</li>`)
           .join("");
 
         const emailHtml = `
           <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
             <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
               <h1 style="color: white; margin: 0; font-size: 24px;">📖 Time to Review!</h1>
               <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Your spaced repetition questions are waiting</p>
             </div>
             
             <p style="font-size: 16px; color: #374151;">Hi ${userName},</p>
             
             <p style="font-size: 16px; color: #374151;">
               You have <strong style="color: ${reviewData.critical > 0 ? '#dc2626' : '#f59e0b'};">${totalDue} question${totalDue !== 1 ? 's' : ''}</strong> ready for review.
               ${urgencyText}
             </p>
             
             <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
               <p style="font-weight: 600; color: #374151; margin: 0 0 12px 0;">Questions to review:</p>
               <ul style="color: #6b7280; padding-left: 20px; margin: 0;">
                 ${questionsList}
                 ${reviewData.questions.length < totalDue ? `<li style="color: #9ca3af;">...and ${totalDue - reviewData.questions.length} more</li>` : ''}
               </ul>
             </div>
             
             <p style="font-size: 14px; color: #6b7280;">
               💡 <strong>Tip:</strong> Reviewing questions at the right time helps move them to long-term memory. 
               Get 3 correct in a row to master a question!
             </p>
             
             <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
             
             <p style="color: #9ca3af; font-size: 12px;">
               You're receiving this because you have email notifications enabled.
               Manage your preferences in Settings.
             </p>
           </div>
         `;
 
         const emailResponse = await resend.emails.send({
           from: "PrepPath <notifications@preppath.dev>",
           to: [userEmail],
           subject: `${urgencyText} - ${totalDue} question${totalDue !== 1 ? 's' : ''} ready for review`,
           html: emailHtml,
         });
 
         if (emailResponse.data?.id) {
           emailsSent++;
           console.log(`Email sent to ${userEmail}: ${emailResponse.data.id}`);
         }
       } catch (userError) {
         const errorMsg = userError instanceof Error ? userError.message : "Unknown error";
         console.error(`Error processing user ${userId}:`, errorMsg);
         errors.push(`User ${userId}: ${errorMsg}`);
       }
     }
 
     console.log(`SRS reminder emails sent: ${emailsSent}`);
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         emailsSent,
         usersProcessed: userReviews.size,
         errors: errors.length > 0 ? errors : undefined 
       }),
       {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error: unknown) {
     console.error("Error in send-srs-reminder:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(JSON.stringify({ success: false, error: errorMessage }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 };
 
 serve(handler);