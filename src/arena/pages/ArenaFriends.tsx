import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Check, X, UserPlus, Search, Users, Trophy, Clock, Swords, Ban, Flag, RotateCcw, Filter,
} from "lucide-react";

interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  profile?: { full_name: string | null; avatar_url: string | null; user_id: string; username?: string | null } | null;
}
interface ArenaUser {
  user_id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  elo: number | null;
  total_battles: number | null;
  created_at?: string | null;
  mutualCount?: number;
}

const PAGE_SIZE = 40;
const FILTERS_KEY = "arena:friends:filters:v1";
const BLOCKED_GATE_COPY = "Unblock this player first to send a request";
const BLOCKED_CHALLENGE_COPY = "You've blocked this player. Unblock them first to challenge.";
const MUTUAL_TTL_MS = 60_000;
const MUTUAL_DEBOUNCE_MS = 200;

interface Filters {
  eloMin: number;
  eloMax: number;
  minBattles: number;
}
const DEFAULT_FILTERS: Filters = { eloMin: 0, eloMax: 3000, minBattles: 0 };

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export default function ArenaFriends() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [list, setList] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [arenaUsers, setArenaUsers] = useState<ArenaUser[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [page, setPage] = useState(0);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [blockedProfiles, setBlockedProfiles] = useState<
    Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>
  >([]);

  const [filters, setFilters] = useState<Filters>(loadFilters());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"elo" | "battles" | "newest" | "mutual">("elo");

  const [reportTarget, setReportTarget] = useState<ArenaUser | null>(null);
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");
  const [unblockTarget, setUnblockTarget] = useState<{ user_id: string; full_name: string | null } | null>(null);

  const [challengeTarget, setChallengeTarget] = useState<ArenaUser | null>(null);
  const [problems, setProblems] = useState<Array<{ slug: string; title: string }>>([]);
  const [challengeProblem, setChallengeProblem] = useState<string>("");
  const [challengeDifficulty, setChallengeDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [challengeDuration, setChallengeDuration] = useState<number>(900);
  const [challengeStep, setChallengeStep] = useState<"setup" | "confirm">("setup");
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengeRoomType, setChallengeRoomType] = useState<"private" | "public">("private");
  const [challengeRoomName, setChallengeRoomName] = useState<string>("");
  const [challengeTopic, setChallengeTopic] = useState<string>("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Persist filters
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  // Load friendships + blocks
  const loadFriendships = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships" as never)
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const items = (data ?? []) as Friend[];
    const ids = Array.from(
      new Set(items.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))),
    );
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      for (const f of items)
        f.profile = map.get(
          f.requester_id === user.id ? f.addressee_id : f.requester_id,
        ) as Friend["profile"];
    }
    setList(items);
  }, [user]);

  const loadBlocks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_blocks" as never)
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const ids = ((data ?? []) as Array<{ blocked_id: string }>).map((r) => r.blocked_id);
    setBlockedIds(new Set(ids));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .in("user_id", ids);
      setBlockedProfiles(
        ids.map((id) => {
          const p = (profs ?? []).find((x) => x.user_id === id);
          return { user_id: id, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null };
        }),
      );
    } else {
      setBlockedProfiles([]);
    }
  }, [user]);

  // Load all users with pagination (everyone, not just arena-rated)
  const loadPage = useCallback(
    async (pageIdx: number, replace = false) => {
      if (loadingPage) return;
      setLoadingPage(true);
      try {
        const from = pageIdx * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id,full_name,avatar_url,created_at")
          .order("created_at", { ascending: false })
          .range(from, to);

        const profRows = ((profs ?? []) as Array<{
          user_id: string; full_name: string | null; avatar_url: string | null; created_at: string | null;
        }>).filter((p) => p.user_id !== user?.id);
        const newHasMore = (profs?.length ?? 0) === PAGE_SIZE;

        let merged: ArenaUser[] = profRows.map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          username: null,
          avatar_url: p.avatar_url,
          elo: null,
          total_battles: null,
          created_at: p.created_at,
        }));

        if (profRows.length) {
          const { data: ratings } = await supabase
            .from("player_ratings" as never)
            .select("user_id,elo,total_battles")
            .in("user_id", profRows.map((p) => p.user_id));
          const rMap = new Map(
            ((ratings ?? []) as Array<{ user_id: string; elo: number; total_battles: number }>)
              .map((r) => [r.user_id, r]),
          );
          merged = merged.map((u) => {
            const r = rMap.get(u.user_id);
            return r ? { ...u, elo: r.elo, total_battles: r.total_battles } : u;
          });
        }

        // Apply Elo / battles filters only when set away from defaults
        const isDefault =
          filters.eloMin === DEFAULT_FILTERS.eloMin &&
          filters.eloMax === DEFAULT_FILTERS.eloMax &&
          filters.minBattles === DEFAULT_FILTERS.minBattles;
        if (!isDefault) {
          merged = merged.filter((u) => {
            const elo = u.elo ?? 0;
            const battles = u.total_battles ?? 0;
            return (
              elo >= filters.eloMin &&
              elo <= filters.eloMax &&
              battles >= filters.minBattles
            );
          });
        }

        setArenaUsers((prev) => {
          if (replace) return merged;
          const seen = new Set(prev.map((u) => u.user_id));
          return [...prev, ...merged.filter((u) => !seen.has(u.user_id))];
        });
        setHasMore(newHasMore);
        setPage(pageIdx);
      } finally {
        setLoadingPage(false);
      }
    },
    [filters, user, loadingPage],
  );

  // Initial loads
  useEffect(() => {
    loadFriendships();
    loadBlocks();
  }, [loadFriendships, loadBlocks]);

  // Reset and reload when filters change
  useEffect(() => {
    setArenaUsers([]);
    setHasMore(true);
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.eloMin, filters.eloMax, filters.minBattles, user?.id]);

  // Realtime: friendships + blocks
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`arena-friends:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Partial<Friend> | undefined;
          if (!row) return;
          if (row.requester_id === user.id || row.addressee_id === user.id) {
            loadFriendships();
            if (payload.eventType === "INSERT" && row.addressee_id === user.id) {
              toast.info("New friend request");
            }
            if (payload.eventType === "UPDATE" && row.requester_id === user.id) {
              const newStatus = (payload.new as Friend).status;
              if (newStatus === "accepted") toast.success("Friend request accepted");
              else if (newStatus === "blocked") toast.error("Friend request was rejected");
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_blocks", filter: `blocker_id=eq.${user.id}` },
        () => loadBlocks(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_reports", filter: `reporter_id=eq.${user.id}` },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus === "resolved") toast.success("Your report was resolved by admins");
          else if (newStatus === "dismissed") toast.info("Your report was dismissed by admins");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFriendships, loadBlocks]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingPage) {
          loadPage(page + 1);
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingPage, loadPage, page]);

  // Friendship actions
  async function addFriend(uid: string) {
    if (!user) return;
    if (blockedIds.has(uid)) {
      toast.error(BLOCKED_GATE_COPY);
      return;
    }
    const { error } = await supabase
      .from("friendships" as never)
      .insert({ requester_id: user.id, addressee_id: uid } as never);
    if (error) {
      if (/block/i.test(error.message)) toast.error("Cannot send: one of you has blocked the other");
      else toast.error(error.message);
    } else toast.success("Friend request sent");
  }
  async function respond(f: Friend, accept: boolean) {
    const { error } = await supabase
      .from("friendships" as never)
      .update({ status: accept ? "accepted" : "blocked" } as never)
      .eq("id", f.id);
    if (error) toast.error(error.message);
  }
  async function removeFriend(f: Friend) {
    await supabase.from("friendships" as never).delete().eq("id", f.id);
  }

  // Block / unblock
  async function blockUser(uid: string) {
    if (!user) return;
    const { error } = await supabase
      .from("user_blocks" as never)
      .insert({ blocker_id: user.id, blocked_id: uid } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Player blocked");
      // Also remove any existing friendship
      const f = list.find(
        (x) => x.requester_id === uid || x.addressee_id === uid,
      );
      if (f) await removeFriend(f);
    }
  }
  async function unblockUser(uid: string) {
    if (!user) return;
    const { error } = await supabase
      .from("user_blocks" as never)
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", uid);
    if (error) {
      toast.error(error.message || "Could not unblock player");
      return;
    }
    const name = blockedProfiles.find((b) => b.user_id === uid)?.full_name ?? "Player";
    toast.success(`${name} unblocked`, {
      description: "You can now send friend requests and challenges to this player.",
    });
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
    setBlockedProfiles((prev) => prev.filter((b) => b.user_id !== uid));
  }

  // Report
  async function submitReport() {
    if (!user || !reportTarget) return;
    const { error } = await supabase.from("player_reports" as never).insert({
      reporter_id: user.id,
      reported_id: reportTarget.user_id,
      reason: reportReason,
      details: reportDetails || null,
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Report submitted");
      setReportTarget(null);
      setReportDetails("");
    }
  }

  // Challenge
  async function openChallenge(target: ArenaUser) {
    if (blockedIds.has(target.user_id)) {
      toast.error(BLOCKED_CHALLENGE_COPY);
      return;
    }
    setChallengeTarget(target);
    setChallengeStep("setup");
    if (problems.length === 0) {
      const { data } = await supabase
        .from("coding_problems")
        .select("slug,title")
        .eq("is_published", true)
        .limit(50);
      setProblems(data ?? []);
      if (data && data[0]) setChallengeProblem(data[0].slug);
    }
  }
  async function sendChallenge() {
    if (!challengeTarget || !challengeProblem) {
      toast.error("Pick a problem");
      return;
    }
    setChallengeSending(true);
    const { error } = await supabase.rpc("battle_create_private" as never, {
      _to_user: challengeTarget.user_id,
      _problem_slug: challengeProblem,
      _difficulty: challengeDifficulty,
      _duration: challengeDuration,
    } as never);
    setChallengeSending(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Challenge invite sent");
      setChallengeTarget(null);
      setChallengeStep("setup");
    }
  }

  const incoming = list.filter((f) => f.addressee_id === user?.id && f.status === "pending");
  const outgoing = list.filter((f) => f.requester_id === user?.id && f.status === "pending");
  const friends = list.filter((f) => f.status === "accepted");

  const myFriendIds = useMemo(
    () =>
      friends
        .map((f) => (f.requester_id === user?.id ? f.addressee_id : f.requester_id))
        .filter(Boolean),
    [friends, user],
  );

  // Mutual friends count: number of MY friends who are also friends with target user
  // Cached per (mySignature, target_id) so sorts/searches don't re-fetch.
  const [mutualMap, setMutualMap] = useState<Map<string, number>>(new Map());
  const [mutualLoading, setMutualLoading] = useState(false);
  // Cache: per (mySig) → map of target_id → { count, fetchedAt }
  const mutualCacheRef = useRef<{
    sig: string;
    counts: Map<string, { count: number; fetchedAt: number }>;
  }>({ sig: "", counts: new Map() });
  const mySig = useMemo(
    () => [...myFriendIds].sort().join(","),
    [myFriendIds],
  );
  // Invalidate cache when blocked list changes (so unblocked users re-fetch)
  const blockedSig = useMemo(
    () => [...blockedIds].sort().join(","),
    [blockedIds],
  );
  useEffect(() => {
    let cancelled = false;
    if (!user || arenaUsers.length === 0 || myFriendIds.length === 0) {
      setMutualMap((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }
    // Invalidate when my friend set changes
    if (mutualCacheRef.current.sig !== mySig) {
      mutualCacheRef.current = { sig: mySig, counts: new Map() };
    }
    const cache = mutualCacheRef.current.counts;
    const now = Date.now();
    // Drop stale entries (older than TTL) so counts refresh as friendships change
    for (const [k, v] of cache) {
      if (now - v.fetchedAt > MUTUAL_TTL_MS) cache.delete(k);
    }

    // Show cached results immediately so UI stays responsive on sort/search/filter
    const initialMap = new Map<string, number>();
    for (const [k, v] of cache) initialMap.set(k, v.count);
    setMutualMap(initialMap);

    const targetIds = arenaUsers
      .filter((u) => !blockedIds.has(u.user_id))
      .map((u) => u.user_id);
    const uncached = targetIds.filter((id) => !cache.has(id));
    if (uncached.length === 0) return;

    // Debounce so quickly-changing filters/sorts/blocked sets don't flicker spinner
    const handle = setTimeout(async () => {
      setMutualLoading(true);
      try {
        const { data } = await supabase
          .from("friendships" as never)
          .select("requester_id,addressee_id,status")
          .eq("status", "accepted")
          .or(
            `and(requester_id.in.(${myFriendIds.join(",")}),addressee_id.in.(${uncached.join(",")})),and(addressee_id.in.(${myFriendIds.join(",")}),requester_id.in.(${uncached.join(",")}))`,
          );
        if (cancelled) return;
        const myFriendSet = new Set(myFriendIds);
        const targetSet = new Set(uncached);
        const ts = Date.now();
        // Initialize zero so we don't refetch the same ids
        for (const id of uncached) cache.set(id, { count: 0, fetchedAt: ts });
        for (const r of (data ?? []) as Array<{ requester_id: string; addressee_id: string }>) {
          let target: string | null = null;
          if (myFriendSet.has(r.requester_id) && targetSet.has(r.addressee_id)) target = r.addressee_id;
          else if (myFriendSet.has(r.addressee_id) && targetSet.has(r.requester_id)) target = r.requester_id;
          if (target) {
            const cur = cache.get(target);
            cache.set(target, { count: (cur?.count ?? 0) + 1, fetchedAt: ts });
          }
        }
        const next = new Map<string, number>();
        for (const [k, v] of cache) next.set(k, v.count);
        setMutualMap(next);
      } finally {
        if (!cancelled) setMutualLoading(false);
      }
    }, MUTUAL_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [user, arenaUsers, myFriendIds, mySig, blockedSig, sortBy, search]);

  const relationByUser = useMemo(() => {
    const m = new Map<string, { state: "friends" | "incoming" | "outgoing" | "rejected" | "none"; record?: Friend }>();
    for (const f of list) {
      const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
      if (f.status === "accepted") m.set(otherId, { state: "friends", record: f });
      else if (f.status === "pending" && f.addressee_id === user?.id) m.set(otherId, { state: "incoming", record: f });
      else if (f.status === "pending" && f.requester_id === user?.id) m.set(otherId, { state: "outgoing", record: f });
      else if (f.status === "blocked" && f.requester_id === user?.id) m.set(otherId, { state: "rejected", record: f });
    }
    return m;
  }, [list, user]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = arenaUsers
      .filter((u) => !blockedIds.has(u.user_id))
      .filter((u) =>
        q
          ? (u.full_name ?? "").toLowerCase().includes(q) ||
            (u.username ?? "").toLowerCase().includes(q)
          : true,
      )
      .map((u) => ({ ...u, mutualCount: mutualMap.get(u.user_id) ?? 0 }));
    arr.sort((a, b) => {
      if (sortBy === "elo") return (b.elo ?? -1) - (a.elo ?? -1);
      if (sortBy === "battles") return (b.total_battles ?? -1) - (a.total_battles ?? -1);
      if (sortBy === "mutual") return (b.mutualCount ?? 0) - (a.mutualCount ?? 0);
      // newest
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return bt - at;
    });
    return arr;
  }, [arenaUsers, search, blockedIds, sortBy, mutualMap]);


  const filtersDirty =
    filters.eloMin !== DEFAULT_FILTERS.eloMin ||
    filters.eloMax !== DEFAULT_FILTERS.eloMax ||
    filters.minBattles !== DEFAULT_FILTERS.minBattles;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4 max-w-4xl mx-auto" data-testid="arena-friends-root">
      <GlassPanel glow="cyan" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Users className="h-5 w-5" /> Friends
          </h1>
          <p className="text-xs text-muted-foreground">
            Connect with arena players, challenge them, or manage your roster.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-1">{friends.length} friends</span>
          {incoming.length > 0 && (
            <span className="rounded-full border border-accent/40 px-2 py-1 text-accent-foreground">
              {incoming.length} requests
            </span>
          )}
          {blockedIds.size > 0 && (
            <span className="rounded-full border border-border px-2 py-1">{blockedIds.size} blocked</span>
          )}
        </div>
      </GlassPanel>

      {incoming.length > 0 && (
        <GlassPanel glow="magenta" className="p-4 space-y-2">
          <div className="text-xs uppercase text-accent-foreground/80">Incoming requests</div>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={f.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{f.profile?.full_name ?? "Player"}</span>
              <Button size="sm" variant="ghost" onClick={() => respond(f, true)}>
                <Check className="h-4 w-4 text-lime-400" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => respond(f, false)}>
                <X className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
        </GlassPanel>
      )}

      <GlassPanel className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs uppercase text-primary/80">All players</div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-card/60 border border-border rounded px-2 py-1 text-xs"
              title="Sort by"
            >
              <option value="elo">Sort: Elo</option>
              <option value="battles">Sort: Battles</option>
              <option value="newest">Sort: Newest</option>
              <option value="mutual">Sort: Mutual friends</option>
            </select>
            <Button
              size="sm"
              variant={showFilters || filtersDirty ? "default" : "outline"}
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="h-3.5 w-3.5 mr-1" /> Filters{filtersDirty ? " •" : ""}
            </Button>
            <span className="text-[10px] text-muted-foreground">{filteredUsers.length} shown</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players by name or username"
              className="pl-8"
            />
          </div>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border/60 bg-background/30 p-3 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Elo range</span>
                <span className="font-medium">{filters.eloMin} – {filters.eloMax}</span>
              </div>
              <Slider
                min={0}
                max={3000}
                step={50}
                value={[filters.eloMin, filters.eloMax]}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, eloMin: v[0] ?? 0, eloMax: v[1] ?? 3000 }))
                }
                aria-label="Elo range"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">Minimum battles</span>
                <span className="font-medium">{filters.minBattles}+</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[filters.minBattles]}
                onValueChange={(v) => setFilters((f) => ({ ...f, minBattles: v[0] ?? 0 }))}
                aria-label="Minimum battles"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[460px] pr-2">
          <div className="space-y-2">
            {filteredUsers.length === 0 && !loadingPage && (
              <div className="text-sm text-muted-foreground/60 py-8 text-center">
                No players match these filters.
              </div>
            )}
            {filteredUsers.map((p) => {
              const rel = relationByUser.get(p.user_id);
              return (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/30 p-2.5"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{(p.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-sm">
                      {p.full_name ?? "Anonymous"}
                      {p.username && (
                        <span className="text-[11px] text-muted-foreground/70 ml-1">@{p.username}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      {p.elo != null && (
                        <span className="inline-flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> {p.elo} Elo
                        </span>
                      )}
                      {p.total_battles != null && p.total_battles > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {p.total_battles} battles
                        </span>
                      )}
                      {(p.mutualCount ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-cyan-400">
                          <Users className="h-3 w-3" /> {p.mutualCount} mutual
                        </span>
                      ) : mutualLoading && myFriendIds.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground/60 animate-pulse">
                          <Users className="h-3 w-3" /> mutual…
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {rel?.state === "friends" && (
                      <span className="text-[11px] text-lime-400 inline-flex items-center gap-1 rounded-full border border-lime-400/30 px-2 py-0.5">
                        <Check className="h-3 w-3" /> Accepted
                      </span>
                    )}
                    {rel?.state === "outgoing" && (
                      <span className="text-[11px] text-amber-400 inline-flex items-center gap-1 rounded-full border border-amber-400/30 px-2 py-0.5">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                    {rel?.state === "rejected" && (
                      <span className="text-[11px] text-red-400 inline-flex items-center gap-1 rounded-full border border-red-400/30 px-2 py-0.5">
                        <X className="h-3 w-3" /> Rejected
                      </span>
                    )}
                    {rel?.state === "incoming" && rel.record && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => respond(rel.record!, true)}>
                          <Check className="h-4 w-4 text-lime-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => respond(rel.record!, false)}>
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </>
                    )}
                    {(!rel || rel.state === "none") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span data-testid={`add-wrap-${p.user_id}`}>
                            <NeonButton
                              size="sm"
                              onClick={() => addFriend(p.user_id)}
                              disabled={blockedIds.has(p.user_id)}
                              aria-disabled={blockedIds.has(p.user_id)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" /> Add
                            </NeonButton>
                          </span>
                        </TooltipTrigger>
                        {blockedIds.has(p.user_id) && (
                          <TooltipContent>{BLOCKED_GATE_COPY}</TooltipContent>
                        )}
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span data-testid={`challenge-wrap-${p.user_id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openChallenge(p)}
                            title="Challenge"
                            disabled={blockedIds.has(p.user_id)}
                            aria-disabled={blockedIds.has(p.user_id)}
                          >
                            <Swords className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {blockedIds.has(p.user_id) && (
                        <TooltipContent>{BLOCKED_CHALLENGE_COPY}</TooltipContent>
                      )}
                    </Tooltip>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReportTarget(p)}
                      title="Report"
                      className="text-muted-foreground hover:text-amber-400"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => blockUser(p.user_id)}
                      title="Block"
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <div ref={sentinelRef} className="h-6 flex items-center justify-center">
              {loadingPage && (
                <div className="text-xs text-muted-foreground"></div>
              )}
              {!hasMore && filteredUsers.length > 0 && (
                <div className="text-[10px] text-muted-foreground/50">End of list</div>
              )}
            </div>
          </div>
        </ScrollArea>
      </GlassPanel>

      <GlassPanel className="p-4 space-y-2">
        <div className="text-xs uppercase text-primary/80">Your friends ({friends.length})</div>
        {friends.length === 0 && (
          <div className="text-sm text-muted-foreground/60">No friends yet — add someone above.</div>
        )}
        {friends.map((f) => {
          const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
          return (
            <div key={f.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={f.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{f.profile?.full_name ?? "Player"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openChallenge({
                    user_id: otherId,
                    full_name: f.profile?.full_name ?? null,
                    avatar_url: f.profile?.avatar_url ?? null,
                    elo: null,
                    total_battles: null,
                  })
                }
              >
                <Swords className="h-3.5 w-3.5 mr-1" /> Challenge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFriend(f)}
                className="text-muted-foreground/60 hover:text-red-400"
              >
                Remove
              </Button>
            </div>
          );
        })}
        {outgoing.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-[10px] uppercase text-muted-foreground/60 mb-1">Pending sent</div>
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="truncate">{f.profile?.full_name ?? "Player"}</span>
                <span className="ml-auto text-xs">waiting…</span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {blockedIds.size > 0 && (
        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase text-primary/80 flex items-center gap-2">
              <Ban className="h-3.5 w-3.5" /> Blocked players ({blockedIds.size})
            </div>
            <span className="text-[10px] text-muted-foreground">
              Blocked users can't message, challenge, or send requests
            </span>
          </div>
          {blockedProfiles.map((b) => (
            <div
              key={b.user_id}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/30 p-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={b.avatar_url ?? undefined} />
                <AvatarFallback>{(b.full_name ?? "?").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{b.full_name ?? "Unknown player"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUnblockTarget({ user_id: b.user_id, full_name: b.full_name })}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Unblock
              </Button>
            </div>
          ))}
        </GlassPanel>
      )}

      {/* Report dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report player</DialogTitle>
            <DialogDescription>
              Report {reportTarget?.full_name ?? "this player"} for violating arena rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Reason</Label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
              >
                <option>Inappropriate behavior</option>
                <option>Cheating / unfair play</option>
                <option>Harassment</option>
                <option>Spam</option>
                <option>Impersonation</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="arena-report-details" className="text-xs">Additional details (optional)</Label>
              <Textarea
                id="arena-report-details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                placeholder="What happened?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <NeonButton onClick={submitReport}>Submit report</NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge dialog */}
      <Dialog open={!!challengeTarget} onOpenChange={(o) => !o && setChallengeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {challengeStep === "setup" ? "Challenge" : "Confirm challenge for"} {challengeTarget?.full_name ?? "player"}
            </DialogTitle>
            <DialogDescription>
              {challengeStep === "setup"
                ? "Configure the match. You'll review before sending."
                : "Review the match setup. Once sent, your opponent is notified to accept."}
            </DialogDescription>
          </DialogHeader>

          {challengeStep === "setup" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="arena-challenge-room-type" className="text-xs">Room type</Label>
                  <select
                    id="arena-challenge-room-type"
                    value={challengeRoomType}
                    onChange={(e) => setChallengeRoomType(e.target.value as "private" | "public")}
                    className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
                  >
                    <option value="private">Private (invite-only)</option>
                    <option value="public">Public (joinable)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="arena-challenge-room-name" className="text-xs">Room name</Label>
                  <Input
                    id="arena-challenge-room-name"
                    value={challengeRoomName}
                    onChange={(e) => setChallengeRoomName(e.target.value)}
                    placeholder="e.g. Friday Showdown"
                    maxLength={40}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Problem</Label>
                <select
                  value={challengeProblem}
                  onChange={(e) => setChallengeProblem(e.target.value)}
                  className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
                >
                  <option value="">— select a problem —</option>
                  {problems.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Topic (optional)</Label>
                <select
                  value={challengeTopic}
                  onChange={(e) => setChallengeTopic(e.target.value)}
                  className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
                >
                  <option value="">Any topic</option>
                  {["arrays","strings","hash-table","two-pointers","binary-search","dp","graphs","trees","greedy","math"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Difficulty</Label>
                  <select
                    value={challengeDifficulty}
                    onChange={(e) => setChallengeDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Time limit</Label>
                  <select
                    value={challengeDuration}
                    onChange={(e) => setChallengeDuration(Number(e.target.value))}
                    className="w-full bg-card/60 border border-border rounded p-2 text-sm mt-1"
                  >
                    <option value={300}>5 min</option>
                    <option value={600}>10 min</option>
                    <option value={900}>15 min</option>
                    <option value={1800}>30 min</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={challengeTarget?.avatar_url ?? undefined} />
                  <AvatarFallback>{(challengeTarget?.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-muted-foreground">Opponent</div>
                  <div className="font-semibold truncate">{challengeTarget?.full_name ?? "Player"}</div>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm space-y-2">
                <div className="text-[10px] uppercase text-muted-foreground">Room settings</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Room type</span><span className="font-medium capitalize">{challengeRoomType}{challengeRoomType === "private" ? " (invite-only)" : " (joinable)"}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Room name</span><span className="font-medium truncate ml-2">{challengeRoomName.trim() || "— untitled —"}</span></div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm space-y-2">
                <div className="text-[10px] uppercase text-muted-foreground">Match setup</div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Problem</span><span className="font-medium truncate ml-2">{problems.find((p) => p.slug === challengeProblem)?.title ?? "— not selected —"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Topic</span><span className="font-medium">{challengeTopic || "Any"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Difficulty</span><span className="font-medium capitalize">{challengeDifficulty}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time limit</span><span className="font-medium">{Math.round(challengeDuration / 60)} min</span></div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {challengeStep === "setup" ? (
              <>
                <Button variant="ghost" onClick={() => setChallengeTarget(null)}>Cancel</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChallengeTarget(null);
                    navigate("/arena/queue");
                  }}
                >
                  Quick Match instead
                </Button>
                <NeonButton
                  onClick={() => {
                    if (!challengeProblem) {
                      toast.error("Pick a problem first");
                      return;
                    }
                    setChallengeStep("confirm");
                  }}
                >
                  Review →
                </NeonButton>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setChallengeStep("setup")} disabled={challengeSending}>
                  ← Back
                </Button>
                <NeonButton onClick={sendChallenge} disabled={challengeSending}>
                  <Swords className="h-3.5 w-3.5 mr-1" />
                  {challengeSending ? "Sending…" : "Confirm & send"}
                </NeonButton>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock confirmation */}
      <AlertDialog open={!!unblockTarget} onOpenChange={(o) => !o && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unblock {unblockTarget?.full_name ?? "this player"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They'll be able to send you friend requests, challenge you to matches, and appear in your discovery list again. You can re-block them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const t = unblockTarget;
                setUnblockTarget(null);
                if (t) await unblockUser(t.user_id);
              }}
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
