import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface NodeOrderData {
  roadmap_id: string;
  section_id: string;
  node_order: string[];
}

interface UndoState {
  sectionId: string;
  previousOrder: string[];
}

export const useRoadmapNodeOrder = (roadmapId: string) => {
  const { user } = useAuth();
  const [customOrders, setCustomOrders] = useState<Record<string, string[]>>({});
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Load custom orders from database
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setCustomOrders({});
        setHasCustomOrder(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roadmap_node_order")
          .select("section_id, node_order")
          .eq("user_id", user.id)
          .eq("roadmap_id", roadmapId);

        if (error) throw error;

        if (data && data.length > 0) {
          const orders: Record<string, string[]> = {};
          data.forEach((row) => {
            orders[row.section_id] = row.node_order;
          });
          setCustomOrders(orders);
          setHasCustomOrder(true);
        } else {
          setCustomOrders({});
          setHasCustomOrder(false);
        }
      } catch (err) {
        console.error("Error loading node order:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user, roadmapId]);

  // Save order for a section (with optional undo tracking)
  const saveOrder = useCallback(async (sectionId: string, nodeOrder: string[], trackUndo: boolean = true) => {
    if (!user) return;

    // Track previous order for undo
    if (trackUndo) {
      const previousOrder = customOrders[sectionId];
      if (previousOrder && previousOrder.length > 0) {
        setUndoStack([{ sectionId, previousOrder }]);
        setCanUndo(true);
      }
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_roadmap_node_order")
        .upsert({
          user_id: user.id,
          roadmap_id: roadmapId,
          section_id: sectionId,
          node_order: nodeOrder,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,roadmap_id,section_id"
        });

      if (error) throw error;

      setCustomOrders(prev => ({
        ...prev,
        [sectionId]: nodeOrder
      }));
      setHasCustomOrder(true);
    } catch (err) {
      console.error("Error saving node order:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, roadmapId, customOrders]);

  // Undo the last drag action
  const undoLastAction = useCallback(async () => {
    if (undoStack.length === 0 || !user) return;

    const lastAction = undoStack[undoStack.length - 1];
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_roadmap_node_order")
        .upsert({
          user_id: user.id,
          roadmap_id: roadmapId,
          section_id: lastAction.sectionId,
          node_order: lastAction.previousOrder,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,roadmap_id,section_id"
        });

      if (error) throw error;

      setCustomOrders(prev => ({
        ...prev,
        [lastAction.sectionId]: lastAction.previousOrder
      }));
      setUndoStack([]);
      setCanUndo(false);
    } catch (err) {
      console.error("Error undoing action:", err);
    } finally {
      setIsSaving(false);
    }
  }, [undoStack, user, roadmapId]);

  // Import custom orders from shared data
  const importOrders = useCallback(async (orders: Record<string, string[]>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save each section's order
      for (const [sectionId, nodeOrder] of Object.entries(orders)) {
        const { error } = await supabase
          .from("user_roadmap_node_order")
          .upsert({
            user_id: user.id,
            roadmap_id: roadmapId,
            section_id: sectionId,
            node_order: nodeOrder,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,roadmap_id,section_id"
          });

        if (error) throw error;
      }

      setCustomOrders(orders);
      setHasCustomOrder(true);
    } catch (err) {
      console.error("Error importing orders:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, roadmapId]);

  // Reset all custom orders for this roadmap
  const resetToDefault = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_roadmap_node_order")
        .delete()
        .eq("user_id", user.id)
        .eq("roadmap_id", roadmapId);

      if (error) throw error;

      setCustomOrders({});
      setHasCustomOrder(false);
    } catch (err) {
      console.error("Error resetting node order:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user, roadmapId]);

  // Get ordered nodes for a section
  const getOrderedNodes = useCallback((sectionId: string, nodes: NodeType[]): NodeType[] => {
    const customOrder = customOrders[sectionId];
    if (!customOrder || customOrder.length === 0) {
      return nodes;
    }

    // Create a map for quick lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Order nodes based on custom order
    const orderedNodes: NodeType[] = [];
    customOrder.forEach(id => {
      const node = nodeMap.get(id);
      if (node) {
        orderedNodes.push(node);
        nodeMap.delete(id);
      }
    });
    
    // Add any remaining nodes that weren't in the custom order
    nodeMap.forEach(node => orderedNodes.push(node));
    
    return orderedNodes;
  }, [customOrders]);

  return {
    customOrders,
    hasCustomOrder,
    isLoading,
    isSaving,
    canUndo,
    saveOrder,
    resetToDefault,
    getOrderedNodes,
    undoLastAction,
    importOrders,
  };
};
