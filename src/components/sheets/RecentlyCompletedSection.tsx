import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowRight, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CompletedSheet {
  id: string;
  title: string;
  category: string;
  problems: number;
  completedAt: string;
}

interface RecentlyCompletedSectionProps {
  sheets: CompletedSheet[];
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

const RecentlyCompletedSection = ({ sheets }: RecentlyCompletedSectionProps) => {
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
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold">Recently Completed</h2>
            <p className="text-xs text-muted-foreground">Great work on finishing these!</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.slice(0, 3).map((sheet, index) => (
          <motion.div
            key={sheet.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="group cursor-pointer border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:shadow-lg hover:border-emerald-500/40 transition-all duration-300"
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
                    <h3 className="font-medium text-sm line-clamp-1 group-hover:text-emerald-500 transition-colors">
                      {sheet.title}
                    </h3>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="shrink-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{sheet.problems} problems completed</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Completed {formatDistanceToNow(new Date(sheet.completedAt), { addSuffix: true })}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    100% Complete
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-500 hover:text-emerald-600">
                    Review
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default RecentlyCompletedSection;
