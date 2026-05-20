import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useExperiences, type ExperienceFilters } from "@/hooks/useExperiences";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, ThumbsUp, Eye, Plus, Sparkles, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const offerColor: Record<string, string> = {
  selected: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  waitlisted: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

export default function Experiences() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ExperienceFilters>({ sort: "recent" });
  const { data, isLoading } = useExperiences(filters);

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <Helmet>
        <title>Real Interview Experiences | Verified Student Stories</title>
        <meta name="description" content="Browse verified, real interview experiences from students placed at top companies. Get inside knowledge on rounds, questions, and tips." />
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-7 text-primary" /> Interview Experiences
          </h1>
          <p className="text-muted-foreground mt-1">Real stories from real placements. Verified and curated.</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link to={user ? "/experiences/submit" : "/auth?redirect=/experiences/submit"}>
            <Plus className="size-4" /> Share your experience
          </Link>
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="size-4" /> Filter</div>
        <Input
          placeholder="Company (e.g. Google)"
          value={filters.company ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value || undefined }))}
          className="md:max-w-xs"
        />
        <Input
          placeholder="Role (e.g. SDE-1)"
          value={filters.role ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
          className="md:max-w-xs"
        />
        <Select
          value={filters.experience_type ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, experience_type: v === "all" ? undefined : (v as any) }))}
        >
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="on_campus">On-Campus</SelectItem>
            <SelectItem value="off_campus">Off-Campus</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sort ?? "recent"} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as any }))}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="top">Most upvoted</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-44 animate-pulse bg-muted/30" />
          ))}
        </div>
      ) : !data?.length ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Briefcase className="size-10 mx-auto mb-3 opacity-50" />
          <p>No experiences match your filters yet. Be the first to share!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((e) => (
            <Link key={e.id} to={`/experiences/${e.id}`}>
              <Card className="p-5 h-full hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{e.company_name}</h3>
                    <p className="text-sm text-muted-foreground">{e.role} · {e.year}</p>
                  </div>
                  <Badge variant="outline" className={offerColor[e.offer_status]}>{e.offer_status.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm line-clamp-3 text-muted-foreground/90 mb-4">{e.overall_text}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">{e.experience_type.replace("_", "-")}</Badge>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" />{e.upvotes}</span>
                    <span className="flex items-center gap-1"><Eye className="size-3.5" />{e.views}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
