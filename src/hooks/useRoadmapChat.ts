import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const useRoadmapChat = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Fetch or create conversation
  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ["roadmap-conversation", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to find existing roadmap conversation
      const { data: existing, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("title", "Roadmap Chat")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setConversationId(existing.id);
        return existing;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: "Roadmap Chat" })
        .select()
        .single();

      if (createError) throw createError;
      setConversationId(newConv.id);
      return newConv;
    },
    enabled: !!user,
  });

  // Fetch messages for conversation
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ["roadmap-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !session || !conversationId) {
      toast.error("Please log in to use Roadmap Chat");
      return;
    }

    setIsStreaming(true);
    setStreamingContent("");

    try {
      // Save user message
      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content,
        });

      if (insertError) throw insertError;

      // Get all messages for context
      const allMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roadmap-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits.");
          return;
        }
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let textBuffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      // Save assistant message
      if (fullContent) {
        await supabase
          .from("chat_messages")
          .insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullContent,
          });
      }

      queryClient.invalidateQueries({ queryKey: ["roadmap-messages", conversationId] });
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [user, session, conversationId, messages, queryClient]);

  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;

      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-messages", conversationId] });
      toast.success("Chat history cleared");
    },
  });

  return {
    messages,
    isLoading: isConversationLoading || isMessagesLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    clearHistory: clearHistory.mutate,
  };
};
