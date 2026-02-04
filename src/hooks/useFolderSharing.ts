import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SharedFolder {
  id: string;
  folder_id: string;
  share_code: string;
  is_public: boolean;
  allow_copy: boolean;
  created_at: string;
  expires_at: string | null;
}

interface UseFolderSharingReturn {
  isLoading: boolean;
  createShareLink: (folderId: string, allowCopy?: boolean) => Promise<string | null>;
  getShareLink: (folderId: string) => Promise<SharedFolder | null>;
  deleteShareLink: (folderId: string) => Promise<boolean>;
  getSharedFolderByCode: (shareCode: string) => Promise<{
    folder: { name: string; description: string | null; color: string } | null;
    items: { question_id: number; question_source: string; sort_order: number }[];
  } | null>;
}

// Generate a random share code
const generateShareCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export function useFolderSharing(): UseFolderSharingReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const createShareLink = useCallback(
    async (folderId: string, allowCopy: boolean = true): Promise<string | null> => {
      if (!user) return null;

      setIsLoading(true);
      try {
        // Check if share already exists
        const { data: existing } = await supabase
          .from("shared_folders")
          .select("share_code")
          .eq("folder_id", folderId)
          .maybeSingle();

        if (existing) {
          return existing.share_code;
        }

        // Create new share
        const shareCode = generateShareCode();
        const { data, error } = await supabase
          .from("shared_folders")
          .insert({
            folder_id: folderId,
            share_code: shareCode,
            is_public: true,
            allow_copy: allowCopy,
          })
          .select("share_code")
          .single();

        if (error) {
          console.error("Error creating share link:", error);
          return null;
        }

        return data.share_code;
      } catch (err) {
        console.error("Error creating share link:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const getShareLink = useCallback(
    async (folderId: string): Promise<SharedFolder | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("shared_folders")
          .select("*")
          .eq("folder_id", folderId)
          .maybeSingle();

        if (error) {
          console.error("Error getting share link:", error);
          return null;
        }

        return data;
      } catch (err) {
        console.error("Error getting share link:", err);
        return null;
      }
    },
    [user]
  );

  const deleteShareLink = useCallback(
    async (folderId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("shared_folders")
          .delete()
          .eq("folder_id", folderId);

        if (error) {
          console.error("Error deleting share link:", error);
          return false;
        }

        return true;
      } catch (err) {
        console.error("Error deleting share link:", err);
        return false;
      }
    },
    [user]
  );

  const getSharedFolderByCode = useCallback(
    async (shareCode: string) => {
      try {
        // Get the shared folder record
        const { data: sharedData, error: sharedError } = await supabase
          .from("shared_folders")
          .select("folder_id, allow_copy")
          .eq("share_code", shareCode)
          .eq("is_public", true)
          .maybeSingle();

        if (sharedError || !sharedData) {
          console.error("Error fetching shared folder:", sharedError);
          return null;
        }

        // Get folder details
        const { data: folderData, error: folderError } = await supabase
          .from("user_folders")
          .select("name, description, color")
          .eq("id", sharedData.folder_id)
          .maybeSingle();

        if (folderError) {
          console.error("Error fetching folder details:", folderError);
          return null;
        }

        // Get folder items
        const { data: itemsData, error: itemsError } = await supabase
          .from("user_folder_items")
          .select("question_id, question_source, sort_order")
          .eq("folder_id", sharedData.folder_id)
          .order("sort_order", { ascending: true });

        if (itemsError) {
          console.error("Error fetching folder items:", itemsError);
          return null;
        }

        return {
          folder: folderData,
          items: itemsData || [],
        };
      } catch (err) {
        console.error("Error fetching shared folder:", err);
        return null;
      }
    },
    []
  );

  return {
    isLoading,
    createShareLink,
    getShareLink,
    deleteShareLink,
    getSharedFolderByCode,
  };
}
