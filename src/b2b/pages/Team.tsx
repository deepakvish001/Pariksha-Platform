import { useState } from "react";
import { Navigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import { useOrgMembers, useRemoveMember, useUpdateMemberRole, type OrgMember, type OrgMemberRole } from "../hooks/useMembers";
import { useOrgInvites, useRevokeOrgInvite, useResendOrgInvite, buildOrgJoinUrl } from "../hooks/useOrgInvites";
import { useMemberCapabilities } from "../hooks/useMemberCapabilities";
import { ROLE_CAPABILITY_PRESETS, CAPABILITY_GROUPS } from "../hooks/usePermissions";
import { InviteTeacherDialog } from "../components/team/InviteTeacherDialog";
import { EditMemberAccessDialog } from "../components/team/EditMemberAccessDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, Info, UserPlus, Copy, Send, Ban, ShieldCheck, MailCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<OrgMemberRole, string> = {
  owner: "Owner", admin: "Admin", proctor: "Proctor", recruiter: "Recruiter", viewer: "Viewer",
};

const CAP_LABEL: Record<string, string> = Object.fromEntries(
  CAPABILITY_GROUPS.flatMap((g) => g.caps.map((c) => [c.key as string, c.label])),
);

function MemberCapabilityChips({ member }: { member: OrgMember }) {
  const { data: overrides } = useMemberCapabilities(member.id);
  const caps = overrides && overrides.length > 0
    ? overrides
    : (ROLE_CAPABILITY_PRESETS[member.role] ?? []);
  const isCustom = !!(overrides && overrides.length > 0);
  if (caps.length === 0) {
    return <span className="text-xs text-[hsl(var(--muted-foreground))]">Read-only</span>;
  }
  const shown = caps.slice(0, 3);
  const extra = caps.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {isCustom && <Badge variant="secondary" className="text-[10px]">Custom</Badge>}
      {shown.map((c) => (
        <Badge key={c} variant="outline" className="text-[10px]">{CAP_LABEL[c] ?? c}</Badge>
      ))}
      {extra > 0 && <Badge variant="outline" className="text-[10px]">+{extra} more</Badge>}
    </div>
  );
}

export default function B2BTeam() {
  const { user } = useAuth();
  const { data: orgs, isLoading: loadingOrgs } = useMyOrganizations();
  const org = orgs?.[0];
  const { data: members, isLoading } = useOrgMembers(org?.id);
  const { data: invites } = useOrgInvites(org?.id);
  const updateRole = useUpdateMemberRole(org?.id);
  const removeMember = useRemoveMember(org?.id);
  const revoke = useRevokeOrgInvite(org?.id);
  const resend = useResendOrgInvite();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<OrgMember | null>(null);

  if (loadingOrgs) return <OrgShell title="Team"><div /></OrgShell>;
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";
  const pending = (invites ?? []).filter((i) => !i.revoked && !i.accepted_at && new Date(i.expires_at) > new Date());

  return (
    <OrgShell
      title={
        <>
          <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
            {org.name}
          </span>{" "}
          <span className="text-[hsl(var(--muted-foreground))] font-normal">· Team</span>
        </>
      }
    >
      <div className="b2b-card p-4 mb-4 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 text-[hsl(var(--primary))]" />
        <div className="flex-1">
          <div className="font-medium">Add teachers and pick exactly what they can do</div>
          <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
            Send a private link to a teacher's email — only that address can use it. Start from a preset
            (Admin, Proctor, Recruiter, Viewer) and tick or untick individual capabilities for fine-grained control.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)} className="shrink-0">
            <UserPlus className="h-4 w-4 mr-2" /> Invite teacher
          </Button>
        )}
      </div>

      {/* Pending invites */}
      {canManage && pending.length > 0 && (
        <div className="b2b-card overflow-hidden mb-4">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <MailCheck className="h-4 w-4" />
            <span className="text-sm font-semibold">Pending invites</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{pending.length} waiting</span>
          </div>
          <ul className="divide-y">
            {pending.map((inv) => {
              const url = buildOrgJoinUrl(inv.token);
              const expiresDays = Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86400000));
              return (
                <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <MailCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{inv.email}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2 flex-wrap mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{inv.role_preset}</Badge>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> expires in {expiresDays}d</span>
                      <span>· {inv.capabilities?.length ?? 0} capabilities</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={resend.isPending}
                      onClick={() => resend.mutate(inv.id, {
                        onSuccess: () => toast.success("Email resent"),
                        onError: (e: any) => toast.error(e.message ?? "Failed to resend"),
                      })}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (!confirm(`Revoke invite for ${inv.email}?`)) return;
                        revoke.mutate(inv.id, {
                          onSuccess: () => toast.success("Invite revoked"),
                          onError: (e: any) => toast.error(e.message ?? "Failed"),
                        });
                      }}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Members */}
      <div className="b2b-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-semibold">Members</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {isLoading ? "…" : `${members?.length ?? 0} total`}
          </span>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>
        ) : (members?.length ?? 0) === 0 ? (
          <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]">No members yet.</div>
        ) : (
          <ul className="divide-y">
            {members!.map((m) => {
              const isSelf = m.user_id === user?.id;
              const isOwner = m.role === "owner";
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback>{(m.full_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium truncate">
                      {m.full_name ?? "Unnamed user"}
                      {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                    </div>
                    <div className="mt-1"><MemberCapabilityChips member={m} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && !isOwner ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => {
                          setBusyId(m.id);
                          updateRole.mutate(
                            { memberId: m.id, role: v as OrgMemberRole },
                            {
                              onSuccess: () => toast.success("Role updated"),
                              onError: (e: any) => toast.error(e.message ?? "Failed"),
                              onSettled: () => setBusyId(null),
                            },
                          );
                        }}
                        disabled={busyId === m.id}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="proctor">Proctor</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{ROLE_LABEL[m.role]}</Badge>
                    )}
                    {canManage && !isOwner && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Edit access
                      </Button>
                    )}
                    {canManage && !isOwner && !isSelf && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${m.full_name ?? "member"}`}
                        className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-destructive"
                        disabled={busyId === m.id}
                        onClick={() => {
                          if (!confirm(`Remove ${m.full_name ?? "this member"} from the org?`)) return;
                          setBusyId(m.id);
                          removeMember.mutate(m.id, {
                            onSuccess: () => toast.success("Member removed"),
                            onError: (e: any) => toast.error(e.message ?? "Failed"),
                            onSettled: () => setBusyId(null),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <InviteTeacherDialog open={inviteOpen} onOpenChange={setInviteOpen} orgId={org.id} />
      <EditMemberAccessDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        member={editing}
        orgId={org.id}
      />
    </OrgShell>
  );
}
