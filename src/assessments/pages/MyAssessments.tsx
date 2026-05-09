import { Link } from "react-router-dom";
import { useMyInvites, useMyAttempts, claimInvite } from "@/b2b/hooks/useInvites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MyAssessments() {
  const { data: invites } = useMyInvites();
  const { data: attempts } = useMyAttempts();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My assessments</h1>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Invitations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!invites?.length && (
            <p className="text-sm text-muted-foreground">No invitations yet.</p>
          )}
          {invites?.map((i: any) => (
            <div key={i.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{i.assessment?.title ?? "Assessment"}</div>
                <div className="text-xs text-muted-foreground">{i.assessment?.duration_min} min</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={i.status === "pending" ? "secondary" : "default"}>{i.status}</Badge>
                {(i.status === "pending" || i.status === "claimed") && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        const a: any = await claimInvite(i.token);
                        navigate(`/assessments/${a.id}/lobby`);
                      } catch (err: any) {
                        toast.error(err?.message ?? "Could not join");
                      }
                    }}
                  >
                    {i.status === "claimed" ? "Resume" : "Start"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Past attempts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!attempts?.length && (
            <p className="text-sm text-muted-foreground">You haven't taken any assessments yet.</p>
          )}
          {attempts?.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{a.assessment?.title ?? "Assessment"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.started_at).toLocaleString()}
                </div>
              </div>
              <Badge variant="outline">{a.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
