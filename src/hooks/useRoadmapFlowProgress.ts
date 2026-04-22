import { useState, useCallback, useMemo, useEffect } from 'react';
import { NodeStatus, roadmapNodesData } from '@/data/fullStackRoadmapData';

const STORAGE_KEY = 'fullstack-roadmap-progress';
// Mirror key so the generic listing page (`/dashboard/roadmaps`) can read
// fullstack progress in the same shape as other roadmaps.
const SYNC_KEY = 'roadmap-progress-fullstack';

type ProgressMap = Record<string, NodeStatus>;

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Convert flow status map → boolean map (only "done" counts as completed).
function toBooleanMap(progress: ProgressMap): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [id, status] of Object.entries(progress)) {
    if (status === 'done') result[id] = true;
  }
  return result;
}

function syncToGeneric(progress: ProgressMap) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(toBooleanMap(progress)));
  } catch {
    /* ignore */
  }
}

export function useRoadmapFlowProgress() {
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  // Keep generic mirror in sync whenever progress changes
  useEffect(() => {
    syncToGeneric(progress);
  }, [progress]);

  const getStatus = useCallback((nodeId: string): NodeStatus => {
    return progress[nodeId] || 'pending';
  }, [progress]);

  const setStatus = useCallback((nodeId: string, status: NodeStatus) => {
    setProgress((prev) => {
      const next = { ...prev };
      if (status === 'pending') {
        delete next[nodeId];
      } else {
        next[nodeId] = status;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      syncToGeneric(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYNC_KEY);
    setProgress({});
  }, []);

  const totalNodes = roadmapNodesData.length;

  const stats = useMemo(() => {
    let done = 0, inProgress = 0, skipped = 0;
    Object.values(progress).forEach((s) => {
      if (s === 'done') done++;
      else if (s === 'in-progress') inProgress++;
      else if (s === 'skipped') skipped++;
    });
    return {
      done,
      inProgress,
      skipped,
      pending: totalNodes - done - inProgress - skipped,
      total: totalNodes,
      percentage: totalNodes > 0 ? Math.round((done / totalNodes) * 100) : 0,
    };
  }, [progress, totalNodes]);

  return { getStatus, setStatus, resetAll, stats, progress };
}
