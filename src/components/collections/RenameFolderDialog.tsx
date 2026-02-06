import { useState, useEffect } from "react";
import { Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  folderDescription: string;
  onRenameFolder: (name: string, description: string) => Promise<boolean>;
}

const RenameFolderDialog = ({
  open,
  onOpenChange,
  folderName,
  folderDescription,
  onRenameFolder,
}: RenameFolderDialogProps) => {
  const [name, setName] = useState(folderName);
  const [description, setDescription] = useState(folderDescription);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(folderName);
      setDescription(folderDescription);
    }
  }, [open, folderName, folderDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const success = await onRenameFolder(name.trim(), description.trim());
    setIsLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-white/10 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-white">Rename Folder</DialogTitle>
              <DialogDescription className="text-white/50">
                Update the folder name and description
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="rename-folder-name" className="text-white/70">
              Folder Name
            </Label>
            <Input
              id="rename-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-primary/50"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rename-folder-description" className="text-white/70">
              Description (optional)
            </Label>
            <Textarea
              id="rename-folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this folder..."
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-primary/50 resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameFolderDialog;
