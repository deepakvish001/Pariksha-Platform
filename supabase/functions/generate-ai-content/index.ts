import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const contentTypePrompts: Record<string, string> = {
  plan: `You are an expert learning coach. Create a comprehensive study plan for the given topic. 
Return a JSON object with this structure:
{
  "overview": "Brief description of the plan",
  "duration": "Estimated completion time (e.g., '4 weeks')",
  "objectives": ["Learning objective 1", "Learning objective 2", ...],
  "phases": [
    {
      "title": "Phase title",
      "duration": "1 week",
      "tasks": ["Task 1", "Task 2", ...],
      "resources": ["Resource 1", "Resource 2", ...]
    }
  ],
  "milestones": ["Milestone 1", "Milestone 2", ...]
}`,

  course: `You are an expert curriculum designer. Create a structured course for the given topic.
Return a JSON object with this structure:
{
  "overview": "Course description",
  "difficulty": "beginner|intermediate|advanced",
  "prerequisites": ["Prerequisite 1", ...],
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "lessons": [
        {
          "title": "Lesson title",
          "content": "Lesson content in markdown",
          "keyPoints": ["Key point 1", ...]
        }
      ],
      "quiz": [
        {
          "question": "Quiz question",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 0,
          "explanation": "Why this is correct"
        }
      ]
    }
  ]
}`,

  guide: `You are a technical writer. Create a step-by-step guide for the given topic.
Return a JSON object with this structure:
{
  "overview": "Guide description",
  "estimatedTime": "30 minutes",
  "prerequisites": ["Prerequisite 1", ...],
  "steps": [
    {
      "title": "Step title",
      "content": "Detailed step content in markdown",
      "tips": ["Helpful tip 1", ...],
      "warnings": ["Warning if any", ...]
    }
  ],
  "summary": "Key takeaways",
  "nextSteps": ["What to learn next", ...]
}`,

  roadmap: `You are a career advisor. Create a learning roadmap for the given topic.
Return a JSON object with this structure:
{
  "overview": "Roadmap description",
  "totalDuration": "6 months",
  "stages": [
    {
      "title": "Stage title",
      "duration": "1 month",
      "description": "Stage description",
      "topics": [
        {
          "title": "Topic title",
          "description": "Brief description",
          "resources": ["Resource link or name", ...],
          "projects": ["Suggested project", ...]
        }
      ],
      "checkpoint": "What you should know by the end of this stage"
    }
  ],
  "careerOutcomes": ["Career path 1", ...]
}`,

  quiz: `You are an assessment expert. Create a comprehensive quiz for the given topic.
Return a JSON object with this structure:
{
  "overview": "Quiz description",
  "difficulty": "beginner|intermediate|advanced",
  "timeLimit": 15,
  "questions": [
    {
      "question": "Question text",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of the correct answer",
      "topic": "Specific topic this tests"
    }
  ]
}
Create 10-15 questions covering different aspects of the topic.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, contentType, includeQuestions } = await req.json();

    if (!topic || !contentType) {
      return new Response(
        JSON.stringify({ error: "Topic and content type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof topic !== "string" || topic.length > 500) {
      return new Response(
        JSON.stringify({ error: "Topic must be a string ≤500 chars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = contentTypePrompts[contentType];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = includeQuestions
      ? `Create a ${contentType} about: ${topic}. Include practice questions where appropriate.`
      : `Create a ${contentType} about: ${topic}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let contentJson;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      contentJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Try to extract JSON directly
      const startIdx = responseText.indexOf("{");
      const endIdx = responseText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        contentJson = JSON.parse(responseText.substring(startIdx, endIdx + 1));
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Generate a title from the topic
    const title = `${topic.charAt(0).toUpperCase() + topic.slice(1)} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;

    // Save to database
    const { data: savedContent, error: saveError } = await supabase
      .from("ai_generated_content")
      .insert({
        user_id: user.id,
        content_type: contentType,
        title,
        topic,
        content: contentJson,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save generated content");
    }

    return new Response(JSON.stringify(savedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-ai-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
