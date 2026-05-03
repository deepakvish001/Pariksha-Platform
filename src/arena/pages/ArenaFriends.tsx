import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Check, X, UserPlus, Search } from "lucide-react";

interface Friend { id: string; requester_id: string; addressee_id: string; status: string; profile?: { full_name: string | null; avatar_url: string | null; user_id: string } | null }

export default function ArenaFriends() {
  const { user } = useAuth();
  const [list, setList] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>>([]);

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
  useEffect(() => { load(); }, [user]);

  async function searchUsers() {
    if (!search.trim()) return;
    const { data } = await supabase.from("profiles").select("user_id,full_name,avatar_url").ilike("full_name", `%${search}%`).limit(10);
    setResults((data ?? []).filter((p) => p.user_id !== user?.id));
  }

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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <GlassPanel glow="cyan" className="p-4">
        <h1 className="text-xl font-black">Friends</h1>
      </GlassPanel>
      <GlassPanel className="p-4 space-y-3">
        <div className="text-xs uppercase text-cyan-300/80">Find players</div>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" onKeyDown={(e) => e.key === "Enter" && searchUsers()} />
          <Button onClick={searchUsers}><Search className="h-4 w-4" /></Button>
        </div>
        {results.map((r) => (
          <div key={r.user_id} className="flex items-center gap-3 rounded border border-white/10 p-2">
            <Avatar className="h-8 w-8"><AvatarImage src={r.avatar_url ?? undefined} /><AvatarFallback>{(r.full_name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
            <span className="flex-1">{r.full_name ?? "Anonymous"}</span>
            <NeonButton size="sm" onClick={() => addFriend(r.user_id)}><UserPlus className="h-3 w-3 mr-1" /> Add</NeonButton>
          </div>
        ))}
      </GlassPanel>
      {incoming.length > 0 && (
        <GlassPanel glow="magenta" className="p-4 space-y-2">
          <div className="text-xs uppercase text-fuchsia-300/80">Incoming requests</div>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={f.profile?.avatar_url ?? undefined} /><AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
              <span className="flex-1">{f.profile?.full_name ?? "Player"}</span>
              <Button size="sm" variant="ghost" onClick={() => respond(f, true)}><Check className="h-4 w-4 text-lime-400" /></Button>
              <Button size="sm" variant="ghost" onClick={() => respond(f, false)}><X className="h-4 w-4 text-red-400" /></Button>
            </div>
          ))}
        </GlassPanel>
      )}
      <GlassPanel className="p-4 space-y-2">
        <div className="text-xs uppercase text-cyan-300/80">Friends ({friends.length})</div>
        {friends.length === 0 && <div className="text-sm text-white/40">No friends yet.</div>}
        {friends.map((f) => (
          <div key={f.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarImage src={f.profile?.avatar_url ?? undefined} /><AvatarFallback>{(f.profile?.full_name ?? "?").slice(0, 2)}</AvatarFallback></Avatar>
            <span className="flex-1">{f.profile?.full_name ?? "Player"}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(f)} className="text-white/40 hover:text-red-400">Remove</Button>
          </div>
        ))}
        {outgoing.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-[10px] uppercase text-white/40 mb-1">Pending sent</div>
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm text-white/50">
                <span>{f.profile?.full_name ?? "Player"}</span>
                <span className="ml-auto text-xs">waiting...</span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
