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
  profile?: { full_name: string | null; avatar_url: string | null; user_id: string } | null;
}
interface ArenaUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  elo: number | null;
  total_battles: number | null;
}

const PAGE_SIZE = 40;
const FILTERS_KEY = "arena:friends:filters:v1";

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

  const [filters, setFilters] = useState<Filters>(loadFilters());
  const [showFilters, setShowFilters] = useState(false);

  const [reportTarget, setReportTarget] = useState<ArenaUser | null>(null);
  const [reportReason, setReportReason] = useState("Inappropriate behavior");
  const [reportDetails, setReportDetails] = useState("");

  const [challengeTarget, setChallengeTarget] = useState<ArenaUser | null>(null);
  const [problems, setProblems] = useState<Array<{ slug: string; title: string }>>([]);
  const [challengeProblem, setChallengeProblem] = useState<string>("");
  const [challengeDifficulty, setChallengeDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [challengeDuration, setChallengeDuration] = useState<number>(900);
  const [challengeStep, setChallengeStep] = useState<"setup" | "confirm">("setup");
  const [challengeSending, setChallengeSending] = useState(false);

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
    setBlockedIds(new Set(((data ?? []) as Array<{ blocked_id: string }>).map((r) => r.blocked_id)));
  }, [user]);

  // Load arena users with pagination
  const loadPage = useCallback(
    async (pageIdx: number, replace = false) => {
      if (loadingPage) return;
      setLoadingPage(true);
      try {
        const from = pageIdx * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data: ratings } = await supabase
          .from("player_ratings" as never)
          .select("user_id,elo,total_battles")
          .gte("elo", filters.eloMin)
          .lte("elo", filters.eloMax)
          .gte("total_battles", filters.minBattles)
          .order("elo", { ascending: false })
          .range(from, to);

        const ratingRows = (ratings ?? []) as Array<{
          user_id: string; elo: number; total_battles: number;
        }>;
        const newHasMore = ratingRows.length === PAGE_SIZE;

        const ids = ratingRows.map((r) => r.user_id).filter((id) => id !== user?.id);
        let merged: ArenaUser[] = [];
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id,full_name,avatar_url")
            .in("user_id", ids);
          const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
          merged = ratingRows
            .filter((r) => r.user_id !== user?.id)
            .map((r) => {
              const p = profMap.get(r.user_id);
              return {
                user_id: r.user_id,
                full_name: p?.full_name ?? null,
                avatar_url: p?.avatar_url ?? null,
                elo: r.elo,
                total_battles: r.total_battles,
              };
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
      toast.error("Unblock this player first to send a request");
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
    await supabase
      .from("user_blocks" as never)
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", uid);
    toast.success("Unblocked");
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

  const relationByUser = useMemo(() => {
    const m = new Map<string, { state: "friends" | "incoming" | "outgoing" | "none"; record?: Friend }>();
    for (const f of list) {
      const otherId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
      if (f.status === "accepted") m.set(otherId, { state: "friends", record: f });
      else if (f.status === "pending" && f.addressee_id === user?.id) m.set(otherId, { state: "incoming", record: f });
      else if (f.status === "pending" && f.requester_id === user?.id) m.set(otherId, { state: "outgoing", record: f });
    }
    return m;
  }, [list, user]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return arenaUsers
      .filter((u) => !blockedIds.has(u.user_id))
      .filter((u) => (q ? (u.full_name ?? "").toLowerCase().includes(q) : true));
  }, [arenaUsers, search, blockedIds]);

  const filtersDirty =
    filters.eloMin !== DEFAULT_FILTERS.eloMin ||
    filters.eloMax !== DEFAULT_FILTERS.eloMax ||
    filters.minBattles !== DEFAULT_FILTERS.minBattles;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
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
          <div className="text-xs uppercase text-primary/80">Arena players</div>
          <div className="flex items-center gap-2">
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
              placeholder="Search players by name"
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
                    <div className="truncate font-medium text-sm">{p.full_name ?? "Anonymous"}</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {rel?.state === "friends" && (
                      <span className="text-[11px] text-lime-400 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Friends
                      </span>
                    )}
                    {rel?.state === "outgoing" && (
                      <span className="text-[11px] text-muted-foreground">Requested</span>
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
                      <NeonButton size="sm" onClick={() => addFriend(p.user_id)}>
                        <UserPlus className="h-3 w-3 mr-1" /> Add
                      </NeonButton>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openChallenge(p)}
                      title="Challenge"
                    >
                      <Swords className="h-3.5 w-3.5" />
                    </Button>
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
                <div className="text-xs text-muted-foreground">Loading more…</div>
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
          <div className="text-xs uppercase text-primary/80">Blocked ({blockedIds.size})</div>
          {Array.from(blockedIds).map((id) => (
            <div key={id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">{id}</span>
              <Button size="sm" variant="ghost" onClick={() => unblockUser(id)}>
                Unblock
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
              <Label className="text-xs">Additional details (optional)</Label>
              <Textarea
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
            <DialogTitle>Challenge {challengeTarget?.full_name ?? "player"}</DialogTitle>
            <DialogDescription>
              Send a private 1v1 invite. They'll be notified to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
                <Label className="text-xs">Duration</Label>
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

            {/* Match summary */}
            <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs space-y-1.5">
              <div className="text-[10px] uppercase text-muted-foreground">Match setup</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Problem</span><span className="font-medium truncate ml-2">{problems.find((p) => p.slug === challengeProblem)?.title ?? "— not selected —"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Difficulty</span><span className="font-medium capitalize">{challengeDifficulty}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time limit</span><span className="font-medium">{Math.round(challengeDuration / 60)} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="font-medium">Private 1v1 (invite-only)</span></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
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
            <NeonButton onClick={sendChallenge}>
              <Swords className="h-3.5 w-3.5 mr-1" /> Send challenge
            </NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
