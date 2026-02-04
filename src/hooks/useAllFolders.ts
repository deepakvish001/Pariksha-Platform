import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  itemCount?: number;
}

export interface FolderItem {
  id: string;
  folder_id: string;
  question_id: number;
  question_source: string;
  sort_order: number;
  created_at: string;
}

export interface FolderWithSource extends Folder {
  source: string;
  sourceLabel: string;
}

interface UseAllFoldersReturn {
  folders: FolderWithSource[];
  folderItems: Record<string, FolderItem[]>;
  isLoading: boolean;
  updateItemOrder: (folderId: string, items: { id: string; sort_order: number }[]) => Promise<boolean>;
  refreshFolders: () => Promise<void>;
}

// Map of question sources to human-readable labels
const SOURCE_LABELS: Record<string, string> = {
  interview: "Interview Questions",
};

// Function to get label for mass recruitment sources
const getSourceLabel = (source: string): string => {
  if (source.startsWith("mass-recruitment-")) {
    const companyId = source.replace("mass-recruitment-", "");
    // Capitalize company name
    return `Mass Recruitment - ${companyId.charAt(0).toUpperCase() + companyId.slice(1).replace(/-/g, " ")}`;
  }
  return SOURCE_LABELS[source] || source;
};

export function useAllFolders(): UseAllFoldersReturn {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderWithSource[]>([]);
  const [folderItems, setFolderItems] = useState<Record<string, FolderItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setFolderItems({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all folders for user
      const { data: foldersData, error: foldersError } = await supabase
        .from("user_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (foldersError) {
        console.error("Error fetching folders:", foldersError);
        return;
      }

      // Fetch all folder items with sort order
      const { data: itemsData, error: itemsError } = await supabase
        .from("user_folder_items")
        .select("*")
        .in("folder_id", foldersData?.map((f) => f.id) || [])
        .order("sort_order", { ascending: true });

      if (itemsError) {
        console.error("Error fetching folder items:", itemsError);
      }

      // Group items by folder and get unique sources per folder
      const itemsByFolder: Record<string, FolderItem[]> = {};
      const sourcesByFolder: Record<string, Set<string>> = {};
      
      (itemsData || []).forEach((item) => {
        if (!itemsByFolder[item.folder_id]) {
          itemsByFolder[item.folder_id] = [];
          sourcesByFolder[item.folder_id] = new Set();
        }
        itemsByFolder[item.folder_id].push(item);
        sourcesByFolder[item.folder_id].add(item.question_source);
      });

      // Transform folders with source info
      const foldersWithSource: FolderWithSource[] = (foldersData || []).map((folder) => {
        const sources = sourcesByFolder[folder.id] || new Set();
        const firstSource = sources.size > 0 ? Array.from(sources)[0] : "unknown";
        
        return {
          ...folder,
          itemCount: itemsByFolder[folder.id]?.length || 0,
          source: firstSource,
          sourceLabel: sources.size > 1 
            ? `${sources.size} sources` 
            : getSourceLabel(firstSource),
        };
      });

      setFolders(foldersWithSource);
      setFolderItems(itemsByFolder);
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const updateItemOrder = useCallback(
    async (folderId: string, items: { id: string; sort_order: number }[]): Promise<boolean> => {
      if (!user) return false;

      try {
        // Update all items in a batch
        const updates = items.map((item) =>
          supabase
            .from("user_folder_items")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
        );

        await Promise.all(updates);

        // Update local state
        setFolderItems((prev) => {
          const folderItemList = prev[folderId] || [];
          const updatedItems = folderItemList.map((item) => {
            const update = items.find((u) => u.id === item.id);
            return update ? { ...item, sort_order: update.sort_order } : item;
          });
          // Sort by new order
          updatedItems.sort((a, b) => a.sort_order - b.sort_order);
          return { ...prev, [folderId]: updatedItems };
        });

        return true;
      } catch (err) {
        console.error("Error updating item order:", err);
        return false;
      }
    },
    [user]
  );

  return {
    folders,
    folderItems,
    isLoading,
    updateItemOrder,
    refreshFolders: fetchFolders,
  };
}
