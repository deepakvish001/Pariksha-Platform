import { useState, useRef, useEffect } from "react";
import { Sparkles, Copy, Loader2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { OutreachTemplate } from "@/data/coldOutreachData";
import { supabase } from "@/integrations/supabase/client";

interface OutreachAIPersonalizerProps {
  template: OutreachTemplate;
  placeholderValues: Record<string, string>;
  onClose: () => void;
}

const OutreachAIPersonalizer = ({
  template,
  placeholderValues,
  onClose,
}: OutreachAIPersonalizerProps) => {
  const [additionalContext, setAdditionalContext] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generatePersonalized = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setAiResponse("");

    abortControllerRef.current = new AbortController();

    const filledPlaceholders = Object.entries(placeholderValues)
      .filter(([_, value]) => value.trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const prompt = `You are an expert at writing cold outreach messages for job seekers. 

I have a template for a "${template.title}" message (${template.platform} platform).

Original template:
${template.body}

${filledPlaceholders ? `Filled in details:\n${filledPlaceholders}` : ''}

${additionalContext ? `Additional context from the user:\n${additionalContext}` : ''}

Please create a personalized, natural-sounding version of this message. Make it:
1. Sound authentic and personal, not templated
2. Keep the same general structure but improve the language
3. Be concise (especially important for LinkedIn - under 500 characters if possible)
4. Be professional yet warm
5. Include all the provided details naturally

Only output the message itself, no explanations or alternatives.`;

    try {
      // Get user session for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use AI personalization",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astra-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate personalized message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setAiResponse(fullText);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "AI-personalized message copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-lg border bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="font-semibold">AI Personalization</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="outreach-additional-context" className="text-sm text-muted-foreground mb-1 block">
            Add context (optional)
          </label>
          <Textarea
            id="outreach-additional-context"
            placeholder="E.g., 'I saw they recently gave a talk about AI', 'We have a mutual connection through a hackathon', etc."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        <Button
          onClick={generatePersonalized}
          disabled={isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Personalized Version
            </>
          )}
        </Button>

        {aiResponse && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI-Generated Message</span>
              <span className="text-xs text-muted-foreground">
                {aiResponse.length} chars
              </span>
            </div>
            <div className="p-4 rounded-lg bg-background border whitespace-pre-wrap text-sm leading-relaxed">
              {aiResponse}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generatePersonalized}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachAIPersonalizer;
