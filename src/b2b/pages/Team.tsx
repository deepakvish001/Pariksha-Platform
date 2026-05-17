import { useState } from "react";
import { Navigate } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import { useOrgMembers, useRemoveMember, useUpdateMemberRole, type OrgMemberRole } from "../hooks/useMembers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<OrgMemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  proctor: "Proctor",
  recruiter: "Recruiter",
  viewer: "Viewer",
};

export default function B2BTeam() {
  const { user } = useAuth();
  const { data: orgs, isLoading: loadingOrgs } = useMyOrganizations();
  const org = orgs?.[0];
  const { data: members, isLoading } = useOrgMembers(org?.id);
  const updateRole = useUpdateMemberRole(org?.id);
  const removeMember = useRemoveMember(org?.id);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loadingOrgs) {
    return (
      <OrgShell title="Team">
        <div className="text-sm text-[hsl(var(--muted-foreground))]"></div>
      </OrgShell>
    );
  }
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  const myRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  return (
    <OrgShell title={<><span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">{org.name}</span> <span className="text-[hsl(var(--muted-foreground))] font-normal">· Team</span></>}>
      <div className="b2b-card p-4 mb-4 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 text-[hsl(var(--primary))]" />
        <div>
          <div className="font-medium">Manage who can access this organization</div>
          <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
            New teammates join automatically when they sign up with your org link or are added by an admin via the
            backend. Roles control what each person can do — owners and admins manage everything; recruiters can grade;
            viewers see results only.
          </p>
        </div>
      </div>

      <div className="b2b-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-semibold">Members</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {isLoading ? "…" : `${members?.length ?? 0} total`}
          </span>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]"></div>
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
                    <AvatarFallback>
                      {(m.full_name ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium truncate">
                      {m.full_name ?? "Unnamed user"}
                      {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      Joined {new Date(m.created_at).toLocaleDateString()}
                    </div>
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
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {ROLE_LABEL[m.role]}
                      </Badge>
                    )}
                    {canManage && !isOwner && !isSelf && (
                      <Button
                        size="icon"
                        variant="ghost"
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
    </OrgShell>
  );
}
