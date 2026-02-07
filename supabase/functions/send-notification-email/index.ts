 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { Resend } from "https://esm.sh/resend@2.0.0";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface NotificationPayload {
   notification_id: string;
   user_id: string;
   type: string;
   title: string;
   message: string;
   data?: Record<string, unknown>;
 }
 
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called by database triggers, so we validate using service role key
    const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    const providedSecret = req.headers.get("X-Cron-Secret") || req.headers.get("Authorization")?.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const isAuthorizedByCron = cronSecret && providedSecret === cronSecret;
    const isAuthorizedByServiceRole = serviceRoleKey && providedSecret === serviceRoleKey;
    
    if (!isAuthorizedByCron && !isAuthorizedByServiceRole) {
      console.log("Unauthorized access attempt to send-notification-email");
      return new Response(
        JSON.stringify({ error: "Unauthorized - This function requires internal authorization" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: NotificationPayload = await req.json();
    const { user_id, type, title, message, data } = payload;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Get user's email and notification preferences
     const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user_id);
     if (authError || !authUser?.user?.email) {
       console.log("Could not fetch user email:", authError);
       return new Response(JSON.stringify({ success: false, error: "User not found" }), {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const userEmail = authUser.user.email;
 
     // Check if user has email notifications enabled
     const { data: profile } = await supabase
       .from("user_profiles_extended")
       .select("email_notifications_enabled, full_name")
       .eq("user_id", user_id)
       .single();
 
     // Get full_name from profiles table as fallback
     const { data: basicProfile } = await supabase
       .from("profiles")
       .select("full_name")
       .eq("user_id", user_id)
       .single();
 
     const userName = basicProfile?.full_name || "there";
 
     // Default to true if not set
     if (profile?.email_notifications_enabled === false) {
       console.log("User has email notifications disabled");
       return new Response(JSON.stringify({ success: true, skipped: true }), {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Build email content based on notification type
     let emailSubject = title;
     let emailHtml = "";
 
     switch (type) {
       case "new_follower":
         const followerName = (data as Record<string, string>)?.follower_name || "Someone";
         emailSubject = `${followerName} started following you!`;
         emailHtml = `
           <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
             <h1 style="color: #10b981;">New Follower! 🎉</h1>
             <p>Hi ${userName},</p>
             <p><strong>${followerName}</strong> just started following you on PrepPath!</p>
             <p>Keep up the great work with your preparation journey.</p>
             <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
             <p style="color: #6b7280; font-size: 12px;">
               You're receiving this email because you have email notifications enabled. 
               You can manage your preferences in Settings.
             </p>
           </div>
         `;
         break;
 
       case "rare_achievement":
         const earnerName = (data as Record<string, string>)?.earner_name || "Someone you follow";
         const achievementId = (data as Record<string, string>)?.achievement_id || "a rare badge";
         emailSubject = `🏆 ${earnerName} earned a rare achievement!`;
         emailHtml = `
           <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
             <h1 style="color: #f59e0b;">Rare Achievement Unlocked! 🏆</h1>
             <p>Hi ${userName},</p>
             <p><strong>${earnerName}</strong> just earned a rare achievement: <strong>${achievementId}</strong></p>
             <p>Only a few users have unlocked this badge. Can you earn it too?</p>
             <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
             <p style="color: #6b7280; font-size: 12px;">
               You're receiving this email because you follow ${earnerName} and have email notifications enabled.
             </p>
           </div>
         `;
         break;
 
       default:
         emailHtml = `
           <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
             <h1 style="color: #3b82f6;">${title}</h1>
             <p>Hi ${userName},</p>
             <p>${message}</p>
             <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
             <p style="color: #6b7280; font-size: 12px;">
               You're receiving this email because you have email notifications enabled.
             </p>
           </div>
         `;
     }
 
     // Send email via Resend
     const emailResponse = await resend.emails.send({
       from: "PrepPath <notifications@preppath.dev>",
       to: [userEmail],
       subject: emailSubject,
       html: emailHtml,
     });
 
     console.log("Notification email sent:", emailResponse);
 
     return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error: unknown) {
     console.error("Error sending notification email:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(JSON.stringify({ success: false, error: errorMessage }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 };
 
 serve(handler);