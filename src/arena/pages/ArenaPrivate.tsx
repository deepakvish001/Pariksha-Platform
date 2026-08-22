import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ArenaPrivate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Array<{ user_id: string; full_name: string | null }>>([]);
  const [opponent, setOpponent] = useState("");
  const [problemSlug, setProblemSlug] = useState("");
  const [problems, setProblems] = useState<Array<{ slug: string; title: string }>>([]);
  const [invites, setInvites] = useState<Array<{ id: string; from_user: string; problem_slug: string | null; status: string }>>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: fs } = await supabase.from("friendships" as never).select("*").eq("status", "accepted").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const ids = ((fs ?? []) as Array<{ requester_id: string; addressee_id: string }>).map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,full_name").in("user_id", ids);
        setFriends((profs ?? []) as typeof friends);
      }
      const { data: probs } = await supabase.from("coding_problems").select("slug,title").eq("is_published", true).limit(50);
      setProblems(probs ?? []);
      const { data: inv } = await supabase.from("battle_invites" as never).select("*").eq("to_user", user.id).eq("status", "pending");
      setInvites((inv ?? []) as typeof invites);
    })();
  }, [user]);

  async function send() {
    if (!opponent || !problemSlug) { toast.error("Pick opponent and problem"); return; }
    const { error } = await supabase.rpc("battle_create_private" as never, { _to_user: opponent, _problem_slug: problemSlug, _difficulty: "medium", _duration: 900 } as never);
    if (error) toast.error(error.message); else toast.success("Invite sent");
  }
  async function accept(id: string) {
    const { data, error } = await supabase.rpc("battle_accept_invite" as never, { _invite: id } as never);
    if (error) toast.error(error.message); else if (data) navigate(`/arena/battle/${data}`);
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <GlassPanel glow="magenta" className="p-4"><h1 className="text-xl font-black">Private Match</h1></GlassPanel>
      <GlassPanel className="p-4 space-y-3">
        <label className="text-xs uppercase text-primary/80">Opponent</label>
        <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full bg-card/60 border border-border rounded p-2 text-sm">
          <option value="">— select friend —</option>
          {friends.map((f) => <option key={f.user_id} value={f.user_id}>{f.full_name ?? "Player"}</option>)}
        </select>
        <label className="text-xs uppercase text-primary/80">Problem</label>
        <select value={problemSlug} onChange={(e) => setProblemSlug(e.target.value)} className="w-full bg-card/60 border border-border rounded p-2 text-sm">
          <option value="">— select problem —</option>
          {problems.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
        </select>
        <NeonButton onClick={send}>Send Invite</NeonButton>
      </GlassPanel>
      {invites.length > 0 && (
        <GlassPanel glow="cyan" className="p-4 space-y-2">
          <div className="text-xs uppercase">Incoming Invites</div>
          {invites.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded border border-border p-2">
              <span className="flex-1 text-sm">{i.problem_slug}</span>
              <NeonButton size="sm" tone="lime" onClick={() => accept(i.id)}>Accept</NeonButton>
            </div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}
