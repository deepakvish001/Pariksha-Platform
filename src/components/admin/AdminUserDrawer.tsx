import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Minus, Award, Trash2, ExternalLink, Send, LogOut } from "lucide-react";
import {
  useAdminUserDetail, useAdjustXp, useGrantAchievement, useRevokeAchievement,
} from "@/hooks/admin/useAdminEngagement";
import {
  useAdminNotifications, useSendAdminNotification,
  useAdminQuizAttempts, useResetSrs,
  useAdminConversations, usePurgeConversations,
  useForceLogout,
} from "@/hooks/admin/useAdminCoverage";
import { Link } from "react-router-dom";

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export const AdminUserDrawer = ({ userId, open, onOpenChange }: Props) => {
  const { data, isLoading } = useAdminUserDetail(open ? userId : null);
  const adjust = useAdjustXp();
  const grant = useGrantAchievement();
  const revoke = useRevokeAchievement();

  const [xpAmount, setXpAmount] = useState("");
  const [xpReason, setXpReason] = useState("");
  const [achId, setAchId] = useState("");

  const profile = data?.profile;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User detail</SheetTitle>
        </SheetHeader>

        {!userId || isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !data ? (
          <p className="py-8 text-sm text-muted-foreground">No data.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{(profile?.full_name ?? "?")[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile?.full_name ?? profile?.username ?? "Unnamed"}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username ?? "—"}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data.roles?.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
                  {profile?.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                  {profile?.leaderboard_hidden && <Badge variant="outline">Hidden from leaderboard</Badge>}
                </div>
              </div>
              {profile?.username && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/u/${profile.username}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3"><p className="text-xs text-muted-foreground">Level</p><p className="text-lg font-bold">{profile?.current_level ?? 1}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">Total XP</p><p className="text-lg font-bold">{profile?.total_xp ?? 0}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">XP this week</p><p className="text-lg font-bold">{profile?.xp_this_week ?? 0}</p></Card>
            </div>

            <Tabs defaultValue="xp">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="xp">XP</TabsTrigger>
                <TabsTrigger value="ach">Ach</TabsTrigger>
                <TabsTrigger value="subs">Subs</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="notif">Notif</TabsTrigger>
                <TabsTrigger value="conv">Chats</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="xp" className="space-y-3">
                <Card className="p-3 space-y-2">
                  <p className="text-xs font-medium">Adjust XP</p>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="number"
                      aria-label="XP amount"
                      placeholder="Amount (+/-)"
                      value={xpAmount}
                      onChange={(e) => setXpAmount(e.target.value)}
                      className="w-32"
                    />
                    <Input
                      aria-label="Reason"
                      placeholder="Reason"
                      value={xpReason}
                      onChange={(e) => setXpReason(e.target.value)}
                      className="flex-1 min-w-[140px]"
                    />
                    <Button
                      size="sm"
                      disabled={!xpAmount || !userId || adjust.isPending}
                      onClick={() => {
                        adjust.mutate({ userId: userId!, amount: parseInt(xpAmount, 10), reason: xpReason || "Admin adjustment" });
                        setXpAmount(""); setXpReason("");
                      }}
                    >
                      {parseInt(xpAmount || "0", 10) >= 0 ? <Plus className="h-3.5 w-3.5 mr-1" /> : <Minus className="h-3.5 w-3.5 mr-1" />}
                      Apply
                    </Button>
                  </div>
                </Card>
                <div className="space-y-1 text-xs">
                  {data.xp_recent.length === 0 && <p className="text-muted-foreground">No XP history.</p>}
                  {data.xp_recent.map((tx) => (
                    <div key={tx.id} className="flex justify-between border-b border-border/30 py-1">
                      <span className="truncate"><span className={tx.amount >= 0 ? "text-emerald-500" : "text-destructive"}>{tx.amount >= 0 ? "+" : ""}{tx.amount}</span> · {tx.source}</span>
                      <span className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ach" className="space-y-3">
                <Card className="p-3 space-y-2">
                  <p className="text-xs font-medium">Grant achievement</p>
                  <div className="flex gap-2">
                    <Input aria-label="Achievement ID" placeholder="achievement_id (e.g. first_quiz)" value={achId} onChange={(e) => setAchId(e.target.value)} />
                    <Button
                      size="sm"
                      disabled={!achId || !userId || grant.isPending}
                      onClick={() => { grant.mutate({ userId: userId!, achievementId: achId }); setAchId(""); }}
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />Grant
                    </Button>
                  </div>
                </Card>
                <div className="space-y-1 text-xs">
                  {data.achievements.length === 0 && <p className="text-muted-foreground">None earned yet.</p>}
                  {data.achievements.map((a) => (
                    <div key={a.achievement_id} className="flex items-center justify-between border-b border-border/30 py-1.5">
                      <div>
                        <p className="font-medium">{a.achievement_id}</p>
                        <p className="text-muted-foreground">{new Date(a.earned_at).toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="sm"
                        onClick={() => userId && revoke.mutate({ userId, achievementId: a.achievement_id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="subs" className="space-y-1 text-xs">
                {data.recent_submissions.length === 0 && <p className="text-muted-foreground">No submissions.</p>}
                {data.recent_submissions.map((s) => (
                  <div key={s.id} className="flex justify-between border-b border-border/30 py-1">
                    <span className="truncate">{s.problem_slug} · <span className="text-muted-foreground">{s.language}</span></span>
                    <span className={s.verdict === "accepted" ? "text-emerald-500" : "text-destructive"}>{s.verdict}</span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="quiz" className="space-y-2 text-xs">
                <UserQuizPanel userId={userId!} />
              </TabsContent>

              <TabsContent value="notif" className="space-y-2 text-xs">
                <UserNotifPanel userId={userId!} />
              </TabsContent>

              <TabsContent value="conv" className="space-y-2 text-xs">
                <UserConversationsPanel userId={userId!} />
              </TabsContent>

              <TabsContent value="audit" className="space-y-1 text-xs">
                {data.audit_actions.length === 0 && <p className="text-muted-foreground">No admin actions by this user.</p>}
                {data.audit_actions.map((a) => (
                  <div key={a.id} className="border-b border-border/30 py-1">
                    <p>{a.action} <span className="text-muted-foreground">{a.entity_type}{a.entity_slug ? ` · ${a.entity_slug}` : ""}</span></p>
                    <p className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const UserNotifPanel = ({ userId }: { userId: string }) => {
  const { data = [], isLoading } = useAdminNotifications(userId, null, 25);
  const send = useSendAdminNotification();
  const force = useForceLogout();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-2">
      <Card className="space-y-2 p-3">
        <p className="text-xs font-medium">Send notification</p>
        <Input aria-label="Notification title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
        <Input aria-label="Notification message" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className="h-8 text-xs" />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!title || !message || send.isPending}
            onClick={() => { send.mutate({ userId, title, message }); setTitle(""); setMessage(""); }}
          ><Send className="h-3 w-3 mr-1" />Send</Button>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => force.mutate({ userId, reason: "admin" })}>
            <LogOut className="h-3 w-3 mr-1" />Force logout
          </Button>
        </div>
      </Card>
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No notifications.</p>
      ) : (
        data.map((n: any) => (
          <div key={n.id} className="border-b border-border/30 py-1">
            <p className="font-medium">{n.title} <span className="text-muted-foreground">· {n.type}</span></p>
            <p className="text-muted-foreground truncate">{n.message}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}{n.read ? " · read" : ""}</p>
          </div>
        ))
      )}
    </div>
  );
};

const UserQuizPanel = ({ userId }: { userId: string }) => {
  const { data = [], isLoading } = useAdminQuizAttempts(userId, null, 25);
  const reset = useResetSrs();
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => reset.mutate({ userId })} disabled={reset.isPending}>
          Reset SRS
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> :
        data.length === 0 ? <p className="text-muted-foreground">No attempts.</p> :
        data.map((a: any) => (
          <div key={a.id} className="flex justify-between border-b border-border/30 py-1">
            <span className="truncate">{a.quiz_type} · {a.category ?? "all"} · {a.score}/{a.total_questions}</span>
            <span className="text-muted-foreground">{new Date(a.completed_at).toLocaleDateString()}</span>
          </div>
        ))}
    </div>
  );
};

const UserConversationsPanel = ({ userId }: { userId: string }) => {
  const { data = [], isLoading } = useAdminConversations(userId, 25);
  const purge = usePurgeConversations();
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="destructive" onClick={() => purge.mutate(userId)} disabled={purge.isPending}>
          <Trash2 className="h-3 w-3 mr-1" />Purge all
        </Button>
      </div>
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> :
        data.length === 0 ? <p className="text-muted-foreground">No conversations.</p> :
        data.map((c: any) => (
          <div key={c.id} className="flex justify-between border-b border-border/30 py-1">
            <span className="truncate">{c.title ?? "Untitled"}</span>
            <span className="text-muted-foreground">{new Date(c.updated_at ?? c.created_at).toLocaleDateString()}</span>
          </div>
        ))}
    </div>
  );
};
