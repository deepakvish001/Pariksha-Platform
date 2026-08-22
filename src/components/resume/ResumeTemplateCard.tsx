import React from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  Shield,
  FileText,
  Star,
  ArrowRight,
  Heart,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResumeTemplate, styleConfig } from "@/data/resumeTemplatesData";
import FormatDownloadButton from "./FormatDownloadButton";

interface ResumeTemplateCardProps {
  template: ResumeTemplate;
  index: number;
  isFeatured?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (templateId: number) => void;
  onDownload?: (template: ResumeTemplate, format: string) => void;
  onPreview?: (template: ResumeTemplate) => void;
  isDownloading?: boolean;
}

// Visual resume preview component
const ResumePreview: React.FC<{ style: string; gradient: string }> = ({
  style,
  gradient,
}) => {
  // Different layouts based on style
  const layouts = {
    modern: (
      <>
        {/* Header with color accent */}
        <div className={cn("h-4 w-full rounded-t bg-gradient-to-r", gradient)} />
        <div className="p-2 space-y-1.5">
          {/* Photo + Name area */}
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-300" />
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-gray-400 rounded w-2/3" />
              <div className="h-1.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          {/* Content sections */}
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-300 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="space-y-1 pt-1">
            <div className="h-1.5 bg-gray-300 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </>
    ),
    traditional: (
      <div className="p-2 space-y-2">
        {/* Centered header */}
        <div className="text-center space-y-1">
          <div className="h-2.5 bg-gray-500 rounded w-1/2 mx-auto" />
          <div className="h-1.5 bg-gray-300 rounded w-2/3 mx-auto" />
        </div>
        {/* Horizontal line */}
        <div className="h-px bg-gray-400 w-full" />
        {/* Sections */}
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-400 rounded w-1/4" />
          <div className="h-1 bg-gray-200 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-400 rounded w-1/3" />
          <div className="h-1 bg-gray-200 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-4/5" />
        </div>
      </div>
    ),
    creative: (
      <div className="flex h-full">
        {/* Left sidebar */}
        <div className={cn("w-1/3 p-1.5 bg-gradient-to-b", gradient)}>
          <div className="h-5 w-5 rounded-full bg-white/80 mx-auto mb-1.5" />
          <div className="space-y-1">
            <div className="h-1 bg-white/60 rounded w-full" />
            <div className="h-1 bg-white/40 rounded w-3/4" />
          </div>
        </div>
        {/* Right content */}
        <div className="flex-1 p-1.5 space-y-1.5">
          <div className="h-2 bg-gray-400 rounded w-2/3" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
            <div className="h-1 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="space-y-0.5 pt-1">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
    minimal: (
      <div className="p-3 space-y-2">
        {/* Simple name */}
        <div className="h-2.5 bg-gray-600 rounded w-1/3" />
        <div className="h-1 bg-gray-300 rounded w-1/2" />
        {/* Minimal content */}
        <div className="space-y-1.5 pt-2">
          <div className="h-1 bg-gray-300 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-4/5" />
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-1 bg-gray-300 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    ),
    "two-column": (
      <div className="flex h-full p-1.5 gap-1.5">
        {/* Left column */}
        <div className="w-2/5 space-y-1.5">
          <div className="h-5 w-5 rounded-sm bg-gray-300 mx-auto" />
          <div className="h-1.5 bg-gray-400 rounded w-full" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="space-y-0.5 pt-1">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
        {/* Divider */}
        <div className="w-px bg-gray-300" />
        {/* Right column */}
        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 bg-gray-400 rounded w-1/2" />
          <div className="space-y-0.5">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-5/6" />
            <div className="h-1 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="space-y-0.5 pt-1">
            <div className="h-1 bg-gray-200 rounded w-full" />
            <div className="h-1 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="h-full w-full bg-white rounded shadow-inner overflow-hidden">
      {layouts[style as keyof typeof layouts] || layouts.modern}
    </div>
  );
};

const ResumeTemplateCard: React.FC<ResumeTemplateCardProps> = ({
  template,
  index,
  isFeatured = false,
  isFavorite = false,
  onToggleFavorite,
  onDownload,
  onPreview,
  isDownloading = false,
}) => {
  const style = styleConfig[template.style];

  const formatDownloads = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const handleDownload = (format: string) => {
    onDownload?.(template, format);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(template.id);
  };

  const handlePreview = () => {
    onPreview?.(template);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group"
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10",
          isFeatured && "ring-2 ring-primary/20 shadow-lg shadow-primary/5"
        )}
      >
        {/* Featured Badge */}
        {template.isFeatured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Editor's Pick
            </Badge>
          </div>
        )}

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          className={cn(
            "absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
            isFavorite
              ? "bg-red-500 text-white shadow-lg"
              : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-background hover:text-red-500 border border-border/50"
          )}
        >
          <Heart
            className={cn("h-4 w-4", isFavorite && "fill-current")}
          />
        </motion.button>

        {/* Preview Area with Visual Resume */}
        <div
          className={cn(
            "relative h-44 p-3 bg-gradient-to-br flex items-center justify-center overflow-hidden",
            style.gradient
          )}
        >
          {/* Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "16px 16px",
            }}
          />

          {/* Resume Preview Thumbnail */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.15 }}
            className="relative w-20 h-28 shadow-2xl rounded overflow-hidden"
          >
            <ResumePreview style={template.style} gradient={style.gradient} />
          </motion.div>

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/90 hover:bg-white text-gray-900"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={handlePreview}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePreview();
                }
              }}
            >
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {template.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium"
            >
              <span
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  style.gradient
                )}
              >
                {style.label}
              </span>
            </Badge>

            {template.atsCompatible && (
              <Badge
                variant="outline"
                className="text-xs gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              >
                <Shield className="h-3 w-3" />
                ATS
              </Badge>
            )}

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Download className="h-3 w-3" />
              {formatDownloads(template.downloads)}
            </span>
          </div>

          {/* Formats */}
          <div className="flex flex-wrap gap-1">
            {template.format.map((fmt) => (
              <span
                key={fmt}
                className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Action Button with Format Selection */}
          <FormatDownloadButton
            template={template}
            onDownload={(t, format) => handleDownload(format)}
            variant="card"
            isDownloading={isDownloading}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResumeTemplateCard;
