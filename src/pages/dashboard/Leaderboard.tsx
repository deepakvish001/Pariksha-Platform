import { Link, useSearchParams } from "react-router-dom";
import { Trophy, ListChecks, Play, LogIn, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import CodingLeaderboard from "@/pages/library/CodingLeaderboard";
import { SubmissionsAndRunsBody } from "./SubmissionsHistory";

const VALID_TABS = ["leaderboard", "submissions", "runs"] as const;
type LeaderboardTab = (typeof VALID_TABS)[number];

function AuthGate({ feature }: { feature: string }) {
  return (
    <Card className="p-10 text-center space-y-4 max-w-xl mx-auto mt-6">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Sign in to see your {feature}</h2>
        <p className="text-sm text-muted-foreground">
          Your {feature} are private to your account. Log in to view, filter, and re-run them.
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link to="/login">
            <LogIn className="h-4 w-4 mr-1.5" />
            Sign in
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/signup">Create account</Link>
        </Button>
      </div>
    </Card>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("view") ?? "leaderboard";
  const tab: LeaderboardTab = (VALID_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as LeaderboardTab)
    : "leaderboard";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === "leaderboard") params.delete("view");
    else params.set("view", next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="container max-w-6xl py-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Global rankings, plus your personal submissions and runs history.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Global Leaderboard
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            My Submissions
          </TabsTrigger>
          <TabsTrigger value="runs" className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            My Runs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <CodingLeaderboard />
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {user ? <SubmissionsAndRunsBody forcedTab="submissions" /> : <AuthGate feature="submissions" />}
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {user ? <SubmissionsAndRunsBody forcedTab="runs" /> : <AuthGate feature="runs" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
