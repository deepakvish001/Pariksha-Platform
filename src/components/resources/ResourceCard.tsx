import { motion } from "framer-motion";
import { Star, Heart, ExternalLink, BookOpen, GraduationCap, Book, Github, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resource } from "@/data/learningResourcesData";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: Resource;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const typeConfig = {
  Guide: {
    icon: BookOpen,
    bgClass: "bg-primary/10",
    borderClass: "border-primary/20",
    textClass: "text-primary",
  },
  Course: {
    icon: GraduationCap,
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/20",
    textClass: "text-purple-400",
  },
  Book: {
    icon: Book,
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    textClass: "text-blue-400",
  },
  Repository: {
    icon: Github,
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  Tool: {
    icon: Wrench,
    bgClass: "bg-cyan-500/10",
    borderClass: "border-cyan-500/20",
    textClass: "text-cyan-400",
  },
};

const difficultyColors = {
  Beginner: "text-emerald-400",
  Intermediate: "text-amber-400",
  Advanced: "text-rose-400",
};

const ResourceCard = ({ resource, index, isFavorite, onToggleFavorite }: ResourceCardProps) => {
  const config = typeConfig[resource.type];
  const TypeIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      className="group relative"
    >
      <div
        className={cn(
          "relative h-full rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-2xl p-5",
          "transition-all duration-300",
          "hover:border-white/[0.1] hover:bg-black/50",
          "hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]"
        )}
      >
        {/* Featured badge */}
        {resource.isFeatured && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-xs px-2 py-0.5">
              Featured
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={cn("p-2.5 rounded-xl border", config.bgClass, config.borderClass)}>
            <TypeIcon className={cn("h-5 w-5", config.textClass)} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all duration-200",
              isFavorite
                ? "text-rose-500 hover:text-rose-400 bg-rose-500/10"
                : "text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
            )}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => onToggleFavorite(resource.id)}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
        </div>

        {/* Type badge */}
        <Badge
          variant="outline"
          className={cn(
            "mb-3 text-xs font-medium border",
            config.bgClass,
            config.borderClass,
            config.textClass
          )}
        >
          {resource.type}
        </Badge>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 mb-4">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-foreground/80">{resource.rating}</span>
          </div>

          {/* Difficulty */}
          {resource.difficulty && (
            <span className={cn("text-xs font-medium", difficultyColors[resource.difficulty])}>
              {resource.difficulty}
            </span>
          )}

          {/* Category */}
          <span className="text-xs text-muted-foreground ml-auto">{resource.category}</span>
        </div>

        {/* Action button */}
        <Button
          variant="outline"
          className="w-full gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-foreground"
          onClick={() => window.open(resource.url, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
          View Resource
        </Button>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
