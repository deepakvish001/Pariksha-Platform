import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest, useContestProblems, useMyRegistration, useRegisterForContest, useWithdrawFromContest, useContestRegistrations, lifecycleStatus } from "@/hooks/useContests";
import { useContestClock } from "@/hooks/useContestClock";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, Trophy, Users, ArrowRight, Lock, Check, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const fmtDate = (s: string) => new Date(s).toLocaleString();

const ContestDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contest, isLoading } = useContest(slug);
  const { data: problems = [] } = useContestProblems(contest?.id);
  const { data: myReg } = useMyRegistration(contest?.id);
  const { data: registrations = [] } = useContestRegistrations(contest?.id);
  const register = useRegisterForContest();
  const withdraw = useWithdrawFromContest();
  const clock = useContestClock(contest?.starts_at, contest?.ends_at);
  const [invite, setInvite] = useState("");

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-96 w-full max-w-5xl" />;
  if (!contest) return <div className="p-8 text-center text-muted-foreground">Contest not found.</div>;

  const lifecycle = lifecycleStatus(contest);
  const isRegistered = myReg?.status === "registered";
  const canSeeProblems = clock.phase === "live" || clock.phase === "ended";
  const canRegister = lifecycle === "active" && clock.phase !== "ended";

  const onRegister = () => {
    if (!user) return navigate("/login");
    register.mutate({ contestId: contest.id, inviteCode: invite || undefined });
  };

  return (
    <>
      <Helmet>
        <title>{contest.title} | Byteskill Contests</title>
        <meta name="description" content={contest.description?.slice(0, 150) ?? "Coding contest"} />
      </Helmet>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        {contest.banner_url && (
          <div className="h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-cover bg-center"
               style={{ backgroundImage: `url(${contest.banner_url})` }} />
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="uppercase">{lifecycle}</Badge>
              <Badge variant="outline" className="uppercase opacity-70">{clock.phase}</Badge>
              <Badge variant="outline" className="capitalize">{contest.scoring_mode}</Badge>
              {contest.visibility === "private" && <Badge variant="outline"><Lock className="mr-1 h-3 w-3" />Private</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{contest.title}</h1>
            <p className="text-muted-foreground">{contest.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isRegistered ? (
              <>
                <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Check className="h-3 w-3" /> Registered
                </Badge>
                {clock.phase !== "ended" && (
                  <Button variant="ghost" size="sm" onClick={() => withdraw.mutate(contest.id)}>
                    Withdraw
                  </Button>
                )}
              </>
            ) : canRegister ? (
              <div className="flex flex-col items-end gap-2">
                {contest.visibility === "private" && (
                  <Input placeholder="Invite code" value={invite} onChange={(e) => setInvite(e.target.value)}
                         className="w-48" />
                )}
                <Button onClick={onRegister} disabled={register.isPending}>
                  {user ? "Register" : "Sign in to register"}
                </Button>
              </div>
            ) : (
              <Badge variant="outline">Registration closed</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Stat icon={CalendarDays} label="Starts" value={fmtDate(contest.starts_at)} />
          <Stat icon={CalendarDays} label="Ends" value={fmtDate(contest.ends_at)} />
          <Stat icon={Users} label="Registered" value={String(registrations.filter(r => r.status === "registered").length)} />
          <Stat icon={Trophy} label="Problems" value={String(problems.length)} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="leaderboard" asChild>
              <Link to={`/contests/${contest.slug}/leaderboard`}>Leaderboard</Link>
            </TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="prose prose-invert max-w-none pt-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {contest.description || "_No overview yet._"}
            </ReactMarkdown>
          </TabsContent>

          <TabsContent value="problems" className="space-y-2 pt-4">
            {!canSeeProblems ? (
              <Card className="p-6 text-center text-muted-foreground">
                Problems unlock when the contest starts.
              </Card>
            ) : problems.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">No problems set.</Card>
            ) : (
              problems.map((p, i) => (
                <Link key={p.problem_slug} to={`/library/problems/${p.problem_slug}?contest=${contest.slug}`}>
                  <Card className="flex items-center justify-between p-4 transition hover:border-primary/40">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                      <span className="font-medium">{p.problem_slug}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{p.points} pts</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="rules" className="prose prose-invert max-w-none pt-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {contest.rules_md || "_No rules specified._"}
            </ReactMarkdown>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

const Stat = ({ icon: Icon, label, value }: any) => (
  <Card className="p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className="mt-1 truncate text-sm font-medium">{value}</div>
  </Card>
);

export default ContestDetail;
