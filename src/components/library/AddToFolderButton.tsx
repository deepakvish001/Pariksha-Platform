import { useState } from "react";
import { FolderPlus, Check, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Folder as FolderType } from "@/hooks/useFolders";

interface AddToFolderButtonProps {
  folders: FolderType[];
  questionId: number;
  questionSource: string;
  isInFolder: (folderId: string, questionId: number, questionSource: string) => boolean;
  onAddToFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  onRemoveFromFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  disabled?: boolean;
}

const folderColorMap: Record<string, string> = {
  primary: "text-primary",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  red: "text-red-500",
  purple: "text-purple-500",
  pink: "text-pink-500",
};

const AddToFolderButton = ({
  folders,
  questionId,
  questionSource,
  isInFolder,
  onAddToFolder,
  onRemoveFromFolder,
  disabled,
}: AddToFolderButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFolderId, setLoadingFolderId] = useState<string | null>(null);

  const inFolderCount = folders.filter((f) => isInFolder(f.id, questionId, questionSource)).length;

  const handleToggleFolder = async (folderId: string) => {
    setLoadingFolderId(folderId);
    const isIn = isInFolder(folderId, questionId, questionSource);
    if (isIn) {
      await onRemoveFromFolder(folderId, questionId, questionSource);
    } else {
      await onAddToFolder(folderId, questionId, questionSource);
    }
    setLoadingFolderId(null);
  };

  if (folders.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={inFolderCount > 0 ? `In ${inFolderCount} folder${inFolderCount === 1 ? "" : "s"}` : "Add to folder"}
          className={cn("h-8 w-8", inFolderCount > 0 && "text-primary")}
          onClick={(e) => e.stopPropagation()}
        >
          <FolderPlus className={cn("h-4 w-4", inFolderCount > 0 && "fill-primary/20")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Add to folder
          </p>
          {folders.map((folder) => {
            const isIn = isInFolder(folder.id, questionId, questionSource);
            const isLoading = loadingFolderId === folder.id;
            const colorClass = folderColorMap[folder.color] || "text-primary";

            return (
              <button
                key={folder.id}
                onClick={() => handleToggleFolder(folder.id)}
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  "hover:bg-muted",
                  isIn && "bg-muted"
                )}
              >
                <Folder className={cn("h-4 w-4", colorClass)} />
                <span className="flex-1 text-left truncate">{folder.name}</span>
                {isIn && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddToFolderButton;
