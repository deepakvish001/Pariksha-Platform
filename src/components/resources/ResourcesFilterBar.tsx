import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResourceType, resourceTypes } from "@/data/learningResourcesData";

interface ResourcesFilterBarProps {
  activeType: ResourceType;
  onTypeChange: (type: ResourceType) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  favoritesCount: number;
}

const ResourcesFilterBar = ({
  activeType,
  onTypeChange,
  showFavoritesOnly,
  onToggleFavorites,
  favoritesCount,
}: ResourcesFilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-white/[0.03]">
      {/* Type tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/[0.05]">
        {resourceTypes.map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              activeType === type
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {activeType === type && (
              <motion.div
                layoutId="activeTypeTab"
                className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{type}</span>
          </button>
        ))}
      </div>

      {/* Favorites toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFavorites}
        className={cn(
          "gap-2 rounded-xl border transition-all duration-200",
          showFavoritesOnly
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
            : "bg-transparent border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white hover:border-white/20"
        )}
      >
        <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
        Favorites
        {favoritesCount > 0 && (
          <span className={cn(
            "px-1.5 py-0.5 text-xs rounded-full",
            showFavoritesOnly ? "bg-rose-500/20" : "bg-white/10"
          )}>
            {favoritesCount}
          </span>
        )}
      </Button>
    </div>
  );
};

export default ResourcesFilterBar;
