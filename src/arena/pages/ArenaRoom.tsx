import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInviteWatcher } from "../hooks";
import { motion } from "framer-motion";

export default function ArenaRoom() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const inviteId = (location.state as { inviteId?: string } | null)?.inviteId;
  const [resolvedInviteId, setResolvedInviteId] = useState<string | undefined>(inviteId);
  const [copied, setCopied] = useState(false);
  const [problemTitle, setProblemTitle] = useState<string>("");

  // If user reloaded the page, look up the invite by code (only the host can read it via RLS).
  useEffect(() => {
    if (resolvedInviteId || !code) return;
    (async () => {
      const { data } = await supabase
        .from("battle_invites" as never)
        .select("id,problem_slug")
        .eq("code", code.toUpperCase())
        .eq("status", "pending")
        .maybeSingle();
      const row = data as { id: string; problem_slug: string | null } | null;
      if (row) {
        setResolvedInviteId(row.id);
        if (row.problem_slug) {
          const { data: p } = await supabase.from("coding_problems").select("title").eq("slug", row.problem_slug).maybeSingle();
          setProblemTitle(p?.title ?? row.problem_slug);
        }
      }
    })();
  }, [code, resolvedInviteId]);

  useInviteWatcher(resolvedInviteId, (battleId) => {
    toast.success("Opponent joined!");
    navigate(`/arena/battle/${battleId}`);
  });

  const shareUrl = `${window.location.origin}/arena/join/${code}`;

  async function copyCode() {
    await navigator.clipboard.writeText(code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied");
  }
  async function cancel() {
    if (resolvedInviteId) {
      await supabase.from("battle_invites" as never).update({ status: "cancelled" } as never).eq("id", resolvedInviteId);
    }
    navigate("/arena");
  }

  return (
    <div className="max-w-xl mx-auto">
      <GlassPanel glow="cyan" className="p-8 text-center space-y-6">
        <div>
          <h1 className="text-2xl font-black">Waiting Room</h1>
          <p className="text-sm text-muted-foreground mt-1">Share this code or link with your opponent</p>
          {problemTitle && <p className="text-xs text-muted-foreground mt-2">Problem: <span className="text-foreground">{problemTitle}</span></p>}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="font-mono text-6xl font-black tracking-[0.4em] gradient-text py-4"
        >
          {code}
        </motion.div>

        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={copyCode}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Code
          </Button>
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" /> Copy Link
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-primary/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Waiting for opponent…
        </div>

        <Button variant="ghost" onClick={cancel} className="text-muted-foreground">
          <X className="h-4 w-4 mr-2" /> Cancel Room
        </Button>

        <p className="text-xs text-muted-foreground/70">Code expires in 10 minutes</p>
      </GlassPanel>
    </div>
  );
}
