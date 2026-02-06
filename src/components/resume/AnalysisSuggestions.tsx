import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  text: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisSuggestionsProps {
  suggestions: Suggestion[];
}

export const AnalysisSuggestions = ({ suggestions }: AnalysisSuggestionsProps) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: "High Priority",
          badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
          iconClass: "text-red-500",
        };
      case "medium":
        return {
          icon: <Lightbulb className="h-4 w-4" />,
          badge: "Medium",
          badgeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          iconClass: "text-yellow-500",
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          badge: "Low",
          badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          iconClass: "text-blue-500",
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Improvement Suggestions
        </CardTitle>
        <CardDescription>Actionable steps to improve your resume</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const config = getPriorityConfig(suggestion.priority);
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className={cn("mt-0.5 shrink-0", config.iconClass)}>{config.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{suggestion.text}</p>
              </div>
              <Badge variant="outline" className={cn("shrink-0", config.badgeClass)}>
                {config.badge}
              </Badge>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
};
