import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { COMMON_PATTERNS, PATTERN_TOTAL } from "@/data/dsaCommonPatternsData";

export const TIERS = [
  { pct: 25, label: "Bronze" as const },
  { pct: 50, label: "Silver" as const },
  { pct: 100, label: "Gold" as const },
];

export type TierLabel = (typeof TIERS)[number]["label"];

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export interface AchievementFeedItem {
  id: string;          // unique e.g. badge:..., streak:7
  kind: "badge" | "streak";
  title: string;
  detail: string;
  ts: string;
  emoji: string;
}

const LS_UNLOCKED = "dsaPatterns:unlockedBadges:v1";
const LS_STREAK_MAX = "dsaPatterns:lastStreakMilestone:v1";
const LS_FEED = "dsaPatterns:achievementsFeed:v1";

const loadArr = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
};

const loadNum = (key: string): number => {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

/** Stable id for a category-mastery badge */
export const badgeId = (catId: string, tier: TierLabel) => `cat:${catId}:${tier}`;
export const OVERALL_BADGE_ID = "overall:Gold";

const computeUnlocked = (done: Set<string>): string[] => {
  const ids: string[] = [];
  COMMON_PATTERNS.forEach((cat) => {
    const total = cat.patterns.length;
    if (total === 0) return;
    const d = cat.patterns.reduce((n, p) => n + (done.has(p.id) ? 1 : 0), 0);
    const pct = (d / total) * 100;
    TIERS.forEach((t) => {
      if (pct >= t.pct) ids.push(badgeId(cat.id, t.label));
    });
  });
  if (PATTERN_TOTAL > 0 && done.size / PATTERN_TOTAL >= 1) ids.push(OVERALL_BADGE_ID);
  return ids;
};

export const useDsaPatternAchievements = (done: Set<string>, currentStreak: number) => {
  const [feed, setFeed] = useState<AchievementFeedItem[]>(() => loadArr<AchievementFeedItem>(LS_FEED));
  const knownBadgesRef = useRef<Set<string>>(new Set(loadArr<string>(LS_UNLOCKED)));
  const lastStreakRef = useRef<number>(loadNum(LS_STREAK_MAX));
  /** Skip the very first effect run for each detector so we don't toast pre-existing state. */
  const badgeHydratedRef = useRef(false);
  const streakHydratedRef = useRef(false);

  useEffect(() => save(LS_FEED, feed.slice(0, 50)), [feed]);

  // Detect newly unlocked badges
  useEffect(() => {
    const currentList = computeUnlocked(done);
    const current = new Set(currentList);

    if (!badgeHydratedRef.current) {
      // Seed ref from previously unlocked + anything that already qualifies
      currentList.forEach((id) => knownBadgesRef.current.add(id));
      save(LS_UNLOCKED, [...knownBadgesRef.current]);
      badgeHydratedRef.current = true;
      return;
    }

    const newOnes: string[] = [];
    current.forEach((id) => {
      if (!knownBadgesRef.current.has(id)) newOnes.push(id);
    });
    // Keep ref in sync for both unlocks and re-locks
    knownBadgesRef.current = current;
    save(LS_UNLOCKED, [...current]);

    if (newOnes.length === 0) return;

    const items: AchievementFeedItem[] = newOnes.map((id) => {
      if (id === OVERALL_BADGE_ID) {
        return {
          id: `badge:${id}:${Date.now()}`,
          kind: "badge",
          title: "Grand Master unlocked!",
          detail: "100% of all common patterns complete",
          ts: new Date().toISOString(),
          emoji: "👑",
        };
      }
      const [, catId, tier] = id.split(":");
      const cat = COMMON_PATTERNS.find((c) => c.id === catId);
      return {
        id: `badge:${id}:${Date.now()}`,
        kind: "badge",
        title: `${tier} • ${cat?.title ?? catId}`,
        detail: `Unlocked the ${tier} mastery badge`,
        ts: new Date().toISOString(),
        emoji: cat?.emoji ?? "🏅",
      };
    });

    setFeed((prev) => [...items, ...prev].slice(0, 50));
    items.forEach((it) =>
      toast.success(it.title, {
        description: it.detail,
        icon: it.emoji,
      }),
    );
  }, [done]);

  // Detect new streak milestones
  useEffect(() => {
    if (!badgeHydratedRef.current) return;
    const reached = STREAK_MILESTONES.filter((m) => currentStreak >= m);
    const newMax = reached.length > 0 ? reached[reached.length - 1] : 0;
    if (newMax > lastStreakRef.current) {
      const item: AchievementFeedItem = {
        id: `streak:${newMax}:${Date.now()}`,
        kind: "streak",
        title: `🔥 ${newMax}-day streak!`,
        detail: `You've practiced ${newMax} days in a row.`,
        ts: new Date().toISOString(),
        emoji: "🔥",
      };
      setFeed((prev) => [item, ...prev].slice(0, 50));
      toast.success(item.title, { description: item.detail, icon: "🔥" });
    }
    lastStreakRef.current = newMax;
    try {
      localStorage.setItem(LS_STREAK_MAX, String(newMax));
    } catch {
      /* ignore */
    }
  }, [currentStreak]);

  const clearFeed = useCallback(() => setFeed([]), []);

  const unlocked = useMemo(() => new Set(computeUnlocked(done)), [done]);

  return { feed, clearFeed, unlocked };
};
