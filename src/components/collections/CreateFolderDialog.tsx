import { useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

const folderColors = [
  { id: "primary", label: "Orange", class: "bg-primary" },
  { id: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { id: "amber", label: "Amber", class: "bg-amber-500" },
  { id: "red", label: "Red", class: "bg-rose-500" },
  { id: "purple", label: "Purple", class: "bg-purple-500" },
  { id: "pink", label: "Pink", class: "bg-pink-500" },
  { id: "blue", label: "Blue", class: "bg-blue-500" },
  { id: "cyan", label: "Cyan", class: "bg-cyan-500" },
];

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string, description: string, color: string) => Promise<boolean>;
}

const CreateFolderDialog = ({
  open,
  onOpenChange,
  onCreateFolder,
}: CreateFolderDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("primary");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const success = await onCreateFolder(name.trim(), description.trim(), color);
    setIsLoading(false);

    if (success) {
      setName("");
      setDescription("");
      setColor("primary");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
      setColor("primary");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-black/95 border-white/10 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-white">Create New Folder</DialogTitle>
              <DialogDescription className="text-white/50">
                Organize your questions into a new collection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-white/70">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., DSA Practice, Interview Prep"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-primary/50"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description" className="text-white/70">
              Description (optional)
            </Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this folder..."
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/30 focus:border-primary/50 resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Folder Color</Label>
            <div className="flex flex-wrap gap-2">
              {folderColors.map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    c.class,
                    color === c.id
                      ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                      : "opacity-60 hover:opacity-100"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
