import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoadmapSectionDividerProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  delay?: number;
}

const RoadmapSectionDivider: React.FC<RoadmapSectionDividerProps> = ({
  icon: Icon,
  title,
  subtitle,
  count,
  countLabel = "items",
  gradientFrom = "from-primary",
  gradientTo = "to-primary/60",
  showViewAll = false,
  onViewAll,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative max-w-6xl mx-auto mb-6"
    >
      {/* Gradient divider line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-background pr-4">
          {/* Icon badge with gradient */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
            className={cn(
              "h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              gradientFrom,
              gradientTo
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{title}</h3>
              {count !== undefined && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {count} {countLabel}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        {showViewAll && onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="bg-background text-muted-foreground hover:text-primary group"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default RoadmapSectionDivider;
