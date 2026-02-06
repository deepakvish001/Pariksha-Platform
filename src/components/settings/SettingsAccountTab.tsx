import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Calendar,
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import SettingsCard from "./SettingsCard";

const SettingsAccountTab = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);

    try {
      if (user) {
        await supabase.from("user_profiles_extended").delete().eq("user_id", user.id);
        await supabase.from("profiles").delete().eq("user_id", user.id);

        if (profile?.avatar_url) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
        }
      }

      await signOut();
      toast({ title: "Account deleted", description: "Your account and data have been removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion failed", description: error.message });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setDeleteConfirmText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Account Status Card */}
      <SettingsCard delay={0}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Account Status</h2>
        </div>

        <div className="space-y-4">
          {/* Status Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Account Active</p>
                <p className="text-sm text-white/40">Your account is in good standing</p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-sm font-medium text-emerald-400">Active</span>
            </div>
          </div>

          {/* Member Since Card */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">Member Since</p>
              <p className="text-sm text-white/40">{memberSince}</p>
            </div>
          </div>

          {/* Data Export (Future) */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] opacity-60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Export Data</p>
                <p className="text-sm text-white/40">Download all your data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled className="border-white/10 text-white/50">
              Coming Soon
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* Danger Zone Card */}
      <SettingsCard delay={0.05} className="border-destructive/20">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>

        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Delete Account</p>
              <p className="text-sm text-white/40">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeleteConfirmText("");
        }}
      >
        <AlertDialogContent className="bg-[#0a0a0c] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-white/60">
              <p>
                This action is <strong className="text-white">permanent and cannot be undone</strong>.
                All your data, including your profile, preferences, and progress will be permanently deleted.
              </p>
              <p>
                To confirm, type <strong className="text-white">DELETE</strong> below:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-2 bg-black/30 border-white/10 text-white"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete My Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default SettingsAccountTab;
