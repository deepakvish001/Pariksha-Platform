import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Star, Clock } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groups: NavGroup[];
  pinned: string[];
  recent: string[];
}

export function AdminCommandPalette({
  open,
  onOpenChange,
  groups,
  pinned,
  recent,
}: Props) {
  const navigate = useNavigate();

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const flat = groups.flatMap((g) => g.items);
  const findItem = (to: string) => flat.find((i) => i.to === to);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const pinnedItems = pinned.map(findItem).filter(Boolean) as NavItem[];
  const recentItems = recent
    .map(findItem)
    .filter(Boolean)
    .filter((i) => !pinned.includes((i as NavItem).to)) as NavItem[];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to admin page…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {pinnedItems.length > 0 && (
          <>
            <CommandGroup heading="Pinned">
              {pinnedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`p-${item.to}`}
                    value={`pinned ${item.label} ${item.to}`}
                    onSelect={() => go(item.to)}
                  >
                    <Star className="mr-2 h-4 w-4 fill-current text-primary" />
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`r-${item.to}`}
                    value={`recent ${item.label} ${item.to}`}
                    onSelect={() => go(item.to)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groups.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.to}
                  value={`${g.label} ${item.label} ${item.to}`}
                  onSelect={() => go(item.to)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {item.to}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
