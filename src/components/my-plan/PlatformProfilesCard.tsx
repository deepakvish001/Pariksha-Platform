import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePlatformStats, PLATFORM_LABELS, type SupportedPlatform } from "@/hooks/usePlatformStats";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const PLATFORMS: { id: SupportedPlatform; placeholder: string; reliable: boolean }[] = [
  { id: "leetcode", placeholder: "leetcode username", reliable: true },
  { id: "codeforces", placeholder: "codeforces handle", reliable: true },
  { id: "codechef", placeholder: "codechef username", reliable: false },
  { id: "geeksforgeeks", placeholder: "gfg username", reliable: false },
  { id: "hackerrank", placeholder: "hackerrank username", reliable: false },
];

export const PlatformProfilesCard = () => {
  const { stats, loading, syncing, syncPlatform, removePlatform } = usePlatformStats();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const handleConnect = async (platform: SupportedPlatform) => {
    const handle = (drafts[platform] ?? "").trim();
    if (!handle) {
      toast({ title: "Enter a handle first", variant: "destructive" });
      return;
    }
    try {
      const result = await syncPlatform(platform, handle);
      if (result?.sync_status === "error") {
        toast({
          title: `${PLATFORM_LABELS[platform]} sync failed`,
          description: result.sync_error ?? "Could not fetch stats",
          variant: "destructive",
        });
      } else {
        toast({ title: `${PLATFORM_LABELS[platform]} connected` });
        setDrafts((d) => ({ ...d, [platform]: "" }));
      }
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleResync = async (platform: SupportedPlatform, handle: string) => {
    try {
      await syncPlatform(platform, handle);
      toast({ title: `${PLATFORM_LABELS[platform]} refreshed` });
    } catch (e) {
      toast({
        title: "Refresh failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const connected = new Map(stats.map((s) => [s.platform, s]));

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Connected coding profiles</h2>
        <p className="text-sm text-muted-foreground">
          Link your handles so the AI can tailor the plan to your real strengths and gaps.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {PLATFORMS.map((p) => {
            const stat = connected.get(p.id);
            const isSyncing = syncing === p.id;
            return (
              <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium">{PLATFORM_LABELS[p.id]}</span>
                    {!p.reliable && (
                      <Badge variant="outline" className="text-xs">best-effort</Badge>
                    )}
                    {stat && stat.sync_status === "ok" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {stat && stat.sync_status === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                  </div>
                  {stat && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleResync(p.id, stat.handle)} disabled={isSyncing}>
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removePlatform(p.id)} disabled={isSyncing}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {stat ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="secondary">@{stat.handle}</Badge>
                    {stat.rating != null && <Badge>Rating {stat.rating}</Badge>}
                    {stat.solved_total > 0 && <Badge variant="outline">{stat.solved_total} solved</Badge>}
                    {stat.solved_easy + stat.solved_medium + stat.solved_hard > 0 && (
                      <span className="text-xs text-muted-foreground">
                        E:{stat.solved_easy} · M:{stat.solved_medium} · H:{stat.solved_hard}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      synced {formatDistanceToNow(new Date(stat.last_synced_at), { addSuffix: true })}
                    </span>
                    {stat.sync_error && (
                      <p className="w-full text-xs text-destructive">{stat.sync_error}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={p.placeholder}
                      value={drafts[p.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      disabled={isSyncing}
                      className="h-8"
                    />
                    <Button size="sm" onClick={() => handleConnect(p.id)} disabled={isSyncing}>
                      {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
