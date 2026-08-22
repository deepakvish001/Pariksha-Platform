import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, FileText, Trash2, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ResumeAnalysisHistoryProps {
  history: AnalysisResult[];
  isLoading: boolean;
  onView: (analysis: AnalysisResult) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const ResumeAnalysisHistory = ({
  history,
  isLoading,
  onView,
  onDelete,
  isDeleting,
}: ResumeAnalysisHistoryProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (score >= 40) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Analysis History
        </CardTitle>
        <CardDescription>Your previous resume analyses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((analysis, index) => (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{analysis.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={getScoreColor(analysis.overall_score)}>
                {analysis.overall_score}/100
              </Badge>
              <Button variant="ghost" size="icon" aria-label="View analysis" onClick={() => onView(analysis)}>
                <Eye className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Delete analysis" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this analysis. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(analysis.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
