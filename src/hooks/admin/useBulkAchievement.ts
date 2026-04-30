import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BulkAchievementResult {
  userId: string;
  ok: boolean;
  error?: string;
}

interface BulkArgs {
  userIds: string[];
  achievementId: string;
  action: "grant" | "revoke";
}

/** Fan-out wrapper around admin_grant_achievement / admin_revoke_achievement. */
export const useBulkAchievementMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userIds, achievementId, action }: BulkArgs): Promise<BulkAchievementResult[]> => {
      const rpc = action === "grant" ? "admin_grant_achievement" : "admin_revoke_achievement";
      const results: BulkAchievementResult[] = [];
      for (const userId of userIds) {
        const { error } = await (supabase.rpc as any)(rpc, {
          _user_id: userId,
          _achievement_id: achievementId,
        });
        results.push({ userId, ok: !error, error: error?.message });
      }
      return results;
    },
    onSuccess: (results, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-achievement-stats"] });
      vars.userIds.forEach((id) =>
        qc.invalidateQueries({ queryKey: ["admin-user-detail", id] })
      );
      const okCount = results.filter((r) => r.ok).length;
      const failCount = results.length - okCount;
      toast({
        title: failCount === 0 ? "Bulk update complete" : "Bulk update finished with errors",
        description: `${okCount} succeeded${failCount ? ` · ${failCount} failed` : ""}`,
        variant: failCount === 0 ? "default" : "destructive",
      });
    },
    onError: (e: any) => toast({ title: "Bulk update failed", description: e.message, variant: "destructive" }),
  });
};
