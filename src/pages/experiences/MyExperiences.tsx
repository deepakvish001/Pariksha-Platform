import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyExperiences, type Experience } from "@/hooks/useExperiences";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, ThumbsUp, Eye, Clock, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from "lucide-react";

const statusMeta: Record<Experience["status"], { label: string; icon: any; cls: string; description: string }> = {
  pending: {
    label: "Pending review",
    icon: Clock,
    cls: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    description: "Our moderators are reviewing your submission. This usually takes 24–48 hours.",
  },
  approved: {
    label: "Approved & live",
    icon: CheckCircle2,
    cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    description: "Your experience is published and visible to everyone. You earned 100 XP!",
  },
  rejected: {
    label: "Not approved",
    icon: XCircle,
    cls: "bg-red-500/15 text-red-500 border-red-500/30",
    description: "This submission did not meet our guidelines. See moderator notes below.",
  },
};

export default function MyExperiences() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useMyExperiences(user?.id);

  if (!loading && !user) return <Navigate to="/auth?redirect=/experiences/mine" replace />;

  const counts = {
    pending: data?.filter((e) => e.status === "pending").length ?? 0,
    approved: data?.filter((e) => e.status === "approved").length ?? 0,
    rejected: data?.filter((e) => e.status === "rejected").length ?? 0,
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <Helmet>
        <title>My Submitted Experiences</title>
      </Helmet>

      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/experiences"><ArrowLeft className="size-4 mr-1" /> Back to marketplace</Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
            <p className="text-muted-foreground mt-1">Track the moderation status of every experience you've shared.</p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/experiences/submit"><Plus className="size-4" /> Share another</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["pending", "approved", "rejected"] as const).map((s) => {
          const m = statusMeta[s];
          const Icon = m.icon;
          return (
            <Card key={s} className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" /> {m.label}
              </div>
              <div className="text-2xl font-bold mt-1">{counts[s]}</div>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : !data?.length ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Briefcase className="size-10 mx-auto mb-3 opacity-50" />
          <p className="mb-4">You haven't submitted any experiences yet.</p>
          <Button asChild><Link to="/experiences/submit">Share your first experience</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((e) => {
            const m = statusMeta[e.status];
            const Icon = m.icon;
            const content = (
              <Card className="p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg truncate">{e.company_name}</h3>
                    <p className="text-sm text-muted-foreground">{e.role} · {e.year}</p>
                  </div>
                  <Badge variant="outline" className={`${m.cls} gap-1 shrink-0`}>
                    <Icon className="size-3.5" /> {m.label}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground/90 line-clamp-2 mb-3">{e.overall_text}</p>

                <div className={`text-xs rounded-md p-3 border ${m.cls}`}>
                  {m.description}
                  {e.status === "rejected" && e.moderation_notes && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <span className="font-medium">Moderator note:</span> {e.moderation_notes}
                    </div>
                  )}
                </div>

                {e.status === "approved" && (
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" />{e.upvotes} upvotes</span>
                    <span className="flex items-center gap-1"><Eye className="size-3.5" />{e.views} views</span>
                  </div>
                )}
              </Card>
            );
            return e.status === "approved" ? (
              <Link key={e.id} to={`/experiences/${e.id}`}>{content}</Link>
            ) : (
              <div key={e.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
