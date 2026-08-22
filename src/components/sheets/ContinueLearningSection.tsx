import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlayCircle, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SheetWithProgress {
  id: string;
  title: string;
  category: string;
  problems: number;
  progress: number;
  completedCount: number;
  lastActivityAt: string | null;
}

interface ContinueLearningSectionProps {
  sheets: SheetWithProgress[];
}

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "dsa": return "text-blue-500";
    case "sql": return "text-emerald-500";
    case "system design": return "text-purple-500";
    case "ml": return "text-amber-500";
    default: return "text-primary";
  }
};

const ContinueLearningSection = ({ sheets }: ContinueLearningSectionProps) => {
  const navigate = useNavigate();

  if (sheets.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PlayCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Continue Where You Left Off</h2>
            <p className="text-xs text-muted-foreground">Pick up your progress</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.slice(0, 3).map((sheet, index) => (
          <motion.div
            key={sheet.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/learn/sheets/${sheet.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/learn/sheets/${sheet.id}`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className={cn("text-xs mb-1", getCategoryColor(sheet.category))}>
                      {sheet.category}
                    </Badge>
                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {sheet.title}
                    </h3>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Button size="icon" variant="ghost" aria-label={`Continue ${sheet.title}`} className="h-8 w-8 shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {sheet.completedCount} of {sheet.problems} completed
                    </span>
                    <span className="font-medium text-primary">{sheet.progress}%</span>
                  </div>
                  <Progress value={sheet.progress} className="h-1.5" />
                </div>

                {sheet.lastActivityAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(sheet.lastActivityAt), { addSuffix: true })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default ContinueLearningSection;
