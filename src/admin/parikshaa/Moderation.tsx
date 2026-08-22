import { useState } from "react";
import { ShellHeader } from "./ParikshaaShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useReports,
  useResolveReport,
  useAdminAIContent,
  useToggleAIContentPublic,
  useDeleteAIContent,
} from "@/hooks/admin/useAdminControl";

function ReportsPanel() {
  const [status, setStatus] = useState<"open" | "resolved" | "dismissed">("open");
  const { data, isLoading } = useReports(status);
  const resolve = useResolveReport();
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["open", "resolved", "dismissed"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border bg-card divide-y">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground"></div>
        ) : (data ?? []).length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No reports.</div>
        ) : (
          (data ?? []).map((r: any) => (
            <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 text-sm">
                <div className="font-medium">{r.entity_type ?? r.subject_type ?? "report"} · {r.reason ?? r.category ?? "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.details ?? r.message ?? ""}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              {status === "open" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: "resolved" })}>Resolve</Button>
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })}>
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AIContentPanel() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminAIContent(search);
  const toggle = useToggleAIContentPublic();
  const del = useDeleteAIContent();
  return (
    <div className="space-y-3">
      <Input aria-label="Search AI content by title" placeholder="Search AI content by title…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      <div className="rounded-lg border bg-card divide-y">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground"></div>
        ) : (data ?? []).length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Nothing found.</div>
        ) : (
          (data ?? []).map((c: any) => (
            <div key={c.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 text-sm">
                <div className="font-medium truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground truncate">{c.content_type} · {c.topic ?? ""} · {c.likes_count ?? 0} likes</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.is_public ? "outline" : "secondary"}>{c.is_public ? "public" : "private"}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: c.id, isPublic: !c.is_public })}>
                  {c.is_public ? "Hide" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Delete this content?")) del.mutate(c.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ParikshaaModeration() {
  return (
    <>
      <ShellHeader title="Moderation" />
      <div className="p-6">
        <Tabs defaultValue="reports">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="ai">AI content</TabsTrigger>
          </TabsList>
          <TabsContent value="reports" className="mt-4">
            <ReportsPanel />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <AIContentPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
