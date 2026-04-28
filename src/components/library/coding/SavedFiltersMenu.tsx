import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Save, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import type { FilterPreset } from "@/hooks/useSavedFilterPresets";

interface Props {
  presets: FilterPreset[];
  /** Builds the query string (no leading "?") for the current filter state. */
  buildCurrentQuery: () => string;
  onApply: (query: string) => void;
  onSave: (name: string, query: string) => FilterPreset | null;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export const SavedFiltersMenu = ({
  presets,
  buildCurrentQuery,
  onApply,
  onSave,
  onRemove,
  onRename,
}: Props) => {
  const [saveOpen, setSaveOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FilterPreset | null>(null);
  const [name, setName] = useState("");

  const handleSave = () => {
    const query = buildCurrentQuery();
    const saved = onSave(name, query);
    if (saved) {
      toast.success("Preset saved", {
        description: `"${saved.name}" — ${query ? "current filters" : "no active filters"}.`,
      });
    } else {
      toast.error("Give your preset a name first.");
      return;
    }
    setName("");
    setSaveOpen(false);
  };

  const handleRename = () => {
    if (!renameTarget) return;
    if (!name.trim()) {
      toast.error("Name can't be empty.");
      return;
    }
    onRename(renameTarget.id, name);
    toast.success("Preset renamed");
    setRenameTarget(null);
    setName("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" title="Saved filter presets">
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Presets</span>
            {presets.length > 0 && (
              <span className="ml-0.5 text-[10px] text-muted-foreground tabular-nums">
                {presets.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Filter presets</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setName("");
              setSaveOpen(true);
            }}
          >
            <Save className="h-3.5 w-3.5 mr-2" />
            Save current as preset…
          </DropdownMenuItem>
          {presets.length > 0 && <DropdownMenuSeparator />}
          {presets.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No presets yet. Save the current filters above to reuse later.
            </p>
          ) : (
            presets.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-muted/50 group"
              >
                <button
                  type="button"
                  onClick={() => {
                    onApply(p.query);
                    toast.success(`Applied "${p.name}"`);
                  }}
                  className="flex-1 text-left px-2 py-1 text-sm truncate"
                  title={p.query || "No filters"}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-[10px] text-muted-foreground truncate">
                    {p.query ? p.query.slice(0, 60) : "no filters"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameTarget(p);
                    setName(p.name);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label={`Rename ${p.name}`}
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(p.id);
                    toast.success(`Removed "${p.name}"`);
                  }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${p.name}`}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save filter preset</DialogTitle>
            <DialogDescription>
              Give this combination of filters and sort a memorable name.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Weekly grind, Hard graphs, …"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRenameTarget(null);
            setName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename preset</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameTarget(null);
                setName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
