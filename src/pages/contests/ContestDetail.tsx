import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest, useContestProblems, useMyRegistration, useRegisterForContest, useWithdrawFromContest, useContestRegisteredCount, lifecycleStatus } from "@/hooks/useContests";
import { useContestClock } from "@/hooks/useContestClock";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, Trophy, Users, ArrowRight, Lock, Check, AlertCircle, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SecureContestGate from "@/components/contests/SecureContestGate";
import { useState as useReactState } from "react";
import { supabase } from "@/integrations/supabase/client";

const fmtDate = (s: string) => new Date(s).toLocaleString();

const ContestDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contest, isLoading } = useContest(slug);
  const { data: problems = [] } = useContestProblems(contest?.id);
  const { data: myReg } = useMyRegistration(contest?.id);
  const { data: registeredCount = 0 } = useContestRegisteredCount(contest?.id);
  const register = useRegisterForContest();
  const withdraw = useWithdrawFromContest();
  const clock = useContestClock(contest?.starts_at, contest?.ends_at);
  const [invite, setInvite] = useState("");
  const honorAcceptedInitial = !!(myReg as { honor_code_accepted_at?: string | null } | undefined)?.honor_code_accepted_at;
  const [honorAccepted, setHonorAccepted] = useReactState(honorAcceptedInitial);
  const [hasActiveSession, setHasActiveSession] = useReactState(false);
  useEffect(() => { setHonorAccepted(honorAcceptedInitial); }, [honorAcceptedInitial]);

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-96 w-full max-w-5xl" />;
  if (!contest) return <div className="p-8 text-center text-muted-foreground">Contest not found.</div>;

  const lifecycle = lifecycleStatus(contest);
  const isRegistered = myReg?.status === "registered";
  const canSeeProblems = clock.phase === "live" || clock.phase === "ended";
  // Secure Mode: registration closes at start time (enforced by trigger too)
  const canRegister = lifecycle === "active" && clock.phase === "upcoming";
  const isDisqualified = (myReg as { status?: string } | undefined)?.status === "disqualified";

  const onRegister = () => {
    if (!user) return navigate("/login");
    register.mutate({ contestId: contest.id, inviteCode: invite || undefined });
  };

  return (
    <>
      <Helmet>
        <title>{contest.title} | Parikshaa Contests</title>
        <meta name="description" content={contest.description?.slice(0, 150) ?? `Join the ${contest.title} coding contest on Parikshaa.`} />
        <link rel="canonical" href={`https://www.parikshaa.org/contests/${contest.slug}`} />
        <meta property="og:title" content={`${contest.title} | Parikshaa Contests`} />
        <meta property="og:description" content={contest.description?.slice(0, 150) ?? `Join the ${contest.title} coding contest on Parikshaa.`} />
        <meta property="og:url" content={`https://www.parikshaa.org/contests/${contest.slug}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={`${contest.title} | Parikshaa Contests`} />
        <meta name="twitter:description" content={contest.description?.slice(0, 150) ?? `Join the ${contest.title} coding contest on Parikshaa.`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          name: contest.title,
          description: contest.description ?? `${contest.title} coding contest on Parikshaa.`,
          startDate: contest.starts_at,
          endDate: contest.ends_at,
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          url: `https://www.parikshaa.org/contests/${contest.slug}`,
          organizer: { "@type": "Organization", name: "Parikshaa", url: "https://www.parikshaa.org" },
        })}</script>
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
              <Badge variant="outline" className="border-primary/40 text-primary">
                <ShieldCheck className="mr-1 h-3 w-3" /> Secure Mode
              </Badge>
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
                  <Input aria-label="Invite code" placeholder="Invite code" value={invite} onChange={(e) => setInvite(e.target.value)}
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

        {(register.error || withdraw.error) && (
          <Alert variant="destructive" data-testid="contest-action-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {register.error ? "Couldn't register" : "Couldn't withdraw"}
            </AlertTitle>
            <AlertDescription>
              {(register.error as Error)?.message ?? (withdraw.error as Error)?.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <Stat icon={CalendarDays} label="Starts" value={fmtDate(contest.starts_at)} />
          <Stat icon={CalendarDays} label="Ends" value={fmtDate(contest.ends_at)} />
          <Stat icon={Users} label="Registered" value={String(registeredCount)} />
          <Stat icon={Trophy} label="Problems" value={String(problems.length)} />
        </div>

        {user && (
          <SecureContestGate
            contestId={contest.id}
            contestSlug={contest.slug}
            startsAt={contest.starts_at}
            registeredCount={registeredCount}
            honorAccepted={honorAccepted}
            onHonorAccepted={() => setHonorAccepted(true)}
            hasStarted={clock.phase === "live" || clock.phase === "ended"}
            hasEnded={clock.phase === "ended"}
            isRegistered={isRegistered}
            isDisqualified={isDisqualified}
            onSessionChange={setHasActiveSession}
            firstProblemSlug={problems[0]?.problem_slug}
          />
        )}

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
            ) : isRegistered && clock.phase === "live" && !hasActiveSession ? (
              <Card className="space-y-2 border-amber-500/30 bg-amber-500/5 p-6 text-center">
                <ShieldCheck className="mx-auto h-6 w-6 text-amber-300" />
                <div className="font-medium">Start your Secure Session to view problems</div>
                <div className="text-sm text-muted-foreground">
                  In Secure Mode, problems are hidden until you start a proctored session above.
                </div>
              </Card>
            ) : problems.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">No problems set.</Card>
            ) : (
              problems.map((p, i) => {
                // While a secure session is active, route problem links into the
                // kiosk layout (no sidebar). Otherwise fall back to the normal
                // problem page with ?contest=<slug> query param.
                const href = hasActiveSession
                  ? `/contests/${contest.slug}/play/${p.problem_slug}`
                  : `/library/problems/${p.problem_slug}?contest=${contest.slug}`;
                return (
                  <Link key={p.problem_slug} to={href}>
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
                );
              })
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
