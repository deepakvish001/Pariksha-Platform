import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SavedPath {
  id: string;
  name: string;
  description: string | null;
  customOrders: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useSavedPaths = (roadmapId: string) => {
  const { user } = useAuth();
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [activePath, setActivePath] = useState<SavedPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved paths from database
  useEffect(() => {
    const loadPaths = async () => {
      if (!user) {
        setSavedPaths([]);
        setActivePath(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roadmap_saved_paths")
          .select("*")
          .eq("user_id", user.id)
          .eq("roadmap_id", roadmapId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const paths: SavedPath[] = (data || []).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          customOrders: (row.custom_orders as Record<string, string[]>) || {},
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setSavedPaths(paths);
        
        // Find active path
        const active = paths.find((p) => p.isActive);
        setActivePath(active || null);
      } catch (err) {
        console.error("Error loading saved paths:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPaths();
  }, [user, roadmapId]);

  // Save a new path
  const savePath = useCallback(
    async (name: string, description: string, customOrders: Record<string, string[]>) => {
      if (!user) return null;

      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("user_roadmap_saved_paths")
          .insert({
            user_id: user.id,
            roadmap_id: roadmapId,
            name,
            description: description || null,
            custom_orders: customOrders,
            is_active: false,
          })
          .select()
          .single();

        if (error) throw error;

        const newPath: SavedPath = {
          id: data.id,
          name: data.name,
          description: data.description,
          customOrders: (data.custom_orders as Record<string, string[]>) || {},
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setSavedPaths((prev) => [newPath, ...prev]);
        
        toast({
          title: "Path saved!",
          description: `"${name}" has been saved to your collection.`,
        });

        return newPath;
      } catch (err) {
        console.error("Error saving path:", err);
        toast({
          title: "Failed to save path",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [user, roadmapId]
  );

  // Activate a saved path
  const activatePath = useCallback(
    async (pathId: string) => {
      if (!user) return;

      setIsSaving(true);
      try {
        // Deactivate all paths first
        await supabase
          .from("user_roadmap_saved_paths")
          .update({ is_active: false })
          .eq("user_id", user.id)
          .eq("roadmap_id", roadmapId);

        // Activate the selected path
        const { error } = await supabase
          .from("user_roadmap_saved_paths")
          .update({ is_active: true })
          .eq("id", pathId);

        if (error) throw error;

        setSavedPaths((prev) =>
          prev.map((p) => ({
            ...p,
            isActive: p.id === pathId,
          }))
        );

        const path = savedPaths.find((p) => p.id === pathId);
        setActivePath(path || null);

        toast({
          title: "Path activated!",
          description: `Now using "${path?.name}" layout.`,
        });

        return path?.customOrders || {};
      } catch (err) {
        console.error("Error activating path:", err);
        toast({
          title: "Failed to activate path",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [user, roadmapId, savedPaths]
  );

  // Deactivate all paths (use default order)
  const deactivateAllPaths = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await supabase
        .from("user_roadmap_saved_paths")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId);

      setSavedPaths((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: false,
        }))
      );
      setActivePath(null);
    } catch (err) {
      console.error("Error deactivating paths:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, roadmapId]);

  // Delete a saved path
  const deletePath = useCallback(
    async (pathId: string) => {
      if (!user) return;

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("user_roadmap_saved_paths")
          .delete()
          .eq("id", pathId);

        if (error) throw error;

        setSavedPaths((prev) => prev.filter((p) => p.id !== pathId));
        
        if (activePath?.id === pathId) {
          setActivePath(null);
        }

        toast({
          title: "Path deleted",
        });
      } catch (err) {
        console.error("Error deleting path:", err);
        toast({
          title: "Failed to delete path",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user, activePath]
  );

  // Update a saved path
  const updatePath = useCallback(
    async (pathId: string, updates: { name?: string; description?: string; customOrders?: Record<string, string[]> }) => {
      if (!user) return;

      setIsSaving(true);
      try {
        const updateData: Record<string, unknown> = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.customOrders) updateData.custom_orders = updates.customOrders;

        const { error } = await supabase
          .from("user_roadmap_saved_paths")
          .update(updateData)
          .eq("id", pathId);

        if (error) throw error;

        setSavedPaths((prev) =>
          prev.map((p) =>
            p.id === pathId
              ? {
                  ...p,
                  name: updates.name || p.name,
                  description: updates.description !== undefined ? updates.description : p.description,
                  customOrders: updates.customOrders || p.customOrders,
                }
              : p
          )
        );

        toast({
          title: "Path updated!",
        });
      } catch (err) {
        console.error("Error updating path:", err);
        toast({
          title: "Failed to update path",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  // Duplicate a saved path
  const duplicatePath = useCallback(
    async (pathId: string) => {
      if (!user) return null;

      const pathToDuplicate = savedPaths.find((p) => p.id === pathId);
      if (!pathToDuplicate) return null;

      setIsSaving(true);
      try {
        const newName = `${pathToDuplicate.name} (Copy)`;
        
        const { data, error } = await supabase
          .from("user_roadmap_saved_paths")
          .insert({
            user_id: user.id,
            roadmap_id: roadmapId,
            name: newName,
            description: pathToDuplicate.description,
            custom_orders: pathToDuplicate.customOrders,
            is_active: false,
          })
          .select()
          .single();

        if (error) throw error;

        const newPath: SavedPath = {
          id: data.id,
          name: data.name,
          description: data.description,
          customOrders: (data.custom_orders as Record<string, string[]>) || {},
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setSavedPaths((prev) => [newPath, ...prev]);

        toast({
          title: "Path duplicated!",
          description: `Created "${newName}" from "${pathToDuplicate.name}".`,
        });

        return newPath;
      } catch (err) {
        console.error("Error duplicating path:", err);
        toast({
          title: "Failed to duplicate path",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [user, roadmapId, savedPaths]
  );

  return {
    savedPaths,
    activePath,
    isLoading,
    isSaving,
    savePath,
    activatePath,
    deactivateAllPaths,
    deletePath,
    updatePath,
    duplicatePath,
  };
};
