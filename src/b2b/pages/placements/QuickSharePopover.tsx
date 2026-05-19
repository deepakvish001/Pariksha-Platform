import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Share2, Copy, Check, Ban, Link2, Loader2, Eye, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

type ShareRow = {
  id: string;
  token: string;
  kind: "profile" | "shortlist";
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  view_count: number | null;
  last_viewed_at: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
};

function buildUrl(token: string) {
  return `${window.location.origin}/p/student/${token}`;
}

export function QuickSharePopover({
  orgId,
  studentId,
  studentName,
  onOpenFullDialog,
  trigger,
}: {
  orgId: string;
  studentId: string;
  studentName: string;
  onOpenFullDialog: () => void;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const queryKey = ["share-quick", orgId, studentId];
  const { data: links, isLoading } = useQuery({
    queryKey,
    enabled: open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_share_links")
        .select("id, token, kind, created_at, expires_at, revoked_at, view_count, last_viewed_at, recruiter_name, recruiter_email")
        .eq("org_id", orgId)
        .eq("kind", "profile")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as ShareRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from("student_share_links")
        .insert({
          org_id: orgId,
          kind: "profile",
          token,
          student_id: studentId,
          student_ids: [studentId],
          expires_at: expiresAt,
          allow_resume: true,
          allow_contact: false,
        })
        .select("id, token")
        .single();
      if (error) throw error;
      return data as { id: string; token: string };
    },
    onSuccess: async (row) => {
      await navigator.clipboard.writeText(buildUrl(row.token)).catch(() => {});
      toast.success("Link created and copied (30-day expiry)");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message || "Could not create link"),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("student_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link revoked");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message || "Could not revoke"),
  });

  const copyLink = async (row: ShareRow) => {
    await navigator.clipboard.writeText(buildUrl(row.token));
    setCopiedId(row.id);
    setTimeout(() => setCopiedId((c) => (c === row.id ? null : c)), 1500);
    toast.success("Link copied");
  };

  const statusOf = (r: ShareRow) =>
    r.revoked_at ? "Revoked" : new Date(r.expires_at) < new Date() ? "Expired" : "Active";

  const active = (links || []).filter((r) => statusOf(r) === "Active");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium truncate">Share · {studentName}</div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={() => { setOpen(false); onOpenFullDialog(); }}
          >
            <Settings2 className="h-3 w-3 mr-1" />
            Options
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            {active.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                No active recruiter link.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {active.map((r) => (
                  <div key={r.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {r.recruiter_name || r.recruiter_email || "Unnamed recipient"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                          {" · exp "}{format(new Date(r.expires_at), "MMM d")}
                        </div>
                      </div>
                      <Badge variant="default" className="shrink-0 text-[10px]">Active</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="h-3 w-3" />{r.view_count || 0}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => copyLink(r)}
                        >
                          {copiedId === r.id
                            ? <Check className="h-3 w-3" />
                            : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-destructive"
                          onClick={() => revoke.mutate(r.id)}
                          disabled={revoke.isPending}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full mt-3"
              size="sm"
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              {create.isPending
                ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                : <Link2 className="h-3.5 w-3.5 mr-2" />}
              Generate &amp; copy (30 days)
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
