import { Helmet } from "react-helmet-async";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useExperience, useMyVote, useToggleVote } from "@/hooks/useExperiences";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, Eye, MapPin, IndianRupee, Calendar, Building2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ReportExperienceDialog } from "@/components/experiences/ReportExperienceDialog";

const offerColor: Record<string, string> = {
  selected: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  waitlisted: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: exp, isLoading } = useExperience(id);
  const { data: voted } = useMyVote(id, user?.id);
  const toggleVote = useToggleVote();

  if (isLoading) return <div className="container max-w-3xl py-8"><Card className="h-96 animate-pulse bg-muted/30" /></div>;
  if (!exp) return (
    <div className="container max-w-3xl py-8 text-center">
      <p className="text-muted-foreground">Experience not found.</p>
      <Button asChild variant="link"><Link to="/experiences">Back to all experiences</Link></Button>
    </div>
  );

  const handleVote = () => {
    if (!user) { navigate(`/auth?redirect=/experiences/${id}`); return; }
    toggleVote.mutate({ experienceId: exp.id, userId: user.id, voted: !!voted });
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <Helmet>
        <title>{exp.company_name} · {exp.role} Interview Experience ({exp.year})</title>
        <meta name="description" content={exp.overall_text.slice(0, 155)} />
      </Helmet>

      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link to="/experiences"><ArrowLeft className="size-4" /> All experiences</Link>
      </Button>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Building2 className="size-6 text-primary" /> {exp.company_name}
            </h1>
            <p className="text-muted-foreground mt-1">{exp.role}</p>
          </div>
          <Badge variant="outline" className={offerColor[exp.offer_status]}>{exp.offer_status.replace("_", " ")}</Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="gap-1"><Calendar className="size-3" />{exp.year}</Badge>
          <Badge variant="secondary" className="capitalize">{exp.experience_type.replace("_", "-")}</Badge>
          <Badge variant="secondary" className="capitalize">{exp.difficulty}</Badge>
          {exp.location && <Badge variant="secondary" className="gap-1"><MapPin className="size-3" />{exp.location}</Badge>}
          {exp.ctc_lpa && <Badge variant="secondary" className="gap-1"><IndianRupee className="size-3" />{exp.ctc_lpa} LPA</Badge>}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-border/40">
          <Button variant={voted ? "default" : "outline"} size="sm" onClick={handleVote} disabled={toggleVote.isPending} className="gap-2">
            <ThumbsUp className="size-4" /> {exp.upvotes} {voted ? "Upvoted" : "Upvote"}
          </Button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3.5" />{exp.views} views</span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-3">Overall experience</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{exp.overall_text}</ReactMarkdown>
        </div>
      </Card>

      {exp.rounds?.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Rounds breakdown</h2>
          <div className="space-y-4">
            {exp.rounds.map((r, idx) => (
              <div key={idx} className="border-l-2 border-primary/50 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Round {idx + 1}</Badge>
                  <h3 className="font-medium">{r.name}</h3>
                  {r.duration && <span className="text-xs text-muted-foreground">· {r.duration}</span>}
                </div>
                {r.type && <p className="text-xs text-muted-foreground mb-1">Type: {r.type}</p>}
                {r.questions && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{r.questions}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {exp.tips && (
        <Card className="p-6 border-primary/30 bg-primary/5">
          <h2 className="font-semibold text-lg mb-3">💡 Tips from the author</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{exp.tips}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
