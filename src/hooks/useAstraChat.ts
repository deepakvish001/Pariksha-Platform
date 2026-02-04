import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

export type Conversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/astra-chat`;

export function useAstraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, [user]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setMessages(data?.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })) || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation history.",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      setCurrentConversationId(data.id);
      await fetchConversations();
      return data.id;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  }, [user, fetchConversations]);

  // Save message to database
  const saveMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({ conversation_id: conversationId, role, content });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }, []);

  // Send message with streaming
  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || !user) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let conversationId = currentConversationId;
    
    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation(input);
      if (!conversationId) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to start conversation.",
        });
        return;
      }
    }

    // Save user message
    await saveMessage(conversationId, "user", input.trim());

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limited",
            description: errorData.error || "Too many requests. Please wait a moment.",
          });
        } else if (resp.status === 402) {
          toast({
            variant: "destructive",
            title: "Usage Limit",
            description: errorData.error || "Please add credits to continue.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorData.error || "Failed to get response.",
          });
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Save assistant message after streaming completes
      if (assistantContent && conversationId) {
        await saveMessage(conversationId, "assistant", assistantContent);
        await fetchConversations(); // Refresh list to update timestamps
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to Astra AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, currentConversationId, createConversation, saveMessage, fetchConversations, toast]);

  // Start new chat
  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      if (currentConversationId === conversationId) {
        newChat();
      }
      await fetchConversations();
      
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation.",
      });
    }
  }, [currentConversationId, newChat, fetchConversations, toast]);

  // Rename conversation
  const renameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", conversationId);

      if (error) throw error;

      await fetchConversations();
      
      toast({
        title: "Renamed",
        description: "Conversation renamed successfully.",
      });
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to rename conversation.",
      });
    }
  }, [fetchConversations, toast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isLoadingHistory,
    sendMessage,
    loadConversation,
    newChat,
    deleteConversation,
    renameConversation,
    fetchConversations,
  };
}
