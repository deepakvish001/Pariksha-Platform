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

interface MergeUndoState {
  mergedPathId: string;
  pathId1: string;
  pathId2: string;
  name: string;
  strategy: "interleave" | "prioritize-first" | "prioritize-second";
  mergedOrders: Record<string, string[]>;
}

export type PathOperationType = 
  | "create" 
  | "delete" 
  | "activate" 
  | "deactivate" 
  | "update" 
  | "duplicate" 
  | "merge" 
  | "undo-merge" 
  | "redo-merge";

export interface PathOperation {
  id: string;
  type: PathOperationType;
  pathName: string;
  pathId?: string;
  details?: string;
  timestamp: Date;
}

export const useSavedPaths = (roadmapId: string) => {
  const { user } = useAuth();
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [activePath, setActivePath] = useState<SavedPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Undo/Redo state for merge operations
  const [mergeUndoStack, setMergeUndoStack] = useState<MergeUndoState[]>([]);
  const [mergeRedoStack, setMergeRedoStack] = useState<MergeUndoState[]>([]);
  
  // Operation history
  const [operationHistory, setOperationHistory] = useState<PathOperation[]>([]);
  
  const addToHistory = (type: PathOperationType, pathName: string, pathId?: string, details?: string) => {
    const operation: PathOperation = {
      id: crypto.randomUUID(),
      type,
      pathName,
      pathId,
      details,
      timestamp: new Date(),
    };
    setOperationHistory((prev) => [operation, ...prev].slice(0, 50)); // Keep last 50 operations
  };

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
        
        addToHistory("create", name, data.id);
        
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

        addToHistory("activate", path?.name || "Unknown", pathId);

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

      const pathToDelete = savedPaths.find((p) => p.id === pathId);

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

        addToHistory("delete", pathToDelete?.name || "Unknown", pathId);

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
    [user, activePath, savedPaths]
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

        addToHistory("duplicate", newName, data.id, `from "${pathToDuplicate.name}"`);

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

  // Merge two paths together
  const mergePaths = useCallback(
    async (
      pathId1: string,
      pathId2: string,
      name: string,
      strategy: "interleave" | "prioritize-first" | "prioritize-second"
    ) => {
      if (!user) return null;

      const path1 = savedPaths.find((p) => p.id === pathId1);
      const path2 = savedPaths.find((p) => p.id === pathId2);

      if (!path1 || !path2) return null;

      // Merge the custom orders based on strategy
      const mergedOrders: Record<string, string[]> = {};
      const allSections = new Set([
        ...Object.keys(path1.customOrders),
        ...Object.keys(path2.customOrders),
      ]);

      allSections.forEach((sectionId) => {
        const order1 = path1.customOrders[sectionId] || [];
        const order2 = path2.customOrders[sectionId] || [];

        if (order1.length === 0) {
          mergedOrders[sectionId] = order2;
        } else if (order2.length === 0) {
          mergedOrders[sectionId] = order1;
        } else {
          // Merge based on strategy
          const merged: string[] = [];
          const seen = new Set<string>();

          if (strategy === "interleave") {
            // Alternate between the two lists
            const maxLen = Math.max(order1.length, order2.length);
            for (let i = 0; i < maxLen; i++) {
              if (i < order1.length && !seen.has(order1[i])) {
                merged.push(order1[i]);
                seen.add(order1[i]);
              }
              if (i < order2.length && !seen.has(order2[i])) {
                merged.push(order2[i]);
                seen.add(order2[i]);
              }
            }
          } else if (strategy === "prioritize-first") {
            // Take all from first, then add any unique from second
            order1.forEach((id) => {
              if (!seen.has(id)) {
                merged.push(id);
                seen.add(id);
              }
            });
            order2.forEach((id) => {
              if (!seen.has(id)) {
                merged.push(id);
                seen.add(id);
              }
            });
          } else {
            // prioritize-second: Take all from second, then add any unique from first
            order2.forEach((id) => {
              if (!seen.has(id)) {
                merged.push(id);
                seen.add(id);
              }
            });
            order1.forEach((id) => {
              if (!seen.has(id)) {
                merged.push(id);
                seen.add(id);
              }
            });
          }

          mergedOrders[sectionId] = merged;
        }
      });

      setIsSaving(true);
      try {
        const { data, error } = await supabase
          .from("user_roadmap_saved_paths")
          .insert({
            user_id: user.id,
            roadmap_id: roadmapId,
            name,
            description: `Merged from "${path1.name}" and "${path2.name}"`,
            custom_orders: mergedOrders,
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

        // Track for undo
        setMergeUndoStack((prev) => [...prev, {
          mergedPathId: data.id,
          pathId1,
          pathId2,
          name,
          strategy,
          mergedOrders,
        }]);
        // Clear redo stack on new merge
        setMergeRedoStack([]);

        addToHistory("merge", name, data.id, `from "${path1.name}" + "${path2.name}"`);

        toast({
          title: "Paths merged!",
          description: `Created "${name}" by combining two paths.`,
        });

        return newPath;
      } catch (err) {
        console.error("Error merging paths:", err);
        toast({
          title: "Failed to merge paths",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [user, roadmapId, savedPaths]
  );

  // Undo merge operation
  const undoMerge = useCallback(async () => {
    if (mergeUndoStack.length === 0 || !user) return;

    const lastMerge = mergeUndoStack[mergeUndoStack.length - 1];
    
    setIsSaving(true);
    try {
      // Delete the merged path
      const { error } = await supabase
        .from("user_roadmap_saved_paths")
        .delete()
        .eq("id", lastMerge.mergedPathId);

      if (error) throw error;

      setSavedPaths((prev) => prev.filter((p) => p.id !== lastMerge.mergedPathId));
      
      // Move to redo stack
      setMergeRedoStack((prev) => [...prev, lastMerge]);
      setMergeUndoStack((prev) => prev.slice(0, -1));

      addToHistory("undo-merge", lastMerge.name);

      toast({
        title: "Merge undone",
        description: "The merged path has been removed.",
      });
    } catch (err) {
      console.error("Error undoing merge:", err);
      toast({
        title: "Failed to undo merge",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [mergeUndoStack, user]);

  // Redo merge operation
  const redoMerge = useCallback(async () => {
    if (mergeRedoStack.length === 0 || !user) return;

    const lastUndo = mergeRedoStack[mergeRedoStack.length - 1];
    const path1 = savedPaths.find((p) => p.id === lastUndo.pathId1);
    const path2 = savedPaths.find((p) => p.id === lastUndo.pathId2);

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("user_roadmap_saved_paths")
        .insert({
          user_id: user.id,
          roadmap_id: roadmapId,
          name: lastUndo.name,
          description: `Merged from "${path1?.name || 'Path 1'}" and "${path2?.name || 'Path 2'}"`,
          custom_orders: lastUndo.mergedOrders,
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
      
      // Update undo state with new path ID and move back to undo stack
      const updatedState = { ...lastUndo, mergedPathId: data.id };
      setMergeUndoStack((prev) => [...prev, updatedState]);
      setMergeRedoStack((prev) => prev.slice(0, -1));

      addToHistory("redo-merge", lastUndo.name, data.id);

      toast({
        title: "Merge redone",
        description: `"${lastUndo.name}" has been recreated.`,
      });
    } catch (err) {
      console.error("Error redoing merge:", err);
      toast({
        title: "Failed to redo merge",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [mergeRedoStack, user, roadmapId, savedPaths]);

  // Clear history
  const clearHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

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
    mergePaths,
    // Undo/Redo for merge
    canUndoMerge: mergeUndoStack.length > 0,
    canRedoMerge: mergeRedoStack.length > 0,
    undoMerge,
    redoMerge,
    // History
    operationHistory,
    clearHistory,
  };
};
