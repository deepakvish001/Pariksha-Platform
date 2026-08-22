import { useState } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  Link,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useFolderSharing } from "@/hooks/useFolderSharing";

interface ShareFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

const ShareFolderDialog = ({
  open,
  onOpenChange,
  folderId,
  folderName,
}: ShareFolderDialogProps) => {
  const { isLoading, createShareLink, deleteShareLink, getShareLink } = useFolderSharing();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allowCopy, setAllowCopy] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load existing share on open
  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      const existing = await getShareLink(folderId);
      if (existing) {
        setShareCode(existing.share_code);
        setAllowCopy(existing.allow_copy);
      } else {
        setShareCode(null);
      }
    }
    onOpenChange(newOpen);
  };

  const handleCreateShare = async () => {
    setIsCreating(true);
    const code = await createShareLink(folderId, allowCopy);
    setIsCreating(false);
    if (code) {
      setShareCode(code);
      toast.success("Share link created!");
    } else {
      toast.error("Failed to create share link");
    }
  };

  const handleDeleteShare = async () => {
    setIsDeleting(true);
    const success = await deleteShareLink(folderId);
    setIsDeleting(false);
    if (success) {
      setShareCode(null);
      toast.success("Share link deleted");
    } else {
      toast.error("Failed to delete share link");
    }
  };

  const handleCopy = async () => {
    if (!shareCode) return;
    const shareUrl = `${window.location.origin}/shared/${shareCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = shareCode ? `${window.location.origin}/shared/${shareCode}` : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{folderName}"
          </DialogTitle>
          <DialogDescription>
            Create a public link to share this collection with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {shareCode ? (
            <>
              {/* Share Link Display */}
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label={copied ? "Link copied" : "Copy link"}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-copy" className="font-medium">
                    Allow copying
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Viewers can copy this collection to their account
                  </p>
                </div>
                <Switch
                  id="allow-copy"
                  checked={allowCopy}
                  onCheckedChange={setAllowCopy}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => window.open(`/shared/${shareCode}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={handleDeleteShare}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This collection is private. Create a share link to make it public.
              </p>
              <Button onClick={handleCreateShare} disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Create Share Link
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFolderDialog;
