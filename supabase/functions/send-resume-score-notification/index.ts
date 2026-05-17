import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResumeScoreNotification {
  user_id: string;
  notification_type: "improvement" | "milestone";
  current_score: number;
  previous_score?: number;
  improvement?: number;
  milestone?: string;
  file_name: string;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const getMilestoneInfo = (score: number): { reached: boolean; milestone: string; emoji: string } | null => {
  if (score >= 95) return { reached: true, milestone: "95+", emoji: "🏆" };
  if (score >= 90) return { reached: true, milestone: "90+", emoji: "🥇" };
  if (score >= 80) return { reached: true, milestone: "80+", emoji: "⭐" };
  if (score >= 70) return { reached: true, milestone: "70+", emoji: "🎯" };
  return null;
};

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
    const payload: ResumeScoreNotification = await req.json();
    const { user_id, notification_type, current_score, previous_score, improvement, milestone, file_name } = payload;

    // Validate that the user_id in the request matches the authenticated user
    if (user_id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You can only send notifications for your own account" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role client for data access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's email
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
      .select("email_notifications_enabled")
      .eq("user_id", user_id)
      .single();

    // Get user's name
    const { data: basicProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    const userName = escapeHtml(basicProfile?.full_name || "there");
    const safeFileName = escapeHtml(file_name || "");
    const safeMilestone = escapeHtml(milestone || "");

    if (profile?.email_notifications_enabled === false) {
      console.log("User has email notifications disabled");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailSubject = "";
    let emailHtml = "";

    if (notification_type === "improvement" && improvement) {
      emailSubject = `🚀 Great Progress! Your Resume Score Improved by ${improvement} Points`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0; font-size: 28px;">🚀 Amazing Progress!</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Hi ${userName},</p>
          
          <p style="font-size: 16px; color: #374151;">
            Congratulations! Your latest resume analysis shows significant improvement.
          </p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Your Score Improved By</p>
            <p style="margin: 0; font-size: 48px; font-weight: bold; color: #22c55e;">+${improvement}</p>
            <p style="margin: 8px 0 0 0; color: #374151; font-size: 16px;">
              ${previous_score} → ${current_score} points
            </p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Resume Analyzed</p>
            <p style="margin: 4px 0 0 0; color: #374151; font-weight: 500;">${file_name}</p>
          </div>
          
          <p style="font-size: 16px; color: #374151;">
            Keep iterating on your resume to reach even higher scores. Every improvement brings you closer to landing your dream job!
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://preppath.dev/research/analyser" 
               style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              View Full Analysis
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            You're receiving this email because you have email notifications enabled. 
            Manage your preferences in Settings.
          </p>
        </div>
      `;
    } else if (notification_type === "milestone" && milestone) {
      const milestoneInfo = getMilestoneInfo(current_score);
      const emoji = milestoneInfo?.emoji || "🎉";
      
      emailSubject = `${emoji} Milestone Reached! Your Resume Scored ${current_score}/100`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">${emoji} Milestone Unlocked!</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Hi ${userName},</p>
          
          <p style="font-size: 16px; color: #374151;">
            Incredible work! Your resume has reached an important milestone.
          </p>
          
          <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">You've Reached The</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #4f46e5;">${milestone} Club</p>
            <p style="margin: 8px 0 0 0; color: #374151; font-size: 18px;">
              Score: <strong>${current_score}/100</strong>
            </p>
          </div>
          
          ${current_score >= 90 ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                🌟 You're in the top tier! Your resume is highly competitive and ATS-ready.
              </p>
            </div>
          ` : current_score >= 80 ? `
            <div style="background: #d1fae5; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                ✨ Excellent! Your resume stands out from the crowd.
              </p>
            </div>
          ` : ''}
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Resume Analyzed</p>
            <p style="margin: 4px 0 0 0; color: #374151; font-weight: 500;">${file_name}</p>
          </div>
          
          <p style="font-size: 16px; color: #374151;">
            ${current_score >= 90 
              ? "Your resume is in excellent shape. Consider applying to your target roles with confidence!" 
              : "Keep refining your resume to unlock the next milestone and maximize your chances!"}
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://preppath.dev/research/analyser" 
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              View Full Analysis
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            You're receiving this email because you have email notifications enabled. 
            Manage your preferences in Settings.
          </p>
        </div>
      `;
    }

    if (!emailSubject || !emailHtml) {
      return new Response(JSON.stringify({ success: false, error: "Invalid notification type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "PrepPath <notifications@preppath.dev>",
      to: [userEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Resume score notification email sent:", emailResponse);

    // Also create an in-app notification
    await supabase.from("notifications").insert({
      user_id,
      type: `resume_${notification_type}`,
      title: notification_type === "improvement" 
        ? `Resume Score Improved by ${improvement} Points!` 
        : `Milestone Reached: ${milestone}`,
      message: notification_type === "improvement"
        ? `Your resume "${file_name}" improved from ${previous_score} to ${current_score} points.`
        : `Your resume "${file_name}" scored ${current_score}/100, reaching the ${milestone} milestone!`,
      data: { current_score, previous_score, improvement, milestone, file_name },
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending resume score notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
