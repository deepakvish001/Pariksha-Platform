import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, Trash2, X, Clock } from "lucide-react";

export function BulkActionBar({
  count,
  onClear,
  onResend,
  onCopyLinks,
  onExport,
  onDelete,
  onSchedule,
  busy,
}: {
  count: number;
  onClear: () => void;
  onResend: () => void;
  onCopyLinks: () => void;
  onExport: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  busy?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-3 z-10 mx-auto max-w-3xl">
      <div className="b2b-card border bg-[hsl(var(--background))] shadow-lg flex items-center gap-1.5 px-3 py-2">
        <span className="text-sm font-medium mr-2">{count} selected</span>
        <Button variant="outline" size="sm" onClick={onResend} disabled={busy}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${busy ? "animate-spin" : ""}`} /> Resend
        </Button>
        <Button variant="outline" size="sm" onClick={onSchedule} disabled={busy}>
          <Clock className="h-3.5 w-3.5 mr-1" /> Schedule
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyLinks}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copy links
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-[hsl(var(--destructive))]">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
