import React from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  Shield,
  FileText,
  Star,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResumeTemplate, styleConfig } from "@/data/resumeTemplatesData";

interface ResumeTemplateCardProps {
  template: ResumeTemplate;
  index: number;
  isFeatured?: boolean;
}

const ResumeTemplateCard: React.FC<ResumeTemplateCardProps> = ({
  template,
  index,
  isFeatured = false,
}) => {
  const style = styleConfig[template.style];

  const formatDownloads = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
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
          isFeatured &&
            "ring-2 ring-primary/20 shadow-lg shadow-primary/5"
        )}
      >
        {/* Featured Badge */}
        {template.isFeatured && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Editor's Pick
            </Badge>
          </div>
        )}

        {/* Preview Area */}
        <div
          className={cn(
            "relative h-40 bg-gradient-to-br flex items-center justify-center overflow-hidden",
            style.gradient
          )}
        >
          {/* Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(white 2px, transparent 2px),
                               linear-gradient(90deg, white 2px, transparent 2px)`,
              backgroundSize: "20px 20px",
            }}
          />

          {/* Template Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
            className="relative"
          >
            <div className="h-20 w-16 bg-white/90 rounded-lg shadow-xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
            {/* Document Lines */}
            <div className="absolute top-8 left-3 right-3 space-y-1.5">
              <div className="h-1 bg-gray-300 rounded-full w-full" />
              <div className="h-1 bg-gray-200 rounded-full w-3/4" />
              <div className="h-1 bg-gray-200 rounded-full w-1/2" />
            </div>
          </motion.div>

          {/* Hover Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/90 hover:bg-white text-gray-900"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
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
              className={cn(
                "text-xs font-medium bg-gradient-to-r bg-clip-text text-transparent",
                style.gradient
              )}
              style={{
                background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", style.gradient)}>
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

          {/* Action Button */}
          <Button className="w-full gap-2 group/btn">
            <Download className="h-4 w-4" />
            Download Free
            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResumeTemplateCard;
