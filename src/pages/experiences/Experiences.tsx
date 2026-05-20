import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useExperiences, useMyExperiences, type ExperienceFilters, type Experience } from "@/hooks/useExperiences";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, ThumbsUp, Eye, Plus, Sparkles, Filter, FileClock, Search, X, Building2, UserSquare2, Calendar,
  Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ownerStatusMeta: Record<Experience["status"], { label: string; icon: any; cls: string }> = {
  pending: { label: "Pending review", icon: Clock, cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  rejected: { label: "Not approved", icon: XCircle, cls: "bg-red-500/15 text-red-500 border-red-500/30" },
};

const offerColor: Record<string, string> = {
  selected: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-500 border-red-500/30",
  waitlisted: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

const difficultyColor: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  hard: "bg-red-500/15 text-red-500 border-red-500/30",
};

export default function Experiences() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ExperienceFilters>({ sort: "recent" });
  const [searchInput, setSearchInput] = useState("");

  // Debounce the search input to avoid querying on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, q: searchInput.trim() || undefined }));
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useExperiences(filters);
  const { data: mine } = useMyExperiences(user?.id);

  // Owner-only: surface user's pending/rejected entries at the top of the marketplace.
  const ownerPending = useMemo(() => {
    if (!user || !mine) return [] as Experience[];
    const approvedIds = new Set((data ?? []).map((e) => e.id));
    return mine.filter((e) => e.status !== "approved" && !approvedIds.has(e.id));
  }, [mine, data, user]);

  // Derive popular companies/roles/years from current dataset for one-tap chips
  const { topCompanies, topRoles, years } = useMemo(() => {
    const cMap = new Map<string, number>();
    const rMap = new Map<string, number>();
    const ySet = new Set<number>();
    (data ?? []).forEach((e) => {
      cMap.set(e.company_name, (cMap.get(e.company_name) ?? 0) + 1);
      rMap.set(e.role, (rMap.get(e.role) ?? 0) + 1);
      ySet.add(e.year);
    });
    const sortDesc = (a: [string, number], b: [string, number]) => b[1] - a[1];
    return {
      topCompanies: [...cMap.entries()].sort(sortDesc).slice(0, 8).map(([n]) => n),
      topRoles: [...rMap.entries()].sort(sortDesc).slice(0, 6).map(([n]) => n),
      years: [...ySet].sort((a, b) => b - a),
    };
  }, [data]);

  const set = (patch: Partial<ExperienceFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const clearAll = () => setFilters({ sort: filters.sort ?? "recent" });

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (filters.q) activeChips.push({ key: "q", label: `“${filters.q}”`, onRemove: () => set({ q: undefined }) });
  if (filters.company) activeChips.push({ key: "company", label: `Company: ${filters.company}`, onRemove: () => set({ company: undefined }) });
  if (filters.role) activeChips.push({ key: "role", label: `Role: ${filters.role}`, onRemove: () => set({ role: undefined }) });
  if (filters.experience_type) activeChips.push({ key: "type", label: `Type: ${filters.experience_type.replace("_", "-")}`, onRemove: () => set({ experience_type: undefined }) });
  if (filters.difficulty) activeChips.push({ key: "diff", label: `Difficulty: ${filters.difficulty}`, onRemove: () => set({ difficulty: undefined }) });
  if (filters.year) activeChips.push({ key: "year", label: `Year: ${filters.year}`, onRemove: () => set({ year: undefined }) });

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <Helmet>
        <title>Real Interview Experiences | Verified Student Stories</title>
        <meta name="description" content="Browse verified, real interview experiences from students placed at top companies. Search by company, role, and category." />
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-7 text-primary" /> Interview Experiences
          </h1>
          <p className="text-muted-foreground mt-1">Real stories from real placements. Verified and curated.</p>
        </div>
        <div className="flex gap-2">
          {user && (
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/experiences/mine"><FileClock className="size-4" /> My submissions</Link>
            </Button>
          )}
          <Button asChild size="lg" className="gap-2">
            <Link to={user ? "/experiences/submit" : "/auth?redirect=/experiences/submit"}>
              <Plus className="size-4" /> Share your experience
            </Link>
          </Button>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company, role, question, tip, location…"
            value={filters.q ?? ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="size-4" /> Filter</div>
          <Input
            placeholder="Company"
            value={filters.company ?? ""}
            onChange={(e) => set({ company: e.target.value || undefined })}
            className="md:max-w-[180px]"
          />
          <Input
            placeholder="Role"
            value={filters.role ?? ""}
            onChange={(e) => set({ role: e.target.value || undefined })}
            className="md:max-w-[180px]"
          />
          <Select
            value={filters.experience_type ?? "all"}
            onValueChange={(v) => set({ experience_type: v === "all" ? undefined : (v as any) })}
          >
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="on_campus">On-Campus</SelectItem>
              <SelectItem value="off_campus">Off-Campus</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.difficulty ?? "all"}
            onValueChange={(v) => set({ difficulty: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.year ? String(filters.year) : "all"}
            onValueChange={(v) => set({ year: v === "all" ? undefined : Number(v) })}
          >
            <SelectTrigger className="md:w-28"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any year</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sort ?? "recent"} onValueChange={(v) => set({ sort: v as any })}>
            <SelectTrigger className="md:w-40 md:ml-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="top">Most upvoted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(topCompanies.length > 0 || topRoles.length > 0) && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
            {topCompanies.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="size-3" /> Companies:</span>
                {topCompanies.map((c) => (
                  <button
                    key={c}
                    onClick={() => set({ company: filters.company === c ? undefined : c })}
                    className={`text-xs px-2 py-0.5 rounded-full border transition ${
                      filters.company === c
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {topRoles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><UserSquare2 className="size-3" /> Roles:</span>
                {topRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => set({ role: filters.role === r ? undefined : r })}
                    className={`text-xs px-2 py-0.5 rounded-full border transition ${
                      filters.role === r
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
            <span className="text-xs text-muted-foreground">Active:</span>
            {activeChips.map((c) => (
              <Badge key={c.key} variant="secondary" className="gap-1 pr-1">
                {c.label}
                <button onClick={c.onRemove} className="hover:bg-background/40 rounded-full p-0.5">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">Clear all</Button>
          </div>
        )}
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
          <p>No experiences match your filters yet.</p>
          {activeChips.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="mt-3">Clear filters</Button>
          )}
        </Card>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">{data.length} experience{data.length === 1 ? "" : "s"}{ownerPending.length > 0 ? ` · ${ownerPending.length} of yours awaiting/needing review` : ""}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...ownerPending, ...data].map((e) => {
              const isOwner = user?.id === e.user_id;
              const showOwnerBadge = isOwner && e.status !== "approved";
              const ownerMeta = showOwnerBadge ? ownerStatusMeta[e.status] : null;
              const OwnerIcon = ownerMeta?.icon;
              return (
              <Link key={e.id} to={`/experiences/${e.id}`}>
                <Card className={`p-5 h-full hover:border-primary/50 transition-colors group flex flex-col ${showOwnerBadge ? "border-dashed" : ""}`}>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">{e.company_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{e.role} · {e.year}</p>
                    </div>
                    {showOwnerBadge && ownerMeta ? (
                      <Badge variant="outline" className={`${ownerMeta.cls} shrink-0 gap-1`}>
                        {OwnerIcon && <OwnerIcon className="size-3" />}{ownerMeta.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`${offerColor[e.offer_status]} shrink-0`}>{e.offer_status.replace("_", " ")}</Badge>
                    )}
                  </div>
                  {showOwnerBadge && (
                    <p className="text-[11px] text-muted-foreground mb-2 italic">Only you can see this card — it isn't public yet.</p>
                  )}
                  <p className="text-sm line-clamp-3 text-muted-foreground/90 mb-3">{e.overall_text}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="secondary" className="capitalize gap-1 text-[10px]">
                      <Building2 className="size-3" />{e.experience_type.replace("_", "-")}
                    </Badge>
                    {e.difficulty && (
                      <Badge variant="outline" className={`capitalize text-[10px] ${difficultyColor[e.difficulty.toLowerCase()] ?? ""}`}>
                        {e.difficulty}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Calendar className="size-3" />{e.year}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end text-xs text-muted-foreground mt-auto gap-3">
                    <span className="flex items-center gap-1"><ThumbsUp className="size-3.5" />{e.upvotes}</span>
                    <span className="flex items-center gap-1"><Eye className="size-3.5" />{e.views}</span>
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
