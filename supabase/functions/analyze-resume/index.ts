import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisResult {
  overall_score: number;
  ats_score: number;
  keyword_score: number;
  format_score: number;
  content_score: number;
  suggestions: { text: string; priority: "high" | "medium" | "low" }[];
  strengths: string[];
  keywords_found: string[];
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileUrl, fileName, resumeText, jobDescription } = await req.json();

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: "Resume text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const jobContext = jobDescription 
      ? `\n\nThe candidate is applying for a position with this job description:\n${jobDescription}\n\nEvaluate how well the resume matches this specific role.`
      : "";

    const systemPrompt = `You are an expert resume analyst and ATS (Applicant Tracking System) specialist. Analyze resumes and provide detailed, actionable feedback.

Your task is to analyze the provided resume and return a JSON response with the following structure:
{
  "overall_score": <number 0-100>,
  "ats_score": <number 0-100>,
  "keyword_score": <number 0-100>,
  "format_score": <number 0-100>,
  "content_score": <number 0-100>,
  "suggestions": [
    { "text": "<specific improvement suggestion>", "priority": "high|medium|low" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "keywords_found": ["<keyword 1>", "<keyword 2>", ...],
  "summary": "<2-3 sentence overall assessment>"
}

Scoring criteria:
- ATS Score: How well the resume is formatted for ATS systems (avoid tables, graphics, unusual fonts)
- Keyword Score: Presence of industry-relevant keywords and action verbs
- Format Score: Clear sections, readability, professional layout, appropriate length
- Content Score: Quantifiable achievements, impact statements, relevant experience
- Overall Score: Weighted average of all scores

Provide exactly 5 suggestions ordered by priority (high first).
Identify 3-5 key strengths.
Extract up to 10 relevant industry keywords found in the resume.

IMPORTANT: Return ONLY valid JSON, no markdown or extra text.`;

    const userPrompt = `Analyze this resume:${jobContext}

---
${resumeText}
---

Return the analysis as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response, handling potential markdown code blocks
    let analysisResult: AnalysisResult;
    try {
      let jsonString = content.trim();
      // Remove markdown code blocks if present
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.slice(0, -3);
      }
      analysisResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse analysis results");
    }

    // Validate and sanitize the response
    const sanitizedResult: AnalysisResult = {
      overall_score: Math.min(100, Math.max(0, analysisResult.overall_score || 0)),
      ats_score: Math.min(100, Math.max(0, analysisResult.ats_score || 0)),
      keyword_score: Math.min(100, Math.max(0, analysisResult.keyword_score || 0)),
      format_score: Math.min(100, Math.max(0, analysisResult.format_score || 0)),
      content_score: Math.min(100, Math.max(0, analysisResult.content_score || 0)),
      suggestions: (analysisResult.suggestions || []).slice(0, 5).map((s: any) => ({
        text: String(s.text || s),
        priority: ["high", "medium", "low"].includes(s.priority) ? s.priority : "medium",
      })),
      strengths: (analysisResult.strengths || []).slice(0, 5).map((s: any) => String(s)),
      keywords_found: (analysisResult.keywords_found || []).slice(0, 10).map((k: any) => String(k)),
      summary: String(analysisResult.summary || "Analysis complete."),
    };

    return new Response(
      JSON.stringify({ success: true, analysis: sanitizedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-resume error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
