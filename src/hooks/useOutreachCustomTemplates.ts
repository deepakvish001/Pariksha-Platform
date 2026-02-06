import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { OutreachCategory, OutreachPlatform } from "@/data/coldOutreachData";

export interface CustomTemplate {
  id: string;
  user_id: string;
  title: string;
  category: OutreachCategory;
  platform: OutreachPlatform;
  subject?: string;
  body: string;
  placeholders: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  category: OutreachCategory;
  platform: OutreachPlatform;
  subject?: string;
  body: string;
  tags?: string[];
}

export const useOutreachCustomTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const extractPlaceholders = (body: string): string[] => {
    const matches = body.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(2, -2)))];
  };

  const loadTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("outreach_custom_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to load custom templates:", error);
      toast({
        title: "Error",
        description: "Failed to load your custom templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createTemplate = useCallback(
    async (input: CreateTemplateInput) => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to create custom templates.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const placeholders = extractPlaceholders(input.body);
        const { data, error } = await (supabase as any)
          .from("outreach_custom_templates")
          .insert({
            user_id: user.id,
            title: input.title,
            category: input.category,
            platform: input.platform,
            subject: input.subject,
            body: input.body,
            placeholders,
            tags: input.tags || [],
          })
          .select()
          .single();

        if (error) throw error;

        setTemplates((prev) => [data, ...prev]);
        toast({
          title: "Template created!",
          description: "Your custom template has been saved.",
        });
        return data;
      } catch (error) {
        console.error("Failed to create template:", error);
        toast({
          title: "Error",
          description: "Failed to create template. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    },
    [user]
  );

  const updateTemplate = useCallback(
    async (id: string, input: Partial<CreateTemplateInput>) => {
      if (!user) return false;

      try {
        const updates: any = { ...input };
        if (input.body) {
          updates.placeholders = extractPlaceholders(input.body);
        }

        const { error } = await (supabase as any)
          .from("outreach_custom_templates")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
        toast({
          title: "Template updated!",
          description: "Your changes have been saved.",
        });
        return true;
      } catch (error) {
        console.error("Failed to update template:", error);
        toast({
          title: "Error",
          description: "Failed to update template. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
        const { error } = await (supabase as any)
          .from("outreach_custom_templates")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast({
          title: "Template deleted",
          description: "Your template has been removed.",
        });
        return true;
      } catch (error) {
        console.error("Failed to delete template:", error);
        toast({
          title: "Error",
          description: "Failed to delete template. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user]
  );

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: loadTemplates,
  };
};
