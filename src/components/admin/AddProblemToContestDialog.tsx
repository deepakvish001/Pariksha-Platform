import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAdminContests, useAttachProblemToContest } from "@/hooks/admin/useAdminContests";

type Props = {
  problemSlug: string;
  problemTitle: string;
  trigger: React.ReactNode;
};

const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-sky-500/15 text-sky-500",
  live: "bg-emerald-500/15 text-emerald-500",
  ended: "bg-zinc-500/15 text-zinc-400",
  cancelled: "bg-rose-500/15 text-rose-500",
};

export const AddProblemToContestDialog = ({ problemSlug, problemTitle, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: contests = [], isLoading } = useAdminContests();
  const attach = useAttachProblemToContest();

  const ELIGIBLE_STATUSES = ["draft", "published", "live"] as const;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contests.forEach((c) => {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    });
    return counts;
  }, [contests]);

  const eligible = useMemo(
    () =>
      contests
        .filter((c) => (ELIGIBLE_STATUSES as readonly string[]).includes(c.status))
        .filter((c) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
        }),
    [contests, search],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to contest</DialogTitle>
          <DialogDescription>
            Attach <span className="font-medium text-foreground">{problemTitle}</span> to a contest.
            Private problems become visible to registered contestants while the contest is live.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contests…"
            className="pl-9"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto rounded-md border divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading contests…</div>
          ) : eligible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <p>No eligible contests yet.</p>
              <Button asChild size="sm" variant="outline" onClick={() => setOpen(false)}>
                <Link to="/admin/contests/new">
                  <Plus className="mr-1 h-3 w-3" /> Create a contest
                </Link>
              </Button>
            </div>
          ) : (
            eligible.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.title}</span>
                    <Badge className={STATUS_VARIANT[c.status] ?? "bg-muted"}>{c.status}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {c.starts_at ? format(new Date(c.starts_at), "PPP p") : "—"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={attach.isPending}
                  onClick={() =>
                    attach.mutate(
                      { problemSlug, contestId: c.id },
                      {
                        onSuccess: (data) => {
                          if (!data?.already_attached) setOpen(false);
                        },
                      },
                    )
                  }
                >
                  {attach.isPending && attach.variables?.contestId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
