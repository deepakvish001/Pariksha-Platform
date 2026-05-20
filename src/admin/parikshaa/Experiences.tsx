import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Eye, Building2, Calendar, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Experience } from "@/hooks/useExperiences";
import { ExperienceReportsQueue } from "./ExperienceReportsQueue";
import { ExperienceAuditLog } from "./ExperienceAuditLog";

function useExperiencesByStatus(status: "pending" | "approved" | "rejected") {
  return useQuery({
    queryKey: ["admin-experiences", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interview_experiences")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as Experience[];
    },
  });
}

export default function ParikshaaExperiences() {
  const [topTab, setTopTab] = useState<"submissions" | "reports">("submissions");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading } = useExperiencesByStatus(tab);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const moderate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const exp = data?.find((e) => e.id === id);
      const note = notesById[id] || null;

      const { error } = await supabase
        .from("interview_experiences")
        .update({
          status,
          moderation_notes: note,
          moderated_by: user?.id ?? null,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      if (!exp) return;

      if (status === "approved") {
        // Idempotent: re-approving never double-awards
        const { error: rpcErr } = await supabase.rpc("award_xp_idempotent" as any, {
          p_user_id: exp.user_id,
          p_amount: 100,
          p_source: "experience_approved",
          p_reference_id: exp.id,
          p_description: `Interview experience approved: ${exp.company_name}`,
          p_metadata: { company: exp.company_name, role: exp.role },
        });
        if (rpcErr) throw rpcErr;
      } else if (status === "rejected" && exp.status === "approved") {
        // Roll back previously-awarded XP if an approved entry is later rejected
        const { error: rpcErr } = await supabase.rpc("reverse_xp_entry" as any, {
          p_source: "experience_approved",
          p_reference_id: exp.id,
          p_reason: note || "Experience rejected after approval",
        });
        if (rpcErr) throw rpcErr;
      }
    },
    onSuccess: (_d, vars) => {
      toast({
        title:
          vars.status === "approved"
            ? "Approved — XP awarded (once)"
            : "Rejected — XP reversed if previously awarded",
      });
      qc.invalidateQueries({ queryKey: ["admin-experiences"] });
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <Helmet><title>Experience Moderation · Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold">Interview Experiences</h1>
        <p className="text-muted-foreground text-sm">Review and approve community-submitted experiences. Approval awards 100 XP.</p>
      </div>

      <Tabs value={topTab} onValueChange={(v) => setTopTab(v as any)}>
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="space-y-4 mt-6">
          {isLoading ? (
            <Card className="h-40 animate-pulse bg-muted/30" />
          ) : !data?.length ? (
            <Card className="p-12 text-center text-muted-foreground">No {tab} experiences.</Card>
          ) : (
            data.map((exp) => (
              <Card key={exp.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Building2 className="size-4 text-primary" /> {exp.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{exp.role} · {exp.year}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="secondary" className="capitalize">{exp.experience_type.replace("_", "-")}</Badge>
                    <Badge variant="secondary" className="capitalize">{exp.offer_status.replace("_", " ")}</Badge>
                    <Badge variant="secondary" className="gap-1"><Calendar className="size-3" />{new Date(exp.created_at).toLocaleDateString()}</Badge>
                    {tab === "approved" && (
                      <Badge variant="secondary" className="gap-1"><ThumbsUp className="size-3" />{exp.upvotes}</Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm line-clamp-3 text-muted-foreground">{exp.overall_text}</p>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link to={`/experiences/${exp.id}`} target="_blank"><Eye className="size-3.5" /> Preview</Link>
                  </Button>
                </div>

                {tab === "pending" && (
                  <>
                    <Textarea
                      placeholder="Moderation notes (optional, shown to author)"
                      rows={2}
                      value={notesById[exp.id] ?? ""}
                      onChange={(e) => setNotesById((m) => ({ ...m, [exp.id]: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => moderate.mutate({ id: exp.id, status: "rejected" })} disabled={moderate.isPending} className="gap-1">
                        <X className="size-4" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => moderate.mutate({ id: exp.id, status: "approved" })} disabled={moderate.isPending} className="gap-1">
                        <Check className="size-4" /> Approve
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))
          )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ExperienceReportsQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}
