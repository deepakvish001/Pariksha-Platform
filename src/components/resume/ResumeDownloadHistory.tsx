import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Clock,
  FileText,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface DownloadHistoryItem {
  id: string;
  user_id: string;
  template_id: number;
  template_name: string;
  downloaded_at: string;
  created_at: string;
}

interface ResumeDownloadHistoryProps {
  downloads: DownloadHistoryItem[];
  isLoading: boolean;
  onClearHistory?: () => void;
  onRedownload?: (templateId: number) => void;
}

const ResumeDownloadHistory: React.FC<ResumeDownloadHistoryProps> = ({
  downloads,
  isLoading,
  onClearHistory,
  onRedownload,
}) => {
  const groupedDownloads = React.useMemo(() => {
    const groups: { [key: string]: DownloadHistoryItem[] } = {};
    
    downloads.forEach((download) => {
      const date = format(new Date(download.downloaded_at), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(download);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({
        date,
        label: format(new Date(date), "MMMM d, yyyy"),
        items,
      }));
  }, [downloads]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          Download History
          {downloads.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {downloads.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download History
          </SheetTitle>
          <SheetDescription>
            Your recently downloaded resume templates
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/50 animate-pulse"
                />
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
              <p className="text-sm text-muted-foreground">
                Templates you download will appear here
              </p>
            </motion.div>
          ) : (
            <>
              {onClearHistory && downloads.length > 0 && (
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearHistory}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear History
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  {groupedDownloads.map((group, groupIndex) => (
                    <motion.div
                      key={group.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                    >
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        {group.label}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map((download, index) => (
                          <motion.div
                            key={download.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                            whileHover={{ x: 4 }}
                            className="group relative flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => onRedownload?.(download.template_id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onRedownload?.(download.template_id);
                              }
                            }}
                          >
                            {/* Icon */}
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {download.template_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(download.downloaded_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>

                            {/* Redownload indicator */}
                            <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ResumeDownloadHistory;
