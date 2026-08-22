import { motion } from "framer-motion";
import { Folder, ChevronRight, Share2, MessageSquare, Users, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FolderWithSource } from "@/hooks/useAllFolders";
import FolderColorPicker from "./FolderColorPicker";

// Color mapping for folder colors
const folderColorClasses: Record<string, string> = {
  primary: "bg-primary/20 text-primary border-primary/30",
  emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  red: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

// Source icon mapping
const sourceIcons: Record<string, React.ElementType> = {
  interview: MessageSquare,
};

const getSourceIcon = (source: string): React.ElementType => {
  if (source.startsWith("mass-recruitment-")) {
    return Users;
  }
  return sourceIcons[source] || Folder;
};

interface CollectionFolderCardProps {
  folder: FolderWithSource;
  index: number;
  onSelect: (folder: FolderWithSource) => void;
  onShare: (folder: FolderWithSource) => void;
  onColorChange: (folderId: string, color: string) => void;
  onRename: (folder: FolderWithSource) => void;
  onDelete: (folder: FolderWithSource) => void;
}

const CollectionFolderCard = ({ folder, index, onSelect, onShare, onColorChange, onRename, onDelete }: CollectionFolderCardProps) => {
  const Icon = getSourceIcon(folder.source);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      className="group relative"
    >
      <div
        onClick={() => onSelect(folder)}
        className={cn(
          "relative h-full rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-2xl p-5 cursor-pointer",
          "transition-all duration-300",
          "hover:border-white/[0.1] hover:bg-black/50",
          "hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]"
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-3">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
              folderColorClasses[folder.color] || "bg-primary/20 text-primary border-primary/30"
            )}
          >
            <Folder className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-primary transition-colors">
              {folder.name}
            </h3>
            <p className="text-sm text-white/40 truncate">
              {folder.description || `${folder.itemCount} questions`}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <FolderColorPicker
              currentColor={folder.color}
              onColorChange={(color) => onColorChange(folder.id, color)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white hover:bg-white/[0.05]"
                  aria-label={`More options for ${folder.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-black/95 border-white/10 backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={() => onShare(folder)}
                  className="text-white/70 hover:text-white focus:text-white focus:bg-white/[0.05]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRename(folder)}
                  className="text-white/70 hover:text-white focus:text-white focus:bg-white/[0.05]"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => onDelete(folder)}
                  className="text-destructive hover:text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/40">
            <Icon className="h-4 w-4" />
            <span className="text-xs truncate">{folder.sourceLabel}</span>
          </div>
          <Badge
            variant="outline"
            className="ml-auto text-xs bg-white/[0.03] border-white/[0.08] text-white/60"
          >
            {folder.itemCount} items
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default CollectionFolderCard;
