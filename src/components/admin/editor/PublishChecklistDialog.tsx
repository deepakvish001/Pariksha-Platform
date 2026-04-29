import { ReactNode, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import {
  TAB_LABELS,
  fieldToTab,
  type TabId,
  type ValidationIssue,
  type ValidationReport,
} from "@/lib/admin/problemValidation";

interface Props {
  trigger: ReactNode;
  report: ValidationReport;
  onConfirm: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  /** Jump to a tab (used as a fallback when an issue has no field). */
  onJumpTo?: (tab: TabId) => void;
  /**
   * Jump to a specific failing field. The editor switches tabs (if needed) and
   * scrolls/flashes the input. The dialog closes automatically.
   */
  onJumpToField?: (field: string, tab: TabId) => void;
}

const ROW_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  empty: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
};

interface GroupedIssue extends ValidationIssue {
  severity: "error" | "warning";
  tab: TabId;
}

export const PublishChecklistDialog = ({
  trigger,
  report,
  onConfirm,
  open,
  onOpenChange,
  onJumpTo,
  onJumpToField,
}: Props) => {
  // Build a tab→issues map. An issue's tab comes from the section it lives in,
  // but if its `field` clearly belongs elsewhere (e.g. a starter_code error
  // surfaced under tests), we rebucket by `fieldToTab` so the jump always lands
  // the user on the right input.
  const grouped = useMemo(() => {
    const map = new Map<TabId, GroupedIssue[]>();
    (Object.keys(report.sections) as TabId[]).forEach((tab) => {
      const sec = report.sections[tab];
      const collect = (issues: ValidationIssue[], severity: "error" | "warning") => {
        issues.forEach((iss) => {
          const target = (iss.field && fieldToTab(iss.field)) || tab;
          const list = map.get(target) ?? [];
          list.push({ ...iss, severity, tab: target });
          map.set(target, list);
        });
      };
      collect(sec.errors, "error");
      collect(sec.warnings, "warning");
    });
    return map;
  }, [report]);

  const totals = useMemo(() => {
    let errors = 0;
    let warnings = 0;
    grouped.forEach((list) => {
      list.forEach((i) => {
        if (i.severity === "error") errors++;
        else warnings++;
      });
    });
    return { errors, warnings };
  }, [grouped]);

  const handleIssueClick = (iss: GroupedIssue) => {
    if (iss.field && onJumpToField) {
      onJumpToField(iss.field, iss.tab);
      onOpenChange?.(false);
    } else {
      onJumpTo?.(iss.tab);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pre-publish checklist</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            {report.canPublish ? (
              <span>All required checks pass. Review warnings, then publish.</span>
            ) : (
              <span>Fix the items marked in red before publishing.</span>
            )}
            {totals.errors > 0 && (
              <Badge variant="outline" className="border-destructive/50 text-destructive">
                {totals.errors} error{totals.errors === 1 ? "" : "s"}
              </Badge>
            )}
            {totals.warnings > 0 && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                {totals.warnings} warning{totals.warnings === 1 ? "" : "s"}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-3">
          <ul className="space-y-2 text-sm">
            {(Object.keys(report.sections) as TabId[]).map((tab) => {
              const sec = report.sections[tab];
              const issues = grouped.get(tab) ?? [];
              const errCount = issues.filter((i) => i.severity === "error").length;
              const warnCount = issues.filter((i) => i.severity === "warning").length;
              return (
                <li key={tab} className="rounded-md border p-2.5">
                  <button
                    type="button"
                    onClick={() => onJumpTo?.(tab)}
                    className="flex w-full items-center gap-2 text-left font-medium hover:underline"
                  >
                    {ROW_ICON[sec.status]}
                    <span>{TAB_LABELS[tab]}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-xs">
                      {errCount > 0 && (
                        <Badge variant="outline" className="border-destructive/50 text-destructive">
                          {errCount}
                        </Badge>
                      )}
                      {warnCount > 0 && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                          {warnCount}
                        </Badge>
                      )}
                    </span>
                  </button>
                  {issues.length > 0 && (
                    <ul className="mt-1.5 space-y-1 pl-6 text-xs">
                      {issues.map((iss, i) => {
                        const isError = iss.severity === "error";
                        const clickable = !!iss.field && !!onJumpToField;
                        return (
                          <li key={`${iss.severity}-${i}`}>
                            <button
                              type="button"
                              onClick={() => handleIssueClick(iss)}
                              disabled={!clickable && !onJumpTo}
                              className={`group flex w-full items-start gap-1 rounded px-1 py-0.5 text-left transition-colors ${
                                clickable
                                  ? "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  : "cursor-default"
                              } ${isError ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}
                              title={clickable ? "Jump to this field" : undefined}
                            >
                              <span className="mt-0.5">•</span>
                              {iss.field && (
                                <code
                                  className={`mr-1 rounded px-1 py-0.5 font-mono text-[10px] ${
                                    isError ? "bg-destructive/10" : "bg-amber-500/10"
                                  }`}
                                >
                                  {iss.field}
                                </code>
                              )}
                              <span className="flex-1">{iss.message}</span>
                              {clickable && (
                                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!report.canPublish}>
            {report.canPublish ? "Publish now" : "Fix errors to publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
