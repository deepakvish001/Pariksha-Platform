import { motion, AnimatePresence } from "framer-motion";
import { Trash2, FolderInput, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FolderWithSource } from "@/hooks/useAllFolders";

// Color mapping for folder colors
const folderColorClasses: Record<string, string> = {
  primary: "bg-primary/20 text-primary",
  emerald: "bg-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/20 text-amber-400",
  red: "bg-rose-500/20 text-rose-400",
  purple: "bg-purple-500/20 text-purple-400",
  pink: "bg-pink-500/20 text-pink-400",
};

interface CollectionsBulkActionsProps {
  isVisible: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string) => void;
  folders: FolderWithSource[];
  currentFolderId: string;
  moveMenuOpen: boolean;
  setMoveMenuOpen: (open: boolean) => void;
}

const CollectionsBulkActions = ({
  isVisible,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onMoveToFolder,
  folders,
  currentFolderId,
  moveMenuOpen,
  setMoveMenuOpen,
}: CollectionsBulkActionsProps) => {
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <AnimatePresence>
      {isVisible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-[88px] z-30 border-b border-white/[0.05] bg-primary/5 backdrop-blur-3xl"
        >
          <div className="flex items-center justify-between gap-4 p-3 px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {selectedCount} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-white/60 hover:text-white hover:bg-white/[0.05]"
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeselectAll}
                className="text-white/60 hover:text-white hover:bg-white/[0.05]"
              >
                Deselect
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Move to folder dropdown */}
              <DropdownMenu open={moveMenuOpen} onOpenChange={setMoveMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Move to folder"
                    className="gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white"
                  >
                    <FolderInput className="h-4 w-4" />
                    <span className="hidden sm:inline">Move to</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-black/90 border-white/10 backdrop-blur-xl"
                >
                  {availableFolders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => onMoveToFolder(folder.id)}
                      className="gap-2 text-white/80 hover:text-white focus:text-white focus:bg-white/[0.05]"
                    >
                      <div
                        className={cn(
                          "h-6 w-6 rounded flex items-center justify-center flex-shrink-0",
                          folderColorClasses[folder.color] || "bg-primary/20"
                        )}
                      >
                        <Folder className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{folder.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {availableFolders.length === 0 && (
                    <DropdownMenuItem disabled className="text-white/40">
                      No other folders
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                aria-label="Delete"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CollectionsBulkActions;
