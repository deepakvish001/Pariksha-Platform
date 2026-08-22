import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import type { Folder as FolderType } from "@/hooks/useFolders";

interface FolderManagerProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, description?: string, color?: string) => Promise<FolderType | null>;
  onUpdateFolder: (id: string, updates: Partial<Pick<FolderType, "name" | "description" | "color">>) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

const folderColors = [
  { id: "primary", label: "Blue", class: "bg-primary" },
  { id: "emerald", label: "Green", class: "bg-emerald-500" },
  { id: "amber", label: "Yellow", class: "bg-amber-500" },
  { id: "red", label: "Red", class: "bg-red-500" },
  { id: "purple", label: "Purple", class: "bg-purple-500" },
  { id: "pink", label: "Pink", class: "bg-pink-500" },
];

const FolderManager = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  isLoading,
}: FolderManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("primary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsSubmitting(true);
    const result = await onCreateFolder(newFolderName.trim(), newFolderDescription.trim(), newFolderColor);
    setIsSubmitting(false);
    if (result) {
      setIsCreateDialogOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setNewFolderColor("primary");
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;
    setIsSubmitting(true);
    const result = await onUpdateFolder(editingFolder.id, {
      name: newFolderName.trim(),
      description: newFolderDescription.trim() || null,
      color: newFolderColor,
    });
    setIsSubmitting(false);
    if (result) {
      setIsEditDialogOpen(false);
      setEditingFolder(null);
    }
  };

  const handleDeleteFolder = async () => {
    if (!editingFolder) return;
    setIsSubmitting(true);
    const result = await onDeleteFolder(editingFolder.id);
    setIsSubmitting(false);
    if (result) {
      setIsDeleteDialogOpen(false);
      setEditingFolder(null);
      if (selectedFolderId === editingFolder.id) {
        onSelectFolder(null);
      }
    }
  };

  const openEditDialog = (folder: FolderType) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderDescription(folder.description || "");
    setNewFolderColor(folder.color || "primary");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (folder: FolderType) => {
    setEditingFolder(folder);
    setIsDeleteDialogOpen(true);
  };

  const getFolderColorClass = (color: string) => {
    const colorObj = folderColors.find((c) => c.id === color);
    return colorObj?.class || "bg-primary";
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Your Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          aria-label="New folder"
          onClick={() => {
            setNewFolderName("");
            setNewFolderDescription("");
            setNewFolderColor("primary");
            setIsCreateDialogOpen(true);
          }}
          className="h-8 gap-1.5"
        >
          <FolderPlus className="h-4 w-4" />
          <span className="hidden sm:inline">New Folder</span>
        </Button>
      </div>

      {/* Folder Grid */}
      {folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Folder className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No folders yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a folder to organize your questions</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-3"
          >
            <FolderPlus className="h-4 w-4 mr-1.5" />
            Create Folder
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {folders.map((folder) => (
              <motion.div
                key={folder.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "group relative p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:shadow-md hover:border-primary/40",
                  selectedFolderId === folder.id
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-card border-border"
                )}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFolder(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectFolder(folder.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      getFolderColorClass(folder.color),
                      "bg-opacity-20"
                    )}
                  >
                    <Folder className={cn("h-5 w-5", getFolderColorClass(folder.color).replace("bg-", "text-"))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                    {folder.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {folder.description}
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs mt-1.5">
                      {folder.itemCount || 0} questions
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`More options for ${folder.name}`}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(folder)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingFolder(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Edit Folder" : "Create New Folder"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update your folder details."
                : "Create a folder to organize your questions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., React Interview Prep"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="A short description..."
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {folderColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setNewFolderColor(color.id)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      color.class,
                      newFolderColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    {newFolderColor === color.id && (
                      <Check className="h-4 w-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdateFolder : handleCreateFolder}
              disabled={!newFolderName.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : isEditDialogOpen ? "Save Changes" : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingFolder?.name}"? This will remove all questions
              from this folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FolderManager;
