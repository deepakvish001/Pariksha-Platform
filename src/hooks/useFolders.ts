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

interface UseFoldersReturn {
  folders: Folder[];
  folderItems: Record<string, FolderItem[]>;
  isLoading: boolean;
  createFolder: (name: string, description?: string, color?: string) => Promise<Folder | null>;
  updateFolder: (id: string, updates: Partial<Pick<Folder, "name" | "description" | "color">>) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  addToFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  removeFromFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  isInFolder: (folderId: string, questionId: number, questionSource: string) => boolean;
  getQuestionFolders: (questionId: number, questionSource: string) => string[];
  refreshFolders: () => Promise<void>;
}

export function useFolders(questionSource: string = "interview"): UseFoldersReturn {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
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
      // Fetch folders
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

      // Group items by folder
      const itemsByFolder: Record<string, FolderItem[]> = {};
      (itemsData || []).forEach((item) => {
        if (!itemsByFolder[item.folder_id]) {
          itemsByFolder[item.folder_id] = [];
        }
        itemsByFolder[item.folder_id].push(item);
      });

      // Add item count to folders
      const foldersWithCount = (foldersData || []).map((folder) => ({
        ...folder,
        itemCount: itemsByFolder[folder.id]?.length || 0,
      }));

      setFolders(foldersWithCount);
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

  const createFolder = useCallback(
    async (name: string, description?: string, color?: string): Promise<Folder | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("user_folders")
          .insert({
            user_id: user.id,
            name,
            description: description || null,
            color: color || "primary",
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating folder:", error);
          return null;
        }

        const newFolder = { ...data, itemCount: 0 };
        setFolders((prev) => [newFolder, ...prev]);
        setFolderItems((prev) => ({ ...prev, [data.id]: [] }));
        return newFolder;
      } catch (err) {
        console.error("Error creating folder:", err);
        return null;
      }
    },
    [user]
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<Pick<Folder, "name" | "description" | "color">>): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("user_folders")
          .update(updates)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating folder:", error);
          return false;
        }

        setFolders((prev) =>
          prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
        return true;
      } catch (err) {
        console.error("Error updating folder:", err);
        return false;
      }
    },
    [user]
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("user_folders")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error deleting folder:", error);
          return false;
        }

        setFolders((prev) => prev.filter((f) => f.id !== id));
        setFolderItems((prev) => {
          const newItems = { ...prev };
          delete newItems[id];
          return newItems;
        });
        return true;
      } catch (err) {
        console.error("Error deleting folder:", err);
        return false;
      }
    },
    [user]
  );

  const addToFolder = useCallback(
    async (folderId: string, questionId: number, source: string): Promise<boolean> => {
      if (!user) return false;

      try {
        // Get the current max sort_order for this folder
        const currentItems = folderItems[folderId] || [];
        const maxSortOrder = currentItems.reduce(
          (max, item) => Math.max(max, item.sort_order || 0),
          -1
        );

        const { data, error } = await supabase
          .from("user_folder_items")
          .insert({
            folder_id: folderId,
            question_id: questionId,
            question_source: source,
            sort_order: maxSortOrder + 1,
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding to folder:", error);
          return false;
        }

        setFolderItems((prev) => ({
          ...prev,
          [folderId]: [...(prev[folderId] || []), data],
        }));

        setFolders((prev) =>
          prev.map((f) =>
            f.id === folderId ? { ...f, itemCount: (f.itemCount || 0) + 1 } : f
          )
        );

        return true;
      } catch (err) {
        console.error("Error adding to folder:", err);
        return false;
      }
    },
    [user, folderItems]
  );

  const removeFromFolder = useCallback(
    async (folderId: string, questionId: number, source: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("user_folder_items")
          .delete()
          .eq("folder_id", folderId)
          .eq("question_id", questionId)
          .eq("question_source", source);

        if (error) {
          console.error("Error removing from folder:", error);
          return false;
        }

        setFolderItems((prev) => ({
          ...prev,
          [folderId]: (prev[folderId] || []).filter(
            (item) => !(item.question_id === questionId && item.question_source === source)
          ),
        }));

        setFolders((prev) =>
          prev.map((f) =>
            f.id === folderId ? { ...f, itemCount: Math.max(0, (f.itemCount || 0) - 1) } : f
          )
        );

        return true;
      } catch (err) {
        console.error("Error removing from folder:", err);
        return false;
      }
    },
    [user]
  );

  const isInFolder = useCallback(
    (folderId: string, questionId: number, source: string): boolean => {
      const items = folderItems[folderId] || [];
      return items.some(
        (item) => item.question_id === questionId && item.question_source === source
      );
    },
    [folderItems]
  );

  const getQuestionFolders = useCallback(
    (questionId: number, source: string): string[] => {
      const result: string[] = [];
      Object.entries(folderItems).forEach(([folderId, items]) => {
        if (items.some((item) => item.question_id === questionId && item.question_source === source)) {
          result.push(folderId);
        }
      });
      return result;
    },
    [folderItems]
  );

  return {
    folders,
    folderItems,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    addToFolder,
    removeFromFolder,
    isInFolder,
    getQuestionFolders,
    refreshFolders: fetchFolders,
  };
}
