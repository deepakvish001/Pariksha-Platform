import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Rocket, Star, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickStartSheet {
  id: string;
  title: string;
  category: string;
  problems: number;
  reason: "popular" | "recommended" | "new";
}

interface QuickStartSectionProps {
  sheets: QuickStartSheet[];
}

const reasonConfig = {
  popular: { label: "Popular", icon: TrendingUp, color: "text-amber-500 bg-amber-500/10" },
  recommended: { label: "Recommended", icon: Star, color: "text-primary bg-primary/10" },
  new: { label: "New", icon: Zap, color: "text-emerald-500 bg-emerald-500/10" },
};

const QuickStartSection = ({ sheets }: QuickStartSectionProps) => {
  const navigate = useNavigate();

  if (sheets.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Rocket className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <h2 className="font-semibold">Quick Start</h2>
          <p className="text-xs text-muted-foreground">Recommended sheets to get you started</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
        {sheets.map((sheet, index) => {
          const config = reasonConfig[sheet.reason];
          const Icon = config.icon;

          return (
            <motion.div
              key={sheet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="shrink-0 sm:shrink"
            >
              <Card
                className="w-48 sm:w-auto cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
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
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className={cn("text-xs gap-1", config.color)}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1">{sheet.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sheet.problems} problems • {sheet.category}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default QuickStartSection;
