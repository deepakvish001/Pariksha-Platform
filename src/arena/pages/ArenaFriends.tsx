import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Check, X, UserPlus, Search, Users, Trophy, Clock } from "lucide-react";

interface Friend { id: string; requester_id: string; addressee_id: string; status: string; profile?: { full_name: string | null; avatar_url: string | null; user_id: string } | null }
interface ArenaUser { user_id: string; full_name: string | null; avatar_url: string | null; elo?: number | null; total_battles?: number | null }

export default function ArenaFriends() {
  const { user } = useAuth();
  const [list, setList] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [arenaUsers, setArenaUsers] = useState<ArenaUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("friendships" as never).select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    const items = (data ?? []) as Friend[];
    const ids = Array.from(new Set(items.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,full_name,avatar_url").in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      for (const f of items) f.profile = map.get(f.requester_id === user.id ? f.addressee_id : f.requester_id) as Friend["profile"];
    }
    setList(items);
  }

  async function loadArenaUsers() {
    setLoadingUsers(true);
    try {
      // Fetch arena players (those with ratings) ordered by elo
      const { data: ratings } = await supabase
        .from("player_ratings" as never)
        .select("user_id,elo,total_battles")
        .order("elo", { ascending: false })
        .limit(100);

      const ratingRows = (ratings ?? []) as Array<{ user_id: string; elo: number; total_battles: number }>;
      const ratingIds = ratingRows.map((r) => r.user_id);

      // Also include some recent profiles so the list isn't empty for new arenas
      const { data: recent } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .order("created_at", { ascending: false })
        .limit(50);

      const allIds = Array.from(new Set([...ratingIds, ...(recent ?? []).map((p) => p.user_id)])).filter((id) => id !== user?.id);

      if (allIds.length === 0) {
        setArenaUsers([]);
        return;
      }

      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,full_name,avatar_url")
        .in("user_id", allIds);

      const ratingMap = new Map(ratingRows.map((r) => [r.user_id, r]));
      const merged: ArenaUser[] = (profs ?? []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        elo: ratingMap.get(p.user_id)?.elo ?? null,
        total_battles: ratingMap.get(p.user_id)?.total_battles ?? null,
      }));

      // Sort: those with ratings first (by elo desc), then others
      merged.sort((a, b) => {
        if ((b.elo ?? -1) !== (a.elo ?? -1)) return (b.elo ?? -1) - (a.elo ?? -1);
        return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      });

      setArenaUsers(merged);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => { load(); loadArenaUsers(); }, [user]);

  async function addFriend(uid: string) {
    if (!user) return;
    const { error } = await supabase.from("friendships" as never).insert({ requester_id: user.id, addressee_id: uid } as never);
    if (error) toast.error(error.message); else { toast.success("Friend request sent"); load(); }
  }
  async function respond(f: Friend, accept: boolean) {
    const { error } = await supabase.from("friendships" as never).update({ status: accept ? "accepted" : "blocked" } as never).eq("id", f.id);
    if (error) toast.error(error.message); else load();
  }
  async function remove(f: Friend) {
    await supabase.from("friendships" as never).delete().eq("id", f.id);
    load();
  }

  const incoming = list.filter((f) => f.addressee_id === user?.id && f.status === "pending");
  const outgoing = list.filter((f) => f.requester_id === user?.id && f.status === "pending");
  const friends = list.filter((f) => f.status === "accepted");

  // Build relationship map for arena users
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
    if (!q) return arenaUsers;
    return arenaUsers.filter((u) => (u.full_name ?? "").toLowerCase().includes(q));
  }, [arenaUsers, search]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <GlassPanel glow="cyan" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2"><Users className="h-5 w-5" /> Friends</h1>
          <p className="text-xs text-muted-foreground">Connect with arena players to challenge them anytime.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-1">{friends.length} friends</span>
          {incoming.length > 0 && <span className="rounded-full border border-accent/40 px-2 py-1 text-accent-foreground">{incoming.length} requests</span>}
        </div>
      </GlassPanel>

      {incoming.length > 0 && (
        <GlassPanel glow="magenta" className="p-4 space-y-2">
          <div className="text-xs uppercase text-accent-foreground/80">Incoming requests</div>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={f.profile?.avatar_url ?? undefined} /><AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
              <span className="flex-1 truncate">{f.profile?.full_name ?? "Player"}</span>
              <Button size="sm" variant="ghost" onClick={() => respond(f, true)}><Check className="h-4 w-4 text-lime-400" /></Button>
              <Button size="sm" variant="ghost" onClick={() => respond(f, false)}><X className="h-4 w-4 text-red-400" /></Button>
            </div>
          ))}
        </GlassPanel>
      )}

      <GlassPanel className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs uppercase text-primary/80">Arena players</div>
          <div className="text-[10px] text-muted-foreground">{filteredUsers.length} shown</div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players by name" className="pl-8" />
          </div>
        </div>
        <ScrollArea className="h-[420px] pr-2">
          <div className="space-y-2">
            {loadingUsers && <div className="text-sm text-muted-foreground">Loading players…</div>}
            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="text-sm text-muted-foreground/60">No players found.</div>
            )}
            {filteredUsers.map((p) => {
              const rel = relationByUser.get(p.user_id);
              return (
                <div key={p.user_id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/30 p-2.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{(p.full_name ?? "?").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-sm">{p.full_name ?? "Anonymous"}</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {p.elo != null && <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" /> {p.elo} Elo</span>}
                      {p.total_battles != null && p.total_battles > 0 && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.total_battles} battles</span>
                      )}
                    </div>
                  </div>
                  {rel?.state === "friends" && (
                    <span className="text-[11px] text-lime-400 inline-flex items-center gap-1"><Check className="h-3 w-3" /> Friends</span>
                  )}
                  {rel?.state === "outgoing" && (
                    <span className="text-[11px] text-muted-foreground">Requested</span>
                  )}
                  {rel?.state === "incoming" && rel.record && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => respond(rel.record!, true)}><Check className="h-4 w-4 text-lime-400" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => respond(rel.record!, false)}><X className="h-4 w-4 text-red-400" /></Button>
                    </div>
                  )}
                  {(!rel || rel.state === "none") && (
                    <NeonButton size="sm" onClick={() => addFriend(p.user_id)}><UserPlus className="h-3 w-3 mr-1" /> Add</NeonButton>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </GlassPanel>

      <GlassPanel className="p-4 space-y-2">
        <div className="text-xs uppercase text-primary/80">Your friends ({friends.length})</div>
        {friends.length === 0 && <div className="text-sm text-muted-foreground/60">No friends yet — add someone above.</div>}
        {friends.map((f) => (
          <div key={f.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarImage src={f.profile?.avatar_url ?? undefined} /><AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
            <span className="flex-1 truncate">{f.profile?.full_name ?? "Player"}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(f)} className="text-muted-foreground/60 hover:text-red-400">Remove</Button>
          </div>
        ))}
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
    </div>
  );
}
