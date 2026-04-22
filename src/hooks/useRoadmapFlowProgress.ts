import { useState, useCallback, useMemo, useEffect } from 'react';
import { NodeStatus } from '@/data/fullStackRoadmapData';

type ProgressMap = Record<string, NodeStatus>;

interface UseRoadmapFlowProgressOptions {
  /** Roadmap identifier — used to scope storage. Defaults to 'fullstack' for backwards compatibility. */
  roadmapId?: string;
  /** Total number of topic nodes in the flow (for percentage calc). */
  totalNodes: number;
}

const buildKeys = (id: string) => ({
  storage: `roadmap-flow-progress-${id}`,
  // Mirror key so the generic listing page (`/dashboard/roadmaps`) can read
  // each roadmap's progress in a uniform shape.
  sync: `roadmap-progress-${id}`,
});

// Keep legacy fullstack-only key working so existing user data is not lost.
const LEGACY_FULLSTACK_KEY = 'fullstack-roadmap-progress';

function loadProgress(id: string): ProgressMap {
  try {
    const { storage } = buildKeys(id);
    let raw = localStorage.getItem(storage);
    // One-time migration of legacy fullstack key
    if (!raw && id === 'fullstack') {
      const legacy = localStorage.getItem(LEGACY_FULLSTACK_KEY);
      if (legacy) {
        localStorage.setItem(storage, legacy);
        raw = legacy;
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function toBooleanMap(progress: ProgressMap): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [id, status] of Object.entries(progress)) {
    if (status === 'done') result[id] = true;
  }
  return result;
}

function syncToGeneric(syncKey: string, progress: ProgressMap) {
  try {
    localStorage.setItem(syncKey, JSON.stringify(toBooleanMap(progress)));
  } catch {
    /* ignore */
  }
}

export function useRoadmapFlowProgress(
  options: UseRoadmapFlowProgressOptions | number = { totalNodes: 0 }
) {
  // Backwards compat: original signature was useRoadmapFlowProgress() with hardcoded fullstack data.
  const opts: UseRoadmapFlowProgressOptions =
    typeof options === 'number' ? { totalNodes: options } : options;
  const roadmapId = opts.roadmapId ?? 'fullstack';
  const totalNodes = opts.totalNodes;

  const keys = useMemo(() => buildKeys(roadmapId), [roadmapId]);

  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress(roadmapId));

  // Re-load when roadmap id changes (when reused across pages).
  useEffect(() => {
    setProgress(loadProgress(roadmapId));
  }, [roadmapId]);

  useEffect(() => {
    syncToGeneric(keys.sync, progress);
  }, [progress, keys.sync]);

  const getStatus = useCallback(
    (nodeId: string): NodeStatus => progress[nodeId] || 'pending',
    [progress]
  );

  const setStatus = useCallback(
    (nodeId: string, status: NodeStatus) => {
      setProgress((prev) => {
        const next = { ...prev };
        if (status === 'pending') {
          delete next[nodeId];
        } else {
          next[nodeId] = status;
        }
        try {
          localStorage.setItem(keys.storage, JSON.stringify(next));
          syncToGeneric(keys.sync, next);
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [keys]
  );

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(keys.storage);
      localStorage.removeItem(keys.sync);
      if (roadmapId === 'fullstack') {
        localStorage.removeItem(LEGACY_FULLSTACK_KEY);
      }
    } catch {
      /* ignore */
    }
    setProgress({});
  }, [keys, roadmapId]);

  const stats = useMemo(() => {
    let done = 0,
      inProgress = 0,
      skipped = 0;
    Object.values(progress).forEach((s) => {
      if (s === 'done') done++;
      else if (s === 'in-progress') inProgress++;
      else if (s === 'skipped') skipped++;
    });
    return {
      done,
      inProgress,
      skipped,
      pending: Math.max(0, totalNodes - done - inProgress - skipped),
      total: totalNodes,
      percentage: totalNodes > 0 ? Math.round((done / totalNodes) * 100) : 0,
    };
  }, [progress, totalNodes]);

  return { getStatus, setStatus, resetAll, stats, progress };
}
