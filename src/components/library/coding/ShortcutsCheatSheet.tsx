import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Shortcut {
  keys: string[];
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  shortcuts: Shortcut[];
  title?: string;
}

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 text-[11px] font-medium rounded border border-border bg-muted/60 text-foreground tabular-nums">
    {children}
  </kbd>
);

export const ShortcutsCheatSheet = ({ open, onOpenChange, shortcuts, title }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title ?? "Keyboard shortcuts"}</SheetTitle>
          <SheetDescription>Faster than reaching for the mouse.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/40"
            >
              <span className="text-sm">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <span key={ki} className="flex items-center gap-1">
                    {ki > 0 && <span className="text-muted-foreground text-xs">+</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
