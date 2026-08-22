import { motion } from "framer-motion";
import { FolderOpen, FolderPlus, Sparkles, Search, ArrowLeft, Share2, CheckSquare, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderWithSource } from "@/hooks/useAllFolders";

// Color mapping for folder colors
const folderColorClasses: Record<string, string> = {
  primary: "bg-primary/20 text-primary border-primary/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  red: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

interface CollectionsHeaderProps {
  totalFolders: number;
  totalItems: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFolder: FolderWithSource | null;
  onBackToFolders: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  onOpenShareDialog: () => void;
  onCreateFolder: () => void;
}

const CollectionsHeader = ({
  totalFolders,
  totalItems,
  searchQuery,
  onSearchChange,
  selectedFolder,
  onBackToFolders,
  isSelectionMode,
  onToggleSelectionMode,
  onOpenShareDialog,
  onCreateFolder,
}: CollectionsHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl">
      <div className="flex flex-col gap-4 p-6">
        {/* Top row */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/[0.05]" />

          {selectedFolder ? (
            // Folder detail header
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToFolders}
                aria-label="Back to folders"
                className="flex-shrink-0 text-white/60 hover:text-white hover:bg-white/[0.05]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                <div
                  className={cn(
                    "relative h-12 w-12 rounded-2xl flex items-center justify-center border",
                    folderColorClasses[selectedFolder.color] || "bg-primary/20 text-primary border-primary/30"
                  )}
                >
                  <FolderOpen className="h-6 w-6" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">
                  {selectedFolder.name}
                </h1>
                <p className="text-sm text-white/40 truncate">
                  {selectedFolder.itemCount} questions • {selectedFolder.sourceLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenShareDialog}
                  aria-label="Share folder"
                  className="gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button
                  variant={isSelectionMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={onToggleSelectionMode}
                  aria-label={isSelectionMode ? "Cancel selection" : "Select items"}
                  className={cn(
                    "gap-2",
                    isSelectionMode
                      ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 hover:text-white"
                  )}
                >
                  {isSelectionMode ? (
                    <>
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Select</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Main collections header
            <div className="flex items-center gap-4 flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    My Collections
                  </h1>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      Organized
                    </Badge>
                  </motion.div>
                </div>
                <p className="text-sm text-white/40">
                  All your folders in one place
                </p>
              </div>

              {/* Stats badges */}
              <div className="hidden md:flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-sm text-white/60">
                    <span className="font-semibold text-white">{totalFolders}</span> Folders
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-sm text-white/60">
                    <span className="font-semibold text-white">{totalItems}</span> Items
                  </span>
                </div>
              </div>

              {/* Create Folder Button */}
              <Button
                onClick={onCreateFolder}
                aria-label="New folder"
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Button>
            </div>
          )}
        </div>

        {/* Search bar (only show on folder list) */}
        {!selectedFolder && (
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-11 bg-white/[0.03] border-white/[0.05] text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default CollectionsHeader;
