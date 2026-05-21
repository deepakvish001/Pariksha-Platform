import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import type { EntryWithDay, JournalEntry } from "../types";
import { downloadFile, entriesToCsv, entriesToMarkdownSummary } from "../csv";

interface Props {
  entries: EntryWithDay[];
  todayEntries: JournalEntry[];
  todayDate: string;
}

export default function ExportMenu({ entries, todayEntries, todayDate }: Props) {
  const onCsv = () => {
    const csv = entriesToCsv(entries);
    downloadFile(`practice-hub-${todayDate}.csv`, csv, "text/csv");
  };
  const onJson = () => {
    downloadFile(
      `practice-hub-${todayDate}.json`,
      JSON.stringify(entries, null, 2),
      "application/json",
    );
  };
  const onCopy = async () => {
    const md = entriesToMarkdownSummary(todayEntries, todayDate);
    await navigator.clipboard.writeText(md);
    toast.success("Daily summary copied!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onCsv}>
          <Download className="h-3.5 w-3.5 mr-2" /> CSV (filtered view)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onJson}>
          <Download className="h-3.5 w-3.5 mr-2" /> JSON backup
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopy}>
          <Copy className="h-3.5 w-3.5 mr-2" /> Copy today's summary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
